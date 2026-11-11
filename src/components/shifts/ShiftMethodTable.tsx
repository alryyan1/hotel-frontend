import { DollarSign, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, methodLabels, netOf, usdOf, type ShiftSummary } from "@/api/shifts";

function CurrencyCard({
  icon: Icon,
  title,
  unit,
  reservations,
  services,
  total,
}: {
  icon: typeof Wallet;
  title: string;
  unit: string;
  reservations: number | undefined;
  services: number | undefined;
  total: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {title}
      </div>
      <dl className="divide-y text-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <dt className="text-muted-foreground">إيرادات الحجوزات</dt>
          <dd className="tabular-nums">{formatMoney(reservations)} {unit}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <dt className="text-muted-foreground">إيرادات الخدمات</dt>
          <dd className="tabular-nums">{formatMoney(services)} {unit}</dd>
        </div>
        <div className="flex items-center justify-between bg-primary/5 px-4 py-2.5">
          <dt className="font-semibold">الإجمالي</dt>
          <dd className="text-lg font-bold tabular-nums text-primary">{formatMoney(total)} {unit}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Shift revenue as two currency cards (SDG and USD are never summed together),
 * followed by both currencies broken down per payment method.
 */
export default function ShiftMethodTable({ summary }: { summary: ShiftSummary }) {
  const usdReservations = Number(summary.total_revenue_usd_cash ?? 0);
  const usdServices = Number(summary.total_service_revenue_usd ?? 0);
  const usdTotal = usdOf(summary);

  const methods = Array.from(
    new Set([
      ...Object.keys(summary.revenue_by_method ?? {}),
      ...Object.keys(summary.services_by_method ?? {}),
      // USD is only ever settled as cash, so dollars always land on the cash row
      ...(usdTotal > 0 ? ["cash"] : []),
    ]),
  );

  const usdCell = (method: string, value: number) =>
    method === "cash" ? formatMoney(value) : <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <CurrencyCard
          icon={Wallet}
          title="الجنيه السوداني (SDG)"
          unit="ج.س"
          reservations={summary.total_revenue}
          services={summary.total_service_revenue}
          total={netOf(summary)}
        />
        <CurrencyCard
          icon={DollarSign}
          title="الدولار (USD)"
          unit="$"
          reservations={usdReservations}
          services={usdServices}
          total={usdTotal}
        />
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">حسب طريقة الدفع</h3>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead rowSpan={2} className="border-e text-right align-middle">طريقة الدفع</TableHead>
                <TableHead colSpan={3} className="border-e text-center">الجنيه (ج.س)</TableHead>
                <TableHead colSpan={3} className="text-center">الدولار ($)</TableHead>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableHead className="text-right">الحجوزات</TableHead>
                <TableHead className="text-right">الخدمات</TableHead>
                <TableHead className="border-e text-right">الإجمالي</TableHead>
                <TableHead className="text-right">الحجوزات</TableHead>
                <TableHead className="text-right">الخدمات</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    لا توجد عمليات بعد
                  </TableCell>
                </TableRow>
              )}
              {methods.map((method) => {
                const rev = summary.revenue_by_method?.[method] ?? 0;
                const srv = summary.services_by_method?.[method] ?? 0;
                return (
                  <TableRow key={method}>
                    <TableCell className="border-e font-medium">{methodLabels[method] ?? method}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(rev)}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(srv)}</TableCell>
                    <TableCell className="border-e font-semibold tabular-nums">{formatMoney(rev + srv)}</TableCell>
                    <TableCell className="tabular-nums">{usdCell(method, usdReservations)}</TableCell>
                    <TableCell className="tabular-nums">{usdCell(method, usdServices)}</TableCell>
                    <TableCell className="font-semibold tabular-nums">{usdCell(method, usdTotal)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {methods.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell className="border-e">الإجمالي</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(summary.total_revenue)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(summary.total_service_revenue)}</TableCell>
                  <TableCell className="border-e tabular-nums">{formatMoney(netOf(summary))}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(usdReservations)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(usdServices)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(usdTotal)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </section>
    </div>
  );
}
