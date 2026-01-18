import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";

interface AccountingHeaderProps {
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  handleExportPdf: () => void;
  handleExportExcel: () => void;
  loading: boolean;
}

export default function AccountingHeader({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  handleExportPdf,
  handleExportExcel,
  loading,
}: AccountingHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
        color: "white",
        boxShadow: "0 10px 30px rgba(25, 118, 210, 0.2)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            الحسابات
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            نظرة شاملة على الأداء المالي
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          sx={{ flexWrap: "wrap" }}
        >
          <TextField
            type="date"
            label="من تاريخ"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(255,255,255,0.7)",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.9)",
              },
            }}
          />
          <TextField
            type="date"
            label="إلى تاريخ"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: 1,
              "& .MuiOutlinedInput-root": {
                color: "white",
                "& fieldset": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(255,255,255,0.5)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "rgba(255,255,255,0.7)",
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.9)",
              },
            }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportPdf}
              disabled={loading}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                backdropFilter: "blur(10px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={loading}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                backdropFilter: "blur(10px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              Excel
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
