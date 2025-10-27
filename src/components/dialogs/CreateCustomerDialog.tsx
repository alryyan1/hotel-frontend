import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerForm: {
    name: string
    phone: string
    national_id: string
    address: string
    date_of_birth: string
    gender: string
  }
  onCustomerFormChange: (form: {
    name: string
    phone: string
    national_id: string
    address: string
    date_of_birth: string
    gender: string
  }) => void
  onCreateCustomer: () => void
  loading: boolean
}

export default function CreateCustomerDialog({
  open,
  onOpenChange,
  customerForm,
  onCustomerFormChange,
  onCreateCustomer,
  loading
}: CreateCustomerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>عميل جديد</DialogTitle>
          <DialogDescription>إضافة عميل إلى قاعدة البيانات</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-3 mt-1">
          <div className="col-span-12">
            <Label>الاسم</Label>
            <Input 
              value={customerForm.name} 
              onChange={(e) => onCustomerFormChange({ ...customerForm, name: e.target.value })} 
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label>الهاتف</Label>
            <Input 
              value={customerForm.phone} 
              onChange={(e) => onCustomerFormChange({ ...customerForm, phone: e.target.value })} 
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label>الرقم الوطني</Label>
            <Input 
              value={customerForm.national_id} 
              onChange={(e) => onCustomerFormChange({ ...customerForm, national_id: e.target.value })} 
            />
          </div>
          <div className="col-span-12">
            <Label>العنوان</Label>
            <Input 
              value={customerForm.address} 
              onChange={(e) => onCustomerFormChange({ ...customerForm, address: e.target.value })} 
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label>تاريخ الميلاد</Label>
            <Input 
              type="date" 
              value={customerForm.date_of_birth} 
              onChange={(e) => onCustomerFormChange({ ...customerForm, date_of_birth: e.target.value })} 
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label>النوع</Label>
            <Select 
              value={customerForm.gender} 
              onValueChange={(v: string) => onCustomerFormChange({ ...customerForm, gender: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="غير محدد" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">ذكر</SelectItem>
                <SelectItem value="female">أنثى</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onCreateCustomer} disabled={loading}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
