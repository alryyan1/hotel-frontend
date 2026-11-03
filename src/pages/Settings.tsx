import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import { Card, Tabs, Input, Button, Switch, Upload, Modal, Typography, Row, Col, Space, Divider } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import {
  UploadOutlined,
  SaveOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  BankOutlined,
  PictureOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { toast } from 'sonner'
import WhatsAppNumberList from '@/components/settings/WhatsAppNumberList'

const { Text, Title } = Typography

export default function Settings() {
  const [form, setForm] = useState({
    official_name: '',
    address_line: '',
    city: '',
    phone: '',
    phone_2: '',
    email: '',
    bank_name_1: '',
    bank_account_number_1: '',
    bank_account_name_1: '',
    bank_name_2: '',
    bank_account_number_2: '',
    bank_account_name_2: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [stampFile, setStampFile] = useState<File | null>(null)
  const [stampPreview, setStampPreview] = useState('')
  const [headerFile, setHeaderFile] = useState<File | null>(null)
  const [headerPreview, setHeaderPreview] = useState('')
  const [footerFile, setFooterFile] = useState<File | null>(null)
  const [footerPreview, setFooterPreview] = useState('')
  const [e_stampFile, setEStampFile] = useState<File | null>(null)
  const [e_stampPreview, setEStampPreview] = useState('')
  const [smsEnabled, setSmsEnabled] = useState(true)
  const [whatsappEnabled, setWhatsappEnabled] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get('/settings/hotel')
        if (data) {
          setForm({
            official_name: data.official_name || '',
            address_line: data.address_line || '',
            city: data.city || '',
            phone: data.phone || '',
            phone_2: data.phone_2 || '',
            email: data.email || '',
            bank_name_1: data.bank_name_1 || '',
            bank_account_number_1: data.bank_account_number_1 || '',
            bank_account_name_1: data.bank_account_name_1 || '',
            bank_name_2: data.bank_name_2 || '',
            bank_account_number_2: data.bank_account_number_2 || '',
            bank_account_name_2: data.bank_account_name_2 || '',
          })
          setSmsEnabled(data.sms_notifications_enabled ?? true)
          setWhatsappEnabled(data.whatsapp_notifications_enabled ?? true)
          if (data.logo_url) {
            setLogoPreview(data.logo_url)
          } else if (data.logo_path) {
            const baseUrl = window.location.origin.replace(':5173', '') + '/hotel-backend/public'
            setLogoPreview(`${baseUrl}/storage/${data.logo_path}`)
          }
          if (data.stamp_url) {
            setStampPreview(data.stamp_url)
          } else if (data.stamp_path) {
            const baseUrl = window.location.origin.replace(':5173', '') + '/hotel-backend/public'
            setStampPreview(`${baseUrl}/storage/${data.stamp_path}`)
          }
          if (data.header_url) {
            setHeaderPreview(data.header_url)
          } else if (data.header_path) {
            const baseUrl = window.location.origin.replace(':5173', '') + '/hotel-backend/public'
            setHeaderPreview(`${baseUrl}/storage/${data.header_path}`)
          }
          if (data.footer_url) {
            setFooterPreview(data.footer_url)
          } else if (data.footer_path) {
            const baseUrl = window.location.origin.replace(':5173', '') + '/hotel-backend/public'
            setFooterPreview(`${baseUrl}/storage/${data.footer_path}`)
          }
          if (data.e_stamp_url) {
            setEStampPreview(data.e_stamp_url)
          } else if (data.e_stamp_path) {
            const baseUrl = window.location.origin.replace(':5173', '') + '/hotel-backend/public'
            setEStampPreview(`${baseUrl}/storage/${data.e_stamp_path}`)
          }
        }
      } catch (e) {
        // ignore if first time
      }
    })()
  }, [])

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''))
      fd.append('sms_notifications_enabled', smsEnabled ? '1' : '0')
      fd.append('whatsapp_notifications_enabled', whatsappEnabled ? '1' : '0')
      if (logoFile) fd.append('logo', logoFile)
      if (stampFile) fd.append('stamp', stampFile)
      if (headerFile) fd.append('header', headerFile)
      if (footerFile) fd.append('footer', footerFile)
      if (e_stampFile) fd.append('e_stamp', e_stampFile)
      const { data } = await apiClient.post('/settings/hotel', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('تم حفظ الإعدادات بنجاح')
      setSmsEnabled(data.sms_notifications_enabled ?? smsEnabled)
      setWhatsappEnabled(data.whatsapp_notifications_enabled ?? whatsappEnabled)
      const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
      if (data.logo_url) setLogoPreview(data.logo_url)
      else if (data.logo_path) setLogoPreview(`${baseUrl}/storage/${data.logo_path}`)
      if (data.stamp_url) setStampPreview(data.stamp_url)
      else if (data.stamp_path) setStampPreview(`${baseUrl}/storage/${data.stamp_path}`)
      if (data.header_url) setHeaderPreview(data.header_url)
      else if (data.header_path) setHeaderPreview(`${baseUrl}/storage/${data.header_path}`)
      if (data.footer_url) setFooterPreview(data.footer_url)
      else if (data.footer_path) setFooterPreview(`${baseUrl}/storage/${data.footer_path}`)
      if (data.e_stamp_url) setEStampPreview(data.e_stamp_url)
      else if (data.e_stamp_path) setEStampPreview(`${baseUrl}/storage/${data.e_stamp_path}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'فشل الحفظ')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteImage(type: 'logo' | 'stamp' | 'header' | 'footer' | 'e_stamp') {
    try {
      setLoading(true)
      await apiClient.delete('/settings/hotel/image', { data: { type } })
      toast.success('تم حذف الصورة بنجاح')
      if (type === 'logo') { setLogoPreview(''); setLogoFile(null) }
      else if (type === 'stamp') { setStampPreview(''); setStampFile(null) }
      else if (type === 'header') { setHeaderPreview(''); setHeaderFile(null) }
      else if (type === 'footer') { setFooterPreview(''); setFooterFile(null) }
      else if (type === 'e_stamp') { setEStampPreview(''); setEStampFile(null) }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'فشل حذف الصورة')
    } finally {
      setLoading(false)
    }
  }

  function confirmDeleteImage(type: 'logo' | 'stamp' | 'header' | 'footer' | 'e_stamp') {
    Modal.confirm({
      title: 'هل أنت متأكد من حذف هذه الصورة؟',
      okText: 'حذف',
      okType: 'danger',
      cancelText: 'إلغاء',
      onOk: () => handleDeleteImage(type),
    })
  }

  const toFileList = (url: string): UploadFile[] =>
    url ? [{ uid: '-1', name: 'image', status: 'done', url }] : []

  function ImageUpload({
    label,
    preview,
    onSelect,
    onRemove,
  }: {
    label: string
    preview: string
    onSelect: (file: File) => void
    onRemove: () => void
  }) {
    return (
      <div>
        <Text style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{label}</Text>
        <Upload
          listType="picture-card"
          fileList={toFileList(preview)}
          beforeUpload={(file) => { onSelect(file); return false }}
          onRemove={() => { onRemove(); return false }}
          maxCount={1}
        >
          {!preview && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8, fontSize: 12 }}>رفع</div>
            </div>
          )}
        </Upload>
      </div>
    )
  }

  const basicTab = (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>المعلومات الأساسية</Text>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>الاسم الرسمي *</Text>
            <Input value={form.official_name} onChange={(e) => updateField('official_name', e.target.value)} />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>العنوان</Text>
            <Input value={form.address_line} onChange={(e) => updateField('address_line', e.target.value)} />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>المدينة</Text>
            <Input value={form.city} onChange={(e) => updateField('city', e.target.value)} />
          </div>
        </Space>
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>معلومات الاتصال</Text>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>الهاتف</Text>
            <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>الهاتف 2</Text>
            <Input value={form.phone_2} onChange={(e) => updateField('phone_2', e.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>البريد الإلكتروني</Text>
            <Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
          </Col>
        </Row>
      </div>
    </Space>
  )

  const bankTab = (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>الحساب الأول</Text>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>اسم البنك</Text>
            <Input value={form.bank_name_1} onChange={(e) => updateField('bank_name_1', e.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>رقم الحساب</Text>
            <Input value={form.bank_account_number_1} onChange={(e) => updateField('bank_account_number_1', e.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>اسم الحساب</Text>
            <Input value={form.bank_account_name_1} onChange={(e) => updateField('bank_account_name_1', e.target.value)} />
          </Col>
        </Row>
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>الحساب الثاني</Text>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>اسم البنك</Text>
            <Input value={form.bank_name_2} onChange={(e) => updateField('bank_name_2', e.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>رقم الحساب</Text>
            <Input value={form.bank_account_number_2} onChange={(e) => updateField('bank_account_number_2', e.target.value)} />
          </Col>
          <Col xs={24} md={8}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>اسم الحساب</Text>
            <Input value={form.bank_account_name_2} onChange={(e) => updateField('bank_account_name_2', e.target.value)} />
          </Col>
        </Row>
      </div>
    </Space>
  )

  const imagesTab = (
    <Space orientation="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <ImageUpload
            label="الشعار"
            preview={logoPreview}
            onSelect={(file) => { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) }}
            onRemove={() => confirmDeleteImage('logo')}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <ImageUpload
            label="الختم"
            preview={stampPreview}
            onSelect={(file) => { setStampFile(file); setStampPreview(URL.createObjectURL(file)) }}
            onRemove={() => confirmDeleteImage('stamp')}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <ImageUpload
            label="الختم الإلكتروني"
            preview={e_stampPreview}
            onSelect={(file) => { setEStampFile(file); setEStampPreview(URL.createObjectURL(file)) }}
            onRemove={() => confirmDeleteImage('e_stamp')}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <ImageUpload
            label="الرأسية (Header)"
            preview={headerPreview}
            onSelect={(file) => { setHeaderFile(file); setHeaderPreview(URL.createObjectURL(file)) }}
            onRemove={() => confirmDeleteImage('header')}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <ImageUpload
            label="التذييل (Footer)"
            preview={footerPreview}
            onSelect={(file) => { setFooterFile(file); setFooterPreview(URL.createObjectURL(file)) }}
            onRemove={() => confirmDeleteImage('footer')}
          />
        </Col>
      </Row>
    </Space>
  )

  const notificationsTab = (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <div className="flex items-center justify-between max-w-md">
        <Text>رسائل SMS عند تأكيد الحجز</Text>
        <Switch checked={smsEnabled} onChange={setSmsEnabled} />
      </div>
      <div className="flex items-center justify-between max-w-md">
        <Text>رسائل واتساب عند تأكيد الحجز</Text>
        <Switch checked={whatsappEnabled} onChange={setWhatsappEnabled} />
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <div>
        <Text strong style={{ display: 'block', marginBottom: 4 }}>أرقام تنبيه إضافية عبر واتساب</Text>
        <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
          هذه الأرقام تُحفظ مباشرة ولا تحتاج الضغط على "حفظ الإعدادات"
        </Text>
        <Space orientation="vertical" size={20} style={{ width: '100%' }}>
          <WhatsAppNumberList
            event="confirmation"
            title="عند تأكيد الحجز"
            description="يستلم نفس رسالة تأكيد الحجز بجانب العميل"
          />
          <WhatsAppNumberList
            event="cancellation"
            title="عند إلغاء الحجز"
            description="يستلم نفس رسالة إلغاء الحجز بجانب العميل"
          />
          <WhatsAppNumberList
            event="cleaning"
            title="تنبيه النظافة عند تسجيل المغادرة"
            description="رسالة نظافة بالغرفة لكل غرفة عند تسجيل المغادرة"
          />
        </Space>
      </div>
    </Space>
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <Space align="center" size={10}>
        <SettingOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        <Title level={4} style={{ margin: 0 }}>إعدادات الفندق</Title>
      </Space>
      <Text type="secondary">تحديث معلومات الفندق والشعار والختم</Text>

      <Card>
        <Tabs
          items={[
            { key: 'basic', label: 'المعلومات الأساسية', icon: <InfoCircleOutlined />, children: basicTab },
            { key: 'bank', label: 'الحسابات البنكية', icon: <BankOutlined />, children: bankTab },
            { key: 'images', label: 'الشعار والصور', icon: <PictureOutlined />, children: imagesTab },
            { key: 'notifications', label: 'الإشعارات', icon: <BellOutlined />, children: notificationsTab },
          ]}
        />

        <div className="mt-4 pt-4 border-t border-border">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleSubmit}
            disabled={!form.official_name.trim()}
          >
            حفظ الإعدادات
          </Button>
        </div>
      </Card>
    </div>
  )
}
