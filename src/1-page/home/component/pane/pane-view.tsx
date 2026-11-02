"use client";

import { Body, Header } from "@/src/2-widget";

import type { PaneViewProps } from "../../type";

export function PaneView({
  pane,
  tabs,
  groups,
  activeGroupId,
  activeTab,
  editorRef,
  composingRef,
  isFocused,
  draggingTabId,
  draggingTabIds,
  selectedTabIds,
  dropZones,
  tabSlide,
  heightRatio,
  onActivate,
  onSelect,
  onClose,
  onMove,
  onMoveToGroup,
  onAdopt,
  onDragStart,
  onDragEnd,
  onCycleTabColor,
  onToggleBookmark,
  onAdd,
  onChange,
}: PaneViewProps) {
  return (
    <div
      className="pane-slot"
      data-pane={pane}
      style={heightRatio ? { flex: `0 0 ${heightRatio * 100}%` } : undefined}
    >
      <div
        className={`note-pane ${isFocused ? "" : "is-unfocused"}`}
        onFocusCapture={onActivate}
        onPointerDownCapture={onActivate}
      >
        <Header
          tabs={tabs}
          groups={groups}
          activeGroupId={activeGroupId}
          activeTabId={activeTab?.id ?? ""}
          draggingTabId={draggingTabId}
          draggingTabIds={draggingTabIds}
          selectedTabIds={selectedTabIds}
          onSelect={onSelect}
          onClose={onClose}
          onMove={onMove}
          onMoveToGroup={onMoveToGroup}
          onAdopt={onAdopt}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onCycleTabColor={onCycleTabColor}
          onToggleBookmark={onToggleBookmark}
          onAdd={onAdd}
        />
        {activeTab && (
          <Body
            activeTab={activeTab}
            editorRef={editorRef}
            composingRef={composingRef}
            draggingTabId={draggingTabId}
            dropZones={dropZones}
            tabSlide={tabSlide}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}
