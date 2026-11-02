export type SearchResultProps = {
  category: string;
  groupName?: string;
  title: string;
  description?: string;
  query: string;
  ariaLabel: string;
  onSelect: () => void;
};
