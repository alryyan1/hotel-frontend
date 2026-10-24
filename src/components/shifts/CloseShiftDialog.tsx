import { useState } from "react";
import { toast } from "sonner";
import apiClient from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { openShiftPdf, type CurrentShiftResponse } from "@/api/shifts";
import ShiftMethodTable from "./ShiftMethodTable";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: CurrentShiftResponse;
  onClosed: () => void;
}

export default function CloseShiftDialog({ open, onOpenChange, current, onClosed }: Props) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleClose = async () => {
    if (!current.shift) return;
    setSaving(true);
    try {
      await apiClient.post(`/shifts/${current.shift.id}/close`, { notes: notes || null });
      toast.success("تم إغلاق الوردية");
      const shiftId = current.shift.id;
      setNotes("");
      onOpenChange(false);
      onClosed();
      openShiftPdf(shiftId);
    } catch {
      // apiClient already shows an error toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>إغلاق الوردية #{current.shift?.id}</DialogTitle>
          <DialogDescription>
            تُحسب المبالغ المستلمة فعلاً فقط، وقيمة الحجوزات غير المدفوعة لا تدخل في الوردية.
          </DialogDescription>
        </DialogHeader>

        {current.summary && <ShiftMethodTable summary={current.summary} />}

        <div className="space-y-1">
          <Label htmlFor="shift-notes">ملاحظات</Label>
          <Textarea id="shift-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={handleClose} disabled={saving}>
            {saving ? "جارٍ الإغلاق..." : "إغلاق الوردية وطباعة التقرير"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
