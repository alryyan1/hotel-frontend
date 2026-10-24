import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import apiClient from "../api/axios";
import { SHIFT_CHANGED_EVENT, SHIFT_REQUIRED_EVENT, type CurrentShiftResponse } from "../api/shifts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CloseShiftDialog from "@/components/shifts/CloseShiftDialog";
import { useAuth } from "./AuthContext";

interface ShiftContextType {
  current: CurrentShiftResponse | null;
  refresh: () => Promise<void>;
  requestOpen: () => void;
  requestClose: () => void;
}

const ShiftContext = createContext<ShiftContextType>({
  current: null,
  refresh: async () => {},
  requestOpen: () => {},
  requestClose: () => {},
});

const REFRESH_INTERVAL_MS = 60_000;

export function ShiftProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState<CurrentShiftResponse | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [opening, setOpening] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get<CurrentShiftResponse>("/shifts/current");
      setCurrent(data);
    } catch {
      // apiClient already shows an error toast
    }
  }, [user]);

  // Initial load, periodic refresh, and refresh when returning to the tab,
  // so the bar's figures follow operations recorded from any page
  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    window.addEventListener(SHIFT_CHANGED_EVENT, refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(SHIFT_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  // A 423 from any financial endpoint asks the user to open a shift
  useEffect(() => {
    const onShiftRequired = () => setOpenDialog(true);
    window.addEventListener(SHIFT_REQUIRED_EVENT, onShiftRequired);
    return () => window.removeEventListener(SHIFT_REQUIRED_EVENT, onShiftRequired);
  }, []);

  const handleOpen = async () => {
    setOpening(true);
    try {
      await apiClient.post("/shifts/open");
      toast.success("تم فتح الوردية");
      setOpenDialog(false);
      await refresh();
    } catch {
      // apiClient already shows an error toast (e.g. another shift is already open)
      await refresh();
    } finally {
      setOpening(false);
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        current,
        refresh,
        requestOpen: () => setOpenDialog(true),
        requestClose: () => setCloseDialog(true),
      }}
    >
      {children}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>فتح وردية جديدة</DialogTitle>
            <DialogDescription>
              {current?.shift
                ? `توجد وردية مفتوحة بالفعل (#${current.shift.id}) بواسطة ${current.shift.opener?.name ?? ""}.`
                : "لا توجد وردية مفتوحة. يجب فتح وردية لتسجيل العمليات المالية. سيبدأ الصندوق فارغاً."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={opening}>
              إلغاء
            </Button>
            {!current?.shift && (
              <Button onClick={handleOpen} disabled={opening}>
                {opening ? "جارٍ الفتح..." : "فتح الوردية"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {current?.shift && (
        <CloseShiftDialog open={closeDialog} onOpenChange={setCloseDialog} current={current} onClosed={refresh} />
      )}
    </ShiftContext.Provider>
  );
}

export const useShift = () => useContext(ShiftContext);
