export type MoreMenuProps = {
  authenticated: boolean;
  searchOpen: boolean;
  unpinnedItems: string[];
  onActivate: (id: string) => void;
};
