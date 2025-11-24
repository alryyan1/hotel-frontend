import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-left"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid hsl(var(--border))',
        },
        success: {
          style: {
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#166534',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
          },
        },
        info: {
          style: {
            background: '#eff6ff',
            border: '1px solid #93c5fd',
            color: '#1e40af',
          },
        },
        warning: {
          style: {
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            color: '#92400e',
          },
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
