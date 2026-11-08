import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BoardPage } from "@/src/1-page/board";

import { readSession, SESSION_COOKIE } from "../api/auth/_lib/session";

export default async function BoardRoute() {
  const cookieStore = await cookies();
  if (!readSession(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/");
  return <BoardPage />;
}
