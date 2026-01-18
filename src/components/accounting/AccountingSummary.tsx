import { useState } from "react";
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AttachMoney as DollarSignIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
} from "@mui/icons-material";
import { Summary } from "../../hooks/useAccounting";
import QuickAddCostDialog from "../costs/QuickAddCostDialog";

interface AccountingSummaryProps {
  summary: Summary | null;
  formatCurrency: (amount: number) => string;
  methodLabels: Record<string, string>;
  onRefresh?: () => void;
}

export default function AccountingSummary({
  summary,
  formatCurrency,
  methodLabels,
  onRefresh,
}: AccountingSummaryProps) {
  const [openQuickAdd, setOpenQuickAdd] = useState(false);

  if (!summary) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Financial Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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
                      onClick={() => setOpenQuickAdd(true)}
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

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
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

      {/* Payment Method Breakdown Cards */}
      <Grid container spacing={3}>
        {summary.revenue_by_method &&
          Object.keys(summary.revenue_by_method).length > 0 && (
            <Grid size={{ xs: 12, md: summary.expenses_by_method ? 6 : 12 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  height: "100%",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <DollarSignIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    تفصيل الإيرادات حسب طريقة الدفع
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  {Object.entries(summary.revenue_by_method).map(
                    ([method, amount]) => (
                      <Grid key={method} size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "grey.50",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {methodLabels[method] || method}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            {formatCurrency(amount)}
                          </Typography>
                        </Box>
                      </Grid>
                    ),
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

        {summary.expenses_by_method &&
          Object.keys(summary.expenses_by_method).length > 0 && (
            <Grid size={{ xs: 12, md: summary.revenue_by_method ? 6 : 12 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: "white",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  height: "100%",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 2 }}
                >
                  <TrendingDownIcon color="error" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    تفصيل المصروفات حسب طريقة الدفع
                  </Typography>
                </Stack>
                <Grid container spacing={2}>
                  {Object.entries(summary.expenses_by_method).map(
                    ([method, amount]) => (
                      <Grid key={method} size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: "grey.50",
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0.5 }}
                          >
                            {methodLabels[method] || method}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, color: "error.main" }}
                          >
                            {formatCurrency(amount)}
                          </Typography>
                        </Box>
                      </Grid>
                    ),
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
      </Grid>
    </Box>
  );
}
