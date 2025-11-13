import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface CreatePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paymentForm: {
    method: string
    amount: string
    notes: string
    reference: string
  }
  onPaymentFormChange: (form: {
    method: string
    amount: string
    notes: string
    reference: string
  }) => void
  onCreatePayment: () => void
  loading: boolean
}

export default function CreatePaymentDialog({
  open,
  onOpenChange,
  paymentForm,
  onPaymentFormChange,
  onCreatePayment,
  loading
}: CreatePaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة دفعة</DialogTitle>
          <DialogDescription>تسجيل دفعة جديدة للعميل</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-3 mt-1">
          <div className="col-span-12 md:col-span-6">
            <Label>طريقة الدفع</Label>
            <Select 
              value={paymentForm.method} 
              onValueChange={(v: string) => onPaymentFormChange({ ...paymentForm, method: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقدي</SelectItem>
                <SelectItem value="bankak">بنكاك</SelectItem>
                <SelectItem value="Ocash">أوكاش</SelectItem>
                <SelectItem value="fawri">فوري</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label>المبلغ</Label>
            <Input 
              type="number"
              step="0.01"
              min="0.01"
              value={paymentForm.amount} 
              onChange={(e) => onPaymentFormChange({ ...paymentForm, amount: e.target.value })} 
              placeholder="0.00"
            />
          </div>
          <div className="col-span-12 md:col-span-6">
            <Label>الرقم المرجعي (اختياري)</Label>
            <Input 
              value={paymentForm.reference} 
              onChange={(e) => onPaymentFormChange({ ...paymentForm, reference: e.target.value })} 
              placeholder="سيتم إنشاؤه تلقائياً"
            />
          </div>
          <div className="col-span-12">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea 
              value={paymentForm.notes} 
              onChange={(e) => onPaymentFormChange({ ...paymentForm, notes: e.target.value })} 
              placeholder="ملاحظات إضافية..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onCreatePayment} disabled={loading || !paymentForm.method || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}>
            {loading ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

