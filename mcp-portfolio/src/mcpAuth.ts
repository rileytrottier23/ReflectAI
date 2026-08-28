/**
 * MCP Bearer-token auth middleware.
 *
 * Validates the Authorization: Bearer <MCP_TOKEN> header on every /mcp
 * request. On failure it returns a 401 with a WWW-Authenticate header that
 * points Claude (or any MCP client) to the OAuth metadata document so it can
 * kick off the OAuth flow automatically.
 *
 * On success it sets req.mcpUserId to MCP_USER_EMAIL (the owner's identity
 * in this single-user server), then calls next().
 */

import type { Request, Response, NextFunction } from "express";

export async function mcpAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = process.env.MCP_TOKEN;
  if (!token) {
    res.status(503).json({ error: "MCP_TOKEN environment variable is not set" });
    return;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${token}`) {
    const base = `${req.protocol}://${req.headers.host}`;
    res.setHeader(
      "WWW-Authenticate",
      `Bearer realm="Journal MCP Server", resource_metadata="${base}/.well-known/oauth-authorization-server"`
    );
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Single-user server: owner identity is determined by MCP_USER_EMAIL.
  // In production you would look this up in your user table; here we use
  // the email string itself as a stable userId for the in-memory store.
  const email = process.env.MCP_USER_EMAIL;
  if (!email) {
    res.status(503).json({ error: "MCP_USER_EMAIL environment variable is not set" });
    return;
  }

  (req as any).mcpUserId = email;
  next();
}
