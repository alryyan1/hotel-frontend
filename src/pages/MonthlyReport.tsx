import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import apiClient from "../api/axios";
import dayjs from "dayjs";

interface DailyData {
  date: string;
  revenue_total: number;
  revenue_cash: number;
  revenue_bank: number;
  expense_total: number;
  expense_cash: number;
  expense_bank: number;
  net: number;
}

export default function MonthlyReport() {
  const [report, setReport] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/accounting/monthly-report", {
        params: { year, month },
      });
      setReport(data.report);
    } catch (error) {
      console.error("Failed to fetch monthly report", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount);
  };

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const totals = report.reduce(
    (acc, day) => ({
      revenue_total: acc.revenue_total + day.revenue_total,
      revenue_cash: acc.revenue_cash + day.revenue_cash,
      revenue_bank: acc.revenue_bank + day.revenue_bank,
      expense_total: acc.expense_total + day.expense_total,
      expense_cash: acc.expense_cash + day.expense_cash,
      expense_bank: acc.expense_bank + day.expense_bank,
      net: acc.net + day.net,
    }),
    {
      revenue_total: 0,
      revenue_cash: 0,
      revenue_bank: 0,
      expense_total: 0,
      expense_cash: 0,
      expense_bank: 0,
      net: 0,
    },
  );

  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: "1400px",
        mx: "auto",
        width: "100%",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "white",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          mb: 4,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={3}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "primary.main", mb: 1 }}
            >
              تقرير الإيرادات والمصروفات الشهري
            </Typography>
            <Typography variant="body1" color="text.secondary">
              عرض تفصيلي للعمليات المالية اليومية
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={handleNextMonth}>
              <ChevronRightIcon />
            </IconButton>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={month}
                onChange={(e) => setMonth(e.target.value as number)}
              >
                {months.map((m, i) => (
                  <MenuItem key={i + 1} value={i + 1}>
                    {m}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={year}
                onChange={(e) => setYear(e.target.value as number)}
              >
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - 5 + i,
                ).map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <IconButton onClick={handlePrevMonth}>
              <ChevronLeftIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ p: 10, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 700 }}>التاريخ</TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  إجمالي الإيرادات
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  إيرادات نقدي
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  إيرادات بنك
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: "error.main" }}
                >
                  إجمالي المصروفات
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  مصروفات نقدي
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  مصروفات بنك
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  الصافي
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.map((day) => (
                <TableRow key={day.date} hover>
                  <TableCell>{dayjs(day.date).format("DD-MM-YYYY")}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    {formatCurrency(day.revenue_total)}
                  </TableCell>
                  <TableCell align="center" color="text.secondary">
                    {formatCurrency(day.revenue_cash)}
                  </TableCell>
                  <TableCell align="center" color="text.secondary">
                    {formatCurrency(day.revenue_bank)}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, color: "error.main" }}
                  >
                    {formatCurrency(day.expense_total)}
                  </TableCell>
                  <TableCell align="center" color="text.secondary">
                    {formatCurrency(day.expense_cash)}
                  </TableCell>
                  <TableCell align="center" color="text.secondary">
                    {formatCurrency(day.expense_bank)}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      color: day.net >= 0 ? "success.main" : "error.main",
                    }}
                  >
                    {formatCurrency(day.net)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: "primary.main" }}>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>
                  الإجمالي
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "white", fontWeight: 700 }}
                >
                  {formatCurrency(totals.revenue_total)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "white", fontWeight: 600 }}
                >
                  {formatCurrency(totals.revenue_cash)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "white", fontWeight: 600 }}
                >
                  {formatCurrency(totals.revenue_bank)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "white", fontWeight: 700 }}
                >
                  {formatCurrency(totals.expense_total)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "white", fontWeight: 600 }}
                >
                  {formatCurrency(totals.expense_cash)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "white", fontWeight: 600 }}
                >
                  {formatCurrency(totals.expense_bank)}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ color: "white", fontWeight: 700 }}
                >
                  {formatCurrency(totals.net)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}
