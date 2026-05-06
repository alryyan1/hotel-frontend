import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/axios";
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Pagination,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  RestoreFromTrash as RestoreIcon,
  DeleteForever as DeleteForeverIcon,
  ArrowBack as ArrowBackIcon,
  DeleteSweep as DeleteSweepIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

interface DeletedCustomer {
  id: number;
  name: string;
  phone?: string;
  national_id?: string;
  type?: "individual" | "company";
  email?: string;
  deleted_at: string;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function DeletedCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<DeletedCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const fetchTrashed = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/customers/trashed", {
        params: {
          page: currentPage,
          per_page: perPage,
          ...(searchTerm && { search: searchTerm }),
        },
      });

      if (data.data && Array.isArray(data.data)) {
        setCustomers(data.data);
        setPaginationMeta({
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          per_page: data.per_page || 20,
          total: data.total || 0,
        });
      }
    } catch {
      toast.error("فشل في تحميل العملاء المحذوفين");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTrashed();
    }, 400);
    return () => clearTimeout(timeout);
  }, [fetchTrashed]);

  const handleRestore = async (customer: DeletedCustomer) => {
    if (!confirm(`هل تريد استعادة العميل "${customer.name}"؟`)) return;
    try {
      await apiClient.post(`/customers/${customer.id}/restore`);
      toast.success(`تم استعادة العميل "${customer.name}" بنجاح`);
      fetchTrashed();
    } catch {
      toast.error("فشل في استعادة العميل");
    }
  };

  const handleForceDelete = async (customer: DeletedCustomer) => {
    if (
      !confirm(
        `هل أنت متأكد من الحذف النهائي للعميل "${customer.name}"؟\nلا يمكن التراجع عن هذا الإجراء.`
      )
    )
      return;
    try {
      await apiClient.delete(`/customers/${customer.id}/force`);
      toast.success(`تم الحذف النهائي للعميل "${customer.name}"`);
      fetchTrashed();
    } catch {
      toast.error("فشل في الحذف النهائي");
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 1 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <DeleteSweepIcon color="warning" />
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                العملاء المحذوفون ({paginationMeta.total})
              </Typography>
            </Stack>
          }
          action={
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/customers")}
            >
              العودة
            </Button>
          }
        />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="البحث بالاسم، الهاتف، أو الرقم الوطني..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    الاسم
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    النوع
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    الهاتف
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    الرقم الوطني
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    تاريخ الحذف
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <DeleteSweepIcon
                        sx={{ fontSize: 48, mb: 1, opacity: 0.4 }}
                        color="action"
                      />
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        display="block"
                      >
                        لا يوجد عملاء محذوفون
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      sx={{ bgcolor: "action.hover" }}
                    >
                      <TableCell align="center" sx={{ fontWeight: 500 }}>
                        {customer.name}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            customer.type === "company" ? "شركة" : "عميل عادي"
                          }
                          color={
                            customer.type === "company"
                              ? "secondary"
                              : "primary"
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {customer.phone ?? (
                          <Typography variant="body2" color="text.secondary">
                            غير محدد
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {customer.national_id ?? (
                          <Typography variant="body2" color="text.secondary">
                            غير محدد
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ color: "error.main" }}>
                        {dayjs(customer.deleted_at).format("DD/MM/YYYY HH:mm")}
                      </TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="center"
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            startIcon={<RestoreIcon />}
                            onClick={() => handleRestore(customer)}
                          >
                            استعادة
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            title="حذف نهائي"
                            onClick={() => handleForceDelete(customer)}
                          >
                            <DeleteForeverIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          {!loading && customers.length > 0 && (
            <Box
              sx={{
                mt: 3,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  عرض:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    sx={{ "& .MuiSelect-select": { py: 1 } }}
                  >
                    {[10, 20, 50, 100].map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  من أصل {paginationMeta.total}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={paginationMeta.current_page === 1}
                  size="small"
                  sx={{ border: 1, borderColor: "divider" }}
                >
                  <ChevronRightIcon />
                </IconButton>

                <Pagination
                  count={paginationMeta.last_page}
                  page={paginationMeta.current_page}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  size="medium"
                  showFirstButton
                  showLastButton
                  siblingCount={1}
                  boundaryCount={1}
                />

                <IconButton
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(p + 1, paginationMeta.last_page)
                    )
                  }
                  disabled={
                    paginationMeta.current_page === paginationMeta.last_page
                  }
                  size="small"
                  sx={{ border: 1, borderColor: "divider" }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
