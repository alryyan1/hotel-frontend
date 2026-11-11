import { toast } from "sonner";
import apiClient from "./axios";

export interface ShiftUserRef {
  id: number;
  name: string;
}

export interface ShiftServiceBreakdown {
  service_id: number;
  name: string;
  count: number;
  quantity: number;
  total_sdg: number;
  total_usd: number;
}

export interface ShiftSummary {
  total_revenue: number;
  total_service_revenue?: number;
  total_revenue_usd_cash?: number;
  total_service_revenue_usd?: number;
  /** Missing on snapshots of shifts closed before the breakdown was added. */
  services_breakdown?: ShiftServiceBreakdown[];
  revenue_by_method?: Record<string, number>;
  services_by_method?: Record<string, number>;
  total_debits: number;
  net_profit: number;
  date_from?: string;
  date_to?: string;
}

export interface Shift {
  id: number;
  opened_by: number;
  opened_at: string;
  closed_by: number | null;
  closed_at: string | null;
  status: "open" | "closed";
  notes: string | null;
  opener?: ShiftUserRef;
  closer?: ShiftUserRef | null;
  figures?: ShiftSummary;
}

export interface CurrentShiftResponse {
  shift: Shift | null;
  summary?: ShiftSummary;
  can_close?: boolean;
}

export interface ShiftUserBreakdown {
  user_id: number;
  name: string;
  summary: ShiftSummary;
}

export interface ShiftDetails {
  shift: Shift;
  summary: ShiftSummary;
  users: ShiftUserBreakdown[] | null;
  transactions: Array<{
    id: number;
    type: "credit";
    amount: string;
    currency?: "SDG" | "USD";
    method: string | null;
    transaction_date: string;
    notes: string | null;
    customer?: ShiftUserRef | null;
    user?: ShiftUserRef | null;
  }>;
  services: Array<{
    id: number;
    amount: string | null;
    billed_amount?: number;
    currency?: "SDG" | "USD";
    payment_method: string | null;
    created_at: string;
    service?: { name: string } | null;
    room?: { number: string } | null;
    reservation?: { customer?: ShiftUserRef | null } | null;
    user?: ShiftUserRef | null;
  }>;
}

export { SHIFT_CHANGED_EVENT, SHIFT_REQUIRED_EVENT } from "./axios";

export const methodLabels: Record<string, string> = {
  cash: "نقدي",
  bankak: "بنكك",
  Ocash: "أوكاش",
  fawri: "فوري",
  unknown: "غير معروف",
};

/**
 * Reservation payments + services. Computed rather than read from net_profit, since
 * snapshots of shifts closed before refunds were dropped still have them deducted there.
 */
export const netOf = (summary: ShiftSummary | null | undefined) =>
  Number(summary?.total_revenue ?? 0) + Number(summary?.total_service_revenue ?? 0);

/** USD cash received for reservations + USD-billed services. */
export const usdOf = (summary: ShiftSummary | null | undefined) =>
  Number(summary?.total_revenue_usd_cash ?? 0) + Number(summary?.total_service_revenue_usd ?? 0);

export const formatMoney = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

export const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" }) : "-";

export async function openShiftPdf(shiftId: number) {
  try {
    const response = await apiClient.get(`/shifts/${shiftId}/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const newWindow = window.open(url, "_blank");
    if (!newWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة لعرض PDF");
      window.URL.revokeObjectURL(url);
      return;
    }
    newWindow.addEventListener("load", () => setTimeout(() => window.URL.revokeObjectURL(url), 1000));
  } catch {
    // apiClient already shows an error toast
  }
}
