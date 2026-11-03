import type { StateCreator } from "zustand";

import { LANGUAGES } from "@/src/5-shared/constant";

import { DEFAULT_SETTINGS, FONT_SCALES, TAB_COLORS } from "../constant";
import type { NotepadState } from "../type";
import { normalizeDashboardStatusNames } from "../util";
import { withTabColorCycle } from "./workspace";

type SettingActions = Pick<
  NotepadState,
  | "setFontScale"
  | "setDashboardStatusDefaults"
  | "setTabColorCycleColor"
  | "setLanguage"
  | "setPanelPosition"
  | "setGroupPosition"
  | "setFooterItems"
  | "setFooterIconsOnly"
  | "resetSettings"
  | "resetTabColorCycle"
  | "shuffleTabColorCycle"
>;

export const createSettingActions: StateCreator<
  NotepadState,
  [],
  [],
  SettingActions
> = (set) => ({
  setDashboardStatusDefaults: (names) =>
    set((state) => ({
      settings: {
        ...state.settings,
        dashboardStatusDefaults: normalizeDashboardStatusNames(names),
      },
    })),
  setFontScale: (fontScale) =>
    set((state) =>
      FONT_SCALES.includes(fontScale)
        ? { settings: { ...state.settings, fontScale } }
        : state,
    ),
  setTabColorCycleColor: (index, color) =>
    set((state) => {
      const cycle = [...state.settings.tabColorCycle];
      if (index < 0 || index >= cycle.length) return state;
      // Earlier slots keep their colors; taking a later slot's color swaps the two so the cycle stays unique.
      const usedIndex = cycle.indexOf(color);
      if (usedIndex >= 0 && usedIndex < index) return state;
      if (usedIndex >= 0) cycle[usedIndex] = cycle[index];
      cycle[index] = color;
      return withTabColorCycle(state, cycle);
    }),
  setLanguage: (language) =>
    set((state) =>
      LANGUAGES.includes(language)
        ? { settings: { ...state.settings, language } }
        : state,
    ),
  setPanelPosition: (panelPosition) =>
    set((state) => ({ settings: { ...state.settings, panelPosition } })),
  setGroupPosition: (groupPosition) =>
    set((state) => ({ settings: { ...state.settings, groupPosition } })),
  setFooterItems: (footerItems) =>
    set((state) => {
      const items = [...new Set(footerItems.filter(Boolean))].slice(0, 50);
      return { settings: { ...state.settings, footerItems: items } };
    }),
  setFooterIconsOnly: (footerIconsOnly) =>
    set((state) => ({
      settings: {
        ...state.settings,
        footerIconsOnly: Boolean(footerIconsOnly),
      },
    })),
  resetTabColorCycle: () =>
    set((state) =>
      withTabColorCycle(state, [...DEFAULT_SETTINGS.tabColorCycle]),
    ),
  // Picks distinct random colors for every slot, never repeating the current order.
  shuffleTabColorCycle: () =>
    set((state) => {
      const current = state.settings.tabColorCycle;
      let cycle = current;
      while (cycle.every((color, index) => color === current[index])) {
        const pool = [...TAB_COLORS];
        cycle = current.map(
          () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
        );
      }
      return withTabColorCycle(state, cycle);
    }),
  resetSettings: () =>
    set((state) => ({
      ...withTabColorCycle(state, [...DEFAULT_SETTINGS.tabColorCycle]),
      settings: {
        ...DEFAULT_SETTINGS,
        tabColorCycle: [...DEFAULT_SETTINGS.tabColorCycle],
        footerItems: [...DEFAULT_SETTINGS.footerItems],
      },
    })),
});
