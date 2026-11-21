export type StoreMode = "auto" | "open" | "closed";

export type DayKey = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export interface DaySchedule {
  enabled: boolean;
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export type WeeklySchedule = Record<DayKey, DaySchedule>;

export interface StoreProfile {
  storeName: string;
  pickupAddress: string;
  streetDistrict: string;
  city: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  instagramUrl: string;
  instagramHandle: string;
  pixKey: string;
  pixKeyDisplay: string;
  pixKeyType: string;
  pixRecipient: string;
  ovenLabel: string;
  estimatedDelivery: string;
  estimatedPickup: string;
  schedule: WeeklySchedule;
  commonRemovals: string[];
  sweetRemovals: string[];
}

export interface StoreSettings {
  id?: string;
  mode: StoreMode;
  is_open?: boolean;
  custom_message?: string | null;
  store_name?: string;
  pickup_address?: string;
  street_district?: string;
  city?: string;
  whatsapp_number?: string;
  whatsapp_display?: string;
  instagram_url?: string;
  instagram_handle?: string;
  pix_key?: string;
  pix_key_display?: string;
  pix_key_type?: string;
  pix_recipient?: string;
  oven_label?: string;
  estimated_delivery?: string;
  estimated_pickup?: string;
  schedule?: WeeklySchedule;
  common_removals?: string[];
  sweet_removals?: string[];
  updated_at?: string;
}

export interface StoreStatusData {
  isOpen: boolean;
  mode: StoreMode;
  customMessage: string | null;
  nextLabel: string;
  updatedAt: string;
  isAutoOpen: boolean;
  hoursLabel: string;
  hoursShort: string;
  profile: StoreProfile;
}

export type AdminRole = "owner" | "kitchen";

export interface AdminUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  active: boolean;
  createdAt?: string;
}
