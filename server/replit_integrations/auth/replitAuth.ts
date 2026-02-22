import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import OpenIDConnectStrategy from "passport-openidconnect";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function getExternalUrl(): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  const replSlug = process.env.REPL_SLUG;
  const replOwner = process.env.REPL_OWNER;
  if (replSlug && replOwner) {
    return `https://${replSlug}.${replOwner}.repl.co`;
  }
  return `http://localhost:5000`;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  const callbackURL = `${getExternalUrl()}/api/callback`;

  passport.use(
    "oidc",
    new OpenIDConnectStrategy(
      {
        issuer: "https://replit.com/",
        authorizationURL: "https://replit.com/auth/authorize",
        tokenURL: "https://replit.com/auth/token",
        userInfoURL: "https://replit.com/auth/userinfo",
        clientID: process.env.REPL_ID!,
        clientSecret: process.env.REPL_ID!,
        callbackURL,
        scope: "openid email profile",
      },
      async (
        _issuer: string,
        profile: any,
        _context: any,
        _idToken: any,
        _accessToken: any,
        _refreshToken: any,
        done: any,
      ) => {
        try {
          const user = await authStorage.upsertUser({
            id: profile.id,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.name?.givenName || profile.displayName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
            provider: "replit",
            providerId: profile.id,
          });
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );

  app.get("/api/login", passport.authenticate("oidc"));

  app.get(
    "/api/callback",
    passport.authenticate("oidc", {
      failureRedirect: "/?error=auth_failed",
      successRedirect: "/",
    }),
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
