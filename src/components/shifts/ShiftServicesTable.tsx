import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, type ShiftServiceBreakdown } from "@/api/shifts";

/** Settled services grouped by service, with SDG and USD kept in separate columns. */
export default function ShiftServicesTable({ services }: { services: ShiftServiceBreakdown[] }) {
  const sum = (key: "count" | "quantity" | "total_sdg" | "total_usd") =>
    services.reduce((total, s) => total + Number(s[key] ?? 0), 0);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right">الخدمة</TableHead>
            <TableHead className="text-right">عدد الطلبات</TableHead>
            <TableHead className="text-right">الكمية</TableHead>
            <TableHead className="text-right">جنيه (SDG)</TableHead>
            <TableHead className="text-right">دولار (USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                لا توجد خدمات مدفوعة
              </TableCell>
            </TableRow>
          )}
          {services.map((s) => (
            <TableRow key={s.service_id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="tabular-nums">{s.count}</TableCell>
              <TableCell className="tabular-nums">{s.quantity}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(s.total_sdg)}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(s.total_usd)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {services.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell>الإجمالي</TableCell>
              <TableCell className="tabular-nums">{sum("count")}</TableCell>
              <TableCell className="tabular-nums">{sum("quantity")}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(sum("total_sdg"))}</TableCell>
              <TableCell className="tabular-nums">{formatMoney(sum("total_usd"))}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
