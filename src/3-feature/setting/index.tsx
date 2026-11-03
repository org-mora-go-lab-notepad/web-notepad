"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import { FONT_SCALES, useNotepadStore } from "@/src/4-entity/notepad";
import { LANGUAGE_LABELS, LANGUAGES } from "@/src/5-shared/constant";
import { useI18n } from "@/src/5-shared/hook";
import { ConfirmPopup, SidePanel } from "@/src/5-shared/ui";

import { Theme } from "../theme";
import {
  DashboardStatusDefaultSetting,
  RadioSetting,
  TabColorSetting,
} from "./component";
import type { SettingProps } from "./type";

export function Setting({ open, onClose }: SettingProps) {
  const { language, t } = useI18n();
  const settings = useNotepadStore((state) => state.settings);
  const setFontScale = useNotepadStore((state) => state.setFontScale);
  const setLanguage = useNotepadStore((state) => state.setLanguage);
  const setPanelPosition = useNotepadStore((state) => state.setPanelPosition);
  const setGroupPosition = useNotepadStore((state) => state.setGroupPosition);
  const setFooterIconsOnly = useNotepadStore(
    (state) => state.setFooterIconsOnly,
  );
  const resetSettings = useNotepadStore((state) => state.resetSettings);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);

  const deleteAllData = () => {
    try {
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key?.startsWith("web-notepad-")) localStorage.removeItem(key);
      }
    } finally {
      window.location.reload();
    }
  };

  return (
    <SidePanel
      className="setting"
      id="settings-panel"
      title={t.settingsTitle}
      open={open}
      headerActions={
        <button
          className="side-panel-action setting-reset"
          type="button"
          onClick={() => setConfirmingReset(true)}
          aria-label={t.resetSettings}
          title={t.resetSettings}
        >
          <RotateCcw size={14} />
        </button>
      }
      closeLabel={t.closePanel(t.settingsTitle)}
      ariaLabel={t.settingsTitle}
      onClose={onClose}
    >
      <div className="setting-content">
        <Theme />
        <RadioSetting
          title={t.fontSize}
          name="font-scale"
          value={settings.fontScale}
          onChange={setFontScale}
          options={FONT_SCALES.map((value) => ({
            value,
            label: Math.round(value * 100) + "%",
          }))}
        />
        <TabColorSetting />
        <RadioSetting
          title={t.language}
          name="language"
          value={language}
          onChange={setLanguage}
          options={LANGUAGES.map((value) => ({
            value,
            label: LANGUAGE_LABELS[value],
            language: value,
          }))}
        />
        <RadioSetting
          title={t.groupPosition}
          name="group-position"
          value={settings.groupPosition}
          onChange={setGroupPosition}
          options={[
            { value: "left", label: t.panelLeft },
            { value: "right", label: t.panelRight },
          ]}
        />
        <RadioSetting
          title={t.panelPosition}
          name="panel-position"
          value={settings.panelPosition}
          onChange={setPanelPosition}
          options={[
            { value: "left", label: t.panelLeft },
            { value: "right", label: t.panelRight },
          ]}
        />
        <RadioSetting
          title={t.footerIconsOnly}
          name="footer-icons-only"
          value={settings.footerIconsOnly}
          onChange={setFooterIconsOnly}
          options={[
            { value: true, label: t.on },
            { value: false, label: t.off },
          ]}
        />
        <DashboardStatusDefaultSetting />
        <section className="setting-section setting-danger-zone">
          <h3>{t.dataManagement}</h3>
          <button
            className="setting-delete-all"
            type="button"
            onClick={() => setConfirmingDeleteAll(true)}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t.deleteAllData}
          </button>
        </section>
      </div>
      {confirmingReset && (
        <ConfirmPopup
          title={t.resetSettings}
          message={t.resetSettingsMessage}
          closeLabel={t.closePanel(t.resetSettings)}
          closeTitle={t.close}
          confirmLabel={t.reset}
          confirmIcon={<RotateCcw size={14} aria-hidden="true" />}
          onCancel={() => setConfirmingReset(false)}
          onConfirm={() => {
            resetSettings();
            setConfirmingReset(false);
          }}
        />
      )}
      {confirmingDeleteAll && (
        <ConfirmPopup
          title={t.deleteAllData}
          message={t.deleteAllDataMessage}
          closeLabel={t.closePanel(t.deleteAllData)}
          closeTitle={t.close}
          confirmLabel={t.deleteAll}
          onCancel={() => setConfirmingDeleteAll(false)}
          onConfirm={deleteAllData}
        />
      )}
    </SidePanel>
  );
}
