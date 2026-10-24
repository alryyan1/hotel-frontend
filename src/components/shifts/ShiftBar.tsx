import { Clock, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShift } from "@/contexts/ShiftContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, formatMoney } from "@/api/shifts";

export default function ShiftBar() {
  const { current, requestOpen, requestClose } = useShift();
  const { user } = useAuth();

  if (!current) return null;

  if (!current.shift) {
    return (
      <div className="flex flex-wrap items-center gap-3 mb-2 mt-1 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        <Lock className="size-4 shrink-0" />
        <span>لا توجد وردية مفتوحة — لا يمكن تسجيل العمليات المالية.</span>
        <Button size="sm" className="ms-auto h-8 gap-1" onClick={requestOpen}>
          <Unlock className="size-4" />
          فتح وردية
        </Button>
      </div>
    );
  }

  const { shift, summary } = current;
  const revenue = (summary?.total_revenue ?? 0) + (summary?.total_service_revenue ?? 0);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 mt-1 rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
      <span className="flex items-center gap-1 font-semibold">
        <Clock className="size-4 shrink-0" />
        وردية #{shift.id} مفتوحة
      </span>
      <span className="text-emerald-800/80">
        منذ {formatDateTime(shift.opened_at)} بواسطة {shift.opener?.name}
      </span>
      <span>
        {user?.is_admin ? "إيرادات الوردية" : "إيراداتك"}: <b>{formatMoney(revenue)}</b>
      </span>
      {current.can_close && (
        <Button size="sm" variant="outline" className="ms-auto h-8 gap-1 bg-white" onClick={requestClose}>
          <Lock className="size-4" />
          إغلاق الوردية
        </Button>
      )}
    </div>
  );
}
