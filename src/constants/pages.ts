export interface PageDef {
  path: string
  label: string
  group: string
}

export const ALL_PAGES: PageDef[] = [
  { path: '/',                      label: 'لوحة التحكم',      group: 'عام' },
  { path: '/reservations',          label: 'إنشاء حجز',        group: 'الحجوزات' },
  { path: '/reservations-list',     label: 'قائمة الحجوزات',   group: 'الحجوزات' },
  { path: '/customers',             label: 'العملاء',           group: 'العملاء' },
  { path: '/rooms',                 label: 'الغرف',             group: 'إدارة الغرف' },
  { path: '/room-types',            label: 'أنواع الغرف',       group: 'إدارة الغرف' },
  { path: '/floors',                label: 'الطوابق',           group: 'إدارة الغرف' },
  { path: '/room-statuses',         label: 'حالات الغرف',       group: 'إدارة الغرف' },
  { path: '/costs',                 label: 'المصاريف',          group: 'المالية' },
  { path: '/accountant',            label: 'الحسابات',          group: 'المالية' },
  { path: '/monthly-report',        label: 'التقرير الشهري',    group: 'المالية' },
  { path: '/inventory',             label: 'المخزون',           group: 'المخزون' },
  { path: '/inventory-orders',      label: 'طلبات المخزون',     group: 'المخزون' },
  { path: '/inventory-receipts',    label: 'واردات المخزون',    group: 'المخزون' },
  { path: '/cleaning-notifications',label: 'تنبيهات النظافة',   group: 'العمليات' },
  { path: '/users',                 label: 'المستخدمين',        group: 'الإدارة' },
  { path: '/settings',              label: 'الإعدادات',         group: 'الإدارة' },
]

export const PAGES_BY_GROUP: Record<string, PageDef[]> = ALL_PAGES.reduce(
  (acc, page) => {
    if (!acc[page.group]) acc[page.group] = []
    acc[page.group].push(page)
    return acc
  },
  {} as Record<string, PageDef[]>
)
