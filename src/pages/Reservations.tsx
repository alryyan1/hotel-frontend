import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/axios";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Tag,
  Empty,
  Typography,
  Space,
  Avatar,
  Flex,
  Segmented,
  Dropdown,
  theme,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  CloseCircleOutlined,
  CalendarOutlined,
  MoreOutlined,
  ToolOutlined,
  ClearOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { toast } from "sonner";
import CreateReservationDialog from "@/components/dialogs/CreateReservationDialog";
import CreateCustomerDialog from "@/components/dialogs/CreateCustomerDialog";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const getDateNDaysFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const [isoDate] = date.toISOString().split("T");
  return isoDate ?? "";
};

// Days remaining until an occupied room's current guest is due to leave.
const daysUntil = (checkOutDate: string): number =>
  dayjs(checkOutDate).startOf("day").diff(dayjs().startOf("day"), "day");

const daysLeftLabel = (checkOutDate: string): string => {
  const days = daysUntil(checkOutDate);
  if (days < 0) return `متأخر عن المغادرة بـ ${Math.abs(days)} يوم`;
  if (days === 0) return "يغادر اليوم";
  return `متبقي ${days} يوم للمغادرة`;
};

const formatDate = (date: string): string => dayjs(date).format("YYYY/MM/DD");

// Room prices come back from the API as decimal strings in some cases, so
// coerce before formatting rather than calling toLocaleString on a string.
const formatCurrency = (value: number | string | null | undefined): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num === null || num === undefined || isNaN(num)) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

// Maintenance/cleaning are manually-set room statuses, independent of reservations.
const isMaintenance = (room: any): boolean => room.status?.code === "maintenance";
const isCleaning = (room: any): boolean => room.status?.code === "cleaning";
const isOutOfService = (room: any): boolean => isMaintenance(room) || isCleaning(room);

// A future booking that overlaps the searched dates makes the room unavailable
// for that period, even if nobody is in it today.
const hasRangeConflict = (room: any): boolean =>
  (room.upcoming_reservations ?? []).some((r: any) => r.overlaps);
const isBooked = (room: any): boolean => !!room.is_occupied || hasRangeConflict(room);

export default function Reservations() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState<string>(() =>
    getDateNDaysFromToday(1)
  );
  const [checkOut, setCheckOut] = useState<string>(() =>
    getDateNDaysFromToday(2)
  );
  const [roomTypeId, setRoomTypeId] = useState<string>("all");
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | "occupied" | "available" | "maintenance" | "cleaning">("all");
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<any[]>([]);
  const [clearingStatusRoomId, setClearingStatusRoomId] = useState<number | null>(null);
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
    currency: "SDG",
  });

  useEffect(() => {
    fetchRoomTypes();
    fetchRoomStatuses();
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

  const fetchRoomStatuses = async () => {
    try {
      const { data } = await apiClient.get("/room-statuses");
      setRoomStatuses(data);
    } catch (e) {
      console.error("Failed to fetch room statuses", e);
    }
  };

  // Changes a room's manual status (maintenance/cleaning/available) without
  // reopening the full room-edit form (Rooms page), so staff can do it inline here.
  const updateRoomStatus = async (room: any, code: string, successMessage: string) => {
    const targetStatus = roomStatuses.find((s: any) => s.code === code);
    if (!targetStatus) {
      toast.error("تعذر العثور على حالة الغرفة المطلوبة");
      return;
    }
    try {
      setClearingStatusRoomId(room.id);
      const { data } = await apiClient.patch(`/rooms/${room.id}/status`, {
        room_status_id: targetStatus.id,
      });
      setAllRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, status: data.status } : r))
      );
      // A room just put under maintenance/cleaning can no longer be booked.
      if (code !== "empty") {
        setSelectedRooms((prev) => prev.filter((r) => r.id !== room.id));
      }
      toast.success(successMessage);
    } catch (e) {
      // Error toast already shown by the apiClient response interceptor
    } finally {
      setClearingStatusRoomId(null);
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
      const { data } = await apiClient.get("/availability", { params });
      const rooms = data?.data || data || [];
      setAllRooms(Array.isArray(rooms) ? rooms : []);

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

  // Available rooms first (bookable right now), then occupied rooms ordered
  // by soonest departure date so staff can see which room frees up next.
  const sortedRooms = useMemo(() => {
    return [...allRooms].sort((a, b) => {
      if (!!a.is_occupied !== !!b.is_occupied) return a.is_occupied ? 1 : -1;
      if (a.is_occupied && b.is_occupied) {
        const dateA = a.current_reservation?.check_out_date;
        const dateB = b.current_reservation?.check_out_date;
        if (dateA && dateB) {
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        }
      }
      return String(a.number ?? "").localeCompare(String(b.number ?? ""), undefined, {
        numeric: true,
      });
    });
  }, [allRooms]);

  // Memoized so the RangePicker doesn't see a "new" value on every render,
  // which would reset whatever the user is typing back to the stored dates.
  const rangeValue = useMemo<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    () => (checkIn && checkOut ? [dayjs(checkIn), dayjs(checkOut)] : null),
    [checkIn, checkOut]
  );

  const occupiedCount = useMemo(
    () => sortedRooms.filter(isBooked).length,
    [sortedRooms]
  );
  const maintenanceCount = useMemo(
    () => sortedRooms.filter(isMaintenance).length,
    [sortedRooms]
  );
  const cleaningCount = useMemo(
    () => sortedRooms.filter(isCleaning).length,
    [sortedRooms]
  );
  const availableCount = sortedRooms.filter((r) => !isBooked(r) && !isOutOfService(r)).length;

  const filteredRooms = useMemo(() => {
    if (occupancyFilter === "occupied") return sortedRooms.filter(isBooked);
    if (occupancyFilter === "available") return sortedRooms.filter((r) => !isBooked(r) && !isOutOfService(r));
    if (occupancyFilter === "maintenance") return sortedRooms.filter(isMaintenance);
    if (occupancyFilter === "cleaning") return sortedRooms.filter(isCleaning);
    return sortedRooms;
  }, [sortedRooms, occupancyFilter]);

  const toggleRoom = (room: any) => {
    if (isOutOfService(room)) {
      toast.error(
        `لا يمكن حجز الغرفة ${room.number} لأنها تحت ${isMaintenance(room) ? "الصيانة" : "النظافة"}`
      );
      return;
    }
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
        // Rooms without a USD price can only be billed in SDG.
        currency: selectedRooms.some((r) => r.price_usd == null) ? "SDG" : form.currency,
        rooms: selectedRooms.map((r) => ({ id: r.id })),
      };
      const { data } = await apiClient.post("/reservations", payload);

      if (data.sms_result) {
        if (data.sms_result.success) {
          toast.success("تم إرسال رسالة تأكيد الحجز بنجاح", {
            position: "top-right",
          });
        } else {
          toast.warning(
            `فشل إرسال الرسالة: ${data.sms_result.error || "خطأ غير معروف"}`,
            { position: "top-right" }
          );
        }
      }

      const count = data.reservations?.length ?? 1;
      toast.success(count > 1 ? `تم إنشاء ${count} حجوزات منفصلة بنجاح` : "تم إنشاء الحجز بنجاح");
      setOpenCreate(false);
      setSelectedRooms([]);
      setForm({ customer_id: "", currency: "SDG" });

      navigate("/reservations-list");
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
    } catch {
      // Error toast is already shown by the apiClient response interceptor
    } finally {
      setLoading(false);
    }
  };

  const isRoomSelected = (roomId: number) =>
    selectedRooms.some((r) => r.id === roomId);

  const hasSearched = checkIn && checkOut;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card size="small">
        <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 12 }}>
          <Space align="center" size={8}>
            <SearchOutlined style={{ color: token.colorPrimary }} />
            <Title level={5} style={{ margin: 0 }}>
              البحث عن توفر الغرف
            </Title>
          </Space>
          {hasSearched && sortedRooms.length > 0 && (
            <Flex align="center" wrap="wrap" gap={12}>
              <Text type="secondary">الغرف ({filteredRooms.length})</Text>
              <Segmented
                size="small"
                value={occupancyFilter}
                onChange={(value) => setOccupancyFilter(value as typeof occupancyFilter)}
                options={[
                  { label: `الكل (${sortedRooms.length})`, value: "all" },
                  { label: `متاحة (${availableCount})`, value: "available" },
                  { label: `محجوزة (${occupiedCount})`, value: "occupied" },
                  { label: `تحت الصيانة (${maintenanceCount})`, value: "maintenance" },
                  { label: `تحت النظافة (${cleaningCount})`, value: "cleaning" },
                ]}
              />
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                disabled={selectedRooms.length === 0}
                onClick={openCreateDialog}
              >
                إتمام الحجز{selectedRooms.length > 0 ? ` (${selectedRooms.length} غرف)` : ""}
              </Button>
            </Flex>
          )}
        </Flex>
        <Row gutter={[12, 8]} align="bottom">
          <Col xs={24} md={10}>
            <Space orientation="vertical" size={2} style={{ width: "100%" }}>
              <Text strong style={{ fontSize: 12 }}>
                تاريخ الوصول والمغادرة
              </Text>
              <RangePicker
                size="middle"
                style={{ width: "100%" }}
                value={rangeValue}
                format={["YYYY-MM-DD", "YYYY/MM/DD", "DD/MM/YYYY", "DD-MM-YYYY"]}
                disabledDate={(current) => !!current && current < dayjs().startOf("day")}
                // A typed date only reaches onChange once both fields are
                // committed, so typing one field then clicking away (e.g. on
                // "بحث") snapped back to the old range. Sync each field as soon
                // as it holds a valid date instead.
                onCalendarChange={(dates) => {
                  const [start, end] = dates ?? [];
                  if (start) {
                    const startStr = start.format("YYYY-MM-DD");
                    setCheckIn(startStr);
                    if (!end && checkOut && !dayjs(checkOut).isAfter(start, "day")) {
                      setCheckOut(start.add(1, "day").format("YYYY-MM-DD"));
                    }
                  }
                  if (end) setCheckOut(end.format("YYYY-MM-DD"));
                }}
                onChange={(_, dateStrings) => {
                  const [newCheckIn, newCheckOut] = dateStrings;
                  setCheckIn(newCheckIn ?? "");
                  setCheckOut(newCheckOut ?? "");
                  if (newCheckIn && newCheckOut) {
                    searchAvailability(newCheckIn, newCheckOut);
                  }
                }}
              />
            </Space>
          </Col>
          <Col xs={16} sm={12} md={8}>
            <Space orientation="vertical" size={2} style={{ width: "100%" }}>
              <Text strong style={{ fontSize: 12 }}>
                نوع الغرفة
              </Text>
              <Select
                value={roomTypeId}
                onChange={setRoomTypeId}
                style={{ width: "100%" }}
                options={[
                  { value: "all", label: "الكل" },
                  ...roomTypes.map((t: any) => ({
                    value: String(t.id),
                    label: t.name,
                  })),
                ]}
              />
            </Space>
          </Col>
          <Col xs={8} md={6}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={loading}
              onClick={() => searchAvailability()}
              block
            >
              بحث
            </Button>
          </Col>
        </Row>
      </Card>

      {hasSearched && (
        <Card size="small">
          {sortedRooms.length > 0 ? (
            <>
              {filteredRooms.length === 0 ? (
                <Empty description="لا توجد غرف مطابقة لهذا الفلتر" />
              ) : (
              <Row gutter={[16, 16]}>
                {filteredRooms.map((room: any) => {
                  const isSelected = isRoomSelected(room.id);
                  const isOccupied = !!room.is_occupied;
                  const roomOutOfService = isOutOfService(room);
                  const currentReservation = room.current_reservation;
                  const upcomingReservations: any[] = room.upcoming_reservations ?? [];
                  const hasConflict = upcomingReservations.some((r) => r.overlaps);
                  const overdue =
                    isOccupied && currentReservation
                      ? daysUntil(currentReservation.check_out_date) < 0
                      : false;

                  return (
                    <Col key={room.id} xs={24} sm={12} lg={8}>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => {
                          toggleRoom(room);
                          if (roomOutOfService) return;
                          if (isOccupied && currentReservation) {
                            toast.warning(
                              `هذه الغرفة محجوزة حتى ${new Date(
                                currentReservation.check_out_date
                              ).toLocaleDateString("en-US")}`,
                              { duration: 4000 }
                            );
                          }
                          if (!isSelected) {
                            upcomingReservations
                              .filter((r) => r.overlaps)
                              .forEach((r) => {
                                toast.warning(
                                  `الغرفة ${room.number} عليها حجز من ${formatDate(r.check_in_date)} إلى ${formatDate(r.check_out_date)}`,
                                  { duration: 5000 }
                                );
                              });
                          }
                        }}
                        style={{
                          cursor: "pointer",
                          height: "100%",
                          userSelect: "none",
                          borderColor: isSelected ? token.colorPrimary : "#f0f0f0",
                          borderWidth: isSelected ? 2 : 1,
                          boxShadow: isSelected
                            ? `0 0 0 3px color-mix(in srgb, ${token.colorPrimary} 12%, transparent)`
                            : undefined,
                          transition: "box-shadow 0.15s, border-color 0.15s",
                        }}
                        styles={{ body: { padding: 16 } }}
                      >
                        <Flex justify="space-between" align="flex-start" style={{ marginBottom: 14 }}>
                          <Space align="center" size={12}>
                            <Avatar
                              shape="square"
                              size={48}
                              style={{
                                background: isOccupied ? "#fa8c16" : token.colorPrimary,
                                fontWeight: 700,
                                fontSize: 16,
                              }}
                            >
                              {room.number}
                            </Avatar>
                            <div>
                              <Text strong style={{ fontSize: 15 }}>
                                غرفة {room.number}
                              </Text>
                              <div>
                                <Text  style={{ fontSize: 12 }}>
                                  الدور {room.floor?.number} · {room.type?.name}
                                </Text>
                              </div>
                            </div>
                          </Space>
                          <Flex align="center" gap={4}>
                          {isSelected ? (
                            <CheckCircleFilled style={{ color: token.colorPrimary, fontSize: 20 }} />
                          ) : isOccupied ? (
                            <Tag color={overdue ? "red" : "orange"} icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                              محجوز
                            </Tag>
                          ) : roomOutOfService ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Space size={4}>
                                <Tag color={room.status?.color} variant="solid" style={{ margin: 0 }}>
                                  {isMaintenance(room) ? "تحت الصيانة" : "تحت النظافة"}
                                </Tag>
                                <Button
                                  size="small"
                                  type="text"
                                  danger
                                  icon={<CloseCircleOutlined />}
                                  loading={clearingStatusRoomId === room.id}
                                  aria-label="إرجاع إلى متاحة"
                                  onClick={() =>
                                    updateRoomStatus(room, "empty", `تم إلغاء حالة الغرفة ${room.number}`)
                                  }
                                />
                              </Space>
                            </div>
                          ) : hasConflict ? (
                            <Tag color="red" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                              محجوزة
                            </Tag>
                          ) : (
                            <Tag color="green" style={{ margin: 0 }}>متاحة</Tag>
                          )}
                          <div onClick={(e) => e.stopPropagation()}>
                            <Dropdown
                              trigger={["click"]}
                              placement="bottomLeft"
                              menu={{
                                items: [
                                  {
                                    key: "maintenance",
                                    icon: <ToolOutlined />,
                                    label: "تحت الصيانة",
                                    disabled: isMaintenance(room),
                                  },
                                  {
                                    key: "cleaning",
                                    icon: <ClearOutlined />,
                                    label: "تحت النظافة",
                                    disabled: isCleaning(room),
                                  },
                                  ...(roomOutOfService
                                    ? [
                                        { type: "divider" as const },
                                        {
                                          key: "empty",
                                          icon: <CheckCircleOutlined />,
                                          label: "إرجاع إلى متاحة",
                                        },
                                      ]
                                    : []),
                                ],
                                onClick: ({ key, domEvent }) => {
                                  domEvent.stopPropagation();
                                  const messages: Record<string, string> = {
                                    maintenance: `تم تحويل الغرفة ${room.number} إلى الصيانة`,
                                    cleaning: `تم تحويل الغرفة ${room.number} إلى النظافة`,
                                    empty: `تم إلغاء حالة الغرفة ${room.number}`,
                                  };
                                  updateRoomStatus(room, key, messages[key] ?? "تم تحديث حالة الغرفة");
                                },
                              }}
                            >
                              <Button
                                size="small"
                                type="text"
                                icon={<MoreOutlined />}
                                loading={clearingStatusRoomId === room.id}
                                aria-label="خيارات الغرفة"
                              />
                            </Dropdown>
                          </div>
                          </Flex>
                        </Flex>

                        <div
                          style={{
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                            borderRadius: 8,
                            padding: "8px 12px",
                            marginBottom: isOccupied || upcomingReservations.length > 0 ? 12 : 0,
                          }}
                        >
                          <Flex justify="space-between" align="baseline">
                            <div>
                              <Text style={{ fontSize: 18, fontWeight: 700, color: "#389e0d" }}>
                                {formatCurrency(room.price_sdg)} 
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}> / ليلة</Text>
                            </div>
                            {room.total_price_sdg ? (
                              <Text  style={{ fontSize: 12 }}>
                                الإجمالي: {formatCurrency(room.total_price_sdg)} 
                              </Text>
                            ) : null}
                          </Flex>
                          {room.price_usd == null ? (
                            // Placeholder keeps the price box the same height with or without a USD price
                            <Flex align="baseline" style={{ marginTop: 2, minHeight: 23 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                لا يوجد سعر بالدولار
                              </Text>
                            </Flex>
                          ) : (
                            <Flex justify="space-between" align="baseline" style={{ marginTop: 2 }}>
                              <div>
                                <Text style={{ fontSize: 15, fontWeight: 700, color: token.colorPrimary }}>
                                  ${formatCurrency(room.price_usd)}
                                </Text>
                                <Text  style={{ fontSize: 12 }}> / ليلة</Text>
                              </div>
                              {room.total_price_usd ? (
                                <Text  style={{ fontSize: 12 }}>
                                  الإجمالي: ${formatCurrency(room.total_price_usd)}
                                </Text>
                              ) : null}
                            </Flex>
                          )}
                        </div>

                        {isOccupied && currentReservation && (
                          <div
                            style={{
                              background: "#fffbe6",
                              border: "1px solid #ffe58f",
                              borderRadius: 8,
                              padding: 10,
                            }}
                          >
                            <Flex align="center" gap={6} style={{ marginBottom: 2 }}>
                              <ExclamationCircleFilled style={{ color: "#d48806", fontSize: 13 }} />
                              <Text strong style={{ fontSize: 12, color: "#874d00" }}>
                                محجوزة حالياً — {currentReservation.customer_name}
                              </Text>
                            </Flex>
                            <Tag color={overdue ? "red" : "gold"} style={{ marginTop: 2 }}>
                              {daysLeftLabel(currentReservation.check_out_date)}
                            </Tag>
                          </div>
                        )}

                        {upcomingReservations.length > 0 && (
                          <div
                            style={{
                              background: hasConflict ? "#fff1f0" : "#e6f4ff",
                              border: `1px solid ${hasConflict ? "#ffa39e" : "#91caff"}`,
                              borderRadius: 8,
                              padding: 10,
                              marginTop: isOccupied && currentReservation ? 8 : 0,
                            }}
                          >
                            <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
                              <CalendarOutlined style={{ color: hasConflict ? "#cf1322" : "#0958d9", fontSize: 13 }} />
                              <Text strong style={{ fontSize: 12, color: hasConflict ? "#a8071a" : "#003eb3" }}>
                                {hasConflict ? "محجوزة في هذه الفترة" : "حجوزات قادمة"}
                              </Text>
                            </Flex>
                            <Flex vertical gap={4}>
                              {upcomingReservations.map((r) => (
                                <Text key={r.id} style={{ fontSize: 12 }}>
                                  من {formatDate(r.check_in_date)} إلى {formatDate(r.check_out_date)} — {r.customer_name}
                                  {r.overlaps && (
                                    <Tag color="red" style={{ marginInlineStart: 6, marginInlineEnd: 0 }}>
                                      محجوزة
                                    </Tag>
                                  )}
                                </Text>
                              ))}
                            </Flex>
                          </div>
                        )}

                      </Card>
                    </Col>
                  );
                })}
              </Row>
              )}
            </>
          ) : (
            !loading && (
              <Empty
                description={
                  <>
                    <div>لا توجد غرف للتواريخ المحددة ({checkIn} - {checkOut})</div>
                    <div>جرب تواريخ أخرى أو نوع غرفة مختلف</div>
                  </>
                }
              />
            )
          )}
        </Card>
      )}

      <CreateReservationDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        customers={customers}
        selectedRooms={selectedRooms}
        checkIn={checkIn}
        checkOut={checkOut}
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
    </div>
  );
}
