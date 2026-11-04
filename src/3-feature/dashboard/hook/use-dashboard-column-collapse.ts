import { useState } from "react";

import type { TabStatus } from "@/src/4-entity/notepad";

export function useDashboardColumnCollapse(groupId: string, status: TabStatus) {
  const key =
    "web-notepad-mobile-column:" + encodeURIComponent(groupId) + ":" + status;
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(key) === "collapsed";
    } catch {
      return false;
    }
  });
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(key, next ? "collapsed" : "expanded");
    } catch {
      /* Keep the current view usable when storage is unavailable. */
    }
  };
  return { collapsed, toggle };
}
