import { useEffect, useState } from 'react'
import { Box, Paper, Typography, Grid, TextField, Button, Alert, Avatar } from '@mui/material'
import apiClient from '../api/axios'

export default function Settings() {
  const [form, setForm] = useState({
    official_name: '', trade_name: '', address_line: '', city: '', postal_code: '', country: '',
    phone: '', email: '', website: '', check_in_time: '', check_out_time: '', cancellation_policy: ''
  })
  const [logoFile, setLogoFile] = useState(null)
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

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
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
      setSuccess('Saved successfully')
      if (data.logo_path) setLogoPreview(`${import.meta.env.VITE_API_BASE}/storage/${data.logo_path}`)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>إعدادات الفندق</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="الاسم الرسمي" value={form.official_name} onChange={e=>updateField('official_name', e.target.value)} required fullWidth />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="الاسم التجاري" value={form.trade_name} onChange={e=>updateField('trade_name', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="العنوان" value={form.address_line} onChange={e=>updateField('address_line', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="المدينة" value={form.city} onChange={e=>updateField('city', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="الرمز البريدي" value={form.postal_code} onChange={e=>updateField('postal_code', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="الدولة" value={form.country} onChange={e=>updateField('country', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="الهاتف" value={form.phone} onChange={e=>updateField('phone', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="البريد الإلكتروني" type="email" value={form.email} onChange={e=>updateField('email', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="الموقع الإلكتروني" value={form.website} onChange={e=>updateField('website', e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="وقت تسجيل الدخول" type="time" value={form.check_in_time} onChange={e=>updateField('check_in_time', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="وقت تسجيل الخروج" type="time" value={form.check_out_time} onChange={e=>updateField('check_out_time', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="سياسة الإلغاء" value={form.cancellation_policy} onChange={e=>updateField('cancellation_policy', e.target.value)} fullWidth multiline minRows={3} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button component="label" variant="outlined">
              رفع الشعار
              <input hidden type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; setLogoFile(f||null); if(f){setLogoPreview(URL.createObjectURL(f))}}} />
            </Button>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {logoPreview && <Avatar src={logoPreview} variant="rounded" sx={{ width: 64, height: 64 }} />}
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}</Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  )
}


