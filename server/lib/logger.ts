import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export function createRequestLogger(req: { method: string; url: string; ip?: string }) {
  return logger.child({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
}

export function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  logger.error({
    context,
    error: message,
    stack,
    ...extra,
  });
}

export function logInfo(context: string, message: string, extra?: Record<string, unknown>) {
  logger.info({
    context,
    message,
    ...extra,
  });
}

export function logWarn(context: string, message: string, extra?: Record<string, unknown>) {
  logger.warn({
    context,
    message,
    ...extra,
  });
}

export function logDebug(context: string, message: string, extra?: Record<string, unknown>) {
  logger.debug({
    context,
    message,
    ...extra,
  });
}
