import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import jwt from "jsonwebtoken";

export const createAccessToken = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

export const hashSecret = (value) =>
  createHash("sha256")
    .update(`${process.env.JWT_SECRET}:${value}`)
    .digest("hex");

export const matchesSecret = (value, expectedHash) => {
  const actualHash = Buffer.from(hashSecret(value), "hex");
  const expected = Buffer.from(expectedHash || "", "hex");
  return (
    actualHash.length === expected.length &&
    timingSafeEqual(actualHash, expected)
  );
};

export const createOpaqueToken = () => randomBytes(32).toString("hex");

export const createOtp = () =>
  String(randomBytes(4).readUInt32BE(0) % 1_000_000).padStart(6, "0");

export const signState = (value) => {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = createHmac("sha256", process.env.JWT_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
};

export const verifyState = (state) => {
  const [payload, signature, extra] = state.split(".");
  if (!payload || !signature || extra) {
    throw Object.assign(new Error("Invalid sign-in state."), { status: 400 });
  }
  const expected = createHmac("sha256", process.env.JWT_SECRET)
    .update(payload)
    .digest();
  let provided;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    throw Object.assign(new Error("Invalid sign-in state."), { status: 400 });
  }
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) {
    throw Object.assign(new Error("Invalid sign-in state."), { status: 400 });
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    throw Object.assign(new Error("Invalid sign-in state."), { status: 400 });
  }
};

export const safeUser = (user) => {
  if (!user) return user;
  const {
    password_hash: _passwordHash,
    otp_hash: _otpHash,
    otp_expires_at: _otpExpiresAt,
    password_reset_hash: _resetHash,
    password_reset_expires_at: _resetExpiresAt,
    ...publicUser
  } = user;
  return publicUser;
};
