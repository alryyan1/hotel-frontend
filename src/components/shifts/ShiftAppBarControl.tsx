import { Clock, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useShift } from "@/contexts/ShiftContext";

const blackOutlineButton =
  "border-black text-black hover:bg-black hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black";

// Shift timestamps in the app bar read in English regardless of app locale,
// since staff here read them as plain 24h clock values.
const formatShiftDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "-";

export default function ShiftAppBarControl() {
  const { current, requestOpen, requestClose } = useShift();

  if (!current) return null;

  if (!current.shift) {
    return (
      <Button
        size="sm"
        variant="outline"
        className={`h-9 gap-1.5 ${blackOutlineButton}`}
        onClick={requestOpen}
      >
        <Unlock className="size-4" />
        <span className="hidden sm:inline">فتح وردية</span>
      </Button>
    );
  }

  const { shift } = current;

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-300/60 bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-900 whitespace-nowrap">
            <Clock className="size-4 shrink-0" />
            <span className="hidden md:inline">
              وردية #{shift.id} — منذ {formatShiftDateTime(shift.opened_at)} — {shift.opener?.name}
            </span>
            <span className="md:hidden">#{shift.id}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          وردية #{shift.id} — فتحها {shift.opener?.name} في {formatShiftDateTime(shift.opened_at)}
        </TooltipContent>
      </Tooltip>
      {current.can_close && (
        <Button
          size="sm"
          variant="outline"
          className={`h-9 gap-1.5 ${blackOutlineButton}`}
          onClick={requestClose}
        >
          <Lock className="size-4" />
          <span className="hidden sm:inline">إغلاق الوردية</span>
        </Button>
      )}
    </div>
  );
}
