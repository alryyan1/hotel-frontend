import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Stack, Grid, Chip, Paper } from "@mui/material";
import {
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useAccounting, Transaction } from "../hooks/useAccounting";
import AccountingHeader from "../components/accounting/AccountingHeader";
import AccountingSummary from "../components/accounting/AccountingSummary";
import TransactionsDialog from "../components/accounting/TransactionsDialog";
import CustomerBalancesDialog from "../components/accounting/CustomerBalancesDialog";
import TransactionEditDialog from "../components/accounting/TransactionEditDialog";

export default function Accountant() {
  const navigate = useNavigate();
  const {
    summary,
    transactions,
    customerBalances,
    loading,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    transactionTypeFilter,
    setTransactionTypeFilter,
    transactionMethodFilter,
    setTransactionMethodFilter,
    searchTerm,
    setSearchTerm,
    transactionsPage,
    setTransactionsPage,
    transactionsTotalPages,
    balancesPage,
    setBalancesPage,
    balancesTotalPages,
    handleExportPdf,
    handleExportExcel,
    deleteTransaction,
    updateTransaction,
    refreshAll,
  } = useAccounting();

  // UI States
  const [openTransactionsDialog, setOpenTransactionsDialog] = useState(false);
  const [openCustomerBalancesDialog, setOpenCustomerBalancesDialog] =
    useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return "0";
    }
    return new Intl.NumberFormat("en-US").format(amount);
  };

  const methodLabels: Record<string, string> = {
    cash: "نقدي",
    bankak: "بنكاك",
    Ocash: "أوكاش",
    fawri: "فوري",
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setOpenEditDialog(true);
  };

  const handleDeleteClick = async (transaction: Transaction) => {
    await deleteTransaction(transaction.id);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        p: { xs: 2, md: 4 },
        maxWidth: "1400px",
        mx: "auto",
        width: "100%",
        minHeight: "100vh",
        pb: 6,
      }}
    >
      <AccountingHeader
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        handleExportPdf={handleExportPdf}
        handleExportExcel={handleExportExcel}
        loading={loading}
      />

      <AccountingSummary
        summary={summary}
        formatCurrency={formatCurrency}
        methodLabels={methodLabels}
        onRefresh={refreshAll}
      />

      {/* Quick Access Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            onClick={() => setOpenTransactionsDialog(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              border: "2px solid transparent",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                borderColor: "primary.main",
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(25, 118, 210, 0.3)",
                }}
              >
                <AccountBalanceIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  العمليات المالية
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  عرض جميع العمليات المالية
                </Typography>
                <Chip
                  label={`${transactions.length} عملية`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <ArrowForwardIcon sx={{ color: "primary.main" }} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            onClick={() => setOpenCustomerBalancesDialog(true)}
            sx={{
              p: 3,
              borderRadius: 3,
              bgcolor: "white",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
              border: "2px solid transparent",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                borderColor: "primary.main",
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={3}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(25, 118, 210, 0.3)",
                }}
              >
                <PeopleIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  أرصدة العملاء
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  عرض جميع أرصدة العملاء
                </Typography>
                <Chip
                  label={`${customerBalances.length} عميل`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <ArrowForwardIcon sx={{ color: "primary.main" }} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <TransactionsDialog
        open={openTransactionsDialog}
        onClose={() => setOpenTransactionsDialog(false)}
        transactions={transactions}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        typeFilter={transactionTypeFilter}
        setTypeFilter={setTransactionTypeFilter}
        methodFilter={transactionMethodFilter}
        setMethodFilter={setTransactionMethodFilter}
        currentPage={transactionsPage}
        setCurrentPage={setTransactionsPage}
        totalPages={transactionsTotalPages}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        formatCurrency={formatCurrency}
        methodLabels={methodLabels}
      />

      <CustomerBalancesDialog
        open={openCustomerBalancesDialog}
        onClose={() => setOpenCustomerBalancesDialog(false)}
        customerBalances={customerBalances}
        loading={loading}
        currentPage={balancesPage}
        setCurrentPage={setBalancesPage}
        totalPages={balancesTotalPages}
        formatCurrency={formatCurrency}
        onCustomerClick={(id) => {
          setOpenCustomerBalancesDialog(false);
          navigate(`/customers/${id}/ledger`);
        }}
      />

      <TransactionEditDialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
          setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        loading={loading}
        onSave={updateTransaction}
      />
    </Box>
  );
}
