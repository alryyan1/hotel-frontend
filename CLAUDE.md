# Hotel Frontend — Page Standards

This repo currently mixes three UI libraries (MUI, antd, shadcn/ui+Tailwind) because pages
were built at different times. **Going forward, shadcn/ui + Tailwind is the standard** for
any page that is newly built or substantially reworked. Don't introduce new MUI usage.
Existing MUI/antd pages are migrated opportunistically when touched, not all at once.

## Component library
- Use the existing kit in `src/components/ui/*` (Button, Card, Input, Label, Dialog, Select,
  Table, Skeleton, etc.) + Tailwind utility classes for layout and spacing.
- Icons: `lucide-react` only (no `@mui/icons-material`, no `@ant-design/icons` on new pages).
- `antd` is still acceptable only for the specific heavy widgets already relied on elsewhere
  (e.g. complex date pickers, existing Table-heavy pages) — don't reach for it on new pages.

## Feedback / errors
- All user feedback goes through `sonner`'s `toast` (`toast.success/error/info`).
- Never use `alert()`, `window.confirm()`, or `window.prompt()`.
- `apiClient`'s response interceptor (`src/api/axios.ts`) already toasts on API errors —
  don't add a second error toast in the `catch` block for the same request.

## Layout
- Dashboard-style pages: `PageHeader` (`@/components/ui/page-header`) banner at the top.
- Full-screen pages (auth, public booking): centered `Card` in a `min-h-screen flex` wrapper.
- Mobile-first; verify down to ~360px wide using Tailwind breakpoints (`sm`/`md`/`lg`).

## Theming
- Use the CSS variables already defined in `src/index.css` (`bg-primary`, `text-foreground`,
  `text-muted-foreground`, `bg-card`, `border-border`, `bg-destructive`, etc.) via Tailwind
  classes. Never hardcode hex/rgb colors in a page.
- Font (Tajawal) is inherited globally — don't override `font-family` per page.

## RTL / LTR
- The whole app is RTL (`<html dir="rtl" lang="ar">`, antd `ConfigProvider` RTL). Pages are
  RTL by default.
- Only wrap a specific sub-tree in `dir="ltr"` when it genuinely needs it (e.g. a
  username/password form). Don't wrap it in a MUI LTR theme/emotion cache anymore — a plain
  `dir="ltr"` on the container is enough with Tailwind.

## Loading states
- Inline spinner: `<Loader2 className="animate-spin" />` from lucide.
- Skeleton loaders: `<Skeleton>` from `@/components/ui/skeleton`.
- Avoid MUI's `CircularProgress`.

## Forms
- `Input` + `Label` from the shadcn kit. Field errors render as
  `text-destructive text-xs` helper text under the field, not MUI's `helperText` prop.
- Buttons: shadcn `<Button variant="..." size="...">`. shadcn's `Button` has no built-in
  `loading` prop (unlike MUI) — disable the button and swap in a `Loader2` spinner manually
  while a request is in flight.

## Page file structure
- Default-exported function component in `src/pages/<Name>.tsx`.
- State hooks at the top, data fetching in `useEffect` via `apiClient`.
- Arabic user-facing copy, consistent with the rest of the app.
