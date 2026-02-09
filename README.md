# 🖥 SiteWatcher — Website Monitoring System

> **[📖 中文版文件 (Chinese Documentation)](./README.zh-TW.md)**

A lightweight, full-stack TypeScript website monitoring system (NestJS + Vue 3) deployed via Docker Compose. Features include user authentication & RBAC, multi-group domain management, multi-protocol monitoring (HTTP/HTTPS/TLS/WHOIS), Telegram alerts, audit logging, i18n (English/Chinese), and batch processing.

## Features

| Feature | Description |
| :--- | :--- |
| **User Authentication** | JWT-based login, default admin account (`admin`/`admin`) |
| **Role-Based Access (RBAC)** | 4 roles: `admin` (full access), `allread` (read all), `onlyedit` (edit assigned groups), `onlyread` (read assigned groups) |
| **Change Password** | All users can change their own password; admin can change any user's password |
| **Audit Logging** | All operations (login, CRUD, password changes) are logged; admin views all logs, users view their own |
| **HTTP Monitoring** | Check target domain HTTP connection status codes |
| **HTTPS Monitoring** | Check HTTPS status (enabling HTTPS auto-enables TLS check) |
| **TLS Certificate Check** | Connect to port 443, check SSL certificate remaining days |
| **WHOIS Domain Expiry** | Query domain WHOIS info, calculate registration expiry |
| **Immediate Check on Create** | When a site is added (single or batch), HTTP + TLS + WHOIS checks run immediately (non-blocking) |
| **Carry-Forward Results** | Scheduled checks carry forward the latest TLS/WHOIS values when those checks are not due, so the dashboard always shows data |
| **Multi-Group Domains** | A domain can belong to multiple groups simultaneously (many-to-many) |
| **Domain Search** | Real-time search bar to filter domains within the selected group |
| **Bulk Edit** | Select multiple domains via checkbox and modify monitoring settings **including groups** in bulk |
| **Independent Toggles** | Each domain can independently enable/disable HTTP, HTTPS, TLS, WHOIS |
| **Domain Validation** | RFC 952/1123 compliant: only `a-z`, `0-9`, `-`, `.` allowed; auto-strips `http://`/`https://` prefix; rejects duplicates |
| **JSON Batch Import** | Import multiple domains at once via JSON, with group assignment and full validation |
| **Search Filters** | Filter domains by monitoring type (HTTP/HTTPS/TLS/WHOIS) and status (Active/Paused) with multi-select checkboxes |
| **JSON Export** | Export all or selected domain configurations as JSON (compatible with batch import format) |
| **Bulk Delete** | Select multiple domains and delete them in bulk (admin only), including associated check results |
| **Bulk Group Mode** | Bulk edit groups with Replace (overwrite) or Add (append) mode selection |
| **Domain-Based History** | Check history is tied to domain string, not site ID — renaming and renaming back restores history |
| **Telegram Alerts** | Auto-send Telegram notifications for TLS/domain expiry or HTTP failures; settings stored in DB |
| **TG Group Topics** | Telegram Chat ID supports `chatId:topicId` format for Group Topics (e.g. `-1003758002772:646`) |
| **Failure Count Alert** | Only trigger alert after configurable consecutive HTTP failures |
| **Independent Intervals** | HTTP/HTTPS in seconds (min 60s), TLS/WHOIS in days (min 1 day) |
| **Batch Processing** | Checks run in batches of 5, with 2s delay between batches |
| **Flexible Check History** | View check results with selectable time range: 1h / 12h / 24h / 1d / 7d / 14d / custom |
| **Alert Settings Page** | Configure TG Bot Token, Chat ID, and alert thresholds in the web UI (stored in DB) |
| **Auto Scheduler** | Runs every minute, checks only domains whose interval has elapsed |
| **Pause/Resume** | Pause or resume monitoring for any individual domain |
| **Log Retention Management** | Admin can configure auto-cleanup of audit logs and check results (daily cron, configurable retention days) |
| **i18n (Internationalization)** | Full English and Traditional Chinese support; language toggle persisted in localStorage |
| **Separate Pages** | Dashboard, User Management, Audit Logs, Telegram Settings, System Settings each on their own page with nav bar |
| **Group Tab Permissions** | Non-admin users only see group tabs they have access to; counts reflect visible domains only |
| **Data Persistence** | All data stored in PostgreSQL with Docker named volumes — survives `docker compose down && up` |
| **Timezone Handling** | Backend stores UTC; frontend displays browser's local timezone automatically |

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   Nginx     │───▶│  NestJS API  │───▶│  PostgreSQL  │
│  (Port 80)  │    │  (Port 3000) │    │              │
└─────────────┘    └──────┬───────┘    └──────────────┘
                          │
┌─────────────┐           │            ┌──────────────┐
│  Vue 3 SPA  │           └───────────▶│    Redis     │
│ (Port 5173) │                        │              │
└─────────────┘                        └──────────────┘
```

| Container | Stack | Purpose |
| :--- | :--- | :--- |
| **nginx** | Nginx Alpine | Reverse proxy (Port 80), forwards `/api/*` to backend |
| **api** | NestJS + TypeORM | REST API, scheduler, checker service, TG alerts |
| **frontend** | Vue 3 + Vite | Frontend dev server (Port 5173, runs independently) |
| **db** | PostgreSQL 15 | Data persistence (named volume) |
| **redis** | Redis 7 | Reserved for caching/queue (named volume) |

> ⚡ Frontend and backend containers run **completely independently**.

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Start All Services

```bash
cd Website_Monitoring
docker compose up --build -d
```

Once running:

| Service | URL |
| :--- | :--- |
| Frontend Dashboard | http://localhost:5173 |
| API (via Nginx) | http://localhost/api/sites |

Default login: **admin** / **admin** (change immediately after first login).

### Stop Services

```bash
docker compose down
```

> Data is persisted in Docker named volumes (`postgres_data`, `redis_data`). To remove all data: `docker compose down -v`.

## Usage

### 1. Add a Monitored Domain

Click "+ New Site" and enter a domain (e.g. `www.google.com`).

**Domain input rules (RFC 952/1123):**
- Enter the domain only — `http://` / `https://` prefixes are **auto-stripped**
- Only letters (`a-z`), numbers (`0-9`), hyphens (`-`), and dots (`.`) are allowed
- Cannot start or end with a hyphen
- Each label (between dots) max 63 characters, total max 253 characters
- Invalid input shows a real-time error message; the submit button is disabled

Select monitoring protocols:
- **HTTP** — Monitor HTTP connection status
- **HTTPS** — Monitor HTTPS status (auto-enables TLS certificate check)
- **TLS** — Standalone TLS certificate expiry check
- **WHOIS** — Domain WHOIS registration expiry check

Configure intervals and alert threshold:
- **HTTP/HTTPS Interval** — Check frequency in seconds (min 60s, default 300s)
- **TLS Check Interval** — Check frequency in days (min 1, default 1)
- **WHOIS Check Interval** — Check frequency in days (min 1, default 1)
- **Failure Threshold** — Consecutive HTTP failures before alerting (default 3)

> Duplicate domains are rejected — each domain can only be added once. If a duplicate is detected, the error is shown and the form remains editable (not stuck).

### 2. Domain Groups

Type a group name and press `+` to create a new group. Domains can belong to **multiple groups** — select groups via checkboxes when adding/editing. Click group tabs to filter.

### 3. Bulk Edit

Select multiple domains via checkboxes, then click "Bulk Edit". You can modify:
- HTTP / HTTPS / TLS / WHOIS toggles
- HTTP interval, failure threshold
- **Group assignment** with mode selection:
  - **Replace** (default) — overwrite existing groups
  - **Add** — keep existing groups and append new ones

Only checked fields are applied; unchecked fields keep their original values.

### 3.1 Bulk Delete

Select domains and click "Bulk Delete" (admin only). All selected domains and their check history will be permanently removed.

### 3.2 JSON Export

Click "JSON Export" to download all domain configurations. If domains are selected, click "Export Selected (N)" to export only those. The exported JSON is compatible with the batch import format.

### 3.3 Search Filters

Click the "Filter" button next to the search bar to expand filter options:
- **Monitoring type**: HTTP / HTTPS / TLS / WHOIS (AND logic — all checked must be enabled)
- **Status**: Active / Paused (OR logic — checking both shows all)
- Click "Clear" to reset all filters

### 4. JSON Batch Import

Click "JSON Batch Import" and paste:

```json
{
  "groupIds": [],
  "sites": [
    {
      "domain": "www.google.com",
      "checkHttp": true,
      "checkHttps": true,
      "checkWhois": false,
      "httpCheckIntervalSeconds": 300,
      "failureThreshold": 3
    },
    {
      "domain": "github.com",
      "checkHttps": true,
      "httpCheckIntervalSeconds": 600,
      "tlsCheckIntervalDays": 1,
      "domainCheckIntervalDays": 7
    }
  ]
}
```

Or a plain array:

```json
[
  { "domain": "example.com" },
  { "domain": "www.github.com", "checkWhois": true, "failureThreshold": 5 }
]
```

**Field Reference:**

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `domain` | string | *(required)* | Domain name (auto-strips `http://`/`https://`, validated per RFC) |
| `checkHttp` | boolean | `true` | Monitor HTTP |
| `checkHttps` | boolean | `true` | Monitor HTTPS (auto-enables TLS) |
| `checkTls` | boolean | `true` | Check TLS certificate expiry |
| `checkWhois` | boolean | `true` | Check WHOIS domain expiry |
| `httpCheckIntervalSeconds` | number | `300` | HTTP/HTTPS check interval in seconds (min 60) |
| `tlsCheckIntervalDays` | number | `1` | TLS check interval in days (min 1) |
| `domainCheckIntervalDays` | number | `1` | WHOIS check interval in days (min 1) |
| `failureThreshold` | number | `3` | Consecutive HTTP failures before alert |
| `groupIds` | string[] | `[]` | Assign to groups (supports multiple) |

### 5. Check History

Each domain card has a 📊 button. Click it to view check results with selectable time range (1h / 12h / 24h / 1d / 7d / 14d / custom). The table shows: timestamp, health status, HTTP status code, TLS days left, domain days left, and error details.

### 6. Telegram Alert Settings

Navigate to the "Telegram Settings" page via the nav bar:

1. Enter **Bot Token** (from [@BotFather](https://t.me/BotFather))
2. Enter **Chat ID** (personal or group/channel ID). For **Group Topics**, use format `chatId:topicId` (e.g. `-1003758002772:646`)
3. Set **TLS alert days** (default 14) and **Domain alert days** (default 30)
4. Check "Enable Telegram Alerts"
5. Click "Save Settings"

Click "Send Test Message" to verify connectivity.

**Expiry alert example:**

```
🚨 Website Monitoring Alert 🚨

🔐 TLS Certificate Expiring Soon
  🟡 example.com — 12 days left

🌐 Domain Expiring Soon
  🟠 test.com — 10 days left

⏰ Alert Time: 2026/2/7 8:00:00 PM
📋 2 items need attention
```

**Consecutive failure alert example:**

```
🔥 Consecutive Failure Alert 🔥

  🟠 example.com — Failed 3 times (threshold 3)
  🔴 test.com — Failed 6 times (threshold 3)

⏰ Alert Time: 2026/2/7 8:01:00 PM
⚠️ 2 domains with consecutive failures
```

### 7. Language Switch

Click the language button (🌐 EN / CN) in the top-right corner of the nav bar to toggle between English and Traditional Chinese. The preference is saved in `localStorage`.

## Batch Processing

To prevent overload when monitoring hundreds of domains:

- **5 domains per batch**, processed concurrently
- **2-second delay** between batches
- Each domain's HTTP/HTTPS, TLS, WHOIS checks have **independent intervals** — checks that aren't due are skipped
- TLS/WHOIS values are **carried forward** from the last check when not due, ensuring dashboard always shows data
- Newly added sites receive an **immediate full check** (HTTP + TLS + WHOIS) — no need to wait for the next scheduler cycle
- All state (last check time, failure count) is **persisted in DB** — survives Docker restarts

## API Reference

### Sites API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sites` | Admin/Editor | Add a monitored domain (validates format, rejects duplicates, triggers immediate check) |
| `POST` | `/api/sites/batch` | Admin/Editor | Batch import domains (validates format, rejects duplicates, triggers immediate checks) |
| `GET` | `/api/sites` | JWT | Get all domains (with groups + latest result) |
| `GET` | `/api/sites/:id` | JWT | Get a single domain |
| `GET` | `/api/sites/export` | JWT | Export all or selected domain configs as JSON |
| `GET` | `/api/sites/:id/history?range=` | JWT | Get check history by domain string (1h/12h/24h/1d/7d/14d) |
| `PUT` | `/api/sites/bulk` | Admin/Editor | Bulk update settings (groups support replace/add mode) |
| `PUT` | `/api/sites/:id` | Admin/Editor | Update domain settings (rename preserves history) |
| `PUT` | `/api/sites/:id/status/:status` | Admin/Editor | Toggle status (active/paused) |
| `DELETE` | `/api/sites/bulk` | Admin | Bulk delete domains and their check results |
| `DELETE` | `/api/sites/:id` | Admin | Delete a domain |

### Groups API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/groups` | Admin | Create a group |
| `GET` | `/api/groups` | JWT | Get all groups (with domains) |
| `GET` | `/api/groups/:id` | JWT | Get a single group |
| `PUT` | `/api/groups/:id` | Admin | Update a group |
| `DELETE` | `/api/groups/:id` | Admin | Delete a group (domains become ungrouped) |

### Auth API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | None | Login (returns JWT + user info) |
| `GET` | `/api/auth/me` | JWT | Get current user info |
| `PUT` | `/api/auth/change-password` | JWT | Change own password |
| `GET` | `/api/auth/users` | Admin | List all users |
| `POST` | `/api/auth/users` | Admin | Create a user |
| `PUT` | `/api/auth/users/:id` | Admin | Update user (role, password, groups) |
| `DELETE` | `/api/auth/users/:id` | Admin | Delete a user |

### Audit API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit` | Admin | Get all audit logs |
| `GET` | `/api/audit/me` | JWT | Get current user's audit logs |

### Alert API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alert/config` | JWT | Get alert configuration |
| `PUT` | `/api/alert/config` | Admin | Update alert configuration |
| `POST` | `/api/alert/test` | Admin | Send Telegram test message |

### Retention API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/retention/config` | JWT | Get retention settings |
| `PUT` | `/api/retention/config` | Admin | Update retention settings (enable/disable auto-cleanup, set retention days) |

## Project Structure

```
Website_Monitoring/
├── docker-compose.yml          # Docker Compose orchestration
├── nginx/
│   └── default.conf            # Nginx reverse proxy config
├── backend-ts/                 # NestJS backend
│   └── src/
│       ├── app.module.ts       # Root module
│       ├── auth/               # Authentication (JWT, RBAC, users)
│       ├── site/               # Sites CRUD, check results, entities
│       ├── group/              # Group management
│       ├── checker/            # Checker service & module (HTTP/TLS/WHOIS)
│       ├── scheduler/          # Cron scheduler (every minute)
│       ├── alert/              # Telegram alert service & config
│       ├── audit/              # Audit logging
│       └── retention/          # Log retention management
├── frontend/                   # Vue 3 frontend
│   └── src/
│       ├── App.vue             # Main layout with nav bar
│       ├── auth.ts             # Auth state management
│       ├── i18n/               # Internationalization (zh-TW, en)
│       └── components/         # Vue components
│           ├── LoginPage.vue
│           ├── SiteList.vue
│           ├── SiteFormModal.vue
│           ├── BatchImportModal.vue
│           ├── BulkEditModal.vue
│           ├── HistoryModal.vue
│           ├── TelegramSettings.vue
│           ├── UserManagement.vue
│           ├── ChangePasswordModal.vue
│           ├── AuditLogPage.vue
│           ├── AuditLogPanel.vue
│           └── RetentionSettings.vue
└── README.md / README.zh-TW.md
```

## Docker Compose Services

```yaml
services:
  nginx:        # Nginx reverse proxy (Port 80)
  frontend:     # Vue 3 frontend dev server (Port 5173), runs independently
  api:          # NestJS backend API (Port 3000, internal only)
  db:           # PostgreSQL 15 database (named volume: postgres_data)
  redis:        # Redis 7 cache (named volume: redis_data)
```

## Tech Stack

- **Backend:** NestJS, TypeORM, PostgreSQL, Redis, Passport.js, JWT, bcryptjs, axios, whois-json, tls, @nestjs/schedule
- **Frontend:** Vue 3 (Composition API), Vite, axios, custom i18n
- **Deployment:** Docker Compose, Nginx reverse proxy, persistent named volumes
- **Auth:** JWT + Role-Based Access Control (admin / allread / onlyedit / onlyread)
- **Alerts:** Telegram Bot API
- **Timezone:** Backend stores UTC, frontend displays browser local time