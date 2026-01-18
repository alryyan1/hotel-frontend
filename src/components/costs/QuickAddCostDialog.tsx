import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { toast } from "sonner";
import dayjs from "dayjs";
import apiClient from "../../api/axios";

interface QuickAddCostDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickAddCostDialog({
  open,
  onClose,
  onSuccess,
}: QuickAddCostDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showQuickCategory, setShowQuickCategory] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: dayjs().format("YYYY-MM-DD"),
    cost_category_id: "",
    payment_method: "cash",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchCategories();
      // Reset form on open
      setForm({
        description: "",
        amount: "",
        date: dayjs().format("YYYY-MM-DD"),
        cost_category_id: "",
        payment_method: "cash",
        notes: "",
      });
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const { data } = await apiClient.get("/cost-categories");
      setCategories(data?.data || data || []);
    } catch (err) {
      console.error("Failed to fetch cost categories", err);
    }
  };

  const handleQuickAddCategory = async () => {
    if (!quickCategoryName.trim()) {
      toast.error("يرجى إدخال اسم الفئة");
      return;
    }

    try {
      setAddingCategory(true);
      const { data } = await apiClient.post("/cost-categories", {
        name: quickCategoryName.trim(),
      });
      toast.success("تم إضافة الفئة بنجاح");
      await fetchCategories();
      setForm({ ...form, cost_category_id: data.id.toString() });
      setQuickCategoryName("");
      setShowQuickCategory(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إضافة الفئة");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.date) {
      toast.error("يرجى إكمال جميع الحقول المطلوبة");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        cost_category_id: form.cost_category_id
          ? parseInt(form.cost_category_id)
          : null,
        payment_method: form.payment_method || null,
        notes: form.notes || null,
      };

      await apiClient.post("/costs", payload);
      toast.success("تم إضافة المصروف بنجاح");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشلت العملية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>إضافة مصروف سريع</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
        >
          <TextField
            label="الوصف"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            fullWidth
            size="small"
            autoFocus
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="المبلغ"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="التاريخ"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Box>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <FormControl fullWidth size="small">
                <InputLabel>الفئة</InputLabel>
                <Select
                  value={form.cost_category_id}
                  onChange={(e) =>
                    setForm({ ...form, cost_category_id: e.target.value })
                  }
                  label="الفئة"
                >
                  <MenuItem value="">اختر الفئة</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!showQuickCategory && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowQuickCategory(true)}
                  sx={{ whiteSpace: "nowrap", minWidth: "auto" }}
                >
                  فئة جديدة
                </Button>
              )}
            </Stack>
            {showQuickCategory && (
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <TextField
                  label="اسم الفئة الجديدة"
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleQuickAddCategory}
                  disabled={addingCategory || !quickCategoryName.trim()}
                >
                  {addingCategory ? <CircularProgress size={16} /> : "إضافة"}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowQuickCategory(false)}
                >
                  إلغاء
                </Button>
              </Stack>
            )}
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel>طريقة الدفع</InputLabel>
            <Select
              value={form.payment_method}
              onChange={(e) =>
                setForm({ ...form, payment_method: e.target.value })
              }
              label="طريقة الدفع"
            >
              <MenuItem value="cash">نقداً</MenuItem>
              <MenuItem value="bankak">بنكك</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="ملاحظات"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            fullWidth
            multiline
            rows={2}
            size="small"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? <CircularProgress size={24} /> : "إضافة المصروف"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
