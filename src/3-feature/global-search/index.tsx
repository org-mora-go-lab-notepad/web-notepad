"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";

import { useI18n, useScrollableListLayout } from "@/src/5-shared/hook";
import { EmptyState, SearchField } from "@/src/5-shared/ui";
import { matchesSearchQuery } from "@/src/5-shared/util";

import { SearchResult } from "./component";
import { useDebouncedSearchQuery, useSearchPopover } from "./hook";
import type { GlobalSearchProps } from "./type";

export function GlobalSearch({
  groups,
  searchQuery,
  onSearchQueryChange,
  open,
  onClose,
  onSelectTab,
}: GlobalSearchProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { containerRef, listRef } = useScrollableListLayout(
    "--global-search-scrollbar-width",
  );
  const query = useDebouncedSearchQuery(searchQuery).trim();
  const tabResults = query
    ? groups.flatMap((group) =>
        group.tabs
          .filter((tab) => matchesSearchQuery(query, tab.title, tab.content))
          .map((tab) => ({ group, tab })),
      )
    : [];
  const dialogRef = useSearchPopover(open, onClose);

  return (
    <dialog
      ref={dialogRef}
      className={`global-search ${query ? "has-query" : ""}`}
      id="global-search-popup"
      aria-labelledby={titleId}
      aria-modal={open ? "true" : "false"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onFocusCapture={(event) => {
        if (
          !(event.target instanceof HTMLInputElement) ||
          event.currentTarget.classList.contains("is-position-locked")
        )
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--global-search-locked-top",
          `${bounds.top}px`,
        );
        event.currentTarget.style.setProperty(
          "--global-search-locked-height",
          `${bounds.height}px`,
        );
        event.currentTarget.classList.add("is-position-locked");
      }}
    >
      <div className="global-search-header">
        <div className="global-search-heading">
          <Search size={20} aria-hidden="true" />
          <h2 id={titleId}>{t.searchTitle}</h2>
        </div>
        <button
          className="global-search-close"
          type="button"
          aria-label={t.closePanel(t.searchTitle)}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div className="global-search-body">
        <div className="global-search-results-pane" ref={containerRef}>
          <SearchField
            value={searchQuery}
            ariaLabel={t.searchEverything}
            placeholder={t.searchEverything}
            onChange={onSearchQueryChange}
          />
          <div className="global-search-list" ref={listRef}>
            {!query ? (
              <EmptyState
                className="global-search-empty-state"
                message={t.enterSearchTerm}
              />
            ) : tabResults.length === 0 ? (
              <EmptyState
                className="global-search-empty-state"
                message={t.noSearchResults}
              />
            ) : (
              <div className="global-search-tabs">
                {tabResults.map(({ group, tab }) => (
                  <SearchResult
                    key={group.id + ":" + tab.id}
                    category={t.tabCategory}
                    groupName={group.name}
                    title={tab.title || t.emptyNote}
                    description={tab.content}
                    query={query}
                    ariaLabel={t.openTabResult(tab.title || t.emptyNote)}
                    onSelect={() => onSelectTab(group.id, tab.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
