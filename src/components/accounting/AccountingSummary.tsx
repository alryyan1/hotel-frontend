import { useState } from "react";
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Button,
} from "@mui/material";
import {
  AttachMoney as DollarSignIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Undo as UndoIcon,
  RoomService as RoomServiceIcon,
  PictureAsPdf as PdfIcon,
} from "@mui/icons-material";
import { Summary } from "../../hooks/useAccounting";
import QuickAddCostDialog from "../costs/QuickAddCostDialog";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

interface AccountingSummaryProps {
  summary: Summary | null;
  formatCurrency: (amount: number) => string;
  methodLabels: Record<string, string>;
  onRefresh?: () => void;
  onExportNetPdf?: () => void;
}

export default function AccountingSummary({
  summary,
  formatCurrency,
  methodLabels,
  onRefresh,
  onExportNetPdf,
}: AccountingSummaryProps) {
  const [openQuickAdd, setOpenQuickAdd] = useState(false);
  const [openRevenueBreakdown, setOpenRevenueBreakdown] = useState(false);
  const [openExpensesBreakdown, setOpenExpensesBreakdown] = useState(false);
  const [openNetBreakdown, setOpenNetBreakdown] = useState(false);
  const [openServicesBreakdown, setOpenServicesBreakdown] = useState(false);
  const [openRefundsBreakdown, setOpenRefundsBreakdown] = useState(false);

  if (!summary) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Financial Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => setOpenRevenueBreakdown(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  إجمالي الإيرادات
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  {formatCurrency(summary.total_revenue)}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "primary.light",
                  color: "primary.main",
                }}
              >
                <DollarSignIcon sx={{ fontSize: 32 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {(summary.total_service_revenue ?? 0) > 0 && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              onClick={() => setOpenServicesBreakdown(true)}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: "white",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    إيرادات الخدمات
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "info.main" }}
                  >
                    {formatCurrency(summary.total_service_revenue ?? 0)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "info.light",
                    color: "info.main",
                  }}
                >
                  <RoomServiceIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => setOpenExpensesBreakdown(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    إجمالي المصروفات
                  </Typography>
                  <Tooltip title="إضافة مصروف سريع">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenQuickAdd(true);
                      }}
                      sx={{
                        bgcolor: "error.light",
                        "&:hover": { bgcolor: "error.main", color: "white" },
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "error.main" }}
                >
                  {formatCurrency(summary.total_expenses)}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "error.light",
                  color: "error.main",
                }}
              >
                <TrendingDownIcon sx={{ fontSize: 32 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <QuickAddCostDialog
          open={openQuickAdd}
          onClose={() => setOpenQuickAdd(false)}
          onSuccess={onRefresh}
        />

        {(summary.total_refunds ?? 0) > 0 && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
            onClick={() => setOpenRefundsBreakdown(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              },
            }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    المبالغ المسترجعة
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "warning.dark" }}
                  >
                    {formatCurrency(summary.total_refunds ?? 0)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "warning.light",
                    color: "warning.dark",
                  }}
                >
                  <UndoIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => setOpenNetBreakdown(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  الصافي
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color:
                      summary.net_profit >= 0 ? "success.main" : "error.main",
                  }}
                >
                  {formatCurrency(summary.net_profit)}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor:
                    summary.net_profit >= 0 ? "success.light" : "error.light",
                  color:
                    summary.net_profit >= 0 ? "success.main" : "error.main",
                }}
              >
                <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Revenue Breakdown Dialog */}
      <Dialog
        open={openRevenueBreakdown}
        onClose={() => setOpenRevenueBreakdown(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          تفصيل الإيرادات حسب طريقة الدفع
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>طريقة الدفع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">المبلغ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.revenue_by_method && Object.entries(summary.revenue_by_method).map(([method, amount]) => (
                  <TableRow key={method} hover>
                    <TableCell>{methodLabels[method] || method}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {formatCurrency(amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>الإجمالي</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {formatCurrency(summary.total_revenue)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* Expenses Breakdown Dialog */}
      <Dialog
        open={openExpensesBreakdown}
        onClose={() => setOpenExpensesBreakdown(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          تفصيل المصروفات حسب طريقة الدفع
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>طريقة الدفع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">المبلغ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.expenses_by_method && Object.entries(summary.expenses_by_method).map(([method, amount]) => (
                  <TableRow key={method} hover>
                    <TableCell>{methodLabels[method] || method}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {formatCurrency(amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>الإجمالي</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatCurrency(summary.total_expenses)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
      {/* Net Breakdown Dialog */}
      <Dialog
        open={openNetBreakdown}
        onClose={() => setOpenNetBreakdown(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ width: 48 }} /> {/* Spacer to center the title */}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              تفصيل الصافي حسب طريقة الدفع
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<PdfIcon />}
              onClick={onExportNetPdf}
              disabled={!onExportNetPdf}
              sx={{ borderRadius: 2 }}
            >
              تصدير PDF
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>طريقة الدفع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">الايرادات</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">الخدمات</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">المصروف</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">مسترجع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">الصافي</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from(new Set([
                  ...Object.keys(summary.revenue_by_method || {}),
                  ...Object.keys(summary.services_by_method || {}),
                  ...Object.keys(summary.expenses_by_method || {})
                ])).map((method) => {
                  const rev = summary.revenue_by_method?.[method] || 0;
                  const srv = summary.services_by_method?.[method] || 0;
                  const exp = summary.expenses_by_method?.[method] || 0;
                  const ref = summary.refunds_by_method?.[method] || 0;
                  const net = (rev + srv) - exp - ref;
                  return (
                    <TableRow key={method} hover>
                      <TableCell>{methodLabels[method] || method}</TableCell>
                      <TableCell align="right">{formatCurrency(rev)}</TableCell>
                      <TableCell align="right" sx={{ color: 'info.main' }}>{formatCurrency(srv)}</TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>{formatCurrency(exp)}</TableCell>
                      <TableCell align="right" sx={{ color: 'warning.dark' }}>{formatCurrency(ref)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: net >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(net)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>الإجمالي</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(summary.total_revenue)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>{formatCurrency(summary.total_service_revenue || 0)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(summary.total_expenses)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.dark' }}>{formatCurrency(summary.total_refunds || 0)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: summary.net_profit >= 0 ? 'success.main' : 'error.main' }}>
                    {formatCurrency(summary.net_profit)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {/* Services Breakdown Dialog */}
      <Dialog
        open={openServicesBreakdown}
        onClose={() => setOpenServicesBreakdown(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          تفصيل إيرادات الخدمات حسب طريقة الدفع
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>طريقة الدفع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">المبلغ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.services_by_method && Object.entries(summary.services_by_method).map(([method, amount]) => (
                  <TableRow key={method} hover>
                    <TableCell>{methodLabels[method] || method}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'info.main' }}>
                      {formatCurrency(amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>الإجمالي</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {formatCurrency(summary.total_service_revenue || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
      {/* Refunds Breakdown Dialog */}
      <Dialog
        open={openRefundsBreakdown}
        onClose={() => setOpenRefundsBreakdown(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          تفصيل المبالغ المسترجعة حسب طريقة الدفع
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>طريقة الدفع</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">المبلغ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.refunds_by_method && Object.entries(summary.refunds_by_method).map(([method, amount]) => (
                  <TableRow key={method} hover>
                    <TableCell>{methodLabels[method] || method}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                      {formatCurrency(amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>الإجمالي</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                    {formatCurrency(summary.total_refunds || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
