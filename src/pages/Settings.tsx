import { useEffect, useState } from 'react'
import apiClient from '../api/axios'
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material'
import { Upload as UploadIcon, Save as SaveIcon } from '@mui/icons-material'
import { toast } from 'sonner'

export default function Settings() {
  const [form, setForm] = useState({
    official_name: '',
    address_line: '',
    city: '',
    phone: '',
    phone_2: '',
    email: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [stampFile, setStampFile] = useState<File | null>(null)
  const [stampPreview, setStampPreview] = useState('')
  const [headerFile, setHeaderFile] = useState<File | null>(null)
  const [headerPreview, setHeaderPreview] = useState('')
  const [footerFile, setFooterFile] = useState<File | null>(null)
  const [footerPreview, setFooterPreview] = useState('')
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
          })
          if (data.logo_url) {
            setLogoPreview(data.logo_url)
          } else if (data.logo_path) {
            // Fallback: construct URL if backend doesn't provide logo_url
            const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
            setLogoPreview(`${baseUrl}/storage/${data.logo_path}`)
          }
          if (data.stamp_url) {
            setStampPreview(data.stamp_url)
          } else if (data.stamp_path) {
            // Fallback: construct URL if backend doesn't provide stamp_url
            const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
            setStampPreview(`${baseUrl}/storage/${data.stamp_path}`)
          }
          if (data.header_url) {
            setHeaderPreview(data.header_url)
          } else if (data.header_path) {
            // Fallback: construct URL if backend doesn't provide header_url
            const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
            setHeaderPreview(`${baseUrl}/storage/${data.header_path}`)
          }
          if (data.footer_url) {
            setFooterPreview(data.footer_url)
          } else if (data.footer_path) {
            // Fallback: construct URL if backend doesn't provide footer_url
            const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
            setFooterPreview(`${baseUrl}/storage/${data.footer_path}`)
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
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''))
      if (logoFile) fd.append('logo', logoFile)
      if (stampFile) fd.append('stamp', stampFile)
      if (headerFile) fd.append('header', headerFile)
      if (footerFile) fd.append('footer', footerFile)
      const { data } = await apiClient.post('/settings/hotel', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('تم حفظ الإعدادات بنجاح')
      if (data.logo_url) {
        setLogoPreview(data.logo_url)
      } else if (data.logo_path) {
        // Fallback: construct URL if backend doesn't provide logo_url
        const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
        setLogoPreview(`${baseUrl}/storage/${data.logo_path}`)
      }
      if (data.stamp_url) {
        setStampPreview(data.stamp_url)
      } else if (data.stamp_path) {
        // Fallback: construct URL if backend doesn't provide stamp_url
        const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
        setStampPreview(`${baseUrl}/storage/${data.stamp_path}`)
      }
      if (data.header_url) {
        setHeaderPreview(data.header_url)
      } else if (data.header_path) {
        // Fallback: construct URL if backend doesn't provide header_url
        const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
        setHeaderPreview(`${baseUrl}/storage/${data.header_path}`)
      }
      if (data.footer_url) {
        setFooterPreview(data.footer_url)
      } else if (data.footer_path) {
        // Fallback: construct URL if backend doesn't provide footer_url
        const baseUrl = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://127.0.0.1/hotel-backend/public'
        setFooterPreview(`${baseUrl}/storage/${data.footer_path}`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'فشل الحفظ')
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

  const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStampFile(file)
      setStampPreview(URL.createObjectURL(file))
    }
  }

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setHeaderFile(file)
      setHeaderPreview(URL.createObjectURL(file))
    }
  }

  const handleFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFooterFile(file)
      setFooterPreview(URL.createObjectURL(file))
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          ⚙️ إعدادات الفندق
        </Typography>
        <Typography variant="body2" color="text.secondary">
          تحديث معلومات الفندق والشعار والختم
        </Typography>
      </Box>

      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ pt: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Basic Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  المعلومات الأساسية
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="الاسم الرسمي"
                    value={form.official_name}
                    onChange={(e) => updateField('official_name', e.target.value)}
                    required
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="العنوان"
                    value={form.address_line}
                    onChange={(e) => updateField('address_line', e.target.value)}
                    size="small"
                  />
                  <TextField
                    fullWidth
                    label="المدينة"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    size="small"
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Contact Information Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  معلومات الاتصال
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="الهاتف"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="الهاتف 2"
                      value={form.phone_2}
                      onChange={(e) => updateField('phone_2', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="email"
                      label="البريد الإلكتروني"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Logo and Stamp Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  الشعار والختم
                </Typography>
                <Grid container spacing={3}>
                  {/* Logo Upload */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        الشعار
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                        >
                          رفع الشعار
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleLogoChange}
                          />
                        </Button>
                        {logoPreview && (
                          <Box
                            component="img"
                            src={logoPreview}
                            alt="Logo Preview"
                            sx={{
                              width: 64,
                              height: 64,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              boxShadow: 1,
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Stamp Upload */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        الختم
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                        >
                          رفع الختم
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleStampChange}
                          />
                        </Button>
                        {stampPreview && (
                          <Box
                            component="img"
                            src={stampPreview}
                            alt="Stamp Preview"
                            sx={{
                              width: 64,
                              height: 64,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              boxShadow: 1,
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Header and Footer Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  الرأسية والتذييل
                </Typography>
                <Grid container spacing={3}>
                  {/* Header Upload */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        الرأسية (Header)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                        >
                          رفع الرأسية
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleHeaderChange}
                          />
                        </Button>
                        {headerPreview && (
                          <Box
                            component="img"
                            src={headerPreview}
                            alt="Header Preview"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 150,
                              objectFit: 'contain',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              boxShadow: 1,
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Footer Upload */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        التذييل (Footer)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<UploadIcon />}
                          size="small"
                        >
                          رفع التذييل
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleFooterChange}
                          />
                        </Button>
                        {footerPreview && (
                          <Box
                            component="img"
                            src={footerPreview}
                            alt="Footer Preview"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 150,
                              objectFit: 'contain',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              boxShadow: 1,
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Submit Button */}
              <Box sx={{ pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
                  sx={{ boxShadow: 2 }}
                >
                  {loading ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
