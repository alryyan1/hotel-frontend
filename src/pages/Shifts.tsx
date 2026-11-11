import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Eye, FileText, Loader2, RefreshCw, UserRound } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
}

const ALL = "all";

function StatusBadge({ status }: { status: Shift["status"] }) {
  return (
    <Badge variant={status === "open" ? "default" : "secondary"}>
      {status === "open" ? "مفتوحة" : "مغلقة"}
    </Badge>
  );
}

export default function Shifts() {
  const { user } = useAuth();
  const { current } = useShift();
  const isAdmin = !!user?.is_admin;

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<ShiftDetails | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status !== ALL) params.append("status", status);
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

  const actions = (shift: Shift) => (
    <div className="flex gap-1">
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

  return (
    <div dir="rtl" className="space-y-4 p-4">
      <PageHeader
        title="الورديات"
        description={isAdmin ? "إيرادات كل وردية بالجنيه والدولار وتفصيلها حسب المستخدم" : "إيراداتك بالجنيه والدولار في كل وردية"}
        icon="🕐"
      />

      <Card className="py-3">
        <CardContent className="flex flex-wrap items-end gap-3 px-3">
          <div className="w-full space-y-1 sm:w-36">
            <Label htmlFor="shift-status">الحالة</Label>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger id="shift-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>الكل</SelectItem>
                <SelectItem value="open">مفتوحة</SelectItem>
                <SelectItem value="closed">مغلقة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 flex-1 space-y-1 sm:w-40 sm:flex-none">
            <Label htmlFor="shift-from">من</Label>
            <Input id="shift-from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="min-w-0 flex-1 space-y-1 sm:w-40 sm:flex-none">
            <Label htmlFor="shift-to">إلى</Label>
            <Input id="shift-to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <Button variant="outline" size="icon" className="sm:ms-auto" onClick={load} disabled={loading} aria-label="تحديث">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
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
          <CardContent className="py-10 text-center text-muted-foreground">لا توجد ورديات</CardContent>
        </Card>
      )}

      {/* Mobile: one card per shift */}
      <div className="space-y-2 md:hidden">
        {shifts.map((shift) => (
            <Card key={shift.id} className="gap-2 py-3">
              <CardContent className="space-y-2 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    #{shift.id} <StatusBadge status={shift.status} />
                  </div>
                  {actions(shift)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateTime(shift.opened_at)} — {shift.opener?.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">إيرادات الجنيه</div>
                    <div className="font-semibold tabular-nums">{formatMoney(netOf(shift.figures))} ج.س</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">إيرادات الدولار</div>
                    <div className="font-semibold tabular-nums">{formatMoney(usdOf(shift.figures))} $</div>
                  </div>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>

      {/* Desktop: table */}
      {shifts.length > 0 && (
        <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">#</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الفتح</TableHead>
                <TableHead className="text-right">الإغلاق</TableHead>
                <TableHead className="text-right">الحجوزات</TableHead>
                <TableHead className="text-right">الخدمات</TableHead>
                <TableHead className="text-right">إيرادات الجنيه</TableHead>
                <TableHead className="text-right">إيرادات الدولار</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.id}</TableCell>
                    <TableCell><StatusBadge status={shift.status} /></TableCell>
                    <TableCell>
                      <div>{formatDateTime(shift.opened_at)}</div>
                      <div className="text-xs text-muted-foreground">{shift.opener?.name}</div>
                    </TableCell>
                    <TableCell>
                      <div>{formatDateTime(shift.closed_at)}</div>
                      <div className="text-xs text-muted-foreground">{shift.closer?.name}</div>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatMoney(shift.figures?.total_revenue)}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(shift.figures?.total_service_revenue)}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatMoney(netOf(shift.figures))}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{formatMoney(usdOf(shift.figures))} $</TableCell>
                    <TableCell>{actions(shift)}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            السابق
          </Button>
          <span className="text-sm">{page} / {lastPage}</span>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
            التالي
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

            <div className="grid gap-2 text-sm sm:grid-cols-2">
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
              {shift.notes && (
                <div className="rounded-lg bg-muted/50 p-2 sm:col-span-2">
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
