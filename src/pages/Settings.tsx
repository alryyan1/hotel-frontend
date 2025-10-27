import { useEffect, useState } from 'react'
import { Upload, Save } from 'lucide-react'
import apiClient from '../api/axios'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

export default function Settings() {
  const [form, setForm] = useState({
    official_name: '', trade_name: '', address_line: '', city: '', postal_code: '', country: '',
    phone: '', email: '', website: '', check_in_time: '', check_out_time: '', cancellation_policy: ''
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get('/settings/hotel')
        if (data) {
          setForm({
            official_name: data.official_name || '',
            trade_name: data.trade_name || '',
            address_line: data.address_line || '',
            city: data.city || '',
            postal_code: data.postal_code || '',
            country: data.country || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            check_in_time: data.check_in_time || '',
            check_out_time: data.check_out_time || '',
            cancellation_policy: data.cancellation_policy || '',
          })
          if (data.logo_path) {
            setLogoPreview(`${import.meta.env.VITE_API_BASE}/storage/${data.logo_path}`)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''))
      if (logoFile) fd.append('logo', logoFile)
      const { data } = await apiClient.post('/settings/hotel', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess('تم حفظ الإعدادات بنجاح')
      if (data.logo_path) setLogoPreview(`${import.meta.env.VITE_API_BASE}/storage/${data.logo_path}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'فشل الحفظ')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إعدادات الفندق"
        description="تحديث معلومات الفندق والشعار وسياسات الحجز"
        icon="⚙️"
      />

      {error && <Alert variant="destructive" className="shadow-md"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="shadow-md border-green-200 bg-green-50"><AlertDescription className="text-green-700 font-medium">{success}</AlertDescription></Alert>}

      <Card className="border-border/40 shadow-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الاسم الرسمي *</Label>
                <Input 
                  value={form.official_name} 
                  onChange={(e) => updateField('official_name', e.target.value)} 
                  required 
                />
              </div>
              <div>
                <Label>الاسم التجاري</Label>
                <Input 
                  value={form.trade_name} 
                  onChange={(e) => updateField('trade_name', e.target.value)} 
                />
              </div>
            </div>

            <div>
              <Label>العنوان</Label>
              <Input 
                value={form.address_line} 
                onChange={(e) => updateField('address_line', e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>المدينة</Label>
                <Input 
                  value={form.city} 
                  onChange={(e) => updateField('city', e.target.value)} 
                />
              </div>
              <div>
                <Label>الرمز البريدي</Label>
                <Input 
                  value={form.postal_code} 
                  onChange={(e) => updateField('postal_code', e.target.value)} 
                />
              </div>
              <div>
                <Label>الدولة</Label>
                <Input 
                  value={form.country} 
                  onChange={(e) => updateField('country', e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>الهاتف</Label>
                <Input 
                  value={form.phone} 
                  onChange={(e) => updateField('phone', e.target.value)} 
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input 
                  type="email"
                  value={form.email} 
                  onChange={(e) => updateField('email', e.target.value)} 
                />
              </div>
              <div>
                <Label>الموقع الإلكتروني</Label>
                <Input 
                  value={form.website} 
                  onChange={(e) => updateField('website', e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>وقت تسجيل الدخول</Label>
                <Input 
                  type="time"
                  value={form.check_in_time} 
                  onChange={(e) => updateField('check_in_time', e.target.value)} 
                />
              </div>
              <div>
                <Label>وقت تسجيل الخروج</Label>
                <Input 
                  type="time"
                  value={form.check_out_time} 
                  onChange={(e) => updateField('check_out_time', e.target.value)} 
                />
              </div>
            </div>

            <div>
              <Label>سياسة الإلغاء</Label>
              <Textarea 
                value={form.cancellation_policy} 
                onChange={(e) => updateField('cancellation_policy', e.target.value)} 
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Label>الشعار</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="size-4 mr-2" />
                    رفع الشعار
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </div>
              </div>
              <div>
                {logoPreview && (
                  <div className="flex items-center gap-2">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="w-16 h-16 object-cover rounded-lg border shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <Button type="submit" disabled={loading} className="shadow-md">
                <Save className="size-4 mr-2" />
                {loading ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
