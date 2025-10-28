import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: string
  action?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  icon = "📊",
  action,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-2 shadow-lg shadow-primary/20 mb-2",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="opacity-90 text-sm md:text-base font-medium">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {action}
          <div className="text-4xl md:text-6xl opacity-70 select-none">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}


