import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PlusOutlined,
  PrinterOutlined,
  UndoOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import apiClient from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import { useShift } from '../contexts/ShiftContext'

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
  transactions?: Array<{ type: 'debit' | 'credit'; amount: number | string }>
}

interface LedgerEntry {
  id: number
  reservation_id?: number
  reservation_service_id?: number
  type: 'reservation' | 'payment' | 'service'
  date: string
  description: string
  currency?: 'USD' | 'SDG'
  rooms?: string
  days?: number
  period?: string
  rate?: number | null
  is_extension?: boolean
  operation_type?: 'extension' | 'transfer' | null
  notes?: string | null
  paymentMethod?: string
  // Payment rows only: who recorded the payment and the shift it belongs to
  paid_by?: string | null
  user_id?: number | null
  shift_id?: number | null
  debit: number
  credit: number
  balance: number
}

// Early checkout: only a hint to refund the unused nights — no ledger entry, no refund.
interface EarlyCheckout {
  reservation_id: number
  currency: 'USD' | 'SDG'
  nights: number | null
  amount: number
}

interface CustomerService {
  id: number
  reservation_id: number
  created_at: string
  quantity?: number
  price?: number | null
  price_currency?: 'USD' | 'SDG' | null
  billed_amount?: number
  currency?: 'USD' | 'SDG'
  payment_method?: string | null
  paid_at?: string | null
  notes?: string | null
  service?: { name: string }
  room?: { number: string }
}

// e.g. "10/11/2026 03:45 م" — 12-hour clock with an Arabic صباحاً/مساءً marker.
const formatDateTime12h = (value: string) => {
  const d = dayjs(value)
  return `${d.format('DD/MM/YYYY hh:mm')} ${d.hour() < 12 ? 'ص' : 'م'}`
}

const methodLabels: Record<string, string> = {
  cash: 'نقدي',
  bankak: 'بنكك',
  Ocash: 'أوكاش',
  fawri: 'فوري',
}

const allMethodOptions = [
  { value: 'cash', label: methodLabels.cash },
  { value: 'bankak', label: methodLabels.bankak },
  { value: 'Ocash', label: methodLabels.Ocash },
  { value: 'fawri', label: methodLabels.fawri },
]

// USD payments only ever come in as physical cash here — the local e-wallet/bank
// methods (bankak, Ocash, fawri) are SDG-only rails.
const methodOptionsFor = (currency?: string) =>
  currency === 'USD' ? allMethodOptions.filter((m) => m.value === 'cash') : allMethodOptions

const defaultMethodFor = (currency?: string) => (currency === 'USD' ? 'cash' : 'bankak')

export default function CustomerLedger() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { current } = useShift()
  const [cancellingPaymentId, setCancellingPaymentId] = useState<number | null>(null)
  // Hook form so the confirm dialog inherits the app's RTL ConfigProvider
  const [modal, modalContextHolder] = Modal.useModal()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [totalsByCurrency, setTotalsByCurrency] = useState<
    Record<string, { total_debit: number; total_credit: number; final_balance: number }>
  >({})
  const [earlyCheckouts, setEarlyCheckouts] = useState<EarlyCheckout[]>([])
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<CustomerReservation[]>([])
  const [services, setServices] = useState<CustomerService[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false)
  const [paymentsModalReservationId, setPaymentsModalReservationId] = useState<number | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    reservation_id: '',
    method: 'bankak',
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
      fetchServices()
    }
  }, [id])

  const fetchServices = async () => {
    try {
      setServicesLoading(true)
      const { data } = await apiClient.get('/reservation-services', { params: { customer_id: id } })
      setServices(Array.isArray(data) ? data : [])
    } catch {
      // apiClient's interceptor already toasts the error
    } finally {
      setServicesLoading(false)
    }
  }

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
      setTotalsByCurrency(ledgerData.totals_by_currency || {})
      setEarlyCheckouts(ledgerData.early_checkouts || [])
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب كشف الحساب')
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    try {
      const { data } = await apiClient.get('/reservations', { params: { customer_id: id, per_page: 'all' } })
      const list: CustomerReservation[] = data?.data || data || []
      setReservations([...list].sort((a, b) => b.id - a.id))
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل في جلب حجوزات العميل')
    }
  }

  const resetPaymentForm = () =>
    setPaymentForm({ reservation_id: '', method: 'bankak', amount: '', notes: '', reference: '' })

  const openPaymentFor = (reservationId: number) => {
    const reservation = reservations.find((r) => r.id === reservationId)
    const remaining = reservation ? reservationBalance(reservation) : 0
    setPaymentForm({
      reservation_id: String(reservationId),
      method: defaultMethodFor(reservation?.currency),
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

  // Mirrors TransactionController::destroy — admins cancel any payment, everyone else
  // only payments they recorded in the currently open shift.
  const canCancelPayment = (entry: LedgerEntry) =>
    !!user?.is_admin ||
    (entry.user_id === user?.id && !!entry.shift_id && entry.shift_id === current?.shift?.id)

  const handleCancelPayment = (entry: LedgerEntry) => {
    modal.confirm({
      title: 'إلغاء السداد',
      content: `سيتم حذف الدفعة بمبلغ ${formatCurrency(entry.credit)} ${entry.currency === 'USD' ? '$' : 'ج.س'} وإعادتها إلى رصيد الحجز. هل أنت متأكد؟`,
      okText: 'إلغاء السداد',
      okButtonProps: { danger: true },
      cancelText: 'تراجع',
      onOk: async () => {
        setCancellingPaymentId(entry.id)
        try {
          await apiClient.delete(`/transactions/${entry.id}`)
          toast.success('تم إلغاء السداد')
          await Promise.all([fetchLedger(), fetchReservations()])
        } catch {
          // apiClient already shows an error toast
        } finally {
          setCancellingPaymentId(null)
        }
      },
    })
  }

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0'
    return new Intl.NumberFormat('en-US').format(amount)
  }

  // SDG and USD each get their own totals/balance row — never summed together.
  const currencyTotals = Object.entries(totalsByCurrency)

  // Payments carry their reservation_id now, so nest them under their reservation
  // row instead of listing them as separate sibling rows in the main table.
  const paymentsByReservation = ledgerEntries.reduce<Record<number, LedgerEntry[]>>((acc, entry) => {
    if (entry.type === 'payment' && entry.reservation_id) {
      acc[entry.reservation_id] = [...(acc[entry.reservation_id] ?? []), entry]
    }
    return acc
  }, {})

  const paidForReservation = (reservationId: number): number =>
    (paymentsByReservation[reservationId] ?? []).reduce((sum, p) => sum + (Number(p.credit) || 0), 0)

  // Extensions and transfers aren't rows of the main table: they're listed in a
  // separate details table under the final totals, with only their difference.
  const isAdjustment = (entry: LedgerEntry) => entry.type === 'reservation' && !!entry.operation_type
  const adjustments = ledgerEntries.filter(isAdjustment)

  // The first booking row of each reservation carries its adjustments in "remaining"
  const parentRowByReservation = ledgerEntries.reduce<Record<number, number>>((acc, entry) => {
    if (entry.type === 'reservation' && entry.reservation_id && !entry.operation_type && !(entry.reservation_id in acc)) {
      acc[entry.reservation_id] = entry.id
    }
    return acc
  }, {})

  const rowDebit = (entry: LedgerEntry): number => {
    if (!entry.reservation_id || parentRowByReservation[entry.reservation_id] !== entry.id) return Number(entry.debit)
    return Number(entry.debit) + adjustments
      .filter((a) => a.reservation_id === entry.reservation_id)
      .reduce((sum, a) => sum + Number(a.debit), 0)
  }

  // Payments without a reservation_id are legacy rows recorded before payments
  // were tied to a reservation — keep those visible at the top level.
  const mainRows = ledgerEntries.filter(
    (entry) => !(entry.type === 'payment' && entry.reservation_id) && !isAdjustment(entry)
  )

  // Services are tracked apart from the ledger, so they get their own totals per currency:
  // what was paid, and what is still owed on unpaid requests at their quoted price.
  const serviceTotals = services.reduce<Record<string, { paid: number; unpaid: number }>>((acc, s) => {
    const currency = (s.paid_at ? s.currency : s.price_currency) ?? 'SDG'
    const bucket = (acc[currency] ??= { paid: 0, unpaid: 0 })
    if (s.paid_at) bucket.paid += Number(s.billed_amount ?? 0)
    else if (s.price != null) bucket.unpaid += Number(s.price) * (s.quantity ?? 1)
    return acc
  }, {})

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
                  <Text  style={{ fontSize: 12 }}>
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
        return entry.description
      },
    },
    {
      title: 'الغرف ',
      key: 'rooms',
      align: 'center',
      render: (_, entry) => {
        if (entry.type === 'reservation') return <Tag>{entry.rooms}</Tag>
        if (entry.type === 'service') return <Tag color="blue" icon={<CustomerServiceOutlined />}>خدمة</Tag>
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
      title: 'الإجمالي',
      key: 'debit',
      align: 'center',
      render: (_, entry) => (Number(entry.debit) !== 0 ? formatCurrency(entry.debit) : '-'),
    },
    {
      title: 'المدفوع',
      key: 'credit',
      align: 'center',
      render: (_, entry) => {
        // Charge rows (reservation/service) don't carry a credit themselves — show
        // how much has actually been paid toward that reservation so far instead
        // of a bare "-", since that's what the column is really answering here.
        if ((entry.type === 'reservation' || entry.type === 'service') && entry.reservation_id) {
          const paid = paidForReservation(entry.reservation_id)
          return paid > 0 ? formatCurrency(paid) : '-'
        }
        return entry.credit > 0 ? formatCurrency(entry.credit) : '-'
      },
    },
    {
      title: 'المتبقي',
      key: 'balance',
      align: 'center',
      render: (_, entry) => {
        // For a charge row, "remaining" is that charge minus what's actually been
        // paid toward its reservation — not the raw chronological ledger balance,
        // which goes stale here once payments are nested out of the main rows.
        if ((entry.type === 'reservation' || entry.type === 'service') && entry.reservation_id) {
          return formatCurrency(rowDebit(entry) - paidForReservation(entry.reservation_id))
        }
        return formatCurrency(entry.balance)
      },
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
              {currencyTotals.length === 0 ? (
                <Text strong style={{  fontSize: 16 }}>0</Text>
              ) : (
                <Space orientation="vertical" size={2}>
                  {currencyTotals.map(([currency, totals]) => (
                    <Text key={currency} strong style={{  fontSize: 16 }}>
                      {formatCurrency(totals.final_balance)} {currency}
                    </Text>
                  ))}
                </Space>
              )}
            </Descriptions.Item>
            {services.length > 0 && (
              <Descriptions.Item label="رصيد الخدمات">
                {/* What is still owed on unpaid service requests, at their quoted price */}
                <Space orientation="vertical" size={2}>
                  {Object.entries(serviceTotals).map(([currency, totals]) => (
                    <Text key={currency} strong style={{ fontSize: 16 }}>
                      {formatCurrency(totals.unpaid)} {currency}
                    </Text>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
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
          rowClassName={(entry) => (entry.type === 'service' ? 'ledger-row-service' : '')}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد حركات حسابية" />,
          }}
          summary={() =>
            mainRows.length === 0 ? null : (
              <>
                {currencyTotals.map(([currency, totals]) => (
                  <Table.Summary.Row key={currency}>
                    <Table.Summary.Cell index={0} colSpan={6} align="center">
                      <Text strong>الإجمالي ({currency})</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <Text strong type="danger">
                        {formatCurrency(totals.total_debit)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <Text strong type="success">
                        {formatCurrency(totals.total_credit)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <Text strong>{formatCurrency(totals.final_balance)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="center" />
                  </Table.Summary.Row>
                ))}
              </>
            )
          }
        />

        {/* Hint only — not an entry, and not part of the totals above */}
        {earlyCheckouts.length > 0 && (
          <Flex vertical gap={4} style={{ marginTop: 12 }}>
            {earlyCheckouts.map((ec) => (
              <Text key={ec.reservation_id} type="warning">
                <WarningOutlined /> يوجد مغادرة مبكرة للحجز #{ec.reservation_id}
                {ec.nights ? ` (${ec.nights} ليلة)` : ''} — يرجى استرجاع مبلغ قدره{' '}
                <Text strong type="warning">
                  {formatCurrency(ec.amount)} {ec.currency}
                </Text>
              </Text>
            ))}
          </Flex>
        )}

        {adjustments.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Title level={5} style={{ marginBottom: 12 }}>
              تفاصيل التمديد والتحويل
            </Title>
            <Table
              size="small"
              dataSource={adjustments}
              rowKey={(entry) => entry.id}
              pagination={false}
              scroll={{ x: true }}
              columns={[
                { title: 'التاريخ', dataIndex: 'date', key: 'date', align: 'center' },
                {
                  title: 'رقم الحجز',
                  key: 'reservation',
                  align: 'center',
                  render: (_, a) => (a.reservation_id ? `#${a.reservation_id}` : '-'),
                },
                {
                  title: 'العملية',
                  key: 'operation',
                  align: 'center',
                  render: (_, a) =>
                    a.operation_type === 'extension' ? (
                      <Tag color="purple">
                        <TypographyLink onClick={() => handleInvoiceClick(a.reservation_id!, a.id)}>تمديد</TypographyLink>
                      </Tag>
                    ) : (
                      <Tag color="orange">تحويل</Tag>
                    ),
                },
                {
                  title: 'التفاصيل',
                  key: 'details',
                  align: 'center',
                  render: (_, a) =>
                    a.operation_type === 'extension'
                      ? `${a.rooms ?? ''} — ${a.days ?? '-'} ليلة × ${a.rate ? formatCurrency(a.rate) : '-'}`
                      : `${(a.notes?.replace(/:?\s*\d+\s*ليلة\s*\(فرق [^)]*\)\s*$/, '') ?? a.description)} — سعر الغرفة الجديدة: ${a.rate ? formatCurrency(a.rate) : '-'} × ${a.days ?? '-'} ليلة`,
                },
                { title: 'الفترة', dataIndex: 'period', key: 'period', align: 'center', render: (p) => p ?? '-' },
                {
                  title: 'العملة',
                  dataIndex: 'currency',
                  key: 'currency',
                  align: 'center',
                  render: (currency) => (currency ? <Tag color={currency === 'USD' ? 'green' : 'default'}>{currency}</Tag> : '-'),
                },
                {
                  title: 'الفرق في المبلغ',
                  key: 'diff',
                  align: 'center',
                  render: (_, a) => {
                    const diff = Number(a.debit)
                    return (
                      <Text strong type={diff < 0 ? 'success' : diff > 0 ? 'danger' : undefined} dir="ltr">
                        {diff > 0 ? '+' : ''}
                        {formatCurrency(diff)}
                      </Text>
                    )
                  },
                },
              ]}
            />
          </div>
        )}
      </Card>

      {services.length > 0 && (
      <Card
        title={
          <Space>
            <CustomerServiceOutlined />
            <Title level={5} style={{ margin: 0 }}>
              الخدمات
            </Title>
          </Space>
        }
      >
        <Table
          size="small"
          dataSource={services}
          rowKey="id"
          loading={servicesLoading}
          pagination={false}
          locale={{
            emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد خدمات لهذا العميل" />,
          }}
          columns={[
            {
              title: 'التاريخ',
              key: 'date',
              align: 'center',
              render: (_, s) => <span className="whitespace-nowrap">{formatDateTime12h(s.created_at)}</span>,
            },
            { title: 'رقم الحجز', key: 'reservation', align: 'center', render: (_, s) => `#${s.reservation_id}` },
            {
              title: 'الخدمة',
              key: 'service',
              align: 'center',
              render: (_, s) =>
                s.paid_at ? (
                  <TypographyLink onClick={() => handleServiceInvoiceClick(s.id)}>{s.service?.name ?? '-'}</TypographyLink>
                ) : (
                  <Text strong>{s.service?.name ?? '-'}</Text>
                ),
            },
            { title: 'العدد', key: 'quantity', align: 'center', render: (_, s) => s.quantity ?? 1 },
            {
              title: 'السعر',
              key: 'price',
              align: 'center',
              render: (_, s) => (s.price != null ? `${formatCurrency(Number(s.price))} ${s.price_currency ?? ''}` : '-'),
            },
            {
              title: 'المبلغ المدفوع',
              key: 'paid_amount',
              align: 'center',
              render: (_, s) => (s.paid_at ? `${formatCurrency(Number(s.billed_amount ?? 0))} ${s.currency ?? ''}` : '-'),
            },
            {
              title: 'طريقة الدفع',
              key: 'method',
              align: 'center',
              render: (_, s) => (s.paid_at ? methodLabels[s.payment_method ?? ''] ?? s.payment_method ?? '-' : '-'),
            },
            {
              title: 'الحالة',
              key: 'status',
              align: 'center',
              render: (_, s) => (s.paid_at ? <Tag color="green">مسددة</Tag> : <Tag color="orange">غير مسددة</Tag>),
            },
            { title: 'ملاحظات', key: 'notes', align: 'center', render: (_, s) => s.notes || '-' },
          ]}
          summary={() =>
            services.length === 0 ? null : (
              <>
                {Object.entries(serviceTotals).map(([currency, totals]) => (
                  <Table.Summary.Row key={currency}>
                    <Table.Summary.Cell index={0} colSpan={5} align="center">
                      <Text strong>إجمالي الخدمات ({currency})</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      <Text strong type="success">
                        {formatCurrency(totals.paid)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={3} align="center">
                      {totals.unpaid > 0 ? (
                        <Text strong type="danger">
                          غير مسدد: {formatCurrency(totals.unpaid)}
                        </Text>
                      ) : (
                        '-'
                      )}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ))}
              </>
            )
          }
        />
      </Card>
      )}

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
                  method: defaultMethodFor(reservation?.currency),
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
              options={methodOptionsFor(selectedReservation?.currency)}
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
        width={820}
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
              title: 'سدد بواسطة',
              key: 'paid_by',
              align: 'center',
              render: (_, entry) => entry.paid_by ?? <Text type="secondary">-</Text>,
            },
            {
              title: 'الإيصال',
              key: 'receipt',
              align: 'center',
              render: (_, entry) => (
                <TypographyLink onClick={() => handlePaymentInvoiceClick(entry.id)}>{entry.description}</TypographyLink>
              ),
            },
            {
              title: '',
              key: 'cancel',
              align: 'center',
              render: (_, entry) =>
                canCancelPayment(entry) ? (
                  <Button
                    size="small"
                    danger
                    icon={<UndoOutlined />}
                    loading={cancellingPaymentId === entry.id}
                    onClick={() => handleCancelPayment(entry)}
                  >
                    إلغاء السداد
                  </Button>
                ) : null,
            },
          ]}
        />
      </Modal>
      {modalContextHolder}

      <style>{`
        .ledger-row-service > td { background-color: #e6f4ff !important; }
      `}</style>
    </Flex>
  )
}
