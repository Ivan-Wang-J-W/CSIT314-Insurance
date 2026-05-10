# Backend — CSIT314 Fundraising Platform

Python Flask REST API following the **BCE (Boundary-Control-Entity)** architecture, mirroring the frontend structure.

---

## Quick Start

```bash
cd backend
pip install -r requirements.txt
python app.py        # API runs on http://localhost:5000
pytest               # run all unit tests
```

### Local PostgreSQL Setup

From the repo root, create the database and load the schema:

```powershell
$env:PGPASSWORD='admin123'
createdb -U postgres frwa
psql -U postgres -d frwa -f "backend\data\314 db.sql"
psql -U postgres -d frwa -f "backend\data\seed_dummy_data.sql"
```

Start the backend with the local database URL:

```powershell
cd backend
$env:DATABASE_URL='postgresql://postgres:admin123@localhost:5432/frwa'
python app.py
```

Run backend tests with the same database URL:

```powershell
$env:DATABASE_URL='postgresql://postgres:admin123@localhost:5432/frwa'
python -m pytest
```

---

## Architecture

```
backend/
├── entity/          # Domain model classes (data + business rules)
├── control/         # Business logic controllers (no Flask dependency)
├── boundary/        # Flask blueprints (HTTP layer)
├── data/
│   └── store.py     # In-memory data store (DB calls commented in)
└── tests/           # pytest test suite
```

### Layer responsibilities

| Layer | Role | Rule |
|---|---|---|
| **Entity** | Data holders + domain methods | No store/Flask imports |
| **Control** | Business logic, validation, orchestration | No Flask imports |
| **Boundary** | Parse HTTP, call control, return JSON | No direct store access |
| **Data** | All persistence (currently in-memory) | Swappable without touching other layers |

---

## Entities

| File | Class | Key fields |
|---|---|---|
| `entity/user.py` | `User` | `id, username, email, password_hash, role, status` |
| `entity/campaign.py` | `Campaign` | `id, title, description, category, fundraiser_id, goal_amount, raised_amount, urgency_tier, status` |
| `entity/donation.py` | `Donation` | `id, campaign_id, donee_id, amount, anonymous` |
| `entity/milestone.py` | `Milestone` | `id, campaign_id, fundraiser_id, title, description` |
| `entity/fraud_report.py` | `FraudReport` | `id, campaign_id, reported_by, status, escalated_to` |
| `entity/notification.py` | `Notification` | `id, user_id, title, message, type, read` |

### Campaign statuses
`PENDING` → `ACTIVE` → `COMPLETED`  
`PENDING` → `REJECTED`  
`ACTIVE` → `SUSPENDED`

### Urgency tiers (D-01)
`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

### User roles
`ADMIN` | `FUNDRAISER` | `DONEE` | `PLATFORM_MANAGER` | `ASSESSOR` | `COMPLIANCE`

---

## Controllers

### `auth_controller.py`
| Function | User story | Description |
|---|---|---|
| `register(data)` | G-07 | Create account; validates unique username/email |
| `login(username, password)` | G-09 | Returns `(token, user)` or raises `ValueError` |
| `logout(token)` | — | Invalidates session token |
| `get_current_user(token)` | — | Resolves token → safe user dict |

### `campaign_controller.py`
| Function | User story | Description |
|---|---|---|
| `list_campaigns(urgency_tier, status, ...)` | G-01, D-01 | Defaults to ACTIVE only; filterable by urgency tier |
| `create_campaign(data, fundraiser_id)` | FR-02 | Creates PENDING campaign with image URL + description |
| `update_campaign(id, patch, fundraiser_id)` | — | Owner-only edit |
| `delete_campaign(id, fundraiser_id)` | — | Owner-only delete |
| `approve_campaign(id, reviewer_id)` | — | PENDING → ACTIVE |
| `reject_campaign(id, reviewer_id, remarks)` | PM-03 | PENDING/ACTIVE → REJECTED; remarks required |
| `suspend_campaign(id)` | — | → SUSPENDED |
| `get_campaign_progress(id)` | FR-04 | Returns `{raised_amount, goal_amount, progress_percent, days_remaining}` |
| `search_campaign_history(status_list, ...)` | PM-10 | Filter by status, category, keyword |

### `donation_controller.py`
| Function | User story | Description |
|---|---|---|
| `create_donation(campaign_id, donee_id, amount, ...)` | — | Updates `raised_amount`; auto-completes campaign at 100% |
| `get_donation_history(donee_id, ...)` | — | Filterable by category and date range |
| `get_goal_alerts(donee_id)` | D-03 | Returns saved campaigns ≥ 90% funded |
| `toggle_favorite(donee_id, campaign_id)` | — | Save/unsave a campaign |

> **D-03 flow:** `create_donation` → checks if any saver's campaign crossed 90% → calls `notification_controller.push_notification` for each saver.

### `milestone_controller.py`
| Function | User story | Description |
|---|---|---|
| `post_milestone(campaign_id, fundraiser_id, title, description)` | FR-07 | Fundraiser posts update; validates ownership |
| `get_milestones(campaign_id)` | D-08 | Returns milestones newest-first |

### `user_controller.py`
| Function | User story | Description |
|---|---|---|
| `create_user(data)` | SA-01 | Admin provisions any role |
| `list_users(role, status)` | — | Filterable listing |
| `toggle_status(user_id)` | — | ACTIVE ↔ SUSPENDED |
| `delete_user(user_id)` | — | Hard delete |
| `get_stats()` | SA-07 | Count by role and status |

### `report_controller.py`
| Function | User story | Description |
|---|---|---|
| `daily_report(date)` | PM-08 | Counts new campaigns, donations, totals for a given day |
| `system_metrics()` | SA-07 | Platform-wide KPIs: users, campaigns, donations, raised amount |

### `assessor_controller.py`
| Function | User story | Description |
|---|---|---|
| `verify_identity(campaign_id, assessor_id, documents, notes)` | AS-02 | Creates or updates identity verification record |
| `flag_as_fraudulent(campaign_id, assessor_id, reason)` | AS-04 | Creates ESCALATED fraud report + suspends campaign |
| `place_withdrawal_hold(campaign_id, assessor_id, reason)` | AS-09 | Sets `withdrawal_held=True` on campaign (status change only, no real payment) |
| `lift_withdrawal_hold(campaign_id)` | — | Lifts active hold |
| `get_identity_status(campaign_id)` | — | Returns verification record or `{status: "PENDING"}` |

### `compliance_controller.py`
| Function | User story | Description |
|---|---|---|
| `get_fraud_reports(status, campaign_id)` | CO-01 | List and filter fraud reports |
| `submit_fraud_report(campaign_id, donee_id, description)` | D-07 | Donee files a report (feeds into CO-01) |
| `review_fraud_report(report_id, reviewer_id)` | CO-01 | Mark as REVIEWED |
| `escalate_campaign(campaign_id, compliance_id, notes, ...)` | CO-05 | Escalates all reports + suspends campaign |
| `view_identity_status(campaign_id)` | CO-09 | Delegates to `assessor_controller.get_identity_status` |

### `config_controller.py`
| Function | User story | Description |
|---|---|---|
| `get_config()` | SA-09 | Returns all platform settings |
| `update_config(key, value)` | SA-09 | Updates one key; allowed: `max_campaign_goal`, `min_campaign_duration_days`, `platform_fee_percent` |

### `notification_controller.py`
| Function | Description |
|---|---|
| `push_notification(user_id, title, message, type)` | Create in-app notification |
| `get_notifications(user_id)` | List notifications newest-first |
| `mark_read(notif_id)` | Mark single notification as read |
| `mark_all_read(user_id)` | Bulk mark read |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Role | User story |
|---|---|---|---|
| POST | `/register` | Public | G-07 |
| POST | `/login` | Public | G-09 |
| POST | `/logout` | Any | — |
| GET | `/me` | Any | — |

### Campaigns — `/api/campaigns`
| Method | Path | Role | User story |
|---|---|---|---|
| GET | `/` | Public | G-01 |
| GET | `/?urgency_tier=HIGH` | Public | D-01 |
| GET | `/<id>` | Public | — |
| POST | `/` | FUNDRAISER | FR-02 |
| PUT | `/<id>` | FUNDRAISER | — |
| DELETE | `/<id>` | FUNDRAISER | — |
| GET | `/<id>/progress` | Public | FR-04 |
| POST | `/<id>/approve` | PLATFORM_MANAGER | — |
| POST | `/<id>/reject` | PLATFORM_MANAGER | PM-03 |
| POST | `/<id>/suspend` | PLATFORM_MANAGER, ADMIN | — |
| GET | `/history` | PLATFORM_MANAGER, ADMIN | PM-10 |
| POST | `/<id>/milestones` | FUNDRAISER | FR-07 |
| GET | `/<id>/milestones` | Public | D-08 |
| POST | `/<id>/favorite` | DONEE | — |

### Donations — `/api/donations`
| Method | Path | Role | User story |
|---|---|---|---|
| POST | `/` | DONEE | — |
| GET | `/history` | DONEE | — |
| GET | `/alerts` | DONEE | D-03 |
| GET | `/notifications` | Any | — |
| POST | `/notifications/<id>/read` | Any | — |

### Admin Users — `/api/admin/users`
| Method | Path | Role | User story |
|---|---|---|---|
| POST | `/` | ADMIN | SA-01 |
| GET | `/` | ADMIN | — |
| GET | `/<id>` | ADMIN | — |
| PUT | `/<id>` | ADMIN | — |
| POST | `/<id>/toggle-status` | ADMIN | — |
| DELETE | `/<id>` | ADMIN | — |

### Reports — `/api/reports`
| Method | Path | Role | User story |
|---|---|---|---|
| GET | `/daily?date=YYYY-MM-DD` | PLATFORM_MANAGER, ADMIN | PM-08 |
| GET | `/metrics` | ADMIN | SA-07 |

### Assessor — `/api/assessor`
| Method | Path | Role | User story |
|---|---|---|---|
| POST | `/campaigns/<id>/verify-identity` | ASSESSOR | AS-02 |
| POST | `/campaigns/<id>/flag-fraud` | ASSESSOR | AS-04 |
| POST | `/campaigns/<id>/withdrawal-hold` | ASSESSOR | AS-09 |
| DELETE | `/campaigns/<id>/withdrawal-hold` | ASSESSOR, ADMIN | — |
| GET | `/campaigns/<id>/identity-status` | ASSESSOR, COMPLIANCE, ADMIN | — |

### Compliance — `/api/compliance`
| Method | Path | Role | User story |
|---|---|---|---|
| GET | `/fraud-reports` | COMPLIANCE, ADMIN | CO-01 |
| POST | `/fraud-reports` | DONEE | D-07 |
| POST | `/fraud-reports/<id>/review` | COMPLIANCE | — |
| POST | `/campaigns/<id>/escalate` | COMPLIANCE | CO-05 |
| GET | `/campaigns/<id>/identity-status` | COMPLIANCE, ADMIN | CO-09 |

### Config — `/api/admin`
| Method | Path | Role | User story |
|---|---|---|---|
| GET | `/config` | ADMIN | SA-09 |
| PUT | `/config/<key>` | ADMIN | SA-09 |

---

## Authentication

All protected endpoints expect:
```
Authorization: Bearer <token>
```
Tokens are issued by `POST /api/auth/login` and stored in the in-memory session store.

---

## Data Store & Database Migration

`data/store.py` is the only file that touches persistence. Every function has its SQLAlchemy equivalent commented directly beside the in-memory implementation:

```python
def get_campaign_by_id(campaign_id):
    # DB: return db.session.get(CampaignModel, campaign_id)
    return _store["campaigns"].get(campaign_id)
```

**To migrate to PostgreSQL:**
1. `pip install flask-sqlalchemy psycopg2-binary`
2. Define SQLAlchemy models (one per entity)
3. Replace each in-memory function body with its commented DB equivalent
4. No other files need to change

---

## Tests

```
tests/
├── conftest.py          # fixtures: app client, store reset, user factories
├── test_auth.py         # G-07, G-09
├── test_campaigns.py    # G-01, D-01, FR-02, FR-04, FR-07, D-08, PM-03, PM-10
├── test_donations.py    # D-03, donation history, favorites
├── test_assessor.py     # AS-02, AS-04, AS-09
├── test_compliance.py   # CO-01, CO-05, CO-09
├── test_reports.py      # PM-08, SA-07
└── test_admin.py        # SA-01, SA-09
```

Each test file has:
- **Controller unit tests** — test business logic directly, no HTTP
- **Route smoke tests** — test HTTP status codes and role enforcement via Flask test client

The store is reset before and after every test via the `autouse` fixture in `conftest.py`.

### Running tests

Run all tests at once:
```bash
pytest
```

Run tests by feature area with verbose output:
```bash
pytest tests/test_auth.py -v        # G-07, G-09
pytest tests/test_campaigns.py -v   # G-01, D-01, FR-02, FR-04, FR-07, D-08, PM-03, PM-10
pytest tests/test_donations.py -v   # D-03, favorites, history
pytest tests/test_assessor.py -v    # AS-02, AS-04, AS-09
pytest tests/test_compliance.py -v  # CO-01, CO-05, CO-09
pytest tests/test_reports.py -v     # PM-08, SA-07
pytest tests/test_admin.py -v       # SA-01, SA-09
```

The `-v` flag prints each test name and pass/fail so you can see exactly which user stories are covered.

### Manual testing with curl

Start the server first (`python app.py`), then use curl or Postman to hit endpoints directly. Example — register a new user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"a@test.com","password":"pass","role":"DONEE"}'
```

All protected endpoints require a Bearer token obtained from `POST /api/auth/login`:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass"}'

# Use the returned token for protected routes:
curl http://localhost:5000/api/donations/history \
  -H "Authorization: Bearer <token>"
```
