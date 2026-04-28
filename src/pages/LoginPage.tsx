import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import apiClient from '../api/axios'
import { useAuth } from '../contexts/AuthContext'

interface LoginFormData {
  username: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hotelSettings, setHotelSettings] = useState({ official_name: 'فندق سيزر', logo_url: '/logo.png' })

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const { data } = await apiClient.get('/public/settings/hotel')
        if (data) {
          setHotelSettings({
            official_name: data.official_name || 'فندق سيزر',
            logo_url: data.logo_url || '/logo.png'
          })
        }
      } catch (err) {
        console.error('Failed to fetch public settings', err)
      }
    }
    fetchPublicSettings()
  }, [])

  const handleInputChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.username || !formData.password) {
      toast.error('الرجاء إدخال اسم المستخدم وكلمة المرور')
      return
    }

    setLoading(true)

    try {
      const { data } = await apiClient.post('/login', {
        username: formData.username,
        password: formData.password,
        device_name: 'web'
      })
      
      localStorage.setItem('token', data.token)
      if (data.user) setUser(data.user)

      window.dispatchEvent(new CustomEvent('auth-change'))

      // Redirect to first permitted page or dashboard
      const user = data.user
      const firstPage = user?.is_admin
        ? '/reservations-list'
        : (user?.permissions?.[0] ?? '/')
      navigate(firstPage, { replace: true })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'فشل تسجيل الدخول'
    //  toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    alert('اتصل بالمشرف لإعادة تعيين كلمة المرور')
  }

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  return (
    <div className="fixed inset-0 bg-background text-foreground overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,0,0,0.04)_0%,transparent_40%)]" />

      {/* Responsive grid: left brand panel (md+), right form */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Left brand/hero - hidden on mobile */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-10 lg:p-14">
          <div className="flex items-center justify-center">
            <img 
              src={hotelSettings.logo_url} 
              alt={hotelSettings.official_name} 
              className="h-32 w-32 lg:h-40 lg:w-40 rounded-xl bg-primary-foreground/20 object-contain p-3 shadow-md"
            />
          </div>
          <div>
            <div className="text-4xl lg:text-5xl font-extrabold leading-snug mb-4 text-center">
              {hotelSettings.official_name}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg text-center mx-auto">
              <div className="rounded-xl bg-primary-foreground/10 p-4 border border-primary-foreground/10">
                <div className="text-2xl mb-1">⚡</div>
                <div className="font-semibold">سرعة</div>
                <div className="text-sm opacity-80">تنفيذ المهام اليومية بسرعة وكفاءة.</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-4 border border-primary-foreground/10">
                <div className="text-2xl mb-1">🔒</div>
                <div className="font-semibold">أمان</div>
                <div className="text-sm opacity-80">حماية بياناتك بكامل العناية.</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-4 border border-primary-foreground/10">
                <div className="text-2xl mb-1">📊</div>
                <div className="font-semibold">تقارير</div>
                <div className="text-sm opacity-80">اطّلع على رؤية واضحة للأداء.</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-4 border border-primary-foreground/10">
                <div className="text-2xl mb-1">💬</div>
                <div className="font-semibold">دعم</div>
                <div className="text-sm opacity-80">فريقنا جاهز للمساعدة دائماً.</div>
              </div>
            </div>
          </div>
          <div className="text-xs opacity-80">© {new Date().getFullYear()} Hotel Admin</div>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center p-4 sm:p-6 md:p-8 h-full overflow-hidden">
          <div className="w-full max-w-md">
            <Card className="border-border/40 shadow-2xl backdrop-blur-xl bg-card/95">
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg md:w-20 md:h-20 p-2">
                  <img 
                    src={hotelSettings.logo_url} 
                    alt={hotelSettings.official_name} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    تسجيل الدخول
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base mt-2">
                    ادخل بيانات حسابك للمتابعة
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Username Field */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      اسم المستخدم
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={handleInputChange('username')}
                        required
                        autoComplete="off"
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                        placeholder="أدخل اسم المستخدم"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Password Field with toggle visibility */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        كلمة المرور
                      </Label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-primary hover:underline transition-colors"
                        tabIndex={-1}
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        required
                        autoComplete="off"
                        className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                        placeholder="أدخل كلمة المرور"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 text-base font-bold shadow-lg hover:shadow-xl transition-all mt-4 text-primary-foreground"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        جارٍ تسجيل الدخول...
                      </div>
                    ) : (
                      <>
                        <LogIn className="size-4 mr-2" />
                        تسجيل الدخول
                      </>
                    )}
                  </Button>

                  {/* Mobile-only footer */}
                  <div className="md:hidden text-center pt-4 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} Hotel Admin</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
