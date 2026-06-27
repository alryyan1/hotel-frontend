import { useEffect, useState, useCallback } from "react";
import apiClient from "../api/axios";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  InputAdornment,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
  Casino as DiceIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { Zoom } from "@mui/material";
import dayjs from "dayjs";

interface Participant {
  id: number;
  full_name: string;
  phone_number: string;
  address: string;
  has_won: boolean;
  created_at: string;
}

export default function ContestParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async (searchTerm: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Participant[]>("/contest-participants", {
        params: { search: searchTerm || undefined },
      });
      setParticipants(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants("");
  }, [fetchParticipants]);

  useEffect(() => {
    const timer = setTimeout(() => fetchParticipants(search), 400);
    return () => clearTimeout(timer);
  }, [search, fetchParticipants]);

  const handleDraw = async () => {
    setDrawing(true);
    setDrawError(null);
    try {
      const { data } = await apiClient.post<Participant>("/contest-draw");
      setWinner(data);
      // تحديث الصف في الجدول مباشرة دون إعادة جلب كل القائمة
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.id ? { ...p, has_won: true } : p))
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "حدث خطأ أثناء السحب";
      setDrawError(msg);
    } finally {
      setDrawing(false);
    }
  };

  const eligibleCount = participants.filter((p) => !p.has_won).length;

  return (
    <Box sx={{ p: 3 }}>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardHeader
          sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 2 }}
          title={
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <TrophyIcon sx={{ color: "#D4A017", fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700}>
                  المشتركون في السحب
                </Typography>
                <Chip
                  label={`${participants.length} مشترك`}
                  size="small"
                  sx={{ bgcolor: "rgba(212,160,23,0.12)", color: "#A17514", fontWeight: 600 }}
                />
                {eligibleCount > 0 && (
                  <Chip
                    label={`${eligibleCount} متاح للسحب`}
                    size="small"
                    variant="outlined"
                    sx={{ color: "text.secondary", fontSize: 11 }}
                  />
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
                {drawError && (
                  <Typography variant="caption" color="error">
                    {drawError}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  startIcon={drawing ? <CircularProgress size={16} color="inherit" /> : <DiceIcon />}
                  onClick={handleDraw}
                  disabled={drawing || eligibleCount === 0}
                  sx={{
                    bgcolor: "#D4A017",
                    "&:hover": { bgcolor: "#B8860B" },
                    fontWeight: 700,
                    px: 2.5,
                    borderRadius: 2,
                  }}
                >
                  {drawing ? "جارِ السحب..." : "سحب عشوائي"}
                </Button>
                <TextField
                  size="small"
                  placeholder="بحث بالاسم أو الهاتف أو السكن..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ width: 280 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          }
        />
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: "#D4A017" }} />
            </Box>
          ) : participants.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
              <TrophyIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography>لا يوجد مشتركون</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  {["#", "الاسم الكامل", "رقم الهاتف", "السكن", "تاريخ التسجيل", "الحالة"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, textAlign: "right" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p, index) => (
                  <TableRow
                    key={p.id}
                    hover
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      bgcolor: p.has_won ? "rgba(212,160,23,0.06)" : undefined,
                    }}
                  >
                    <TableCell sx={{ color: "text.secondary", fontSize: 13, textAlign: "right" }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                        {!!p.has_won && <TrophyIcon sx={{ color: "#D4A017", fontSize: 16 }} />}
                        <Typography fontWeight={p.has_won ? 700 : 600} fontSize={14}>
                          {p.full_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Typography fontSize={13} sx={{ direction: "ltr", textAlign: "right" }}>
                        {p.phone_number}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Typography fontSize={13} color="text.secondary">{p.address}</Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Typography fontSize={12} color="text.secondary">
                        {dayjs(p.created_at).format("YYYY/MM/DD - HH:mm")}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      <Chip
                        label={p.has_won ? "فائز" : "مشترك"}
                        size="small"
                        icon={p.has_won ? <TrophyIcon style={{ fontSize: 13 }} /> : undefined}
                        sx={
                          p.has_won
                            ? { bgcolor: "rgba(212,160,23,0.15)", color: "#A17514", fontWeight: 700, border: "1px solid #D4A017" }
                            : { bgcolor: "grey.100", color: "text.secondary" }
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Winner Dialog */}
      <Dialog
        open={!!winner}
        onClose={() => setWinner(null)}
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 350 }}
        slotProps={{
          backdrop: {
            sx: { backdropFilter: "blur(6px)", bgcolor: "rgba(0,0,0,0.7)" },
          },
        }}
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: 5,
            overflow: "hidden",
            width: 420,
            maxWidth: "95vw",
            background: "linear-gradient(160deg, #040d24 0%, #07122A 50%, #040d24 100%)",
            border: "1px solid rgba(212,160,23,0.4)",
            boxShadow: "0 0 80px rgba(212,160,23,0.2), 0 30px 60px rgba(0,0,0,0.6)",
          },
        }}
      >
        <Box sx={{ position: "relative" }}>
          {/* X close button */}
          <IconButton
            size="small"
            onClick={() => setWinner(null)}
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 10,
              color: "rgba(255,255,255,0.35)",
              "&:hover": { color: "#D4A017", bgcolor: "rgba(212,160,23,0.1)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Floating sparkles */}
          {(
            [
              { top: "8%",  left: "8%",  size: 10, delay: 0 },
              { top: "18%", left: "88%", size: 8,  delay: 0.4 },
              { top: "5%",  left: "55%", size: 12, delay: 0.7 },
              { top: "30%", left: "4%",  size: 7,  delay: 1.1 },
              { top: "25%", left: "93%", size: 9,  delay: 0.2 },
              { top: "12%", left: "72%", size: 6,  delay: 0.9 },
              { top: "38%", left: "78%", size: 8,  delay: 1.4 },
              { top: "42%", left: "18%", size: 7,  delay: 0.6 },
            ] as const
          ).map((s, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                top: s.top,
                left: s.left,
                fontSize: s.size,
                color: "#D4A017",
                pointerEvents: "none",
                animation: `sparkle 2.2s ${s.delay}s ease-in-out infinite`,
                "@keyframes sparkle": {
                  "0%, 100%": { opacity: 0.15, transform: "scale(0.7)" },
                  "50%":       { opacity: 1,    transform: "scale(1.3)" },
                },
              }}
            >
              ✦
            </Box>
          ))}

          {/* Header */}
          <Box sx={{ pt: 5, pb: 3.5, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Trophy with glow halo */}
            <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
              <Box
                sx={{
                  position: "absolute",
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,160,23,0.35) 0%, transparent 70%)",
                  animation: "halo 2.4s ease-in-out infinite",
                  "@keyframes halo": {
                    "0%, 100%": { transform: "scale(1)",   opacity: 0.5 },
                    "50%":       { transform: "scale(1.4)", opacity: 1   },
                  },
                }}
              />
              <TrophyIcon
                sx={{
                  fontSize: 86,
                  color: "#D4A017",
                  position: "relative",
                  zIndex: 1,
                  filter: "drop-shadow(0 0 18px rgba(212,160,23,0.75))",
                  animation: "trophyFloat 3s ease-in-out infinite",
                  "@keyframes trophyFloat": {
                    "0%, 100%": { transform: "translateY(0)   rotate(-3deg)" },
                    "50%":       { transform: "translateY(-9px) rotate(3deg)"  },
                  },
                }}
              />
            </Box>

            <Typography
              fontWeight={900}
              sx={{
                color: "#D4A017",
                fontSize: 22,
                letterSpacing: 2,
                textShadow: "0 0 24px rgba(212,160,23,0.6)",
              }}
            >
              مبروك الفائز
            </Typography>
          </Box>

          {/* Gold divider */}
          <Box
            sx={{
              height: 1,
              mx: 4,
              background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.6), transparent)",
            }}
          />

          {/* Winner info */}
          <DialogContent sx={{ px: 3.5, pt: 3, pb: 3.5 }}>
            {/* Name */}
            <Typography
              variant="h4"
              fontWeight={900}
              align="center"
              sx={{
                color: "#fff",
                mb: 3,
                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                letterSpacing: 0.5,
              }}
            >
              {winner?.full_name}
            </Typography>

            {/* Info card */}
            <Box
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid rgba(212,160,23,0.3)",
                bgcolor: "rgba(5, 17, 38, 0.85)",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2.5,
                  py: 1.8,
                  borderBottom: "1px solid rgba(212,160,23,0.15)",
                }}
              >
                <PhoneIcon sx={{ color: "#D4A017", fontSize: 18, flexShrink: 0 }} />
                <Typography sx={{ color: "#cbd5e1", fontSize: 15, direction: "ltr", letterSpacing: 0.5 }}>
                  {winner?.phone_number}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.8 }}>
                <LocationIcon sx={{ color: "#D4A017", fontSize: 18, flexShrink: 0 }} />
                <Typography sx={{ color: "#cbd5e1", fontSize: 15 }}>
                  {winner?.address}
                </Typography>
              </Box>
            </Box>

            {/* Close button */}
            <Button
              variant="contained"
              fullWidth
              onClick={() => setWinner(null)}
              sx={{
                py: 1.3,
                borderRadius: 3,
                background: "linear-gradient(90deg, #b8862B 0%, #D4A017 100%)",
                color: "#07122A",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: 1,
                boxShadow: "0 4px 24px rgba(212,160,23,0.45)",
                "&:hover": {
                  background: "linear-gradient(90deg, #A87A0A 0%, #b8862B 100%)",
                  boxShadow: "0 6px 30px rgba(212,160,23,0.65)",
                },
              }}
            >
              إغلاق
            </Button>
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
  );
}
