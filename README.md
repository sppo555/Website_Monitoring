# 🖥 Website Monitoring System

> **[📖 中文版文件 (Chinese Documentation)](./README.zh-TW.md)**

A lightweight website monitoring system built with full-stack TypeScript (NestJS + Vue 3) and Docker, featuring user authentication & RBAC, multi-group domain management, multi-protocol monitoring, Telegram alerts, audit logging, and batch processing.

## Features

| Feature | Description |
| :--- | :--- |
| **User Authentication** | JWT-based login, default admin account (admin/admin) |
| **Role-Based Access** | 4 roles: `admin` (full access), `allread` (read all), `onlyedit` (edit assigned groups), `onlyread` (read assigned groups) |
| **Change Password** | All users can change their own password; admin can change any user's password |
| **Audit Logging** | All operations (login, CRUD, password changes) are logged; admin views all logs, users view their own |
| **HTTP Monitoring** | Check target domain HTTP connection status codes |
| **HTTPS Monitoring** | Check HTTPS status (enabling HTTPS auto-enables TLS check) |
| **TLS Certificate Check** | Connect to port 443, check SSL certificate remaining days |
| **WHOIS Domain Expiry** | Query domain WHOIS info, calculate registration expiry |
| **Multi-Group Domains** | A domain can belong to multiple groups simultaneously (many-to-many) |
| **Domain Search** | Search bar to filter domains within the selected group |
| **Bulk Edit** | Select multiple domains via checkbox and modify monitoring settings in bulk |
| **Independent Toggles** | Each domain can independently enable/disable HTTP, HTTPS, TLS, WHOIS |
| **Duplicate Prevention** | Rejects duplicate domain entries on create and batch import |
| **JSON Batch Import** | Import multiple domains at once via JSON, with group assignment |
| **Telegram Alerts** | Auto-send Telegram notifications for TLS/domain expiry or HTTP failures; settings stored in DB |
| **Failure Count Alert** | Only trigger alert after configurable consecutive HTTP failures |
| **Independent Intervals** | HTTP/HTTPS in seconds (min 60s), TLS/WHOIS in days (min 1 day) |
| **Batch Processing** | Checks run in batches of 5, with 2s delay between batches |
| **Flexible Check History** | View check results with selectable time range: 1h / 12h / 24h / 1d / 7d / 14d |
| **Alert Settings Page** | Configure TG Bot Token, Chat ID, and alert thresholds in the web UI (stored in DB) |
| **Auto Scheduler** | Runs every minute, checks only domains whose interval has elapsed |
| **Pause/Resume** | Pause or resume monitoring for any individual domain |
| **Log Retention Management** | Admin can configure auto-cleanup of audit logs and check results (daily cron, configurable retention days) |
| **Separate Pages** | Dashboard, User Management, Audit Logs, Telegram Settings, System Settings each on their own page with nav bar |
| **Data Persistence** | All data stored in PostgreSQL with Docker named volumes — survives `docker compose down && up` |

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
| **nginx** | Nginx Alpine | Reverse proxy, forwards API requests to backend |
| **api** | NestJS + TypeORM | REST API, scheduler, checker service, TG alerts |
| **frontend** | Vue 3 + Vite | Frontend dev server (runs independently) |
| **db** | PostgreSQL 15 | Data persistence |
| **redis** | Redis 7 | Reserved for caching/queue |

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
| API (via Nginx) | http://localhost/sites |

### Stop Services

```bash
docker compose down
```

## Usage

### 1. Add a Monitored Domain

Click "+ New Site", enter a domain (e.g. `www.google.com`) — **no** `http://` or `https://` prefix needed.

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

> Duplicate domains are rejected — each domain can only be added once.

### 2. Domain Groups

Type a group name and press `+` to create a new group. Domains can belong to **multiple groups** — select groups via checkboxes when adding/editing. Click group tabs to filter.

### 3. JSON Batch Import

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
| `domain` | string | *(required)* | Domain name, without http/https prefix |
| `checkHttp` | boolean | `true` | Monitor HTTP |
| `checkHttps` | boolean | `true` | Monitor HTTPS (auto-enables TLS) |
| `checkTls` | boolean | `true` | Check TLS certificate expiry |
| `checkWhois` | boolean | `true` | Check WHOIS domain expiry |
| `httpCheckIntervalSeconds` | number | `300` | HTTP/HTTPS check interval in seconds (min 60) |
| `tlsCheckIntervalDays` | number | `1` | TLS check interval in days (min 1) |
| `domainCheckIntervalDays` | number | `1` | WHOIS check interval in days (min 1) |
| `failureThreshold` | number | `3` | Consecutive HTTP failures before alert |
| `groupIds` | string[] | `[]` | Assign to groups (supports multiple) |

### 4. Check History

Each domain card has a 📊 button. Click it to view all check results from the last 24 hours in a table showing: timestamp, health status, HTTP status code, TLS days left, domain days left, and error details.

### 5. Telegram Alert Settings

Expand the "🔔 Telegram Alert Settings" panel at the top of the page:

1. Enter **Bot Token** (from [@BotFather](https://t.me/BotFather))
2. Enter **Chat ID** (personal or group/channel ID)
3. Set **TLS alert days** (default 14) and **Domain alert days** (default 30)
4. Check "Enable Telegram Alerts"
5. Click "💾 Save Settings"

Click "📤 Send Test Message" to verify connectivity.

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

## Batch Processing

To prevent overload when monitoring hundreds of domains:

- **5 domains per batch**, processed concurrently
- **2-second delay** between batches
- Each domain's HTTP/HTTPS, TLS, WHOIS checks have **independent intervals** — checks that aren't due are skipped
- All state (last check time, failure count) is **persisted in DB** — survives Docker restarts

## API Reference

### Sites API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/sites` | Admin/Editor | Add a monitored domain (rejects duplicates) |
| `POST` | `/sites/batch` | Admin/Editor | Batch import domains (rejects duplicates) |
| `GET` | `/sites` | JWT | Get all domains (with groups + latest result) |
| `GET` | `/sites/:id` | JWT | Get a single domain |
| `GET` | `/sites/:id/history?range=` | JWT | Get check history (1h/12h/24h/1d/7d/14d) |
| `PUT` | `/sites/bulk` | Admin/Editor | Bulk update monitoring settings |
| `PUT` | `/sites/:id` | Admin/Editor | Update domain settings |
| `PUT` | `/sites/:id/status/:status` | Admin/Editor | Toggle status (active/paused) |
| `DELETE` | `/sites/:id` | Admin | Delete a domain |

### Groups API

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/groups` | Create a group |
| `GET` | `/groups` | Get all groups (with domains) |
| `GET` | `/groups/:id` | Get a single group |
| `PUT` | `/groups/:id` | Update a group |
| `DELETE` | `/groups/:id` | Delete a group (domains become ungrouped) |

### Auth API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | None | Login (returns JWT + user info) |
| `GET` | `/auth/me` | JWT | Get current user info |
| `PUT` | `/auth/change-password` | JWT | Change own password |
| `GET` | `/auth/users` | Admin | List all users |
| `POST` | `/auth/users` | Admin | Create a user |
| `PUT` | `/auth/users/:id` | Admin | Update user (role, password, groups) |
| `DELETE` | `/auth/users/:id` | Admin | Delete a user |

### Audit API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/audit` | Admin | Get all audit logs |
| `GET` | `/audit/me` | JWT | Get current user's audit logs |

### Alert API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/alert/config` | JWT | Get alert configuration |
| `PUT` | `/alert/config` | Admin | Update alert configuration |
| `POST` | `/alert/test` | Admin | Send Telegram test message |

### Retention API

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/retention/config` | JWT | Get retention settings |
| `PUT` | `/retention/config` | Admin | Update retention settings (enable/disable auto-cleanup, set retention days) |

## Docker Compose Services

```yaml
services:
  nginx:        # Nginx reverse proxy (Port 80)
  frontend:     # Vue 3 frontend dev server (Port 5173), runs independently
  api:          # NestJS backend API (Port 3000, internal only)
  db:           # PostgreSQL 15 database
  redis:        # Redis 7 cache
```

## Tech Stack

- **Backend:** NestJS, TypeORM, PostgreSQL, Redis, Passport.js, JWT, bcryptjs, axios, whois-json
- **Frontend:** Vue 3, Vite, axios
- **Deployment:** Docker Compose, Nginx (persistent volumes for DB & Redis)
- **Auth:** JWT + Role-Based Access Control (admin/allread/onlyedit/onlyread)
- **Alerts:** Telegram Bot API