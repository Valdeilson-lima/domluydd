export type StoreMode = "auto" | "open" | "closed";

export interface StoreSettings {
  id?: string;
  mode: StoreMode;
  is_open?: boolean;
  custom_message?: string | null;
  updated_at?: string;
}

export interface StoreStatusData {
  isOpen: boolean;
  mode: StoreMode;
  customMessage: string | null;
  nextLabel: string;
  updatedAt: string;
  isAutoOpen: boolean;
}
