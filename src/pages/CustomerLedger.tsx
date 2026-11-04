import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/axios'
import {
  Button,
  Card,
  Descriptions,
  Typography,
  Flex,
  Table,
  Tag,
  Modal,
  Input,
  Select,
  Space,
  Empty,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  PlusOutlined,
  DownloadOutlined,
  UndoOutlined,
  PrinterOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'

const { Text, Title, Link: TypographyLink } = Typography
const { TextArea } = Input

interface Customer {
  id: number
  name: string
  phone?: string
  national_id?: string
  address?: string
  type?: 'individual' | 'company'
  contact_name_1?: string
  contact_name_2?: string
  document_path?: string
}

interface CustomerReservation {
  id: number
  check_in_date: string
  check_out_date: string
  status: string
  currency: 'USD' | 'SDG'
  rooms?: Array<{ id: number; number: string }>
  transactions?: Array<{ type: 'debit' | 'credit' | 'refund'; amount: number | string }>
}

interface LedgerEntry {
  id: number
  reservation_id?: number
  reservation_service_id?: number
  type: 'reservation' | 'payment' | 'refund' | 'service'
  date: string
  description: string
  currency?: 'USD' | 'SDG'
  rooms?: string
  days?: number
  period?: string
  rate?: number | null
  is_extension?: boolean
  paymentMethod?: string
  debit: number
  credit: number
  refund_amount?: number
  balance: number
}

const methodLabels: Record<string, string> = {
  cash: 'نقدي',
  bankak: 'بنكك',
  Ocash: 'أوكاش',
  fawri: 'فوري',
}

export default function CustomerLedger() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [finalBalance, setFinalBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<CustomerReservation[]>([])
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [paymentsModalReservationId, setPaymentsModalReservationId] = useState<number | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    reservation_id: '',
    method: 'cash',
    amount: '',
    notes: '',
    reference: '',
  })

  const selectedReservation = reservations.find((r) => String(r.id) === paymentForm.reservation_id) ?? null

  const reservationBalance = (r: CustomerReservation): number => {
    const debit = (r.transactions ?? []).filter((t) => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0)
    const credit = (r.transactions ?? []).filter((t) => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0)
    return debit - credit
  }

  useEffect(() => {
    if (id) {
      fetchCustomer()
      fetchLedger()
      fetchReservations()
    }
  }, [id])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get(`/customers/${id}`)
      setCustomer(data?.data || data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب بيانات العميل')
    } finally {
      setLoading(false)
    }
  }

  const fetchLedger = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get(`/customers/${id}/ledger`)
      const ledgerData = data?.data || data
      setLedgerEntries(ledgerData.ledger_entries || [])
      setFinalBalance(ledgerData.final_balance || 0)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب كشف الحساب')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    try {
      const { data } = await apiClient.get('/reservations', { params: { customer_id: id, per_page: 'all' } })
      setReservations(data?.data || data || [])
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب حجوزات العميل')
    }
  }

  const resetPaymentForm = () =>
    setPaymentForm({ reservation_id: '', method: 'cash', amount: '', notes: '', reference: '' })

  const openPaymentFor = (reservationId: number) => {
    const reservation = reservations.find((r) => r.id === reservationId)
    const remaining = reservation ? reservationBalance(reservation) : 0
    setPaymentForm({
      reservation_id: String(reservationId),
      method: 'cash',
      amount: remaining > 0 ? remaining.toString() : '',
      notes: '',
      reference: '',
    })
    setOpenPaymentDialog(true)
  }

  const handleCreatePayment = async () => {
    if (!id || !paymentForm.reservation_id || !paymentForm.method || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      setLoading(true)

      const payload: any = {
        customer_id: Number(id),
        reservation_id: Number(paymentForm.reservation_id),
        type: 'credit',
        method: paymentForm.method,
        amount: parseFloat(paymentForm.amount),
      }

      if (paymentForm.reference) payload.reference = paymentForm.reference
      if (paymentForm.notes) payload.notes = paymentForm.notes

      await apiClient.post('/transactions', payload)
      toast.success('تم إضافة الدفعة بنجاح')
      setOpenPaymentDialog(false)
      resetPaymentForm()
      await Promise.all([fetchLedger(), fetchReservations()])
    } catch (err: any) {
      // apiClient already shows an error toast
    } finally {
      setLoading(false)
    }
  }

  const openPdfBlob = async (
    endpoint: string,
    opts: { successMessage: string; failMessage: string }
  ) => {
    try {
      setLoading(true)
      const response = await apiClient.get(endpoint, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const newWindow = window.open(url, '_blank')
      if (!newWindow) {
        toast.error('يرجى السماح بالنوافذ المنبثقة لعرض PDF')
        window.URL.revokeObjectURL(url)
        return
      }
      newWindow.addEventListener('load', () => {
        setTimeout(() => window.URL.revokeObjectURL(url), 1000)
      })
      toast.success(opts.successMessage)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || opts.failMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdf = () =>
    id &&
    openPdfBlob(`/customers/${id}/ledger/pdf`, {
      successMessage: 'تم فتح الكشف في نافذة جديدة',
      failMessage: 'فشل في فتح الكشف',
    })

  const handleInvoiceClick = (reservationId: number, extensionTransactionId?: number) => {
    const endpoint = extensionTransactionId
      ? `/reservations/${reservationId}/extension-invoice/pdf?transaction_id=${extensionTransactionId}`
      : `/reservations/${reservationId}/invoice/pdf`
    return openPdfBlob(endpoint, {
      successMessage: 'تم فتح الفاتورة في نافذة جديدة',
      failMessage: 'فشل في فتح الفاتورة',
    })
  }

  const handleServiceInvoiceClick = (reservationServiceId: number) =>
    openPdfBlob(`/reservation-services/${reservationServiceId}/pdf`, {
      successMessage: 'تم فتح فاتورة الخدمة في نافذة جديدة',
      failMessage: 'فشل في فتح فاتورة الخدمة',
    })

  const handlePaymentInvoiceClick = (transactionId: number) =>
    openPdfBlob(`/transactions/${transactionId}/invoice/pdf`, {
      successMessage: 'تم فتح إيصال الدفع في نافذة جديدة',
      failMessage: 'فشل في فتح إيصال الدفع',
    })

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0'
    return new Intl.NumberFormat('en-US').format(amount)
  }

  const sumDebit = ledgerEntries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0)
  const sumCredit = ledgerEntries.reduce(
    (sum, entry) => (entry.type !== 'payment' ? sum : sum + (Number(entry.credit) || 0)),
    0
  )
  const totalRefund = ledgerEntries.reduce(
    (sum, entry) => (entry.type !== 'refund' ? sum : sum + (Number(entry.refund_amount) || 0)),
    0
  )
  const totalDebit = sumDebit - totalRefund
  const totalCredit = sumCredit - totalRefund

  // Payments carry their reservation_id now, so nest them under their reservation
  // row instead of listing them as separate sibling rows in the main table.
  const paymentsByReservation = ledgerEntries.reduce<Record<number, LedgerEntry[]>>((acc, entry) => {
    if (entry.type === 'payment' && entry.reservation_id) {
      acc[entry.reservation_id] = [...(acc[entry.reservation_id] ?? []), entry]
    }
    return acc
  }, {})

  // Payments without a reservation_id are legacy rows recorded before payments
  // were tied to a reservation — keep those visible at the top level.
  const mainRows = ledgerEntries.filter((entry) => !(entry.type === 'payment' && entry.reservation_id))

  const reservationPayments = paymentsModalReservationId ? paymentsByReservation[paymentsModalReservationId] ?? [] : []

  const columns: ColumnsType<LedgerEntry> = [
    {
      title: 'التاريخ',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
    },
    {
      title: 'الوصف',
      key: 'description',
      align: 'center',
      render: (_, entry) => {
        if (entry.type === 'reservation' && entry.reservation_id) {
          return (
            <div>
              <TypographyLink onClick={() => handleInvoiceClick(entry.reservation_id!, entry.is_extension ? entry.id : undefined)}>
                {entry.description}
              </TypographyLink>
              {entry.period && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {entry.period}
                  </Text>
                </div>
              )}
            </div>
          )
        }
        if (entry.type === 'service' && entry.reservation_service_id) {
          return (
            <TypographyLink onClick={() => handleServiceInvoiceClick(entry.reservation_service_id!)}>
              <CustomerServiceOutlined /> {entry.description}
            </TypographyLink>
          )
        }
        if (entry.type === 'payment') {
          return <TypographyLink onClick={() => handlePaymentInvoiceClick(entry.id)}>{entry.description}</TypographyLink>
        }
        if (entry.type === 'refund') {
          return (
            <Text type="warning" strong>
              <UndoOutlined /> {entry.description}
            </Text>
          )
        }
        return entry.description
      },
    },
    {
      title: 'الغرف / طريقة الدفع',
      key: 'rooms',
      align: 'center',
      render: (_, entry) => {
        if (entry.type === 'reservation') return <Tag>{entry.rooms}</Tag>
        if (entry.type === 'service') return <Tag color="blue" icon={<CustomerServiceOutlined />}>خدمة</Tag>
        if (entry.type === 'refund') return <Tag color="gold" icon={<UndoOutlined />}>مسترجع</Tag>
        return (
          <Tag color="purple" icon={<CreditCardOutlined />}>
            {methodLabels[entry.paymentMethod ?? ''] ?? entry.paymentMethod}
          </Tag>
        )
      },
    },
    {
      title: 'العملة',
      dataIndex: 'currency',
      key: 'currency',
      align: 'center',
      render: (currency) => (currency ? <Tag color={currency === 'USD' ? 'green' : 'default'}>{currency}</Tag> : '-'),
    },
    {
      title: 'عدد الأيام',
      dataIndex: 'days',
      key: 'days',
      align: 'center',
      render: (days) => days || '-',
    },
    {
      title: 'سعر الليلة',
      key: 'rate',
      align: 'center',
      render: (_, entry) => (entry.rate ? formatCurrency(entry.rate) : '-'),
    },
    {
      title: 'مدين',
      key: 'debit',
      align: 'center',
      render: (_, entry) => (entry.debit > 0 ? formatCurrency(entry.debit) : '-'),
    },
    {
      title: 'دائن',
      key: 'credit',
      align: 'center',
      render: (_, entry) =>
        entry.credit > 0 ? (
          <Text type={entry.type === 'refund' ? 'warning' : undefined} strong={entry.type === 'refund'}>
            {formatCurrency(entry.credit)}
          </Text>
        ) : (
          '-'
        ),
    },
    {
      title: 'الرصيد',
      dataIndex: 'balance',
      key: 'balance',
      align: 'center',
      render: (balance) => formatCurrency(balance),
    },
    {
      title: 'إجراءات',
      key: 'actions',
      align: 'center',
      render: (_, entry) => {
        if (entry.type !== 'reservation' || !entry.reservation_id) return null
        const paymentsCount = (paymentsByReservation[entry.reservation_id] ?? []).length
        return (
          <Space size={4}>
            <Button size="small" icon={<PlusOutlined />} onClick={() => openPaymentFor(entry.reservation_id!)}>
              دفعة
            </Button>
            <Button
              size="small"
              icon={<CreditCardOutlined />}
              disabled={paymentsCount === 0}
              onClick={() => setPaymentsModalReservationId(entry.reservation_id!)}
            >
              المدفوعات {paymentsCount > 0 && `(${paymentsCount})`}
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <Flex vertical gap={16} style={{ padding: 24 }}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/customers')}>
          العودة إلى العملاء
        </Button>
        {customer && (
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={handleExportPdf} disabled={loading || ledgerEntries.length === 0}>
              عرض PDF
            </Button>
            {customer.type === 'company' && customer.document_path && (
              <Button
                icon={<PrinterOutlined />}
                onClick={() => {
                  const url = `${apiClient.defaults.baseURL?.replace('/api', '')}/storage/${customer.document_path}`
                  window.open(url, '_blank')
                }}
              >
                طباعة المستند
              </Button>
            )}
          </Space>
        )}
      </Flex>

      {customer && (
        <Card>
          <Descriptions column={{ xs: 1, sm: 2, md: 4 }} bordered size="middle">
            <Descriptions.Item label="الاسم">
              <Text strong>{customer.name}</Text>
              {customer.type === 'company' && (customer.contact_name_1 || customer.contact_name_2) && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {[customer.contact_name_1, customer.contact_name_2].filter(Boolean).join(' • ')}
                  </Text>
                </div>
              )}
            </Descriptions.Item>
            {customer.phone && <Descriptions.Item label="الهاتف">{customer.phone}</Descriptions.Item>}
            {customer.national_id && (
              <Descriptions.Item label={customer.type === 'company' ? 'رقم السجل التجاري' : 'الرقم الوطني'}>
                {customer.national_id}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="الرصيد النهائي">
              <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
                {formatCurrency(finalBalance)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <Title level={5} style={{ margin: 0 }}>
              كشف الحساب
            </Title>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={mainRows}
          rowKey={(entry) => `${entry.type}-${entry.id}`}
          loading={loading}
          pagination={false}
          scroll={{ x: true }}
          rowClassName={(entry) =>
            entry.type === 'refund' ? 'ledger-row-refund' : entry.type === 'service' ? 'ledger-row-service' : ''
          }
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد حركات حسابية" />,
          }}
          summary={() =>
            mainRows.length === 0 ? null : (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={6} align="center">
                  <Text strong>الإجمالي</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="center">
                  <Text strong type="danger">
                    {formatCurrency(totalDebit)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="center">
                  <Flex vertical align="center" gap={4}>
                    <Text strong type="success">
                      {formatCurrency(totalCredit)}
                    </Text>
                    {totalRefund > 0 && (
                      <Tag color="gold" icon={<UndoOutlined />}>
                        مسترجع: {formatCurrency(totalRefund)}
                      </Tag>
                    )}
                  </Flex>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">
                  <Text strong>{formatCurrency(finalBalance)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center" />
              </Table.Summary.Row>
            )
          }
        />
      </Card>

      <Modal
        open={openPaymentDialog}
        onCancel={() => {
          setOpenPaymentDialog(false)
          resetPaymentForm()
        }}
        title={
          <Space>
            <span>إضافة دفعة</span>
            {selectedReservation && <Tag color="blue">العملة: {selectedReservation.currency}</Tag>}
          </Space>
        }
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setOpenPaymentDialog(false)
              resetPaymentForm()
            }}
          >
            إلغاء
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            disabled={
              !paymentForm.reservation_id || !paymentForm.method || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0
            }
            onClick={handleCreatePayment}
          >
            حفظ
          </Button>,
        ]}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          تسجيل دفعة جديدة مقابل أحد حجوزات العميل — تُحتسب الدفعة بعملة الحجز المختار
        </Text>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>الحجز</Text>
            <Select
              value={paymentForm.reservation_id || undefined}
              onChange={(value) => {
                const reservation = reservations.find((r) => String(r.id) === value)
                const remaining = reservation ? reservationBalance(reservation) : 0
                setPaymentForm({
                  ...paymentForm,
                  reservation_id: value,
                  amount: remaining > 0 ? remaining.toString() : '',
                })
              }}
              style={{ width: '100%' }}
              placeholder={reservations.length === 0 ? 'لا توجد حجوزات لهذا العميل' : 'اختر الحجز'}
              notFoundContent="لا توجد حجوزات"
              options={reservations.map((r) => ({
                value: String(r.id),
                label: `حجز #${r.id} — ${(r.rooms ?? []).map((room) => room.number).join('، ') || '—'} — ${r.currency} — متبقي ${formatCurrency(reservationBalance(r))}`,
              }))}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>طريقة الدفع</Text>
            <Select
              value={paymentForm.method}
              onChange={(value) => setPaymentForm({ ...paymentForm, method: value })}
              style={{ width: '100%' }}
              options={[
                { value: 'cash', label: 'نقدي' },
                { value: 'bankak', label: 'بنكك' },
                { value: 'Ocash', label: 'أوكاش' },
                { value: 'fawri', label: 'فوري' },
              ]}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              المبلغ {selectedReservation && `(${selectedReservation.currency})`}
            </Text>
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="0.00"
              disabled={!paymentForm.reservation_id}
              suffix={selectedReservation?.currency}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>الرقم المرجعي (اختياري)</Text>
            <Input
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              placeholder="سيتم إنشاؤه تلقائياً"
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>ملاحظات (اختياري)</Text>
            <TextArea
              rows={3}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="ملاحظات إضافية..."
            />
          </div>
        </Space>
      </Modal>

      <Modal
        open={paymentsModalReservationId !== null}
        onCancel={() => setPaymentsModalReservationId(null)}
        title={`المدفوعات — حجز #${paymentsModalReservationId ?? ''}`}
        footer={<Button onClick={() => setPaymentsModalReservationId(null)}>إغلاق</Button>}
      >
        <Table
          size="small"
          dataSource={reservationPayments}
          rowKey={(entry) => entry.id}
          pagination={false}
          locale={{ emptyText: 'لا توجد مدفوعات لهذا الحجز' }}
          columns={[
            { title: 'التاريخ', dataIndex: 'date', key: 'date', align: 'center' },
            {
              title: 'طريقة الدفع',
              key: 'method',
              align: 'center',
              render: (_, entry) => (
                <Tag color="purple" icon={<CreditCardOutlined />}>
                  {methodLabels[entry.paymentMethod ?? ''] ?? entry.paymentMethod}
                </Tag>
              ),
            },
            {
              title: 'المبلغ',
              key: 'amount',
              align: 'center',
              render: (_, entry) => formatCurrency(entry.credit),
            },
            {
              title: 'الإيصال',
              key: 'receipt',
              align: 'center',
              render: (_, entry) => (
                <TypographyLink onClick={() => handlePaymentInvoiceClick(entry.id)}>{entry.description}</TypographyLink>
              ),
            },
          ]}
        />
      </Modal>

      <style>{`
        .ledger-row-refund > td { background-color: #fffbe6 !important; }
        .ledger-row-service > td { background-color: #e6f4ff !important; }
      `}</style>
    </Flex>
  )
}
