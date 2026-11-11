import { useEffect, useState, useRef, useCallback } from "react";
import apiClient from "../api/axios";
import {
  Card,
  Table,
  Input,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  Segmented,
  Empty,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  TeamOutlined,
  PhoneOutlined,
  CalendarOutlined,
  UserOutlined,
  BankOutlined,
  FileTextOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { toast } from "sonner";
import CreateCustomerDialog from "@/components/dialogs/CreateCustomerDialog";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const { Text, Title } = Typography;

interface Customer {
  id: number;
  name: string;
  phone?: string;
  national_id?: string;
  address?: string;
  date_of_birth?: string;
  gender?: "male" | "female";
  type?: "individual" | "company";
  email?: string;
  contact_name_1?: string;
  contact_name_2?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function Customers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    national_id: "",
    address: "",
    date_of_birth: "",
    gender: "",
    type: "individual",
    email: "",
    contact_name_1: "",
    contact_name_2: "",
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  // Debounce search term - wait 500ms after user stops typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Reset to page 1 when debounced search term changes (but not on initial mount)
  const prevDebouncedSearchRef = useRef<string>("");
  useEffect(() => {
    if (
      prevDebouncedSearchRef.current !== "" &&
      prevDebouncedSearchRef.current !== debouncedSearchTerm &&
      currentPage !== 1
    ) {
      setCurrentPage(1);
    }
    prevDebouncedSearchRef.current = debouncedSearchTerm;
  }, [debouncedSearchTerm, currentPage]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/customers", {
        params: {
          page: currentPage,
          per_page: perPage,
          ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        },
      });

      // Handle Laravel pagination response
      if (data.data && Array.isArray(data.data)) {
        setCustomers(data.data);
        setPaginationMeta({
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          per_page: data.per_page || 20,
          total: data.total || 0,
        });
      } else if (Array.isArray(data)) {
        // Fallback for non-paginated response
        setCustomers(data);
        setPaginationMeta({
          current_page: 1,
          last_page: 1,
          per_page: data.length,
          total: data.length,
        });
      }
    } catch (e) {
      console.error("Failed to fetch customers", e);
      toast.error("فشل في تحميل العملاء");
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage, debouncedSearchTerm]);

  // Fetch customers when page, perPage, or debounced search term changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreateCustomer = async () => {
    try {
      setLoading(true);
      const payload = { ...customerForm };
      await apiClient.post("/customers", payload);
      setOpenCreate(false);
      setCustomerForm({
        name: "",
        phone: "",
        national_id: "",
        address: "",
        date_of_birth: "",
        gender: "",
        type: "individual",
        email: "",
        contact_name_1: "",
        contact_name_2: "",
      });
      toast.success("تم إنشاء العميل بنجاح");
      // Refresh the list - go to first page to show the new customer
      setCurrentPage(1);
      await fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء العميل");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setLoading(true);
      const payload = { ...customerForm };
      const { data } = await apiClient.put(
        `/customers/${selectedCustomer.id}`,
        payload,
      );
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? data : c)),
      );
      setOpenEdit(false);
      setSelectedCustomer(null);
      setCustomerForm({
        name: "",
        phone: "",
        national_id: "",
        address: "",
        date_of_birth: "",
        gender: "",
        type: "individual",
        email: "",
        contact_name_1: "",
        contact_name_2: "",
      });
      toast.success("تم تحديث العميل بنجاح");
      // Refresh to ensure data is up to date
      await fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل تحديث العميل");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone || "",
      national_id: customer.national_id || "",
      address: customer.address || "",
      date_of_birth: customer.date_of_birth || "",
      gender: customer.gender || "",
      type: customer.type || "individual",
      email: customer.email || "",
      contact_name_1: customer.contact_name_1 || "",
      contact_name_2: customer.contact_name_2 || "",
    });
    setOpenEdit(true);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  const isCompanyForm = customerForm.type === "company";

  const columns: ColumnsType<Customer> = [
    {
      title: "الاسم",
      dataIndex: "name",
      align: "center",
      render: (_, customer) => (
        <div>
          <Text strong>{customer.name}</Text>
          {customer.type === "company" &&
            (customer.contact_name_1 || customer.contact_name_2) && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {[customer.contact_name_1, customer.contact_name_2]
                    .filter(Boolean)
                    .join(" • ")}
                </Text>
              </div>
            )}
        </div>
      ),
    },
    {
      title: "النوع",
      dataIndex: "type",
      align: "center",
      render: (_, customer) => (
        <Tag color={customer.type === "company" ? "purple" : "blue"}>
          {customer.type === "company" ? "شركة" : "عميل عادي"}
        </Tag>
      ),
    },
    {
      title: "الهاتف",
      dataIndex: "phone",
      align: "center",
      render: (_, customer) =>
        customer.phone ? (
          <Space size={4}>
            <PhoneOutlined />
            {customer.phone}
          </Space>
        ) : (
          <Text type="secondary">غير محدد</Text>
        ),
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "created_at",
      align: "center",
      render: (_, customer) => (
        <Space size={4}>
          <CalendarOutlined />
          {formatDate(customer.created_at)}
        </Space>
      ),
    },
    {
      title: "الإجراءات",
      align: "center",
      render: (_, customer) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/customers/${customer.id}/ledger`)}
          >
            كشف
          </Button>
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditDialog(customer)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 8 }}>
      <Card
        title={
          <Space>
            <TeamOutlined style={{ color: "#1677ff" }} />
            <Title level={5} style={{ margin: 0 }}>
              قائمة العملاء ({paginationMeta.total})
            </Title>
          </Space>
        }
        extra={
          <Space>
          
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenCreate(true)}
            >
              عميل جديد
            </Button>
          </Space>
        }
      >
        <Input
          placeholder="البحث بالاسم، الهاتف، أو الرقم الوطني..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          style={{ marginBottom: 16 }}
        />

        <Table<Customer>
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                description={
                  searchTerm ? "لا توجد نتائج للبحث" : "ابدأ بإضافة عميل جديد"
                }
              />
            ),
          }}
          pagination={{
            current: paginationMeta.current_page,
            pageSize: paginationMeta.per_page,
            total: paginationMeta.total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (total) => `من أصل ${total}`,
            onChange: (page, pageSize) => {
              setCurrentPage(page);
              if (pageSize !== perPage) {
                setPerPage(pageSize);
                setCurrentPage(1);
              }
            },
          }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      <CreateCustomerDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        customerForm={customerForm}
        onCustomerFormChange={setCustomerForm}
        onCreateCustomer={handleCreateCustomer}
        loading={loading}
      />

      <Modal
        open={openEdit}
        onCancel={() => setOpenEdit(false)}
        title="تعديل العميل"
        width={640}
        closable={!loading}
        maskClosable={!loading}
        footer={[
          <Button key="cancel" onClick={() => setOpenEdit(false)} disabled={loading}>
            إلغاء
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleEditCustomer}
          >
            حفظ التغييرات
          </Button>,
        ]}
      >
        <Text type="secondary">تحديث بيانات العميل</Text>

        <Divider titlePlacement="end" plain style={{ margin: "16px 0" }}>
          فئة العميل
        </Divider>
        <Segmented
          value={customerForm.type}
          onChange={(value) =>
            setCustomerForm({ ...customerForm, type: value as string })
          }
          block
          options={[
            { label: "عميل عادي", value: "individual", icon: <UserOutlined /> },
            { label: "شركة", value: "company", icon: <BankOutlined /> },
          ]}
        />

        <Divider titlePlacement="end" plain style={{ margin: "20px 0 16px" }}>
          {isCompanyForm ? "بيانات الشركة" : "المعلومات الشخصية"}
        </Divider>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Input
              placeholder={isCompanyForm ? "اسم الشركة" : "الاسم الكامل"}
              prefix={isCompanyForm ? <BankOutlined /> : <UserOutlined />}
              value={customerForm.name}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, name: e.target.value })
              }
            />
          </Col>

          {isCompanyForm && (
            <>
              <Col xs={24} sm={12}>
                <Input
                  placeholder="اسم العميل 1"
                  prefix={<UserOutlined />}
                  value={customerForm.contact_name_1}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      contact_name_1: e.target.value,
                    })
                  }
                />
              </Col>
              <Col xs={24} sm={12}>
                <Input
                  placeholder="اسم العميل 2"
                  prefix={<UserOutlined />}
                  value={customerForm.contact_name_2}
                  onChange={(e) =>
                    setCustomerForm({
                      ...customerForm,
                      contact_name_2: e.target.value,
                    })
                  }
                />
              </Col>
            </>
          )}

          <Col xs={24} sm={12}>
            <Input
              placeholder="رقم الهاتف"
              prefix={<PhoneOutlined />}
              value={customerForm.phone}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, phone: e.target.value })
              }
            />
          </Col>
          <Col xs={24} sm={12}>
            <Input
              placeholder={isCompanyForm ? "رقم السجل التجاري" : "الرقم الوطني"}
              prefix={<IdcardOutlined />}
              value={customerForm.national_id}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  national_id: e.target.value,
                })
              }
            />
          </Col>

          {isCompanyForm && (
            <Col span={24}>
              <Input
                type="email"
                placeholder="البريد الالكتروني"
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, email: e.target.value })
                }
              />
            </Col>
          )}
        </Row>

        {isCompanyForm && (
          <>
            <Divider titlePlacement="end" plain style={{ margin: "20px 0 16px" }}>
              العنوان
            </Divider>
            <Input.TextArea
              placeholder="العنوان الكامل"
              value={customerForm.address}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, address: e.target.value })
              }
              rows={3}
            />
          </>
        )}

        {!isCompanyForm && (
          <>
            <Divider titlePlacement="end" plain style={{ margin: "20px 0 16px" }}>
              معلومات إضافية
            </Divider>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <DatePicker
                  placeholder="تاريخ الميلاد"
                  suffixIcon={<CalendarOutlined />}
                  style={{ width: "100%" }}
                  value={
                    customerForm.date_of_birth
                      ? dayjs(customerForm.date_of_birth)
                      : null
                  }
                  onChange={(_, dateString) =>
                    setCustomerForm({
                      ...customerForm,
                      date_of_birth: (dateString as string) || "",
                    })
                  }
                />
              </Col>
              <Col xs={24} sm={12}>
                <Select
                  placeholder="النوع"
                  style={{ width: "100%" }}
                  value={customerForm.gender || undefined}
                  onChange={(value) =>
                    setCustomerForm({ ...customerForm, gender: value })
                  }
                  options={[
                    { value: "male", label: "ذكر" },
                    { value: "female", label: "أنثى" },
                  ]}
                />
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </div>
  );
}
