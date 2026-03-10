# Zentinel – Production Deployment & Configuration Guide

This document tracks all external callback URLs, webhooks, cron jobs, environment variables, and deployment milestones required to run Zentinel in production. 

## 📌 Base Domain Reference
- **Landing Page**: `https://zentinel.dev`
- **Main Dashboard App**: `https://app.zentinel.dev`
- **CRM App**: `https://crm.zentinel.dev`

---

## 🔗 OAuth & Integrations Callback URLs
When configuring external apps (GitHub, GitLab, Bitbucket, WorkOS, Supabase), use the following callback URLs.

### 1. Authentication (Supabase & WorkOS SSO)
- **Supabase Auth Callback**: `https://app.zentinel.dev/auth/callback`
- **WorkOS SSO Callback**: `https://app.zentinel.dev/api/auth/workos/callback`

> **Note on Auth Routing**: The `auth/callback` route centrally handles all user sign-ins. Upon exchanging the session code, it queries the database to determine the user's role:
> 1. If the user is in `crm_staff`, they are redirected to `https://crm.zentinel.dev`.
> 2. If the user is in `organization_members`, they are redirected to `https://app.zentinel.dev/dashboard`.
> 3. Otherwise, they are routed to `https://app.zentinel.dev/onboarding`.

### 2. Version Control Integrations
When setting up OAuth Apps or GitHub Apps for repository scanning:
- **GitHub App Callback**: `https://app.zentinel.dev/api/integrations/callback/github`
- **GitLab App Callback**: 
  - `https://app.zentinel.dev/api/integrations/callback/gitlab`
  - `https://app.zentinel.dev/api/oauth/gitlab/callback` 
- **Bitbucket App Callback**: 
  - `https://app.zentinel.dev/api/integrations/callback/bitbucket`
  - `https://app.zentinel.dev/api/oauth/bitbucket/callback`

---

## 🪝 Webhooks
These endpoints listen for incoming events from third-party services.

- **Dodo Payments Webook**: `https://app.zentinel.dev/api/webhooks/dodo`
  - *Function*: Listens for successful checkouts, subscription renewals, and cancellations to update the user's billing tier in Supabase.
  - *Setup*: Add this URL in the Dodo Payments dashboard and set the webhook secret in environment variables.

---

## ⏱️ Scheduled Tasks (Supabase `pg_cron`)
Zentinel uses Supabase's native `pg_cron` extension to handle recurring tasks (like automated scans, summaries, and reports) directly inside the database, avoiding the need for external triggers like Google Cloud Scheduler.

Tasks can be scheduled to make HTTP requests (using the `pg_net` extension) to our Next.js API routes. **All schedules are written in UTC but tuned for EST**.

1. **Weekly Summary**
   - *Requirement*: Sunday at 10:00 PM EST (which translates to 03:00 AM UTC on Monday).
   - *Example SQL Schedule*: `SELECT cron.schedule('weekly-summary', '0 3 * * 1', $$ SELECT net.http_get('https://app.zentinel.dev/api/cron/weekly-summary') $$);`

2. **Monthly Report**
   - *Requirement*: First Sunday of the month at Midnight EST (which translates to 05:00 AM UTC on Sunday).
   - *Example SQL Schedule*: `SELECT cron.schedule('monthly-report', '0 5 1-7 * 0', $$ SELECT net.http_get('https://app.zentinel.dev/api/cron/monthly-report') $$);`

3. **Automatic Scans**
   - *Requirement*: User-defined. When a user creates a scan schedule, the frontend will pass their timezone and preferred time. The backend will parse this into a UTC cron string, and use a service-role SQL query to insert a dynamic `cron.schedule()` pointing to that repository's webhook endpoint.

*(Note: Ensure the `pg_cron` and `pg_net` extensions are enabled in the Supabase Integrations dashboard).*

---

## ✅ Deployment & Feature Checklist

### Achieved So Far
- [x] Initialized Next.js frontend with Tailwind CSS and modern UI components.
- [x] Setup Cloud Build `cloudbuild.yaml` for containerized deployments.
- [x] Deployed Landing Page Apps to Google Cloud Run (`https://zentinel.dev`).
- [x] Setup subdomain routing for the Main Dashboard (`https://app.zentinel.dev`).
- [x] Setup subdomain routing for the internal CRM (`https://crm.zentinel.dev`).
- [x] Configured Supabase Auth with standard Email/Password and SSO.
- [x] Implemented and fixed Supabase Multi-Factor Authentication (TOTP 2FA) to prevent IP binding issues.
- [x] Created the CRM Pipeline, Prospects, and Team Management interfaces.
- [x] Expanded "Founder Directory" to support a wide range of social links (X, GitHub, Bluesky, Telegram, Instagram).
- [x] Fixed complex SQL views (e.g., `crm_daily_scorecard` with joined tables and strict typing).
- [x] Integrated PostHog analytics tracking.
- [x] Replaced placeholders with final Zentinel branding (SVGs in headers, footers).
- [x] Configured Dodo Payments UI scaffolding and initial webhook endpoints.

### Next Steps / Pending
- [ ] **GitHub App Registration**: Register Zentinel as a GitHub app, generate private keys, and configure the webhook URL to listen for push events (for autonomous scanning).
- [ ] **AI Pentesting Agent Deployment**: Deploy the autonomous scanning backend that actually executes the payloads.
- [ ] **Websocket / Realtime DB Updates**: Ensure Live View correctly connects to Supabase Realtime for streaming scan logs to the dashboard.
- [ ] **Configure Supabase Cron Jobs**: Enable `pg_cron` and schedule the recurring queries to hit the `/api/cron/*` endpoints and trigger automatic scans.
- [ ] **Dodo Payments Production**: Switch from Test API keys to Live API keys prior to launch and verify webhook signatures.
- [ ] **WorkOS Production Setup**: Map actual enterprise SSO SAML connections for prospective enterprise clients.
