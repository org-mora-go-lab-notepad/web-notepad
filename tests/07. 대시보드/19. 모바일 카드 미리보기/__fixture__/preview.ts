import { test as base } from "@playwright/test";

import type { NoteTab } from "@/src/4-entity/notepad";

import { MOBILE_VIEWPORT } from "../../../__constant__";
import { createGroupFixture, createTabFixture } from "../../../__fixture__";
import { openPanel, writeStoredState } from "../../../__util__";

type PreviewData = { active: NoteTab; closed: NoteTab; long: NoteTab };
export const previewTest = base.extend<{ previewData: PreviewData }>({
  viewport: MOBILE_VIEWPORT,
  isMobile: true,
  hasTouch: true,
  previewData: async ({ page }, provide) => {
    const active = createTabFixture(
      "main-note",
      "Original main note\nKeep the editor selection",
      { tabColor: "gray" },
    );
    const closed = createTabFixture(
      "closed-note",
      "Closed note\n닫힌 노트의 전체 본문\n<script>alert('text only')</script>\n🙂 preserved",
      { open: false, bookmarked: true, tabColor: "indigo" },
    );
    const long = createTabFixture(
      "long-note",
      [
        "Long readable note",
        ...Array.from(
          { length: 120 },
          (_, i) =>
            `Line ${i + 1}: 전체 내용과 줄바꿈, 공백  두 개\t탭 문자 🙂`,
        ),
        "마지막 줄 END",
      ].join("\n"),
      { tabColor: "orange", dashboardStatus: "ready" },
    );
    await writeStoredState(page, {
      activeGroupId: "ungrouped",
      groups: [
        createGroupFixture("ungrouped", "Ungrouped", [active, closed, long], {
          activeTabId: active.id,
        }),
      ],
    });
    await openPanel(page, "dashboard-panel");
    await provide({ active, closed, long });
  },
});
