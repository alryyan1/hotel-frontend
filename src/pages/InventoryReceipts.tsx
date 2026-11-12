import { useEffect, useState } from "react";
import apiClient from "../api/axios";
import { toast } from "sonner";
import { Search, ArrowDownCircle, Printer, Eye, Trash2, X } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

const formatDate = (value: string | null | undefined) => (value ? dayjs(value).format("YYYY-MM-DD") : "-");
const formatAmount = (value: any) =>
  parseFloat(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const userName = (receipt: any) => receipt.user?.username || receipt.user?.name || "-";

export default function InventoryReceipts() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openReceiptDetails, setOpenReceiptDetails] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  // Receipt waiting for delete confirmation (deleting reverses stock)
  const [pendingDelete, setPendingDelete] = useState<any>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchTerm, dateFrom, dateTo, supplierFilter]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/inventory-receipts");
      const receiptsData = data?.data || data || [];
      setReceipts(receiptsData);
      setFilteredReceipts(receiptsData);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.message || "فشل في تحميل الواردات");
      } else {
        setReceipts([]);
        setFilteredReceipts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterReceipts = () => {
    let filtered = [...receipts];

    if (searchTerm) {
      filtered = filtered.filter(
        (receipt: any) =>
          (receipt.receipt_number || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (receipt.notes || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (receipt.supplier || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((receipt: any) => {
        const receiptDate = dayjs(receipt.receipt_date).format("YYYY-MM-DD");
        return receiptDate >= dateFrom;
      });
    }

    if (dateTo) {
      filtered = filtered.filter((receipt: any) => {
        const receiptDate = dayjs(receipt.receipt_date).format("YYYY-MM-DD");
        return receiptDate <= dateTo;
      });
    }

    if (supplierFilter) {
      filtered = filtered.filter((receipt: any) =>
        (receipt.supplier || "")
          .toLowerCase()
          .includes(supplierFilter.toLowerCase()),
      );
    }

    filtered.sort((a: any, b: any) => {
      const dateA = dayjs(a.created_at);
      const dateB = dayjs(b.created_at);
      return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
    });

    setFilteredReceipts(filtered);
  };

  const handleViewDetails = (receipt: any) => {
    setSelectedReceipt(receipt);
    setOpenReceiptDetails(true);
  };

  const closeDetails = () => {
    setOpenReceiptDetails(false);
    setSelectedReceipt(null);
  };

  const handleDelete = async (receipt: any) => {
    try {
      setLoading(true);
      await apiClient.delete(`/inventory-receipts/${receipt.id}`);
      toast.success("تم حذف الوارد بنجاح");
      fetchReceipts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل حذف الوارد");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async (receiptId: number) => {
    try {
      const response = await apiClient.get(
        `/inventory-receipts/${receiptId}/pdf`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `inventory_receipt_${receiptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      toast.error("فشل في تصدير ملف PDF");
    }
  };

  const hasFilters = !!searchTerm || !!dateFrom || !!dateTo || !!supplierFilter;
  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setSupplierFilter("");
  };

  const receiptActions = (receipt: any) => (
    <div className="flex justify-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(receipt)} aria-label="عرض التفاصيل">
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleExportPdf(receipt.id)} aria-label="طباعة">
        <Printer className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        onClick={() => setPendingDelete(receipt)}
        aria-label="حذف"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <h1 className="text-xl font-bold">واردات المخزون</h1>

      {/* Filters */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-end gap-2 px-3">
          <div className="w-full space-y-1 sm:w-64">
            <Label htmlFor="receipt-search">البحث</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="receipt-search"
                className="ps-9"
                placeholder="رقم الوارد، المورد، الملاحظات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full space-y-1 sm:w-44">
            <Label htmlFor="receipt-supplier-filter">المورد</Label>
            <Input
              id="receipt-supplier-filter"
              placeholder="اسم المورد"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-1 sm:w-40 sm:flex-none">
            <Label htmlFor="receipt-from">من تاريخ</Label>
            <Input id="receipt-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="min-w-0 flex-1 space-y-1 sm:w-40 sm:flex-none">
            <Label htmlFor="receipt-to">إلى تاريخ</Label>
            <Input id="receipt-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
              <X className="size-4" />
              مسح الفلاتر
            </Button>
          )}
          <span className="pb-2 text-sm text-muted-foreground sm:ms-auto">
            <span className="font-bold text-foreground">{filteredReceipts.length}</span> من أصل{" "}
            <span className="font-bold text-foreground">{receipts.length}</span> وارد
          </span>
        </CardContent>
      </Card>

      {/* Receipts */}
      {loading && receipts.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <ArrowDownCircle className="size-12 text-muted-foreground/50" />
            <div className="font-medium">لا توجد واردات</div>
            {hasFilters && <div className="text-sm text-muted-foreground">لم يتم العثور على واردات تطابق معايير البحث</div>}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: one card per receipt */}
          <div className="space-y-2 md:hidden">
            {filteredReceipts.map((receipt: any) => (
              <Card key={receipt.id} className="gap-2 py-3">
                <CardContent className="space-y-2 px-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{receipt.receipt_number || "-"}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{formatDate(receipt.receipt_date)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {receipt.supplier || "بدون مورد"} · {receipt.items?.length || 0} عنصر · {userName(receipt)}
                  </div>
                  {receiptActions(receipt)}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center">رقم الوارد</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                  <TableHead className="text-center">المورد</TableHead>
                  <TableHead className="text-center">عدد العناصر</TableHead>
                  <TableHead className="text-center">المستخدم</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt: any) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="text-center font-semibold">{receipt.receipt_number || "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">{formatDate(receipt.receipt_date)}</TableCell>
                    <TableCell className="text-center">{receipt.supplier || "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">{receipt.items?.length || 0}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{userName(receipt)}</TableCell>
                    <TableCell>{receiptActions(receipt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Receipt Details Dialog */}
      <Dialog open={openReceiptDetails} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pe-6">
              تفاصيل الوارد
              {selectedReceipt && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExportPdf(selectedReceipt.id)}>
                  <Printer className="size-4" />
                  طباعة
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">رقم الوارد</div>
                  <div className="font-semibold">{selectedReceipt.receipt_number}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">التاريخ</div>
                  <div className="font-semibold tabular-nums">{formatDate(selectedReceipt.receipt_date)}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">المورد</div>
                  <div className="font-semibold">{selectedReceipt.supplier || "-"}</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2.5">
                  <div className="text-xs text-muted-foreground">المستخدم</div>
                  <div className="font-semibold">{userName(selectedReceipt)}</div>
                </div>
                {selectedReceipt.notes && (
                  <div className="col-span-2 rounded-lg bg-muted/50 p-2.5 sm:col-span-4">
                    <div className="text-xs text-muted-foreground">الملاحظات</div>
                    <div>{selectedReceipt.notes}</div>
                  </div>
                )}
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">عناصر الوارد</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-center">العنصر</TableHead>
                        <TableHead className="text-center">الفئة</TableHead>
                        <TableHead className="text-center">الكمية المستلمة</TableHead>
                        <TableHead className="text-center">سعر الشراء</TableHead>
                        <TableHead className="text-center">ملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReceipt.items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center font-medium">{item.inventory?.name || "-"}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{item.inventory?.category?.name || "-"}</TableCell>
                          <TableCell className="text-center font-bold tabular-nums">{formatAmount(item.quantity_received)}</TableCell>
                          <TableCell className="text-center tabular-nums">
                            {item.purchase_price ? formatAmount(item.purchase_price) : "-"}
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

          <DialogFooter>
            <Button variant="outline" onClick={closeDetails}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الوارد {pendingDelete?.receipt_number}</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الوارد؟ سيتم عكس الكميات في المخزون.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
