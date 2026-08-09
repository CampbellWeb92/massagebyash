# Massage by Ash Schedule - Full Booking Manager

This build shares one Supabase schedule with the public Massage by Ash website.

## First setup

Run `supabase-setup.sql` in the Supabase SQL Editor before deploying this build. It is the same migration as `SUPABASE-UPGRADE.sql` in the full package.

## Admin features

- Confirmed appointments with start/end ranges
- Configurable appointment buffer
- Manual time-range blocks
- Whole-day and individual-time blocks
- Custom hours for any individual date
- Public client notices
- Public holiday overrides
- Pending website request queue
- Confirm / cancel / complete workflow
- Booking-rule settings
- Activity history and day-level undo
- Leave/date-range blocking with one public reason

## Security

The browser uses only a Supabase publishable key. Client names, phone numbers and booking notes are stored in `appointments`, protected by RLS. The public calendar reads sanitised availability from `public_schedule_days` and `public_schedule_blocks` only.

The first authorised administrator is `infocampbellweb@gmail.com`. Database policies now use `schedule_admins`, so another authorised account can be added without rewriting all RLS policies.
