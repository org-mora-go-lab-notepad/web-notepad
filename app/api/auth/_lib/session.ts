import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { KakaoUser } from "./kakao";

export const KAKAO_STATE_COOKIE = "web-notepad-kakao-state";
export const SHARE_RETURN_COOKIE = "web-notepad-share-return";
export const SESSION_COOKIE = "web-notepad-session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const DEVELOPMENT_SESSION_SECRET = "web-notepad-local-development-session";

type SessionPayload = KakaoUser & {
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.KAKAO_REST_API_KEY;
  if (!secret && process.env.NODE_ENV === "development")
    return DEVELOPMENT_SESSION_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function createGroupShareToken(groupId: string, version = 0) {
  if (
    !/^shared-[0-9a-f-]{36}$/i.test(groupId) ||
    !Number.isSafeInteger(version) ||
    version < 0
  )
    throw new Error("Invalid share link descriptor");
  const payload = version ? `${groupId}.${version}` : groupId;
  return `${payload}.${sign("group-share:" + payload)}`;
}

export function readGroupShareToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 2 && parts.length !== 3) return null;
  const groupId = parts[0],
    signature = parts.at(-1)!;
  if (!/^shared-[0-9a-f-]{36}$/i.test(groupId) || !signature) return null;
  if (
    parts.length === 3 &&
    (!/^[1-9][0-9]*$/.test(parts[1]) || !Number.isSafeInteger(Number(parts[1])))
  )
    return null;
  const payload = parts.slice(0, -1).join(".");
  const expected = Buffer.from(sign("group-share:" + payload)),
    received = Buffer.from(signature);
  return expected.length === received.length &&
    timingSafeEqual(expected, received)
    ? groupId
    : null;
}

export function createOAuthState() {
  return randomBytes(32).toString("base64url");
}

export function createSession(user: KakaoUser) {
  const payload: SessionPayload = {
    ...user,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readSession(value?: string): KakaoUser | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;

  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (payload.expiresAt <= Date.now() || !payload.id || !payload.nickname)
      return null;
    return {
      id: payload.id,
      nickname: payload.nickname,
      profileImageUrl: payload.profileImageUrl,
    };
  } catch {
    return null;
  }
}
