export type GroupSharingAccess = { role: "owner" | "member"; active: boolean };
export type GroupSharingActions = {
  authenticated: boolean;
  loading: boolean;
  refreshGroups: () => Promise<void> | undefined;
  accessByGroup: Record<string, GroupSharingAccess>;
  changeAccess: (
    groupId: string,
    action: "leave" | "revoke",
  ) => Promise<boolean>;
};
