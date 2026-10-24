# SafeEars

Anonymous, secure mental-wellness support that connects people in Nigeria with vetted **peer listeners** and **licensed therapists** — by text or voice, privately, whenever they need to be heard.

> ⚠️ **Safety notice:** SafeEars is **not** an emergency or medical service. If you or someone else is in immediate danger, call **112** or **199**.

---

## What's built

- **Brand theme system** (burgundy `#7E232E`, blush `#E4DAD1`, cream `#FAF7F3`) with three switchable, persisted themes: **Light**, **Dark**, and **High-contrast**. Powered by CSS variables in `src/index.css`, exposed via `src/lib/theme.jsx`, toggled in the app header and Settings.
- **Public site:** Landing, How it works, Pricing, Resource library, Crisis & Safety, Privacy, Terms.
- **Auth:** Backend-managed email/password login, email OTP verification, password reset, and optional Google OAuth.
- **Role-based app** (role stored on the User entity: `seeker`, `listener`, `therapist`, `admin`):
  - **Support Seeker** — "Get support now" flow: pick topic → text/voice → urgency → matching queue → live session workspace → rating & feedback.
  - **Listener / Therapist** — availability toggle, incoming request queue with a 30-second accept/decline timer, live session workspace, profile completeness.
  - **Admin** — overview metrics, application review (approve/reject/suspend), users, editable plans & pricing, safety incidents.
- **Live session workspace** (shared by seeker and listener): session timer, secure text chat (realtime-synced), voice UI with mute, **Report & Escalate** safety action, end-session + rating flow.
- **Matching logic** (`src/lib/matching.js`): selects an available, approved listener/therapist by topic, availability, session type and priority; updates queue states (`searching → matched/awaiting → active → completed/cancelled/escalated`).
- **Subscriptions & billing:** plans and subscriptions are persisted in PostgreSQL and editable by an admin; payment checkout is not connected yet, and free crisis resources remain accessible.

## Data models

Prisma models in `server/prisma/schema.prisma`:
- `User` (customised: role, nickname, bio, support_topics, communication_preference, privacy_level, theme_preference, is_available, verification_status, average_rating, sessions_completed)
- `SupportTopic`, `SessionRequest`, `Session` (with embedded `messages`), `ListenerApplication`, `Plan`, `Subscription`, `Rating`, `SafetyReport`, `Notification`, `ResourceArticle`

Common fields include `id`, `created_date`, and `updated_date`; authentication secrets are stored as hashes and never returned by the API.

## Roles & permissions

- **Seekers** set a nickname, topics, and privacy in **Settings** (default role for new sign-ups).
- **Listeners/Therapists** are gated behind **Admin approval** of a `ListenerApplication`. Until approved (`verification_status = approved`) they cannot receive live sessions.
- **Admin** can review applications, manage users, edit plans, and resolve safety incidents.

> **Administrator account:** Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npm run db:seed` to provision the administrator. New users start as seekers. Administrator approval is required before listeners or therapists become available for matching.

## Subscription / free-trial logic

- New users are on **Free / Trial**. Plan `trial_days`, `price_ngn`, `voice_minutes` and feature flags are all editable from **Admin → Plans & Pricing**.
- When a trial expires, premium session access is restricted and an upgrade screen is shown in **Subscription & Billing**. Crisis resources remain free to everyone.

## Privacy assumptions

- Nickname-based use is the default; real identity and contact details are never shown to listeners.
- Session messages are stored on the `Session` table; the current UI syncs updates by polling the API.
- **Report & Escalate** creates a `SafetyReport` for admin review; the session is flagged.

## Known limitations / next steps

- **Matching** is currently coordinated by the frontend using backend-filtered public listener profiles. For high-volume production traffic, move queueing and matching into a transactional server-side worker.
- **Payments** (Paystack/Flutterwave) and full checkout/billing-history are represented in the UI but not connected to a payment processor.
- **Therapist dashboard** currently reuses the listener dashboard (same queue/session flow); a clinical-specific view can be layered on.
- **In-app notifications** are stored as entities; a toast/realtime feed UI can be added to the header bell.

## Tech

React + Vite + Tailwind, shadcn/ui, lucide-react, Express, Prisma, and PostgreSQL. Theming via CSS variables (HSL tokens) so new themes can be added centrally in `src/index.css`.

## Backend setup

The frontend calls the Express API through `/api`. In development, Vite proxies
those requests to `http://localhost:4000`; run the frontend and server in
separate terminals:

```sh
npm install
cd server
npm install
cd ..
```

Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to the
PostgreSQL connection string, a random `JWT_SECRET` (at least 32 characters),
and the frontend/API URLs. Do not commit `.env` files or put database
credentials in frontend `VITE_*` variables. Configure `SMTP_*` to enable
registration verification and password-reset emails. Google sign-in is optional
and requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

Then run:

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run server:dev
npm run dev
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 10 characters) before seeding
the first administrator. For production, provide all secrets as hosting
provider environment variables, run `npm run db:migrate` as a deployment
release step, seed the administrator once, and set `VITE_API_URL` to the API
origin if the frontend and API are hosted on different origins. Set
`FRONTEND_URL` to the exact deployed frontend origin and `API_PUBLIC_URL` to
the public API URL ending in `/api`. The API exposes `/api/health` for
deployment health checks.

The database password supplied for setup should be rotated before production
use and stored only in the hosting provider's secret environment configuration.
The committed `server/.env.example` contains placeholders only; rotate any real
credentials that were previously used in that local example file.

For Render, set the service's **Root Directory** to the repository root (the
directory containing this README and the root `package.json`), not `server`.
Use the following commands:

- **Build Command:** `npm install && npm --prefix server install --include=dev && npm run db:generate && npm run build`
- **Start Command:** `npm start`

The root `package.json` must be included in the deployed commit; its `start`
script launches the API, which serves the built Vite app at `/` and handles
client-side routes while keeping `/api` endpoints separate. The build explicitly generates the
Prisma Client from `server/prisma/schema.prisma`; this is required for the
`@prisma/client` import at runtime. At startup, the backend generates Prisma
Client and runs `prisma migrate deploy` before starting the API, so the
checked-in database tables are created/updated and startup fails explicitly if
migration fails. Set `DATABASE_URL` in Render to the PostgreSQL connection
string (including `?sslmode=require` for Render PostgreSQL); never use the
placeholder from `.env.example`. Ensure the variable is configured so Prisma's
config can load during generation and migration. If Render still reports
`Missing script: "start"`, verify the service is using the correct
repository/branch and root directory, then deploy the commit containing this
start script. The API service
serves the frontend from `dist`, so the Render web-service URL is also the app
URL. Set `FRONTEND_URL` to that exact service origin and `API_PUBLIC_URL` to
that origin followed by `/api`. The default `VITE_API_URL` uses same-origin
`/api`; a separate frontend deployment is not required.