import { toast } from "sonner";
import apiClient from "./axios";

export interface ShiftUserRef {
  id: number;
  name: string;
}

export interface ShiftSummary {
  total_revenue: number;
  total_service_revenue?: number;
  revenue_by_method?: Record<string, number>;
  services_by_method?: Record<string, number>;
  total_debits: number;
  total_refunds: number;
  refunds_by_method?: Record<string, number>;
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
    type: "credit" | "refund";
    amount: string;
    method: string | null;
    transaction_date: string;
    notes: string | null;
    customer?: ShiftUserRef | null;
    user?: ShiftUserRef | null;
  }>;
  services: Array<{
    id: number;
    amount: string | null;
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
