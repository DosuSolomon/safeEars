import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { safeUser } from "../lib/security.js";

export async function authenticate(req, res, next) {
  const authorization = req.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  if (!token) {
    return res.status(401).json({ error: { message: "Authentication required." } });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: { message: "Invalid access token." } });
  }
  if (typeof payload !== "object" || typeof payload.sub !== "string") {
    return res.status(401).json({ error: { message: "Invalid access token." } });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.email_verified) {
      return res.status(401).json({ error: { message: "Invalid access token." } });
    }
    req.user = safeUser(user);
    return next();
  } catch (error) {
    return next(error);
  }
}

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: { message: "Administrator access required." } });
  }
  return next();
};
