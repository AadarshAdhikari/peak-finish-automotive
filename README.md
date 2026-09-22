# Peak Finish Automotive Booking Assistant

A mobile-first GitHub Pages-ready prototype for Peak Finish Automotive.

## Included

- Guided vehicle and condition assessment
- Package recommendation logic
- Current package pricing and service inclusions
- Current add-on starting prices
- No-GST pricing notice
- Cash, PayID, bank transfer and EFTPOS choices
- Order-number generation and customer confirmation
- Local admin preview for Aadarsh and Sima
- Job completion and pre-filled Google review request

## Preview locally

Run any static web server in this directory, for example:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. The admin preview is at `http://localhost:8080/admin.html`.

## Important production work

The current prototype stores test submissions in the visitor's browser. Before public launch, connect:

1. Supabase/Postgres for shared booking storage.
2. Supabase Auth with two approved accounts (Aadarsh and Sima).
3. Row-level security so customers cannot read bookings.
4. An email/SMS provider for confirmations, reminders and review requests.
5. Address autocomplete and server-side travel-distance calculation.
6. A private environment configuration for all keys.

Do not place private API keys in a public GitHub Pages repository.

## GitHub Pages

This project has no build step. Upload the files to a repository and enable Pages from the main branch. A custom subdomain such as `book.peakfinishautomotive.com` can be attached after deployment.
