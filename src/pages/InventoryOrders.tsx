import { useEffect, useState } from "react";
import apiClient from "../api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Printer,
} from "lucide-react";
import dayjs from "dayjs";
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Button as MuiButton,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
} from "@mui/material";

export default function InventoryOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openOrderDetails, setOpenOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [openFiltersDialog, setOpenFiltersDialog] = useState(false);

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

    if (filterStatus) {
      filtered = filtered.filter((order: any) => order.status === filterStatus);
    }

    filtered.sort((a: any, b: any) => {
      const dateA = dayjs(a.created_at);
      const dateB = dayjs(b.created_at);
      return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0;
    });

    setFilteredOrders(filtered);
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "approved":
        return "موافق عليه";
      case "rejected":
        return "مرفوض";
      case "completed":
        return "مكتمل";
      default:
        return status;
    }
  };

  const getStatusColor = (
    status: string,
  ): "default" | "primary" | "success" | "error" | "warning" => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "completed":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="size-4" />;
      case "approved":
        return <CheckCircle className="size-4" />;
      case "rejected":
        return <XCircle className="size-4" />;
      case "completed":
        return <Package className="size-4" />;
      default:
        return null;
    }
  };

  const handleApprove = async (order: any) => {
    if (
      !window.confirm(
        "هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم تحديث المخزون تلقائياً.",
      )
    )
      return;

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

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">طلبات المخزون</h1>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground font-medium">
          <span className="text-foreground font-bold">
            {filteredOrders.length}
          </span>{" "}
          من أصل{" "}
          <span className="text-foreground font-bold">{orders.length}</span> طلب
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setOpenFiltersDialog(true)}
            className="h-9 w-full sm:w-auto"
          >
            <Filter className="size-4 mr-2" />
            الفلاتر والبحث
          </Button>
        </div>
      </div>

      {/* Filters Dialog */}
      <MuiDialog
        open={openFiltersDialog}
        onClose={() => setOpenFiltersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <MuiDialogTitle>الفلاتر والبحث</MuiDialogTitle>
        <MuiDialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <TextField
              label="البحث"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              placeholder="ابحث في رقم الطلب، الملاحظات..."
              InputProps={{
                startAdornment: <Search className="size-4 mr-2" />,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="الحالة"
              >
                <MenuItem value="">جميع الحالات</MenuItem>
                <MenuItem value="pending">قيد الانتظار</MenuItem>
                <MenuItem value="approved">موافق عليه</MenuItem>
                <MenuItem value="rejected">مرفوض</MenuItem>
                <MenuItem value="completed">مكتمل</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton variant="outlined" onClick={clearFilters}>
            مسح الفلاتر
          </MuiButton>
          <MuiButton
            variant="contained"
            onClick={() => setOpenFiltersDialog(false)}
          >
            تطبيق
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>

      {/* Orders Table/Cards */}
      <Card className="border-border/40 shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">📋</div>
              <p className="text-muted-foreground">جارٍ التحميل...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3 opacity-50">📋</div>
              <p className="text-muted-foreground font-medium">لا توجد طلبات</p>
            </div>
          ) : (
            <>
              {/* Desktop Table Layout */}
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-bold text-center">
                        رقم الطلب
                      </TableHead>
                      <TableHead className="font-bold text-center">
                        التاريخ
                      </TableHead>
                      <TableHead className="font-bold text-center">
                        عدد العناصر
                      </TableHead>
                      <TableHead className="font-bold text-center">
                        الحالة
                      </TableHead>
                      <TableHead className="font-bold text-center">
                        المستخدم
                      </TableHead>
                      <TableHead className="font-bold text-center">
                        إجراءات
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: any) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-medium text-center">
                          {order.order_number || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {order.order_date
                            ? dayjs(order.order_date).format("YYYY-MM-DD")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {order.items?.length || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <Chip
                            label={getStatusLabel(order.status)}
                            color={getStatusColor(order.status)}
                            size="small"
                            icon={getStatusIcon(order.status)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {order.user?.username || order.user?.name || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(order)}
                            >
                              عرض التفاصيل
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportPdf(order.id)}
                              title="طباعة"
                            >
                              <Printer className="size-4" />
                            </Button>
                            {order.status === "pending" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApprove(order)}
                              >
                                موافقة
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <MuiDialog
        open={openOrderDetails}
        onClose={() => {
          setOpenOrderDetails(false);
          setSelectedOrder(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            maxHeight: "90vh",
          },
        }}
      >
        <MuiDialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          تفاصيل الطلب
          {selectedOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportPdf(selectedOrder.id)}
            >
              <Printer className="size-4 mr-2" />
              طباعة
            </Button>
          )}
        </MuiDialogTitle>
        <MuiDialogContent>
          {selectedOrder && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>رقم الطلب:</strong> {selectedOrder.order_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>التاريخ:</strong>{" "}
                  {selectedOrder.order_date
                    ? dayjs(selectedOrder.order_date).format("YYYY-MM-DD")
                    : "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>الحالة:</strong>
                  <Chip
                    label={getStatusLabel(selectedOrder.status)}
                    color={getStatusColor(selectedOrder.status)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>المستخدم:</strong>{" "}
                  {selectedOrder.user?.username ||
                    selectedOrder.user?.name ||
                    "-"}
                </Typography>
                {selectedOrder.notes && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>الملاحظات:</strong> {selectedOrder.notes}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  عناصر الطلب
                </Typography>
                <div className="rounded-lg border border-border/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-bold text-center">
                          العنصر
                        </TableHead>
                        <TableHead className="font-bold text-center">
                          الفئة
                        </TableHead>
                        <TableHead className="font-bold text-center">
                          الكمية
                        </TableHead>
                        <TableHead className="font-bold text-center">
                          ملاحظات
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">
                            {item.inventory?.name || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.inventory?.category?.name || "-"}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {parseFloat(item.quantity || 0).toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Box>

              {selectedOrder.status === "pending" && (
                <Box sx={{ display: "flex", gap: 2 }}>
                  <MuiButton
                    variant="contained"
                    color="success"
                    onClick={() => {
                      handleApprove(selectedOrder);
                      setOpenOrderDetails(false);
                    }}
                  >
                    موافقة
                  </MuiButton>
                  <MuiButton
                    variant="contained"
                    color="error"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder, "rejected");
                      setOpenOrderDetails(false);
                    }}
                  >
                    رفض
                  </MuiButton>
                </Box>
              )}
            </Box>
          )}
        </MuiDialogContent>
        <MuiDialogActions>
          <MuiButton
            variant="outlined"
            onClick={() => {
              setOpenOrderDetails(false);
              setSelectedOrder(null);
            }}
          >
            إغلاق
          </MuiButton>
        </MuiDialogActions>
      </MuiDialog>
    </div>
  );
}
