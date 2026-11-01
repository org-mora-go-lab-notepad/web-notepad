import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sanitizeCloudSnapshot } from "@/src/4-entity/notepad/persistence";

import { readSession, SESSION_COOKIE } from "../../auth/_lib/session";
import {
  countNotepadUpdates,
  getLatestNotepadUpdate,
  saveNotepadUpdate,
} from "../_lib/history";

async function currentUserId() {
  const cookieStore = await cookies();
  return readSession(cookieStore.get(SESSION_COOKIE)?.value)?.id;
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const latest = await getLatestNotepadUpdate(userId);
    const count = await countNotepadUpdates(userId);
    return NextResponse.json(
      { latest, count },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const {
    eventId,
    snapshot,
    baseEventId,
    deletedTabIds = [],
    movedTabs = [],
    userId: ownerId,
  } = input as Record<string, unknown>;
  if (ownerId !== undefined && ownerId !== userId) {
    return NextResponse.json({ error: "Account changed" }, { status: 403 });
  }
  if (
    typeof eventId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(eventId) ||
    typeof snapshot !== "string" ||
    snapshot.length > 5_000_000 ||
    !Array.isArray(deletedTabIds) ||
    deletedTabIds.length > 1_000 ||
    !deletedTabIds.every((id) => typeof id === "string" && id.length <= 200) ||
    !Array.isArray(movedTabs) ||
    JSON.stringify(movedTabs).length > 5_000_000 ||
    !movedTabs.every(
      (tab) =>
        tab &&
        typeof tab.id === "string" &&
        tab.id.length <= 200 &&
        typeof tab.content === "string",
    ) ||
    (baseEventId !== undefined &&
      baseEventId !== null &&
      typeof baseEventId !== "string")
  ) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  let sanitizedSnapshot: string;
  try {
    const state = JSON.parse(snapshot) as Record<string, unknown>;
    if (
      !Array.isArray(state.groups) ||
      !Array.isArray(state.closedTabs) ||
      !state.settings
    ) {
      return NextResponse.json({ error: "Invalid snapshot" }, { status: 400 });
    }
    sanitizedSnapshot = sanitizeCloudSnapshot(snapshot);
  } catch {
    return NextResponse.json({ error: "Invalid snapshot" }, { status: 400 });
  }
  try {
    const result = await saveNotepadUpdate(
      userId,
      eventId,
      sanitizedSnapshot,
      baseEventId as string | null | undefined,
      deletedTabIds,
      movedTabs,
    );
    if (!result.saved)
      return NextResponse.json(
        {
          error: "Conflict",
          latest: result.latest,
          protectedTabIds: result.protectedTabIds,
        },
        {
          status: 409,
          headers: { "Cache-Control": "private, no-store" },
        },
      );
    return NextResponse.json(
      { saved: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
