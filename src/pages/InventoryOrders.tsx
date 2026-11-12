import { useEffect, useState } from "react";
import apiClient from "../api/axios";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Printer,
  Eye,
  X,
  ClipboardList,
} from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ALL = "all";

const STATUS_META: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: {
    label: "قيد الانتظار",
    icon: Clock,
    className: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  },
  approved: {
    label: "موافق عليه",
    icon: CheckCircle,
    className: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  rejected: {
    label: "مرفوض",
    icon: XCircle,
    className: "border-transparent bg-destructive/10 text-destructive",
  },
  completed: {
    label: "مكتمل",
    icon: Package,
    className: "border-transparent bg-primary/10 text-primary",
  },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  if (!meta) return <Badge variant="secondary">{status}</Badge>;
  const Icon = meta.icon;
  return (
    <Badge className={meta.className}>
      <Icon />
      {meta.label}
    </Badge>
  );
}

const formatDate = (value: string | null | undefined) => (value ? dayjs(value).format("YYYY-MM-DD") : "-");
const userName = (order: any) => order.user?.username || order.user?.name || "-";

export default function InventoryOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openOrderDetails, setOpenOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  // Order waiting for approval confirmation (approving updates stock)
  const [pendingApprove, setPendingApprove] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/inventory-orders");
      const ordersData = data?.data || data || [];
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message || "فشل في تحميل الطلبات");
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(
        (order: any) =>
          (order.order_number || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (order.notes || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterStatus !== ALL) {
      filtered = filtered.filter((order: any) => order.status === filterStatus);
    }

    filtered.sort((a: any, b: any) => {
      const dateA = dayjs(a.created_at);
      const dateB = dayjs(b.created_at);
      return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
    });

    setFilteredOrders(filtered);
  };

  const handleApprove = async (order: any) => {
    try {
      setLoading(true);
      await apiClient.post(`/inventory-orders/${order.id}/approve`);
      toast.success("تم الموافقة على الطلب بنجاح");
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل الموافقة على الطلب");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (order: any, newStatus: string) => {
    try {
      setLoading(true);
      await apiClient.put(`/inventory-orders/${order.id}`, {
        status: newStatus,
      });
      toast.success("تم تحديث حالة الطلب بنجاح");
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تحديث حالة الطلب");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setOpenOrderDetails(true);
  };

  const closeDetails = () => {
    setOpenOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleExportPdf = async (orderId: number) => {
    try {
      const response = await apiClient.get(`/inventory-orders/${orderId}/pdf`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inventory_order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      toast.error("فشل في تصدير ملف PDF");
    }
  };

  const hasFilters = !!searchTerm || filterStatus !== ALL;
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus(ALL);
  };

  const orderActions = (order: any) => (
    <div className="flex justify-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(order)} aria-label="عرض التفاصيل">
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleExportPdf(order.id)} aria-label="طباعة">
        <Printer className="size-4" />
      </Button>
      {order.status === "pending" && (
        <Button size="sm" className="gap-1" onClick={() => setPendingApprove(order)}>
          <CheckCircle className="size-4" />
          موافقة
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <h1 className="text-xl font-bold">طلبات المخزون</h1>

      {/* Filters */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-center gap-2 px-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder="ابحث في رقم الطلب، الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-44 sm:flex-none">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>جميع الحالات</SelectItem>
              {Object.entries(STATUS_META).map(([value, meta]) => (
                <SelectItem key={value} value={value}>{meta.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
              <X className="size-4" />
              مسح الفلاتر
            </Button>
          )}
          <span className="text-sm text-muted-foreground sm:ms-auto">
            <span className="font-bold text-foreground">{filteredOrders.length}</span> من أصل{" "}
            <span className="font-bold text-foreground">{orders.length}</span> طلب
          </span>
        </CardContent>
      </Card>

      {/* Orders */}
      {loading && orders.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ClipboardList className="size-12 text-muted-foreground/50" />
            <div className="font-medium">لا توجد طلبات</div>
            {hasFilters && <div className="text-sm text-muted-foreground">لم يتم العثور على طلبات تطابق معايير البحث</div>}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: one card per order */}
          <div className="space-y-2 md:hidden">
            {filteredOrders.map((order: any) => (
              <Card key={order.id} className="gap-2 py-3">
                <CardContent className="space-y-2 px-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{order.order_number || "-"}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(order.order_date)} · {order.items?.length || 0} عنصر · {userName(order)}
                  </div>
                  {orderActions(order)}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center">رقم الطلب</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                  <TableHead className="text-center">عدد العناصر</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">المستخدم</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-center font-semibold">{order.order_number || "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">{formatDate(order.order_date)}</TableCell>
                    <TableCell className="text-center tabular-nums">{order.items?.length || 0}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-center text-muted-foreground">{userName(order)}</TableCell>
                    <TableCell>{orderActions(order)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Order Details Dialog */}
      <Dialog open={openOrderDetails} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pe-6">
              تفاصيل الطلب
              {selectedOrder && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExportPdf(selectedOrder.id)}>
                  <Printer className="size-4" />
                  طباعة
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">رقم الطلب</div>
                  <div className="font-semibold">{selectedOrder.order_number}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">التاريخ</div>
                  <div className="font-semibold tabular-nums">{formatDate(selectedOrder.order_date)}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">الحالة</div>
                  <div className="pt-0.5"><StatusBadge status={selectedOrder.status} /></div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">المستخدم</div>
                  <div className="font-semibold">{userName(selectedOrder)}</div>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2 rounded-lg bg-muted/50 p-2.5 sm:col-span-4">
                    <div className="text-xs text-muted-foreground">الملاحظات</div>
                    <div>{selectedOrder.notes}</div>
                  </div>
                )}
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">عناصر الطلب</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-center">العنصر</TableHead>
                        <TableHead className="text-center">الفئة</TableHead>
                        <TableHead className="text-center">الكمية</TableHead>
                        <TableHead className="text-center">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center font-medium">{item.inventory?.name || "-"}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{item.inventory?.category?.name || "-"}</TableCell>
                          <TableCell className="text-center font-bold tabular-nums">
                            {parseFloat(item.quantity || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">{item.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedOrder?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => {
                    handleUpdateStatus(selectedOrder, "rejected");
                    setOpenOrderDetails(false);
                  }}
                >
                  <XCircle className="size-4" />
                  رفض
                </Button>
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    setPendingApprove(selectedOrder);
                    setOpenOrderDetails(false);
                  }}
                >
                  <CheckCircle className="size-4" />
                  موافقة
                </Button>
              </>
            )}
            <Button variant="outline" onClick={closeDetails}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve confirmation */}
      <AlertDialog open={!!pendingApprove} onOpenChange={(open) => !open && setPendingApprove(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>الموافقة على الطلب {pendingApprove?.order_number}</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم تحديث المخزون تلقائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingApprove) handleApprove(pendingApprove);
                setPendingApprove(null);
              }}
            >
              موافقة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
