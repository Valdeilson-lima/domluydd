import crypto from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "donluydd_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PIN ||
    "donluydd-dev-session-secret"
  );
}

export function getExpectedAdminPin(): string {
  return process.env.ADMIN_PIN || "1234";
}

export function verifyPinConstantTime(input: string): boolean {
  const expected = getExpectedAdminPin();
  const a = Buffer.from(input.trim(), "utf8");
  const b = Buffer.from(expected.trim(), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signAdminToken(expiresAtMs: number): string {
  const payload = String(expiresAtMs);
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token || !token.includes(".")) return false;
  const [payload, providedSig] = token.split(".");
  if (!payload || !providedSig) return false;
  const expiresAtMs = Number(payload);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return false;

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  const a = Buffer.from(providedSig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminRequestAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}
