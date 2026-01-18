import { useState, useEffect } from "react";
import apiClient from "../api/axios";
import { toast } from "sonner";
import dayjs from "dayjs";

export interface Summary {
  total_revenue: number;
  revenue_by_method?: Record<string, number>;
  total_debits: number;
  total_expenses: number;
  expenses_by_method?: Record<string, number>;
  net_profit: number;
  date_from?: string;
  date_to?: string;
}

export interface Transaction {
  id: number;
  customer_id: number;
  reservation_id?: number;
  type: "debit" | "credit";
  amount: number;
  currency: string;
  method?: "cash" | "bankak" | "Ocash" | "fawri";
  reference?: string;
  transaction_date: string;
  notes?: string;
  customer?: {
    id: number;
    name: string;
    phone?: string;
  };
  reservation?: {
    id: number;
    check_in_date: string;
    check_out_date: string;
  };
}

export interface CustomerBalance {
  id: number;
  name: string;
  phone?: string;
  national_id?: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

export function useAccounting() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customerBalances, setCustomerBalances] = useState<CustomerBalance[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  // Date filters
  const [dateFrom, setDateFrom] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [dateTo, setDateTo] = useState(
    dayjs().endOf("month").format("YYYY-MM-DD"),
  );

  // Transaction filters
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [transactionMethodFilter, setTransactionMethodFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [balancesPage, setBalancesPage] = useState(1);
  const [balancesTotalPages, setBalancesTotalPages] = useState(1);

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
    fetchCustomerBalances();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [
    transactionTypeFilter,
    transactionMethodFilter,
    searchTerm,
    transactionsPage,
  ]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const { data } = await apiClient.get(
        `/accounting/summary?${params.toString()}`,
      );
      setSummary(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في جلب الملخص المالي");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (transactionTypeFilter) params.append("type", transactionTypeFilter);
      if (transactionMethodFilter)
        params.append("method", transactionMethodFilter);
      if (searchTerm) params.append("search", searchTerm);
      params.append("per_page", "20");
      params.append("page", transactionsPage.toString());

      const { data } = await apiClient.get(
        `/accounting/transactions?${params.toString()}`,
      );
      setTransactions(data.data || []);
      setTransactionsTotalPages(data.last_page || 1);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "فشل في جلب العمليات المالية",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBalances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("per_page", "20");
      params.append("page", balancesPage.toString());

      const { data } = await apiClient.get(
        `/accounting/customer-balances?${params.toString()}`,
      );
      setCustomerBalances(data.data || []);
      setBalancesTotalPages(data.last_page || 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في جلب أرصدة العملاء");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await apiClient.get(
        `/accounting/report/pdf?${params.toString()}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");

      if (!newWindow) {
        toast.error("يرجى السماح بالنوافذ المنبثقة لعرض PDF");
        window.URL.revokeObjectURL(url);
        return;
      }

      newWindow.addEventListener("load", () => {
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      });

      toast.success("تم فتح التقرير في نافذة جديدة");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في تصدير PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);

      const response = await apiClient.get(
        `/accounting/report/excel?${params.toString()}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `accounting_report_${dayjs().format("YYYY-MM-DD")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("تم تحميل التقرير بنجاح");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في تصدير Excel");
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه العملية؟")) return;

    try {
      setLoading(true);
      await apiClient.delete(`/transactions/${id}`);
      toast.success("تم حذف العملية بنجاح");
      fetchTransactions();
      fetchSummary();
      fetchCustomerBalances();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في حذف العملية");
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: number, form: any) => {
    try {
      setLoading(true);
      await apiClient.put(`/transactions/${id}`, form);
      toast.success("تم تحديث العملية بنجاح");
      fetchTransactions();
      fetchSummary();
      fetchCustomerBalances();
      return true;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في تحديث العملية");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
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
    refreshAll: () => {
      fetchSummary();
      fetchTransactions();
      fetchCustomerBalances();
    },
  };
}
