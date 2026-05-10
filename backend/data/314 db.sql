-- =============================================================================
-- Fundraising Platform — PostgreSQL Schema
-- Generated from: store.py, entity/*.py, control/*.py
-- Framework: Flask + psycopg2 / SQLAlchemy (raw SQL version)
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE user_role AS ENUM (
    'ADMIN',
    'FUNDRAISER',
    'DONEE',
    'PLATFORM_MANAGER',
    'ASSESSOR',
    'COMPLIANCE'
);

CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'SUSPENDED'
);

CREATE TYPE campaign_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
    'SUSPENDED'
);

CREATE TYPE urgency_tier AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE fraud_report_status AS ENUM (
    'PENDING',
    'REVIEWED',
    'ESCALATED',
    'CLOSED'
);

CREATE TYPE verification_status AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);

CREATE TYPE hold_status AS ENUM (
    'ACTIVE',
    'LIFTED'
);

CREATE TYPE notification_type AS ENUM (
    'info',
    'success',
    'warning',
    'error'
);

-- =============================================================================
-- TABLE: users
-- Source: entity/user.py, control/auth_controller.py, control/user_controller.py
-- =============================================================================

CREATE TABLE users (
    id              VARCHAR(8)      PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    username        VARCHAR(64)     NOT NULL UNIQUE,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(256)    NOT NULL,
    role            user_role       NOT NULL,
    full_name       VARCHAR(128)    NOT NULL,
    phone           VARCHAR(32)     NOT NULL DEFAULT '',
    status          user_status     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_status   ON users(status);
CREATE INDEX idx_users_email    ON users(email);

-- =============================================================================
-- TABLE: sessions
-- Source: store.py (create_session, get_user_id_by_token, delete_session)
-- =============================================================================

CREATE TABLE sessions (
    token       VARCHAR(64)     PRIMARY KEY,
    user_id     VARCHAR(8)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- =============================================================================
-- TABLE: campaigns
-- Source: entity/campaign.py, control/campaign_controller.py
-- =============================================================================

CREATE TABLE campaigns (
    id                  VARCHAR(8)      PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    title               VARCHAR(256)    NOT NULL,
    description         TEXT            NOT NULL,
    category            VARCHAR(64)     NOT NULL,
    fundraiser_id       VARCHAR(8)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_amount         NUMERIC(12, 2)  NOT NULL CHECK (goal_amount > 0),
    raised_amount       NUMERIC(12, 2)  NOT NULL DEFAULT 0.00,
    image_url           TEXT            NOT NULL DEFAULT '',
    start_date          DATE,
    end_date            DATE,
    status              campaign_status NOT NULL DEFAULT 'PENDING',
    urgency_tier        urgency_tier    NOT NULL DEFAULT 'LOW',
    rejection_remarks   TEXT            NOT NULL DEFAULT '',
    withdrawal_held     BOOLEAN         NOT NULL DEFAULT FALSE,
    withdrawal_limit    NUMERIC(12, 2),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status          ON campaigns(status);
CREATE INDEX idx_campaigns_fundraiser_id   ON campaigns(fundraiser_id);
CREATE INDEX idx_campaigns_category        ON campaigns(category);
CREATE INDEX idx_campaigns_urgency_tier    ON campaigns(urgency_tier);
CREATE INDEX idx_campaigns_created_at      ON campaigns(created_at);

-- =============================================================================
-- TABLE: donations
-- Source: entity/donation.py, control/donation_controller.py
-- =============================================================================

CREATE TABLE donations (
    id              VARCHAR(8)      PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    campaign_id     VARCHAR(8)      NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    donee_id        VARCHAR(8)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          NUMERIC(12, 2)  NOT NULL CHECK (amount > 0),
    message         TEXT            NOT NULL DEFAULT '',
    anonymous       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_campaign_id  ON donations(campaign_id);
CREATE INDEX idx_donations_donee_id     ON donations(donee_id);
CREATE INDEX idx_donations_created_at   ON donations(created_at);

-- =============================================================================
-- TABLE: refunds
-- Source: control/compliance_controller.py, store.py
-- User stories: CO-03 (approve/reject refund requests)
-- =============================================================================

CREATE TABLE refunds (
    id              VARCHAR(8)      PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    donation_id     VARCHAR(8)      NOT NULL UNIQUE REFERENCES donations(id) ON DELETE CASCADE,
    donee_id        VARCHAR(8)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT            NOT NULL,
    amount          NUMERIC(12, 2)  NOT NULL CHECK (amount > 0),
    status          VARCHAR(32)     NOT NULL DEFAULT 'PENDING',
    reviewed_by     VARCHAR(8)      REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ
);

CREATE INDEX idx_refunds_donation_id    ON refunds(donation_id);
CREATE INDEX idx_refunds_donee_id       ON refunds(donee_id);
CREATE INDEX idx_refunds_status         ON refunds(status);
CREATE INDEX idx_refunds_created_at     ON refunds(created_at);

-- =============================================================================
-- TABLE: milestones
-- Source: entity/milestone.py, control/milestone_controller.py
-- User stories: FR-07 (post milestone), D-08 (view milestone feed)
-- =============================================================================

CREATE TABLE milestones (
    id              VARCHAR(8)      PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    campaign_id     VARCHAR(8)      NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    fundraiser_id   VARCHAR(8)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(256)    NOT NULL,
    description     TEXT            NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_campaign_id ON milestones(campaign_id);

-- =============================================================================
-- TABLE: fraud_reports
-- Source: entity/fraud_report.py, control/compliance_controller.py,
--         control/assessor_controller.py
-- User stories: D-07 (donee flags), CO-01 (compliance reviews), AS-04 (assessor flags)
-- =============================================================================

CREATE TABLE fraud_reports (
    id              VARCHAR(8)              PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    campaign_id     VARCHAR(8)              NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    reported_by     VARCHAR(8)              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description     TEXT                    NOT NULL,
    status          fraud_report_status     NOT NULL DEFAULT 'PENDING',
    reviewed_by     VARCHAR(8)              REFERENCES users(id) ON DELETE SET NULL,
    escalated_to    VARCHAR(8)              REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_reports_campaign_id  ON fraud_reports(campaign_id);
CREATE INDEX idx_fraud_reports_status       ON fraud_reports(status);
CREATE INDEX idx_fraud_reports_reported_by  ON fraud_reports(reported_by);

-- =============================================================================
-- TABLE: identity_verifications
-- Source: store.py (identity_verifications), control/assessor_controller.py
-- User stories: AS-02 (verify identity), CO-09 (view identity status)
-- =============================================================================

CREATE TABLE identity_verifications (
    id              VARCHAR(8)          PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    campaign_id     VARCHAR(8)          NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
    fundraiser_id   VARCHAR(8)          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verified_by     VARCHAR(8)          REFERENCES users(id) ON DELETE SET NULL,
    status          verification_status NOT NULL DEFAULT 'PENDING',
    documents       TEXT[]              NOT NULL DEFAULT '{}',
    notes           TEXT                NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_identity_verifications_campaign_id ON identity_verifications(campaign_id);

-- =============================================================================
-- TABLE: withdrawal_holds
-- Source: store.py (withdrawal_holds), control/assessor_controller.py
-- User stories: AS-09 (place hold), CO-02 (compliance hold)
-- =============================================================================

CREATE TABLE withdrawal_holds (
    id              VARCHAR(8)      PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    campaign_id     VARCHAR(8)      NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    placed_by       VARCHAR(8)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT            NOT NULL,
    status          hold_status     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_withdrawal_holds_campaign_id   ON withdrawal_holds(campaign_id);
CREATE INDEX idx_withdrawal_holds_status        ON withdrawal_holds(status);

-- =============================================================================
-- TABLE: favorites
-- Source: store.py (favorites), control/donation_controller.py (toggle_favorite)
-- User stories: D-03 (alert when near goal), Donee saves campaigns
-- =============================================================================

CREATE TABLE favorites (
    id              VARCHAR(8)      PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    donee_id        VARCHAR(8)      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id     VARCHAR(8)      NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (donee_id, campaign_id)
);

CREATE INDEX idx_favorites_donee_id     ON favorites(donee_id);
CREATE INDEX idx_favorites_campaign_id  ON favorites(campaign_id);

-- =============================================================================
-- TABLE: notifications
-- Source: entity/notification.py, control/notification_controller.py
-- User stories: D-03 (goal proximity alerts), general in-app notices
-- =============================================================================

CREATE TABLE notifications (
    id          VARCHAR(8)          PRIMARY KEY DEFAULT substr(gen_random_uuid()::text, 1, 8),
    user_id     VARCHAR(8)          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(256)        NOT NULL,
    message     TEXT                NOT NULL,
    notif_type  notification_type   NOT NULL DEFAULT 'info',
    read        BOOLEAN             NOT NULL DEFAULT FALSE,
    link        TEXT,
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id      ON notifications(user_id);
CREATE INDEX idx_notifications_read         ON notifications(read);
CREATE INDEX idx_notifications_created_at   ON notifications(created_at);

-- =============================================================================
-- TABLE: platform_config
-- Source: store.py (config), control/config_controller.py
-- User stories: SA-09 (manage platform configuration settings)
-- =============================================================================

CREATE TABLE platform_config (
    key         VARCHAR(64)     PRIMARY KEY,
    value       NUMERIC(12, 4)  NOT NULL,
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Seed default config values (mirrors store.py defaults)
INSERT INTO platform_config (key, value) VALUES
    ('max_campaign_goal',           1000000),
    ('min_campaign_duration_days',  7),
    ('platform_fee_percent',        5);

-- =============================================================================
-- VIEWS (optional helpers for reporting)
-- =============================================================================

-- Daily report view (PM-08)
CREATE VIEW v_daily_report AS
SELECT
    DATE(c.created_at)                              AS report_date,
    COUNT(DISTINCT c.id)                            AS new_campaigns,
    COUNT(DISTINCT d.id)                            AS donations_count,
    COALESCE(SUM(d.amount), 0)                      AS total_donated,
    COUNT(DISTINCT CASE WHEN c.status = 'ACTIVE'     THEN c.id END) AS approved_campaigns,
    COUNT(DISTINCT CASE WHEN c.status = 'REJECTED'   THEN c.id END) AS rejected_campaigns,
    COUNT(DISTINCT CASE WHEN c.status = 'SUSPENDED'  THEN c.id END) AS suspended_campaigns
FROM campaigns c
LEFT JOIN donations d ON d.campaign_id = c.id
    AND DATE(d.created_at) = DATE(c.created_at)
GROUP BY DATE(c.created_at);

-- System metrics view (SA-07)
CREATE VIEW v_system_metrics AS
SELECT
    (SELECT COUNT(*) FROM users)                                AS total_users,
    (SELECT COUNT(*) FROM campaigns)                            AS total_campaigns,
    (SELECT COUNT(*) FROM campaigns WHERE status = 'ACTIVE')    AS active_campaigns,
    (SELECT COUNT(*) FROM campaigns WHERE status = 'COMPLETED') AS completed_campaigns,
    (SELECT COUNT(*) FROM donations)                            AS total_donations,
    (SELECT COALESCE(SUM(amount), 0) FROM donations)            AS total_raised,
    (SELECT COALESCE(AVG(amount), 0) FROM donations)            AS average_donation;
