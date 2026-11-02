import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<LoginFormData>({ username: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const nextErrors: Partial<LoginFormData> = {}
    if (!form.username) nextErrors.username = 'الرجاء إدخال اسم المستخدم'
    if (!form.password) nextErrors.password = 'الرجاء إدخال كلمة المرور'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)

    try {
      const { data } = await apiClient.post('/login', {
        username: form.username,
        password: form.password,
        device_name: 'web',
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
    } catch {
      // Error toast is already shown by the apiClient response interceptor
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    toast.info('اتصل بالمشرف لإعادة تعيين كلمة المرور')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-[400px]">
        <CardContent className="px-6 flex flex-col items-center gap-2 pb-2">
          <img src="/logo.png" alt="" className="w-28 h-28 object-contain" />
          <div className="text-center">
            <h1 className="text-lg font-bold">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">
              ادخل بيانات حسابك للمتابعة
            </p>
          </div>
        </CardContent>

        <CardContent className="px-6">
          <form onSubmit={handleSubmit} noValidate dir="ltr" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">اسم المستخدم</Label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="off"
                  autoFocus
                  disabled={loading}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  aria-invalid={!!errors.username}
                  className="ps-9"
                />
              </div>
              {errors.username && (
                <p className="text-destructive text-xs">{errors.username}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  autoComplete="off"
                  disabled={loading}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  aria-invalid={!!errors.password}
                  className="ps-9 pe-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs">{errors.password}</p>
              )}
              <button
                type="button"
                onClick={handleForgotPassword}
                className="self-start text-xs text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
