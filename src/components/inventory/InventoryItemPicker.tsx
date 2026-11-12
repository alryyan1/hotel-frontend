import { useMemo, useState } from 'react'
import { ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface InventoryItemPickerProps {
  inventory: any[]
  onPick: (item: any) => void
  placeholder: string
}

/** Searchable list of inventory items; picking one hands it to `onPick` and resets. */
export default function InventoryItemPicker({ inventory, onPick, placeholder }: InventoryItemPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? inventory.filter((item: any) => (item.name || '').toLowerCase().includes(q)) : inventory
  }, [inventory, query])

  const pick = (item: any) => {
    onPick(item)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setQuery('') }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal text-muted-foreground">
          <span className="truncate">{placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent dir="rtl" align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="h-8 ps-8"
            placeholder="ابحث عن عنصر..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches.length > 0) {
                e.preventDefault()
                pick(matches[0])
              }
            }}
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">لا توجد عناصر</div>
          ) : (
            matches.map((item: any) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-start text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <span className="truncate">{item.name}</span>
                {item.category?.name && <span className="shrink-0 text-xs text-muted-foreground">{item.category.name}</span>}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
