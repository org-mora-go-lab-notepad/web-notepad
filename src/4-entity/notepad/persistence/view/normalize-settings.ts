import { LANGUAGES } from "@/src/5-shared/constant";
import type { Language } from "@/src/5-shared/type";

import { DEFAULT_SETTINGS, FONT_SCALES, TAB_COLORS } from "../../constant";
import type { NotepadSettings, TabColor } from "../../type";
import { normalizeDashboardStatusNames } from "../../util";
import { isTabColor } from "../read-value";

export const normalizeSettings = (value: unknown): NotepadSettings => {
  const settings = (value && typeof value === "object" ? value : {}) as Partial<
    Record<keyof NotepadSettings, unknown>
  >;
  const cycle = settings.tabColorCycle;
  const validCycle =
    Array.isArray(cycle) &&
    cycle.length === DEFAULT_SETTINGS.tabColorCycle.length &&
    cycle.every(isTabColor) &&
    new Set(cycle).size === cycle.length;
  const migratedCycle: TabColor[] =
    validCycle && settings.tabColorCycleVersion !== 2
      ? [
          cycle[0],
          (["orange", ...TAB_COLORS] as TabColor[]).find(
            (color) => color !== cycle[0] && color !== cycle[1],
          )!,
          cycle[1],
        ]
      : validCycle
        ? [...cycle]
        : [...DEFAULT_SETTINGS.tabColorCycle];
  const footerItems = Array.isArray(settings.footerItems)
    ? [
        ...new Set(
          settings.footerItems
            .filter((item): item is string =>
              Boolean(typeof item === "string" && item.trim()),
            )
            .slice(0, 50),
        ),
      ]
    : [...DEFAULT_SETTINGS.footerItems];
  return {
    tabColorCycleVersion: 2,
    dashboardStatusDefaults: normalizeDashboardStatusNames(
      settings.dashboardStatusDefaults,
    ),
    fontScale: FONT_SCALES.includes(settings.fontScale as number)
      ? (settings.fontScale as number)
      : DEFAULT_SETTINGS.fontScale,
    tabColorCycle: migratedCycle,
    language: LANGUAGES.includes(settings.language as Language)
      ? (settings.language as Language)
      : DEFAULT_SETTINGS.language,
    panelPosition:
      settings.panelPosition === "left"
        ? "left"
        : DEFAULT_SETTINGS.panelPosition,
    groupPosition:
      settings.groupPosition === "right"
        ? "right"
        : DEFAULT_SETTINGS.groupPosition,
    footerItems,
    footerIconsOnly:
      typeof settings.footerIconsOnly === "boolean"
        ? settings.footerIconsOnly
        : DEFAULT_SETTINGS.footerIconsOnly,
  };
};
