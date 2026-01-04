import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import React from "react";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => 
    React.createElement("a", { href }, children),
  Route: ({ component: Component }: { component: React.ComponentType }) => 
    React.createElement(Component),
  Switch: ({ children }: { children: React.ReactNode }) => 
    React.createElement(React.Fragment, null, children),
}));
