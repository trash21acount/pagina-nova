import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PBKDF2_ITERATIONS = 310000;
const PBKDF2_KEY_LENGTH = 32;
const PBKDF2_SALT_LENGTH = 16;
const PBKDF2_PREFIX = "pbkdf2_sha256";
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET ?? "meme-sis-dev-secret";

type SessionPayload = {
  sub: string;
  username: string;
  role: string;
};

function toBase64Url(value: Buffer) {
  return value.toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(PBKDF2_SALT_LENGTH).toString("hex");
  const derived = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, "sha256");
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${salt}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const segments = storedHash.split("$");
  if (segments.length !== 4 || segments[0] !== PBKDF2_PREFIX) {
    return false;
  }

  const iterations = Number.parseInt(segments[1], 10);
  const salt = segments[2];
  const expectedHash = segments[3];

  if (!Number.isFinite(iterations) || !salt || !expectedHash) {
    return false;
  }

  const derived = pbkdf2Sync(password, salt, iterations, PBKDF2_KEY_LENGTH, "sha256");
  const actualHash = derived.toString("hex");

  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(actualHash, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createSessionToken(payload: SessionPayload) {
  const header = toBase64Url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = toBase64Url(Buffer.from(JSON.stringify(payload)));
  const signature = createHmac("sha256", SESSION_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = createHmac("sha256", SESSION_SECRET).update(`${header}.${body}`).digest("base64url");

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(body).toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export function createSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
