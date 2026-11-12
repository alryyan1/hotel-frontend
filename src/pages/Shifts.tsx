import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  Unlock,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { useShift } from "../contexts/ShiftContext";
import {
  formatDateTime,
  formatMoney,
  netOf,
  openShiftPdf,
  usdOf,
  type Shift,
  type ShiftDetails,
  type ShiftSummary,
  type ShiftUserBreakdown,
} from "../api/shifts";
import ShiftMethodTable from "@/components/shifts/ShiftMethodTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total?: number;
}

type StatusFilter = "all" | "open" | "closed";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "open", label: "مفتوحة" },
  { value: "closed", label: "مغلقة" },
];

// "3س 20د" between two timestamps; an open shift runs until now.
const formatDuration = (from: string | null | undefined, to?: string | null) => {
  if (!from) return "-";
  const minutes = Math.max(0, Math.floor((new Date(to ?? Date.now()).getTime() - new Date(from).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}ي ${hours}س`;
  if (hours > 0) return `${hours}س ${mins}د`;
  return `${mins}د`;
};

function StatusBadge({ status }: { status: Shift["status"] }) {
  return status === "open" ? (
    <Badge variant="success" className="gap-1.5">
      <span className="size-1.5 animate-pulse rounded-full bg-current" />
      مفتوحة
    </Badge>
  ) : (
    <Badge variant="secondary">مغلقة</Badge>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-lg font-bold tabular-nums">
          {value} {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Shifts() {
  const { user } = useAuth();
  const { current, requestOpen, requestClose } = useShift();
  const isAdmin = !!user?.is_admin;

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<ShiftDetails | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status !== "all") params.append("status", status);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      const { data } = await apiClient.get<Paginated<Shift>>(`/shifts?${params.toString()}`);
      setShifts(data.data);
      setLastPage(data.last_page);
    } catch {
      // apiClient already shows an error toast
    } finally {
      setLoading(false);
    }
  }, [page, status, dateFrom, dateTo]);

  // Reload when filters change or the current shift is opened/closed
  useEffect(() => {
    load();
  }, [load, current?.shift?.id, current?.shift?.status]);

  const showDetails = async (shiftId: number) => {
    setDetailsLoadingId(shiftId);
    try {
      const { data } = await apiClient.get<ShiftDetails>(`/shifts/${shiftId}`);
      setDetails(data);
    } catch {
      // apiClient already shows an error toast
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const hasFilters = status !== "all" || !!dateFrom || !!dateTo;
  const clearFilters = () => {
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const actions = (shift: Shift) => (
    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => showDetails(shift.id)}
        disabled={detailsLoadingId === shift.id}
        aria-label="التفاصيل"
      >
        {detailsLoadingId === shift.id ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => openShiftPdf(shift.id)} aria-label="طباعة">
        <FileText className="size-4" />
      </Button>
    </div>
  );

  const openShift = current?.shift;

  return (
    <div dir="rtl" className="space-y-4 p-4">
      {/* Current shift */}
      {current && (
        openShift ? (
          <Card className="gap-0 overflow-hidden border-primary/30 py-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                <span className="text-base font-bold">الوردية الحالية #{openShift.id}</span>
                <StatusBadge status="open" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => showDetails(openShift.id)}
                  disabled={detailsLoadingId === openShift.id}
                >
                  {detailsLoadingId === openShift.id ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                  التفاصيل
                </Button>
                {current.can_close && (
                  <Button size="sm" className="gap-1.5" onClick={requestClose}>
                    <Lock className="size-4" />
                    إغلاق الوردية
                  </Button>
                )}
              </div>
            </div>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile icon={UserRound} label="فتحها" value={openShift.opener?.name ?? "-"} />
              <StatTile icon={CalendarClock} label="منذ" value={formatDuration(openShift.opened_at)} unit={formatDateTime(openShift.opened_at)} />
              <StatTile icon={Wallet} label="إيرادات الجنيه" value={formatMoney(netOf(current.summary))} unit="ج.س" />
              <StatTile icon={DollarSign} label="إيرادات الدولار" value={formatMoney(usdOf(current.summary))} unit="$" />
            </CardContent>
          </Card>
        ) : (
          <Card className="py-0">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-semibold">لا توجد وردية مفتوحة</div>
                <div className="text-sm text-muted-foreground">يجب فتح وردية لتسجيل العمليات المالية</div>
              </div>
              <Button className="gap-1.5" onClick={requestOpen}>
                <Unlock className="size-4" />
                فتح وردية
              </Button>
            </CardContent>
          </Card>
        )
      )}

      {/* Filters */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-end gap-3 px-3">
          <div className="w-full space-y-1 sm:w-auto">
            <Label>الحالة</Label>
            <div className="flex rounded-lg border bg-muted/40 p-0.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => { setStatus(f.value); setPage(1); }}
                  className={cn(
                    "flex-1 rounded-md px-4 py-1.5 text-sm transition-colors sm:flex-none",
                    status === f.value ? "bg-background font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1 sm:w-40 sm:flex-none">
            <Label htmlFor="shift-from">من</Label>
            <Input id="shift-from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="min-w-0 flex-1 space-y-1 sm:w-40 sm:flex-none">
            <Label htmlFor="shift-to">إلى</Label>
            <Input id="shift-to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <div className="flex gap-2 sm:ms-auto">
            {hasFilters && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
                <X className="size-4" />
                مسح الفلاتر
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="تحديث">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && shifts.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!loading && shifts.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {hasFilters ? "لا توجد ورديات مطابقة للفلاتر" : "لا توجد ورديات"}
          </CardContent>
        </Card>
      )}

      {/* Mobile: one card per shift */}
      <div className="space-y-2 md:hidden">
        {shifts.map((shift) => (
          <Card key={shift.id} className="cursor-pointer gap-2 py-3" onClick={() => showDetails(shift.id)}>
            <CardContent className="space-y-3 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  وردية #{shift.id} <StatusBadge status={shift.status} />
                </div>
                {actions(shift)}
              </div>
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <div>الفتح: {formatDateTime(shift.opened_at)} — {shift.opener?.name}</div>
                {shift.closed_at && <div>الإغلاق: {formatDateTime(shift.closed_at)} — {shift.closer?.name}</div>}
                <div>المدة: {formatDuration(shift.opened_at, shift.closed_at)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-xs text-muted-foreground">الجنيه</div>
                  <div className="font-bold tabular-nums">{formatMoney(netOf(shift.figures))} ج.س</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-xs text-muted-foreground">الدولار</div>
                  <div className="font-bold tabular-nums">{formatMoney(usdOf(shift.figures))} $</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: table */}
      {shifts.length > 0 && (
        <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">الوردية</TableHead>
                <TableHead className="text-right">الفتح</TableHead>
                <TableHead className="text-right">الإغلاق</TableHead>
                <TableHead className="text-right">المدة</TableHead>
                <TableHead className="text-right">الجنيه (ج.س)</TableHead>
                <TableHead className="text-right">الدولار ($)</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id} className="cursor-pointer" onClick={() => showDetails(shift.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-semibold">
                      #{shift.id} <StatusBadge status={shift.status} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="tabular-nums">{formatDateTime(shift.opened_at)}</div>
                    <div className="text-xs text-muted-foreground">{shift.opener?.name}</div>
                  </TableCell>
                  <TableCell>
                    {shift.closed_at ? (
                      <>
                        <div className="tabular-nums">{formatDateTime(shift.closed_at)}</div>
                        <div className="text-xs text-muted-foreground">{shift.closer?.name}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatDuration(shift.opened_at, shift.closed_at)}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold tabular-nums">{formatMoney(netOf(shift.figures))}</div>
                    <div className="text-xs tabular-nums text-muted-foreground">
                      حجوزات {formatMoney(shift.figures?.total_revenue)} · خدمات {formatMoney(shift.figures?.total_service_revenue)}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold tabular-nums">{formatMoney(usdOf(shift.figures))}</TableCell>
                  <TableCell>{actions(shift)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            <ChevronRight className="size-4" />
            السابق
          </Button>
          <span className="min-w-16 text-center text-sm tabular-nums">{page} / {lastPage}</span>
          <Button variant="outline" size="sm" className="gap-1" disabled={page >= lastPage || loading} onClick={() => setPage(page + 1)}>
            التالي
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}

      <ShiftDetailsDialog details={details} onClose={() => setDetails(null)} isAdmin={isAdmin} />
    </div>
  );
}

function ShiftUsersTable({ users }: { users: ShiftUserBreakdown[] }) {
  const sum = (pick: (s: ShiftSummary) => number | undefined) =>
    users.reduce((total, row) => total + Number(pick(row.summary) ?? 0), 0);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead rowSpan={2} className="border-e text-right align-middle">المستخدم</TableHead>
            <TableHead colSpan={3} className="border-e text-center">الجنيه (ج.س)</TableHead>
            <TableHead colSpan={3} className="text-center">الدولار ($)</TableHead>
          </TableRow>
          <TableRow className="bg-muted/30">
            <TableHead className="text-right">الحجوزات</TableHead>
            <TableHead className="text-right">الخدمات</TableHead>
            <TableHead className="border-e text-right">الإجمالي</TableHead>
            <TableHead className="text-right">الحجوزات</TableHead>
            <TableHead className="text-right">الخدمات</TableHead>
            <TableHead className="text-right">الإجمالي</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                لا توجد إيرادات
              </TableCell>
            </TableRow>
          )}
          {users.map((row) => (
            <TableRow key={row.user_id}>
              <TableCell className="border-e">
                <span className="flex items-center gap-1.5 font-medium">
                  <UserRound className="size-4 text-muted-foreground" />
                  {row.name}
                </span>
              </TableCell>
              <TableCell className="tabular-nums">{formatMoney(row.summary.total_revenue)}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(row.summary.total_service_revenue)}</TableCell>
              <TableCell className="border-e font-semibold tabular-nums">{formatMoney(netOf(row.summary))}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(row.summary.total_revenue_usd_cash)}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(row.summary.total_service_revenue_usd)}</TableCell>
              <TableCell className="font-semibold tabular-nums">{formatMoney(usdOf(row.summary))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {users.length > 1 && (
          <TableFooter>
            <TableRow>
              <TableCell className="border-e">الإجمالي</TableCell>
              <TableCell className="tabular-nums">{formatMoney(sum((s) => s.total_revenue))}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(sum((s) => s.total_service_revenue))}</TableCell>
              <TableCell className="border-e tabular-nums">{formatMoney(sum(netOf))}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(sum((s) => s.total_revenue_usd_cash))}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(sum((s) => s.total_service_revenue_usd))}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(sum(usdOf))}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

function ShiftDetailsDialog({
  details,
  onClose,
  isAdmin,
}: {
  details: ShiftDetails | null;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const shift = details?.shift;

  return (
    <Dialog open={!!details} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto sm:max-w-[calc(100%-2rem)] md:max-w-6xl">
        {details && shift && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                تقرير الوردية #{shift.id} <StatusBadge status={shift.status} />
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">الفتح:</span>
                {formatDateTime(shift.opened_at)} — {shift.opener?.name}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">الإغلاق:</span>
                {formatDateTime(shift.closed_at)} {shift.closer?.name && `— ${shift.closer.name}`}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">المدة:</span>
                {formatDuration(shift.opened_at, shift.closed_at)}
              </div>
              {shift.notes && (
                <div className="rounded-lg bg-muted/50 p-2 sm:col-span-3">
                  <span className="text-muted-foreground">ملاحظات:</span> {shift.notes}
                </div>
              )}
            </div>

            <ShiftMethodTable summary={details.summary} />

            {isAdmin && details.users && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">إيرادات المستخدمين</h3>
                <ShiftUsersTable users={details.users} />
              </section>
            )}

            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => openShiftPdf(shift.id)}>
                <FileText className="size-4" />
                طباعة التقرير
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
