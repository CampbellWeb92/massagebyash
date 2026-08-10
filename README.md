# Massage by Ashleigh — Website + Schedule App

GitHub Pages-ready package.

## Public website
`index.html` is at the repository root. Publish GitHub Pages from `main` → `/ (root)`.

The booking form uses a four-step flow:
1. Details
2. Service
3. Appointment
4. Confirm

It retains live Supabase availability, service-duration closing-time protection, pending request saving, and WhatsApp handoff.

## Schedule app
The latest synced admin Schedule App is in `/schedule/` and includes pending-booking alerts and sound controls.

Open it at `/schedule/` on the same domain.

## Database
No new SQL changes are required for the professional booking-form interface. If the full booking-system Supabase upgrade has already been run, do not run it again just for this UI update.

See `/setup/` and `/schedule/` for the existing database/setup documentation.
