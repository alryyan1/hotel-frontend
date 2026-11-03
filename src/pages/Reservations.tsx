import { useEffect, useMemo, useState } from "react";
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
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
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

// Room prices come back from the API as decimal strings in some cases, so
// coerce before formatting rather than calling toLocaleString on a string.
const formatCurrency = (value: number | string | null | undefined): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num === null || num === undefined || isNaN(num)) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

export default function Reservations() {
  const [checkIn, setCheckIn] = useState<string>(() =>
    getDateNDaysFromToday(1)
  );
  const [checkOut, setCheckOut] = useState<string>(() =>
    getDateNDaysFromToday(2)
  );
  const [roomTypeId, setRoomTypeId] = useState<string>("all");
  const [occupancyFilter, setOccupancyFilter] = useState<"all" | "occupied" | "available">("all");
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
    currency: "SDG",
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

  const occupiedCount = useMemo(
    () => sortedRooms.filter((r) => r.is_occupied).length,
    [sortedRooms]
  );
  const availableCount = sortedRooms.length - occupiedCount;

  const filteredRooms = useMemo(() => {
    if (occupancyFilter === "occupied") return sortedRooms.filter((r) => r.is_occupied);
    if (occupancyFilter === "available") return sortedRooms.filter((r) => !r.is_occupied);
    return sortedRooms;
  }, [sortedRooms, occupancyFilter]);

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
        currency: form.currency,
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

      toast.success("تم إنشاء الحجز بنجاح");
      setOpenCreate(false);
      setSelectedRooms([]);
      setForm({ customer_id: "", currency: "SDG" });

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
      <Card>
        <Space align="center" style={{ marginBottom: 16 }}>
          <SearchOutlined style={{ color: "var(--ant-color-primary, #1677ff)" }} />
          <Title level={5} style={{ margin: 0 }}>
            البحث عن توفر الغرف
          </Title>
        </Space>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Space orientation="vertical" size={4} style={{ width: "100%" }}>
              <Text strong style={{ fontSize: 13 }}>
                تاريخ الوصول والمغادرة
              </Text>
              <RangePicker
                style={{ width: "100%" }}
                value={checkIn && checkOut ? [dayjs(checkIn), dayjs(checkOut)] : null}
                disabledDate={(current) => !!current && current < dayjs().startOf("day")}
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
          <Col xs={24} sm={12} md={8}>
            <Space orientation="vertical" size={4} style={{ width: "100%" }}>
              <Text strong style={{ fontSize: 13 }}>
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
          <Col xs={24} md={8}>
            <Space orientation="vertical" size={4} style={{ width: "100%" }}>
              <Text style={{ fontSize: 13, opacity: 0 }}>بحث</Text>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={() => searchAvailability()}
                block
              >
                بحث
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {hasSearched && (
        <Card>
          {sortedRooms.length > 0 ? (
            <>
              <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={12}
                style={{ marginBottom: 16 }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  الغرف ({filteredRooms.length})
                </Title>
                <Segmented
                  value={occupancyFilter}
                  onChange={(value) => setOccupancyFilter(value as typeof occupancyFilter)}
                  options={[
                    { label: `الكل (${sortedRooms.length})`, value: "all" },
                    { label: `متاحة (${availableCount})`, value: "available" },
                    { label: `محجوزة (${occupiedCount})`, value: "occupied" },
                  ]}
                />
              </Flex>
              {filteredRooms.length === 0 ? (
                <Empty description="لا توجد غرف مطابقة لهذا الفلتر" />
              ) : (
              <Row gutter={[16, 16]}>
                {filteredRooms.map((room: any) => {
                  const isSelected = isRoomSelected(room.id);
                  const isOccupied = !!room.is_occupied;
                  const currentReservation = room.current_reservation;
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
                          if (isOccupied && currentReservation) {
                            toast.warning(
                              `هذه الغرفة محجوزة حتى ${new Date(
                                currentReservation.check_out_date
                              ).toLocaleDateString("en-US")}`,
                              { duration: 4000 }
                            );
                          }
                        }}
                        style={{
                          cursor: "pointer",
                          borderColor: isSelected ? "#1677ff" : "#f0f0f0",
                          borderWidth: isSelected ? 2 : 1,
                          boxShadow: isSelected
                            ? "0 0 0 3px rgba(22, 119, 255, 0.12)"
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
                                background: isOccupied ? "#fa8c16" : "#1677ff",
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
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  الدور {room.floor?.number} · {room.type?.name}
                                </Text>
                              </div>
                            </div>
                          </Space>
                          {isSelected ? (
                            <CheckCircleFilled style={{ color: "#1677ff", fontSize: 20 }} />
                          ) : isOccupied ? (
                            <Tag color={overdue ? "red" : "orange"} icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                              محجوز
                            </Tag>
                          ) : (
                            <Tag color="green" style={{ margin: 0 }}>متاحة</Tag>
                          )}
                        </Flex>

                        <div
                          style={{
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                            borderRadius: 8,
                            padding: "8px 12px",
                            marginBottom: isOccupied || isSelected ? 12 : 0,
                          }}
                        >
                          <Flex justify="space-between" align="baseline">
                            <div>
                              <Text style={{ fontSize: 18, fontWeight: 700, color: "#389e0d" }}>
                                {formatCurrency(room.price_sdg)} ج.س
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}> / ليلة</Text>
                            </div>
                            {room.total_price_sdg ? (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                الإجمالي: {formatCurrency(room.total_price_sdg)} ج.س
                              </Text>
                            ) : null}
                          </Flex>
                          <Flex justify="space-between" align="baseline" style={{ marginTop: 2 }}>
                            <div>
                              <Text style={{ fontSize: 15, fontWeight: 700, color: "#1677ff" }}>
                                ${formatCurrency(room.price_usd)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}> / ليلة</Text>
                            </div>
                            {room.total_price_usd ? (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                الإجمالي: ${formatCurrency(room.total_price_usd)}
                              </Text>
                            ) : null}
                          </Flex>
                        </div>

                        {isOccupied && currentReservation && (
                          <div
                            style={{
                              background: "#fffbe6",
                              border: "1px solid #ffe58f",
                              borderRadius: 8,
                              padding: 10,
                              marginBottom: isSelected ? 12 : 0,
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

                        {isSelected && (
                          <Button
                            type="primary"
                            block
                            icon={<PlusOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateDialog();
                            }}
                          >
                            إتمام الحجز
                          </Button>
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
