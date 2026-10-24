import { Router } from "express";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "../lib/mailer.js";
import {
  createAccessToken,
  createOpaqueToken,
  createOtp,
  hashSecret,
  matchesSecret,
  safeUser,
  signState,
  verifyState,
} from "../lib/security.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const emailSchema = z.string().trim().email().max(254).transform((email) => email.toLowerCase());
const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(10).max(128),
});
const profileSchema = z.object({
  nickname: z.string().max(80).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  support_topics: z.array(z.string().max(100)).max(100).optional(),
  communication_preference: z.enum(["text", "voice"]).optional(),
  privacy_level: z.enum(["anonymous", "pseudonymous"]).optional(),
  theme_preference: z.enum(["light", "dark", "contrast"]).optional(),
  is_available: z.boolean().optional(),
  profile_complete: z.boolean().optional(),
}).strict();
const otpTtl = 10 * 60 * 1000;

async function sendVerificationCode(user) {
  const code = createOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp_hash: hashSecret(code),
      otp_expires_at: new Date(Date.now() + otpTtl),
    },
  });
  await sendEmail({
    to: user.email,
    subject: "Your SafeEars verification code",
    text: `Your SafeEars verification code is ${code}. It expires in 10 minutes.`,
  });
}

function getGoogleCallbackUrl() {
  const apiUrl = new URL(process.env.API_PUBLIC_URL);
  const apiPath = apiUrl.pathname.replace(/\/+$/, "");
  const isLocalDevelopmentUrl =
    process.env.NODE_ENV !== "production" &&
    apiUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(apiUrl.hostname);
  if (
    (apiUrl.protocol !== "https:" && !isLocalDevelopmentUrl) ||
    apiUrl.search ||
    apiUrl.hash ||
    apiPath !== "/api"
  ) {
    throw Object.assign(
      new Error("Google OAuth requires API_PUBLIC_URL to be the HTTPS API base URL ending in /api."),
      { status: 500 },
    );
  }
  return `${apiUrl.origin}${apiPath}/auth/google/callback`;
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.email_verified) {
      return res.status(409).json({ error: { message: "An account with this email already exists." } });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { password_hash, otp_hash: null, otp_expires_at: null },
        })
      : await prisma.user.create({
          data: { email, password_hash },
        });
    await sendVerificationCode(user);
    return res.status(202).json({ message: "Verification code sent." });
  } catch (error) {
    return next(error);
  }
});

router.post("/verify-otp", authLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: emailSchema }).parse(req.body);
    const otpCode = z.string().regex(/^\d{6}$/).parse(req.body.otpCode);
    const user = await prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      !user.otp_hash ||
      !user.otp_expires_at ||
      user.otp_expires_at.getTime() < Date.now() ||
      !matchesSecret(otpCode, user.otp_hash)
    ) {
      return res.status(400).json({ error: { message: "Invalid or expired verification code." } });
    }
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        otp_hash: null,
        otp_expires_at: null,
      },
    });
    return res.json({
      access_token: createAccessToken(verifiedUser),
      user: safeUser(verifiedUser),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/resend-otp", authLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: emailSchema }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.email_verified) {
      await sendVerificationCode(user);
    }
    return res.json({ message: "If the account can be verified, a code has been sent." });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: { message: "Invalid email or password." } });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: { message: "Verify your email before signing in." } });
    }
    return res.json({
      access_token: createAccessToken(user),
      user: safeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/password-reset/request", authLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: emailSchema }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.email_verified) {
      const resetToken = createOpaqueToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_reset_hash: hashSecret(resetToken),
          password_reset_expires_at: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const resetUrl = new URL("/reset-password", process.env.FRONTEND_URL);
      resetUrl.searchParams.set("token", resetToken);
      await sendEmail({
        to: email,
        subject: "Reset your SafeEars password",
        text: `Use this link within one hour to reset your password: ${resetUrl.toString()}`,
      });
    }
    return res.json({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    return next(error);
  }
});

router.post("/password-reset/confirm", authLimiter, async (req, res, next) => {
  try {
    const { resetToken, newPassword } = z
      .object({
        resetToken: z.string().regex(/^[a-f\d]{64}$/i),
        newPassword: z.string().min(10).max(128),
      })
      .parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        password_reset_hash: hashSecret(resetToken),
        password_reset_expires_at: { gt: new Date() },
      },
    });
    if (!user) {
      return res.status(400).json({ error: { message: "Invalid or expired password reset link." } });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: await bcrypt.hash(newPassword, 12),
        password_reset_hash: null,
        password_reset_expires_at: null,
      },
    });
    return res.json({ message: "Password reset successfully." });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authenticate, async (req, res) => res.json(req.user));

router.patch("/me", authenticate, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: { message: "No supported profile fields supplied." } });
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });
    return res.json(safeUser(updatedUser));
  } catch (error) {
    return next(error);
  }
});

router.get("/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: { message: "Google sign-in is not configured." } });
  }
  const returnTo = typeof req.query.returnTo === "string" ? req.query.returnTo : "/";
  const state = signState({ nonce: createOpaqueToken(), returnTo });
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  authorizationUrl.searchParams.set("redirect_uri", getGoogleCallbackUrl());
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");
  return res.redirect(authorizationUrl.toString());
});

router.get("/google/callback", async (req, res, next) => {
  try {
    if (typeof req.query.error === "string") {
      return res.status(400).send("Google sign-in was cancelled or denied.");
    }
    if (typeof req.query.code !== "string" || typeof req.query.state !== "string") {
      return res.status(400).send("Invalid Google sign-in response.");
    }
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).send("Google sign-in is not configured.");
    }
    const state = verifyState(req.query.state);
    const returnTo = typeof state.returnTo === "string" ? state.returnTo : "/";
    const destination = new URL(returnTo, process.env.FRONTEND_URL);
    if (destination.origin !== new URL(process.env.FRONTEND_URL).origin) {
      return res.status(400).send("Invalid sign-in return URL.");
    }
    const redirectUri = getGoogleCallbackUrl();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      const providerError = await tokenResponse.json().catch(() => ({}));
      console.error("Google OAuth token exchange failed:", {
        status: tokenResponse.status,
        error: providerError.error,
        error_description: providerError.error_description,
      });
      return res
        .status(502)
        .send("Google sign-in failed. Check that Render's API_PUBLIC_URL and the Google OAuth redirect URI match exactly.");
    }
    const googleTokens = await tokenResponse.json();
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${googleTokens.access_token}` },
    });
    if (!profileResponse.ok) {
      throw new Error("Google profile could not be loaded.");
    }
    const profile = await profileResponse.json();
    if (!profile.email || profile.email_verified !== true) {
      throw new Error("Google did not verify the email address.");
    }
    const user = await prisma.user.upsert({
      where: { email: String(profile.email).toLowerCase() },
      create: {
        email: String(profile.email).toLowerCase(),
        full_name: profile.name || null,
        email_verified: true,
      },
      update: { email_verified: true },
    });
    destination.searchParams.set("access_token", createAccessToken(user));
    return res.redirect(destination.toString());
  } catch (error) {
    return next(error);
  }
});

export default router;
