 import { useEffect, useState } from "react";
import apiClient from "../api/axios";
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { toast } from "sonner";
import CreateReservationDialog from "@/components/dialogs/CreateReservationDialog";
import CreateCustomerDialog from "@/components/dialogs/CreateCustomerDialog";

const getDateNDaysFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const [isoDate] = date.toISOString().split("T");
  return isoDate ?? "";
};

export default function Reservations() {
  const [checkIn, setCheckIn] = useState<string>(() =>
    getDateNDaysFromToday(1)
  );
  const [checkOut, setCheckOut] = useState<string>(() =>
    getDateNDaysFromToday(2)
  );
  const [guestCount, setGuestCount] = useState<number>(1);
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    national_id: "",
    address: "",
    date_of_birth: "",
    gender: "",
  });
  const [form, setForm] = useState({
    customer_id: "",
    notes: "",
  });

  useEffect(() => {
    fetchRoomTypes();
    fetchAllCustomers();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const { data } = await apiClient.get("/room-types");
      setRoomTypes(data);
    } catch (e) {
      console.error("Failed to fetch room types", e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await apiClient.get("/customers");
      setCustomers(data?.data || data);
    } catch (e) {
      console.error("Failed to fetch customers", e);
    }
  };
  const fetchAllCustomers = async () => {
    try {
      const { data } = await apiClient.get("/customers/all");
      setCustomers(data?.data || data);
    } catch (e) {
      console.error("Failed to fetch customers", e);
    }
  };

  const searchAvailability = async (
    customCheckIn?: string,
    customCheckOut?: string
  ) => {
    try {
      const checkInDate = customCheckIn ?? checkIn;
      const checkOutDate = customCheckOut ?? checkOut;
      if (!checkInDate || !checkOutDate) {
        toast.error("الرجاء اختيار تاريخي الوصول والمغادرة");
        return;
      }
      setLoading(true);
      const params: any = {
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
      };
      if (roomTypeId && roomTypeId !== "all") params.room_type_id = roomTypeId;
      if (guestCount) params.guest_count = guestCount;
      const { data } = await apiClient.get("/availability", { params });
      const rooms = data?.data || data || [];
      setAllRooms(Array.isArray(rooms) ? rooms : []);

      // Show message if no rooms found
      if (!rooms || rooms.length === 0) {
        toast.info("لا توجد غرف للتواريخ المحددة");
      }
    } catch (e) {
      console.error("Availability search failed", e);
      toast.error("فشل في جلب التوفر");
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (room: any) => {
    setSelectedRooms((prev) => {
      const exists = prev.find((r) => r.id === room.id);
      if (exists) return prev.filter((r) => r.id !== room.id);
      return [...prev, room];
    });
  };

  const openCreateDialog = () => {
    if (!checkIn || !checkOut) {
      toast.error("اختر التواريخ أولاً");
      return;
    }
    setOpenCreate(true);
  };

  const createReservation = async () => {
    try {
      setLoading(true);
      if (!form.customer_id || selectedRooms.length === 0) {
        toast.error("العميل وغرفة واحدة على الأقل مطلوبة");
        return;
      }

      // Check for occupied rooms and show warnings
      const occupiedRooms = selectedRooms.filter(
        (r: any) => r.is_occupied && r.current_reservation
      );
      if (occupiedRooms.length > 0) {
        occupiedRooms.forEach((room: any) => {
          const checkOutDate = new Date(
            room.current_reservation.check_out_date
          ).toLocaleDateString("ar-SA");
          toast.warning(
            `ملاحظة: الغرفة ${room.number} محجوزة حالياً حتى ${checkOutDate}`,
            { duration: 5000 }
          );
        });
      }

      const payload = {
        customer_id: form.customer_id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count: guestCount,
        notes: form.notes || "",
        rooms: selectedRooms.map((r) => ({ id: r.id })),
      };
      const { data } = await apiClient.post("/reservations", payload);

      // Handle SMS result
      if (data.sms_result) {
        if (data.sms_result.success) {
          toast.success("تم إرسال رسالة تأكيد الحجز بنجاح", {
            position: "top-right",
          });
        } else {
          toast.warning(
            `فشل إرسال الرسالة: ${data.sms_result.error || "خطأ غير معروف"}`,
            {
              position: "top-right",
            }
          );
        }
      }

      toast.success("تم إنشاء الحجز بنجاح");
      setOpenCreate(false);
      setSelectedRooms([]);
      setForm({ customer_id: "", notes: "" });

      // Refresh available rooms after successful reservation
      if (checkIn && checkOut) {
        await searchAvailability();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء الحجز");
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      setLoading(true);
      const payload = { ...customerForm };
      const { data } = await apiClient.post("/customers", payload);
      setCustomers((prev) => [data, ...prev]);
      setForm((f) => ({ ...f, customer_id: data.id }));
      setOpenCustomer(false);
      setCustomerForm({
        name: "",
        phone: "",
        national_id: "",
        address: "",
        date_of_birth: "",
        gender: "",
      });
      toast.success("تم إنشاء العميل");
    } catch (err: any) {
      // toast.error(err?.response?.data?.message || 'فشل إنشاء العميل')
    } finally {
      setLoading(false);
    }
  };

  const isRoomSelected = (roomId: number) => {
    return selectedRooms.some((r) => r.id === roomId);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}>
      <style>{`
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          10%, 30% {
            transform: scale(1.05);
          }
          20%, 40% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>

      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ pt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <SearchIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              البحث عن توفر الغرف
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    تاريخ الوصول
                  </Typography>
                </Stack>
                <TextField
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  fullWidth
                  size="small"
                  inputProps={{
                    min: getDateNDaysFromToday(0)
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    تاريخ المغادرة
                  </Typography>
                </Stack>
                <TextField
                  type="date"
                  value={checkOut}
                  onChange={(e) => {
                    const newCheckOut = e.target.value;
                    setCheckOut(newCheckOut);
                    // Trigger search if check-in date is also set
                    if (checkIn && newCheckOut) {
                      setTimeout(
                        () => searchAvailability(checkIn, newCheckOut),
                        100
                      );
                    }
                  }}
                  fullWidth
                  size="small"
                  inputProps={{
                    min: checkIn || getDateNDaysFromToday(0)
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PeopleIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    عدد الضيوف
                  </Typography>
                </Stack>
                <TextField
                  type="number"
                  inputProps={{ min: 1 }}
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  fullWidth
                  size="small"
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  نوع الغرفة
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="room-type-label">الكل</InputLabel>
                  <Select
                    labelId="room-type-label"
                    value={roomTypeId}
                    onChange={(e) => setRoomTypeId(e.target.value)}
                    label="الكل"
                  >
                    <MenuItem value="all">الكل</MenuItem>
                    {roomTypes.map((t: any) => (
                      <MenuItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Box
                sx={{ display: "flex", alignItems: "flex-end", height: "100%" }}
              >
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => searchAvailability()}
                  disabled={loading}
                  sx={{ height: 40, boxShadow: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    "بحث"
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Show results section when search has been performed */}
      {(allRooms?.length > 0 ||
        (allRooms?.length === 0 && !loading && checkIn && checkOut)) && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ pt: 2 }}>
            {allRooms?.length > 0 ? (
              <>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    جميع الغرف ({allRooms.length})
                  </Typography>
                </Stack>
                <Grid container spacing={2} sx={{ p: 1 }}>
                  {allRooms.map((room: any) => {
                    const isSelected = isRoomSelected(room.id);
                    const isOccupied = room.is_occupied || false;
                    const currentReservation = room.current_reservation;

                    return (
                      <Grid key={room.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                        <Box
                          onClick={() => {
                            toggleRoom(room);
                            if (isOccupied && currentReservation) {
                              toast.warning(
                                `هذه الغرفة محجوزة حتى ${new Date(
                                  currentReservation.check_out_date
                                ).toLocaleDateString("en-US")}`,
                                { duration: 4000 }
                              );
                            }
                          }}
                          sx={{
                            cursor: "pointer",
                            borderRadius: 2,
                            border: 2,
                            borderColor: isSelected
                              ? "primary.main"
                              : isOccupied
                              ? ""
                              : "divider",
                            bgcolor: isOccupied
                              ? ""
                              : "background.paper",
                            p: 2,
                            transition: "all 0.2s",
                            position: "relative",
                            "&:hover": {
                              boxShadow: 3,
                              borderColor: isSelected
                                ? "primary.main"
                                : isOccupied
                                ? ""
                                : "primary.light",
                            },
                            boxShadow: isSelected ? 2 : isOccupied ? 1 : 0,
                            opacity: isOccupied ? 0.95 : 1,
                          }}
                        >
                          {/* Occupied Badge */}
                          {isOccupied && (
                            <Chip
                              label="محجوز"
                              color="warning"
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                fontWeight: "bold",
                                fontSize: "0.7rem",
                              }}
                            />
                          )}

                          <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                            <Box
                              sx={{
                                width: 56,
                                height: 56,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 2,
                                bgcolor: isOccupied ? "" : "primary.light",
                                color: isOccupied
                                  ? ""
                                  : "primary.main",
                                fontWeight: "bold",
                                fontSize: "1.125rem",
                                boxShadow: 1,
                                position: "relative",
                              }}
                            >
                              {room.number}
                              {isSelected && (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: -4,
                                    right: -4,
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    border: 2,
                                    borderColor: "background.paper",
                                  }}
                                >
                                  <CheckCircleIcon sx={{ fontSize: 14 }} />
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: "bold" }}
                              >
                                غرفة {room.number}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                الدور {room.floor?.number} • {room.type?.name}
                              </Typography>
                              {/* Price Display */}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: "bold",
                                  color: "primary.main",
                                  mt: 0.5,
                                }}
                              >
                                {(room.rate || room.base_price || 0).toLocaleString('en-US')} $ / ليلة
                              </Typography>
                              {room.total_price && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  الإجمالي: {room.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                                </Typography>
                              )}
                            </Box>
                          </Stack>

                          {/* Occupancy Warning */}
                          {isOccupied && currentReservation && (
                            <Box
                              sx={{
                                bgcolor: "",
                                border: "1px solid",
                                borderColor: "",
                                borderRadius: 1,
                                p: 1,
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: "bold",
                                  color: "warning.dark",
                                  display: "block",
                                }}
                              >
                                ⚠️ محجوزة حالياً
                              </Typography>
                              <Typography
                              >
                                العميل: {currentReservation.customer_name}
                              </Typography>
                              <Typography
                                sx={{  display: "block" }}
                              >
                                تاريخ المغادرة:{" "}
                                {new Date(
                                  currentReservation.check_out_date
                                ).toLocaleDateString("en-US")}
                              </Typography>
                            </Box>
                          )}

                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            gap={0.5}
                            sx={{ mb: isSelected ? 2 : 0 }}
                          >
                            <Chip
                              label={`${room.type?.capacity} ضيوف`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.75rem" }}
                            />
                            {room.type?.area && (
                              <Chip
                                label={`${room.type.area} م²`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.75rem" }}
                              />
                            )}
                            {Array.isArray(room.type?.amenities) &&
                              room.type.amenities
                                .slice(0, 2)
                                .map((a: string, i: number) => (
                                  <Chip
                                    key={i}
                                    label={a}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: "0.75rem" }}
                                  />
                                ))}
                          </Stack>

                          {/* Action Button inside Selected Room */}
                          {isSelected && (
                            <Button
                              variant="contained"
                              fullWidth
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreateDialog();
                              }}
                              startIcon={<AddIcon />}
                              sx={{
                                mt: 1,
                                py: 0.5,
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                                borderRadius: 1.5,
                                boxShadow: 2,
                                animation: "heartbeat 1.5s ease-in-out infinite",
                              }}
                            >
                              إتمام الحجز
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h2" sx={{ mb: 2, opacity: 0.5 }}>
                  🏨
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ fontWeight: 500, mb: 1 }}
                >
                  لا توجد غرف
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  للتواريخ المحددة ({checkIn} - {checkOut})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  جرب تواريخ أخرى أو نوع غرفة مختلف
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <CreateReservationDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        customers={customers}
        selectedRooms={selectedRooms}
        form={form}
        onFormChange={setForm}
        onCreateReservation={createReservation}
        onOpenCustomerDialog={() => setOpenCustomer(true)}
        loading={loading}
      />

      <CreateCustomerDialog
        open={openCustomer}
        onOpenChange={setOpenCustomer}
        customerForm={customerForm}
        onCustomerFormChange={setCustomerForm}
        onCreateCustomer={createCustomer}
        loading={loading}
      />
    </Box>
  );
}
