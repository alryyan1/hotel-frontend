# Prompt: Shift System

Task: add a shift system to the hotel management system.

The project has two parts:

- Backend (Laravel 12 + Sanctum): `c:\xampp\htdocs\hotel-backend`
- Frontend (React 19 + TypeScript + Vite + Tailwind/shadcn + MUI): `c:\xampp\htdocs\hotel-frontend`

The UI language is Arabic (RTL), so all user-facing text must be in Arabic. Follow the existing code style and naming conventions.

## Business rules

1. Only one shift can be open in the hotel at any time. It is a single hotel-wide shift, not one per user.
2. Shifts are opened and closed manually, with no fixed times.
3. A new shift cannot be opened until the current one is closed.
4. There is no opening float: the cash drawer starts empty (zero) at every shift.
5. An open shift is required to record any financial operation. Admin users (`is_admin`) are exempt from this rule.
6. Each shift is calculated completely separately from the others.
7. Within a shift, every financial operation is recorded under the user who created it.
   - A regular user sees only their own revenue in the shift.
   - An admin sees the shift totals, with a breakdown per user.
8. Any authorized user can open a shift when none is open. Only the user who opened the shift or an admin can close it.

## Current state (verify this yourself before changing anything)

- The `transactions`, `costs` and `reservation_services` tables currently have no `user_id` column.
- Revenue is calculated in `AccountingController::getSummaryData()` with this formula:
  `credit + reservation_services − costs − refund`
  with a breakdown by payment method (`cash`, `bankak`, `Ocash`, `fawri`).
- `Transaction` records are created in several places, including `ReservationController`, `ReservationServiceController` and `TransactionController`.
- Frontend permissions are based on page paths: `ALL_PAGES` in `src/constants/pages.ts`, and the `PermissionGuard` component in `App.tsx`.

## Backend

1. A migration for a `shifts` table with:
   `id`, `opened_by` (user), `opened_at`, `closed_by` (nullable), `closed_at` (nullable),
   `expected_cash`, `actual_cash`, `difference`,
   `totals` (json: a snapshot of the summary at closing time), `status` (open/closed), `notes`, `timestamps`.
2. A migration that adds `user_id` and `shift_id` (nullable, foreign key, nullOnDelete) to the `transactions`, `costs` and `reservation_services` tables.
3. A `Shift` model with its relations, plus the matching relations on the other models.
4. A `BelongsToShift` trait that hooks into the `creating` event and fills in automatically:
   - `user_id = auth()->id()`
   - `shift_id` = the currently open shift

   Apply it to `Transaction`, `Cost` and `ReservationService`, so the existing `create` calls don't need to change.
5. A `ShiftService` with:
   - `current()`
   - `open(user)`: rejects the request if a shift is already open.
   - `summary(shift, ?userId)`
   - `close(shift, user, actualCash, notes)`

   Calculation:
   - `expected_cash` = cash revenue + cash services − cash refunds − cash expenses
   - `difference` = `actual_cash − expected_cash`
6. Refactor `getSummaryData()` to accept an optional filter (`shift_id` or `user_id`) instead of duplicating the logic. Existing reports must return exactly the same results as before.
7. An `EnsureOpenShift` middleware applied to the routes that create or update transactions, costs and services, and to reservation actions that create financial transactions. It returns `423` with an Arabic message: "يجب فتح وردية أولاً" ("A shift must be opened first"). Admins are exempt.
8. A `ShiftController` with these routes:

   | Method | Route | Description |
   |---|---|---|
   | GET | `shifts/current` | The open shift + a live summary (regular users: their own revenue only) |
   | POST | `shifts/open` | Open a shift |
   | POST | `shifts/{shift}/close` | Close the shift |
   | GET | `shifts` | List, filterable by date and status (regular users see only their own figures) |
   | GET | `shifts/{shift}` | Details + transactions + per-user breakdown (admins) |
   | GET | `shifts/{shift}/pdf` | PDF report using TCPDF, following the style of the existing PDF exports |

9. Existing records keep `shift_id = null` and appear in reports under "بدون وردية" ("No shift").

## Frontend

1. A `ShiftContext` that fetches `shifts/current` after login and exposes a `refresh` function.
2. A bar in `MainLayout` showing:
   - The shift status
   - When it was opened and who opened it
   - The current user's revenue in this shift
   - An open or close shift button, depending on the status
3. Opening a shift is a single confirmation button, with no input fields.
4. A `CloseShiftDialog` showing:
   - The summary by payment method
   - An input for the actual cash counted
   - The difference, calculated live while typing

   After closing, it offers printing the PDF report.
5. A `/shifts` page with:
   - A table of shifts
   - A details view for each shift
   - For admins: a table of each user's revenue within the shift
6. Add `/shifts` to `ALL_PAGES` under the "المالية" (Finance) group, and add the route in `App.tsx` wrapped in `PermissionGuard`.
7. In `src/api/axios.ts`: on a `423` response, show a toast with a button to open a shift.

## Check this first

`ReservationServiceController` creates a `Transaction`, and the summary also adds `reservation_services.amount` separately. Check whether services are being counted twice, and report back to me before using this formula for shifts.

## Delivery

- Show me the file plan first, and do not start implementing until I approve it.
- Write feature tests for:
  - Preventing a second shift from being opened
  - Automatically linking operations to the user and the shift
  - The per-user summary calculation
  - The difference calculation on close
  - Rejecting financial operations when no shift is open
- Do not commit unless I ask you to.
