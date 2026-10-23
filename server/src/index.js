import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { ZodError } from "zod";
import { prisma } from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import entityRoutes from "./routes/entities.js";

const app = express();
const port = Number(process.env.PORT || 4000);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured.");
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}
if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL must be configured.");
}
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD ||
    !process.env.SMTP_FROM ||
    !process.env.API_PUBLIC_URL)
) {
  throw new Error("Production requires SMTP_* and API_PUBLIC_URL configuration.");
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "256kb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

app.get("/api/health", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok" });
  } catch (error) {
    return next(error);
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/entities", entityRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: { message: "Route not found." } });
});

app.use((error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: { message: error.issues.map((issue) => issue.message).join("; ") },
    });
  }
  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: { message: error.message } });
  }
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: { message: "Request body contains invalid JSON." } });
  }
  if (error.name === "PrismaClientValidationError") {
    return res.status(400).json({ error: { message: "Invalid entity data." } });
  }
  if (error.code === "P2002") {
    return res.status(409).json({ error: { message: "A record with this value already exists." } });
  }
  if (error.code === "P2025") {
    return res.status(404).json({ error: { message: "Record not found." } });
  }
  console.error("Unhandled API error:", error);
  return res.status(500).json({ error: { message: "An unexpected server error occurred." } });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`SafeEars API listening on port ${port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down API server.`);
  server.close(async (error) => {
    await prisma.$disconnect();
    if (error) {
      console.error("Error while stopping the API server:", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
