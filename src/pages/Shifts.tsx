import { useCallback, useEffect, useState } from "react";
import { Eye, FileText, RefreshCw } from "lucide-react";
import apiClient from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { useShift } from "../contexts/ShiftContext";
import {
  formatDateTime,
  formatMoney,
  methodLabels,
  openShiftPdf,
  type Shift,
  type ShiftDetails,
} from "../api/shifts";
import ShiftMethodTable from "@/components/shifts/ShiftMethodTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
}

export default function Shifts() {
  const { user } = useAuth();
  const { current } = useShift();
  const isAdmin = !!user?.is_admin;

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<ShiftDetails | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.append("status", status);
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
    try {
      const { data } = await apiClient.get<ShiftDetails>(`/shifts/${shiftId}`);
      setDetails(data);
    } catch {
      // apiClient already shows an error toast
    }
  };

  return (
    <div dir="rtl" className="space-y-4 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold">الورديات</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "إيرادات كل وردية وتفصيلها حسب المستخدم" : "إيراداتك في كل وردية"}
          </p>
        </div>
        <div className="ms-auto flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="shift-status">الحالة</Label>
            <select
              id="shift-status"
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">الكل</option>
              <option value="open">مفتوحة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="shift-from">من</Label>
            <Input id="shift-from" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="shift-to">إلى</Label>
            <Input id="shift-to" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <Button variant="outline" size="icon" onClick={load} disabled={loading} aria-label="تحديث">
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">#</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الفتح</TableHead>
              <TableHead className="text-right">الإغلاق</TableHead>
              <TableHead className="text-right">مدفوعات الحجوزات</TableHead>
              <TableHead className="text-right">الخدمات</TableHead>
              <TableHead className="text-right">المصروف</TableHead>
              <TableHead className="text-right">الصافي</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  {loading ? "جارٍ التحميل..." : "لا توجد ورديات"}
                </TableCell>
              </TableRow>
            )}
            {shifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>{shift.id}</TableCell>
                <TableCell>
                  <Badge variant={shift.status === "open" ? "default" : "secondary"}>
                    {shift.status === "open" ? "مفتوحة" : "مغلقة"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>{formatDateTime(shift.opened_at)}</div>
                  <div className="text-xs text-muted-foreground">{shift.opener?.name}</div>
                </TableCell>
                <TableCell>
                  <div>{formatDateTime(shift.closed_at)}</div>
                  <div className="text-xs text-muted-foreground">{shift.closer?.name}</div>
                </TableCell>
                <TableCell>{formatMoney(shift.figures?.total_revenue)}</TableCell>
                <TableCell>{formatMoney(shift.figures?.total_service_revenue)}</TableCell>
                <TableCell>{formatMoney(shift.figures?.total_expenses)}</TableCell>
                <TableCell className="font-semibold">{formatMoney(shift.figures?.net_profit)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => showDetails(shift.id)} aria-label="التفاصيل">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openShiftPdf(shift.id)} aria-label="طباعة">
                      <FileText className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        {details && shift && (
          <>
            <DialogHeader>
              <DialogTitle>
                الوردية #{shift.id} — {shift.status === "open" ? "مفتوحة" : "مغلقة"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>الفتح: {formatDateTime(shift.opened_at)} — {shift.opener?.name}</div>
              <div>الإغلاق: {formatDateTime(shift.closed_at)} {shift.closer?.name && `— ${shift.closer.name}`}</div>
              {shift.notes && <div className="sm:col-span-2">ملاحظات: {shift.notes}</div>}
            </div>

            <ShiftMethodTable summary={details.summary} />

            {isAdmin && details.users && (
              <section className="space-y-2">
                <h3 className="font-semibold">إيرادات المستخدمين</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">المستخدم</TableHead>
                        <TableHead className="text-right">مدفوعات الحجوزات</TableHead>
                        <TableHead className="text-right">الخدمات</TableHead>
                        <TableHead className="text-right">المصروف</TableHead>
                        <TableHead className="text-right">مسترجع</TableHead>
                        <TableHead className="text-right">الصافي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            لا توجد عمليات
                          </TableCell>
                        </TableRow>
                      )}
                      {details.users.map((row) => (
                        <TableRow key={row.user_id}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{formatMoney(row.summary.total_revenue)}</TableCell>
                          <TableCell>{formatMoney(row.summary.total_service_revenue)}</TableCell>
                          <TableCell>{formatMoney(row.summary.total_expenses)}</TableCell>
                          <TableCell>{formatMoney(row.summary.total_refunds)}</TableCell>
                          <TableCell className="font-semibold">{formatMoney(row.summary.net_profit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="font-semibold">العمليات</h3>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">البيان</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الطريقة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      {isAdmin && <TableHead className="text-right">المستخدم</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.transactions.map((t) => (
                      <TableRow key={`t-${t.id}`}>
                        <TableCell>{t.type === "credit" ? "دفعة" : "مسترجع"}</TableCell>
                        <TableCell>{t.customer?.name ?? t.notes ?? "-"}</TableCell>
                        <TableCell>{formatMoney(t.amount)}</TableCell>
                        <TableCell>{methodLabels[t.method ?? ""] ?? t.method ?? "-"}</TableCell>
                        <TableCell>{formatDateTime(t.transaction_date)}</TableCell>
                        {isAdmin && <TableCell>{t.user?.name ?? "-"}</TableCell>}
                      </TableRow>
                    ))}
                    {details.services.map((s) => (
                      <TableRow key={`s-${s.id}`}>
                        <TableCell>خدمة</TableCell>
                        <TableCell>
                          {s.service?.name ?? "-"}
                          {s.room?.number && ` — غرفة ${s.room.number}`}
                          {s.reservation?.customer?.name && ` — ${s.reservation.customer.name}`}
                        </TableCell>
                        <TableCell>{formatMoney(s.amount)}</TableCell>
                        <TableCell>{methodLabels[s.payment_method ?? "cash"] ?? s.payment_method}</TableCell>
                        <TableCell>{formatDateTime(s.created_at)}</TableCell>
                        {isAdmin && <TableCell>{s.user?.name ?? "-"}</TableCell>}
                      </TableRow>
                    ))}
                    {details.costs.map((c) => (
                      <TableRow key={`c-${c.id}`}>
                        <TableCell>مصروف</TableCell>
                        <TableCell>{c.description}</TableCell>
                        <TableCell>{formatMoney(c.amount)}</TableCell>
                        <TableCell>{methodLabels[c.payment_method ?? "unknown"] ?? c.payment_method}</TableCell>
                        <TableCell>{c.date}</TableCell>
                        {isAdmin && <TableCell>{c.user?.name ?? "-"}</TableCell>}
                      </TableRow>
                    ))}
                    {details.transactions.length + details.services.length + details.costs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                          لا توجد عمليات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>

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
