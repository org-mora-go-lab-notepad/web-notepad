import type { ReactNode } from "react";

export type BottomSheetProps = {
  title: string;
  closeLabel: string;
  resizeLabel: string;
  className?: string;
  returnFocusTo?: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
};
