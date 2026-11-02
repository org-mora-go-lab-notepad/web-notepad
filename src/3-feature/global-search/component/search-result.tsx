import { FileText } from "lucide-react";

import { SearchHighlight } from "@/src/5-shared/ui/search-field/component";

import type { SearchResultProps } from "../type";

export function SearchResult({
  category,
  groupName,
  title,
  description,
  query,
  ariaLabel,
  onSelect,
}: SearchResultProps) {
  return (
    <button
      className="global-search-result"
      type="button"
      aria-label={ariaLabel}
      onClick={onSelect}
    >
      <span className="global-search-result-category">
        <FileText size={14} aria-hidden="true" />
        {category}
        {groupName && (
          <>
            {" · "}
            <SearchHighlight text={groupName} query={query} />
          </>
        )}
      </span>
      <strong>
        <SearchHighlight text={title} query={query} />
      </strong>
      {description !== undefined && (
        <p>
          <SearchHighlight text={description} query={query} />
        </p>
      )}
    </button>
  );
}
