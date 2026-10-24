import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, methodLabels, type ShiftSummary } from "@/api/shifts";

/** Revenue / services / expenses / refunds per payment method, mirroring the net-breakdown report. */
export default function ShiftMethodTable({ summary }: { summary: ShiftSummary }) {
  const methods = Array.from(
    new Set([
      ...Object.keys(summary.revenue_by_method ?? {}),
      ...Object.keys(summary.services_by_method ?? {}),
      ...Object.keys(summary.expenses_by_method ?? {}),
      ...Object.keys(summary.refunds_by_method ?? {}),
    ]),
  );

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">طريقة الدفع</TableHead>
            <TableHead className="text-right">مدفوعات الحجوزات</TableHead>
            <TableHead className="text-right">الخدمات</TableHead>
            <TableHead className="text-right">المصروف</TableHead>
            <TableHead className="text-right">مسترجع</TableHead>
            <TableHead className="text-right">الصافي</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {methods.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                لا توجد عمليات بعد
              </TableCell>
            </TableRow>
          )}
          {methods.map((method) => {
            const rev = summary.revenue_by_method?.[method] ?? 0;
            const srv = summary.services_by_method?.[method] ?? 0;
            const exp = summary.expenses_by_method?.[method] ?? 0;
            const ref = summary.refunds_by_method?.[method] ?? 0;
            return (
              <TableRow key={method}>
                <TableCell>{methodLabels[method] ?? method}</TableCell>
                <TableCell>{formatMoney(rev)}</TableCell>
                <TableCell>{formatMoney(srv)}</TableCell>
                <TableCell>{formatMoney(exp)}</TableCell>
                <TableCell>{formatMoney(ref)}</TableCell>
                <TableCell className="font-semibold">{formatMoney(rev + srv - exp - ref)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>الإجمالي</TableCell>
            <TableCell>{formatMoney(summary.total_revenue)}</TableCell>
            <TableCell>{formatMoney(summary.total_service_revenue)}</TableCell>
            <TableCell>{formatMoney(summary.total_expenses)}</TableCell>
            <TableCell>{formatMoney(summary.total_refunds)}</TableCell>
            <TableCell>{formatMoney(summary.net_profit)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
