import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { People as PeopleIcon } from "@mui/icons-material";
import { CustomerBalance } from "../../hooks/useAccounting";

interface CustomerBalancesDialogProps {
  open: boolean;
  onClose: () => void;
  customerBalances: CustomerBalance[];
  loading: boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  formatCurrency: (amount: number) => string;
  onCustomerClick: (id: number) => void;
}

export default function CustomerBalancesDialog({
  open,
  onClose,
  customerBalances,
  loading,
  currentPage,
  setCurrentPage,
  totalPages,
  formatCurrency,
  onCustomerClick,
}: CustomerBalancesDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <PeopleIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            أرصدة العملاء
          </Typography>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : customerBalances.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="body1" color="text.secondary">
              لا توجد أرصدة عملاء
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>العميل</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>الهاتف</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    مدين
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    دائن
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    الرصيد
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customerBalances.map((balance) => (
                  <TableRow
                    key={balance.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => onCustomerClick(balance.id)}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {balance.name}
                    </TableCell>
                    <TableCell>{balance.phone || "-"}</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: "success.main", fontWeight: 500 }}
                    >
                      {formatCurrency(balance.total_debit)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: "error.main", fontWeight: 500 }}
                    >
                      {formatCurrency(balance.total_credit)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 600,
                        color:
                          balance.balance > 0 ? "error.main" : "success.main",
                      }}
                    >
                      {formatCurrency(balance.balance)}
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
