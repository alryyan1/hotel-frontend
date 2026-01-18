import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Transaction } from "../../hooks/useAccounting";

interface TransactionEditDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  loading: boolean;
  onSave: (id: number, form: any) => Promise<boolean>;
}

export default function TransactionEditDialog({
  open,
  onClose,
  transaction,
  loading,
  onSave,
}: TransactionEditDialogProps) {
  const [editForm, setEditForm] = useState({
    amount: "",
    method: "cash" as "cash" | "bankak" | "Ocash" | "fawri",
    reference: "",
    notes: "",
    transaction_date: "",
  });

  useEffect(() => {
    if (transaction) {
      setEditForm({
        amount: transaction.amount.toString(),
        method: transaction.method || "cash",
        reference: transaction.reference || "",
        notes: transaction.notes || "",
        transaction_date: dayjs(transaction.transaction_date).format(
          "YYYY-MM-DD",
        ),
      });
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;
    const success = await onSave(transaction.id, editForm);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>تعديل العملية المالية</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              type="date"
              label="تاريخ العملية"
              value={editForm.transaction_date}
              onChange={(e) =>
                setEditForm({ ...editForm, transaction_date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="المبلغ"
              value={editForm.amount}
              onChange={(e) =>
                setEditForm({ ...editForm, amount: e.target.value })
              }
              inputProps={{ step: "0.01", min: "0.01" }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>طريقة الدفع</InputLabel>
              <Select
                value={editForm.method}
                label="طريقة الدفع"
                onChange={(e) =>
                  setEditForm({ ...editForm, method: e.target.value as any })
                }
              >
                <MenuItem value="cash">نقدي</MenuItem>
                <MenuItem value="bankak">بنكاك</MenuItem>
                <MenuItem value="Ocash">أوكاش</MenuItem>
                <MenuItem value="fawri">فوري</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="الرقم المرجعي"
              value={editForm.reference}
              onChange={(e) =>
                setEditForm({ ...editForm, reference: e.target.value })
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="ملاحظات"
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          إلغاء
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={
            loading || !editForm.amount || parseFloat(editForm.amount) <= 0
          }
        >
          {loading ? <CircularProgress size={16} /> : "حفظ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
