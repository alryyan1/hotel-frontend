import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { Transaction } from "../../hooks/useAccounting";

interface TransactionsDialogProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  methodFilter: string;
  setMethodFilter: (val: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  methodLabels: Record<string, string>;
}

export default function TransactionsDialog({
  open,
  onClose,
  transactions,
  loading,
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  methodFilter,
  setMethodFilter,
  currentPage,
  setCurrentPage,
  totalPages,
  onEdit,
  onDelete,
  formatCurrency,
  methodLabels,
}: TransactionsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <AccountBalanceIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            العمليات المالية
          </Typography>
        </Stack>
      </DialogTitle>
      <Divider />
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: "grey.50",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="بحث بالمرجع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>النوع</InputLabel>
            <Select
              value={typeFilter}
              label="النوع"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="">الكل</MenuItem>
              <MenuItem value="debit">مدين</MenuItem>
              <MenuItem value="credit">دائن</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>طريقة الدفع</InputLabel>
            <Select
              value={methodFilter}
              label="طريقة الدفع"
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <MenuItem value="">الكل</MenuItem>
              <MenuItem value="cash">نقدي</MenuItem>
              <MenuItem value="bankak">بنكاك</MenuItem>
              <MenuItem value="Ocash">أوكاش</MenuItem>
              <MenuItem value="fawri">فوري</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              لا توجد عمليات مالية
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>التاريخ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>النوع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>العميل</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    المبلغ
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>طريقة الدفع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>المرجع</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    الإجراءات
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      {dayjs(transaction.transaction_date).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.type === "debit" ? "مدين" : "دائن"}
                        color={
                          transaction.type === "debit" ? "primary" : "success"
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{transaction.customer?.name || "-"}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      {transaction.method ? (
                        <Chip
                          label={
                            methodLabels[transaction.method] ||
                            transaction.method
                          }
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{transaction.reference || "-"}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <IconButton
                          size="small"
                          onClick={() => onEdit(transaction)}
                          disabled={transaction.type === "debit"}
                          title={
                            transaction.type === "debit"
                              ? "لا يمكن تعديل عمليات الحجز"
                              : "تعديل"
                          }
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(transaction)}
                          title="حذف"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}
