# Peak Finish Automotive Booking Assistant

A mobile-first booking, pricing and job-management system for Peak Finish Automotive.

## Included

- Guided vehicle and condition assessment
- Package recommendation logic
- Current package pricing and service inclusions
- Current add-on starting prices
- No-GST pricing notice
- Cash, PayID, bank transfer and EFTPOS choices
- Order-number generation and customer confirmation
- Secure passwordless admin access for Aadarsh and Sima
- Shared Supabase order database with row-level security
- Email confirmations and optional SMS notifications
- Job completion and one-click Google review requests

## Preview locally

Run any static web server in this directory, for example:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. The admin preview is at `http://localhost:8080/admin.html`.

## Secure production setup

The customer form works in local preview mode until Supabase is configured. To switch on shared orders and notifications:

1. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor. Replace the placeholder Sima email first.
2. Enter the project's public URL and publishable key in `config.js`. These values are safe to expose; never place a secret or service-role key there.
3. Deploy both folders inside `supabase/functions` as Edge Functions.
4. Add the secrets shown in `supabase/functions/.env.example` in Supabase Edge Function secrets.
5. In Supabase Auth URL Configuration, allow the deployed `admin.html` URL as a redirect URL.
6. Configure a verified sender/domain in Resend. Twilio is optional for SMS.

The database denies anonymous reads. Only email addresses listed in `admin_users` can view or update bookings.

Do not place private API keys in a public GitHub Pages repository.

## GitHub Pages

This project has no build step. Enable Pages from the main branch. A custom subdomain such as `book.peakfinishautomotive.com` can be attached after deployment.
