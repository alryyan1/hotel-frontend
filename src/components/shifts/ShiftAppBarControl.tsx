import { Clock, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useShift } from "@/contexts/ShiftContext";
import { formatDateTime } from "@/api/shifts";

export default function ShiftAppBarControl() {
  const { current, requestOpen, requestClose } = useShift();

  if (!current) return null;

  if (!current.shift) {
    return (
      <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={requestOpen}>
        <Unlock className="size-4" />
        <span className="hidden sm:inline">فتح وردية</span>
      </Button>
    );
  }

  const { shift } = current;

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-emerald-300/60 bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-900">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="size-4 shrink-0" />
            <span className="hidden md:inline">
              وردية #{shift.id} — منذ {formatDateTime(shift.opened_at)} — {shift.opener?.name}
            </span>
            <span className="md:hidden">#{shift.id}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          وردية #{shift.id} — فتحها {shift.opener?.name} في {formatDateTime(shift.opened_at)}
        </TooltipContent>
      </Tooltip>
      {current.can_close && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 hover:bg-emerald-100"
          onClick={requestClose}
          title="إغلاق الوردية"
        >
          <Lock className="size-4" />
        </Button>
      )}
    </div>
  );
}
