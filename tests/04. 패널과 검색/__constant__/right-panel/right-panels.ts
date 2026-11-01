import { DESKTOP_VIEWPORT, MOBILE_VIEWPORT } from "../../../__constant__";

export const RIGHT_PANEL_IDS = [
  "dashboard-panel",
  "shortcuts-panel",
  "settings-panel",
];

// The Shortcut command is hidden on mobile; the other panel commands remain available.
export const RIGHT_PANEL_VIEWPORTS = [
  { viewport: DESKTOP_VIEWPORT, panelIds: RIGHT_PANEL_IDS },
  {
    viewport: MOBILE_VIEWPORT,
    panelIds: ["dashboard-panel", "settings-panel"],
  },
];
