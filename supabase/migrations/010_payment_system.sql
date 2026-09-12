-- ============================================================
-- TutorMeet — Payment System Schema
-- Run AFTER 009_review_system.sql
--
-- Design principles:
-- 1. Amounts stored as INTEGER paise to avoid float errors
-- 2. verified_by_webhook = TRUE only via server-side webhook handler
-- 3. No card numbers, CVV, or full bank accounts stored ever
-- 4. Every payment event produces ledger entries (double-entry)
-- 5. invoice_number uses sequence for human-readable IDs
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE payment_status_enum AS ENUM (
  'pending',
  'awaiting_capture',
  'processing',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
  'disputed',
  'cancelled'
);

CREATE TYPE payment_method_enum AS ENUM (
  'upi', 'card', 'net_banking', 'wallet',
  'cash', 'bank_transfer', 'other'
);

CREATE TYPE payment_gateway_enum AS ENUM (
  'razorpay', 'stripe', 'manual', 'none'
);

CREATE TYPE invoice_status_enum AS ENUM (
  'draft', 'issued', 'paid', 'overdue', 'cancelled'
);

CREATE TYPE ledger_entry_type AS ENUM (
  'payment_received', 'platform_fee', 'tutor_earning',
  'refund_issued', 'partial_refund',
  'payout_initiated', 'payout_completed', 'adjustment'
);

CREATE TYPE ledger_direction AS ENUM ('credit', 'debit');
CREATE TYPE ledger_account   AS ENUM ('platform', 'tutor', 'parent');

CREATE TYPE payout_status_enum AS ENUM (
  'pending', 'processing', 'completed', 'failed'
);

-- ─── Invoice number sequence ──────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1 INCREMENT 1;

-- ─── invoices ─────────────────────────────────────────────────────────────────

CREATE TABLE invoices (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT         NOT NULL UNIQUE
                   DEFAULT 'TM-' || to_char(NOW(),'YYYY') || '-' ||
                            LPAD(nextval('invoice_number_seq')::TEXT, 5, '0'),
  enrollment_id   UUID         NOT NULL REFERENCES enrollments(id),
  parent_id       UUID         NOT NULL REFERENCES profiles(id),
  tutor_id        UUID         NOT NULL REFERENCES tutor_profiles(id),
  student_name    TEXT,

  -- Period covered
  period_start    DATE         NOT NULL,
  period_end      DATE         NOT NULL,
  sessions_billed SMALLINT     NOT NULL DEFAULT 0,

  -- Amounts in paise (INTEGER avoids float issues)
  amount_paise        INTEGER  NOT NULL CHECK (amount_paise > 0),
  platform_fee_paise  INTEGER  NOT NULL DEFAULT 0 CHECK (platform_fee_paise >= 0),
  tutor_amount_paise  INTEGER  NOT NULL CHECK (tutor_amount_paise >= 0),
  currency            CHAR(3)  NOT NULL DEFAULT 'INR',

  status          invoice_status_enum NOT NULL DEFAULT 'draft',
  due_date        DATE,
  issued_at       TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_invoice_split CHECK (
    amount_paise = platform_fee_paise + tutor_amount_paise
  )
);

-- ─── payments ─────────────────────────────────────────────────────────────────
-- SECURITY: No card data stored. verified_by_webhook is backend-only.

CREATE TABLE payments (
  id                    UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        TEXT                  NOT NULL UNIQUE,

  invoice_id            UUID                  REFERENCES invoices(id),
  enrollment_id         UUID                  NOT NULL REFERENCES enrollments(id),
  parent_id             UUID                  NOT NULL REFERENCES profiles(id),
  tutor_id              UUID                  NOT NULL REFERENCES tutor_profiles(id),

  -- All amounts in paise
  amount_paise          INTEGER               NOT NULL CHECK (amount_paise > 0),
  platform_fee_paise    INTEGER               NOT NULL DEFAULT 0,
  tutor_amount_paise    INTEGER               NOT NULL,
  currency              CHAR(3)               NOT NULL DEFAULT 'INR',

  -- Gateway
  gateway               payment_gateway_enum  NOT NULL DEFAULT 'manual',
  gateway_order_id      TEXT,
  gateway_payment_id    TEXT,                 -- populated by webhook ONLY
  gateway_signature     TEXT,                 -- stored for audit trail
  payment_method        payment_method_enum,

  -- Status
  status                payment_status_enum   NOT NULL DEFAULT 'pending',

  -- SECURITY: This column can ONLY be set to TRUE by the server-side
  -- webhook handler. Application code must enforce this invariant.
  verified_by_webhook   BOOLEAN               NOT NULL DEFAULT FALSE,

  -- Refund tracking
  refunded_amount_paise INTEGER               NOT NULL DEFAULT 0,
  refund_reason         TEXT,
  refunded_at           TIMESTAMPTZ,

  -- Metadata
  description           TEXT,
  failure_reason        TEXT,
  notes                 TEXT,   -- PRIVATE — admin only

  created_at            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_payment_split CHECK (
    amount_paise = platform_fee_paise + tutor_amount_paise
  ),
  CONSTRAINT chk_refund_lte_amount CHECK (
    refunded_amount_paise <= amount_paise
  )
);

COMMENT ON COLUMN payments.verified_by_webhook IS
  'SECURITY: Must only be set TRUE by server-side webhook handler after signature verification. Never trust frontend input for payment confirmation.';
COMMENT ON COLUMN payments.gateway_payment_id IS
  'Set by webhook handler only — never from frontend callback.';

-- ─── payment_ledger ───────────────────────────────────────────────────────────
-- Append-only ledger. No UPDATE or DELETE via application code.

CREATE TABLE payment_ledger (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id      UUID              NOT NULL REFERENCES payments(id),
  entry_type      ledger_entry_type NOT NULL,
  amount_paise    INTEGER           NOT NULL CHECK (amount_paise > 0),
  direction       ledger_direction  NOT NULL,
  account         ledger_account    NOT NULL,
  currency        CHAR(3)           NOT NULL DEFAULT 'INR',
  balance_after   INTEGER,          -- running balance snapshot
  description     TEXT              NOT NULL,
  created_by      UUID              REFERENCES profiles(id),
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
  -- No updated_at — ledger entries are immutable
);

COMMENT ON TABLE payment_ledger IS
  'Immutable double-entry ledger. No UPDATE or DELETE permitted.';

-- ─── tutor_payouts ────────────────────────────────────────────────────────────
-- SECURITY: Only last 4 digits of bank account stored — never full account number.

CREATE TABLE tutor_payouts (
  id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id          UUID               NOT NULL REFERENCES tutor_profiles(id),
  amount_paise      INTEGER            NOT NULL CHECK (amount_paise > 0),
  currency          CHAR(3)            NOT NULL DEFAULT 'INR',
  status            payout_status_enum NOT NULL DEFAULT 'pending',
  payment_ids       UUID[]             NOT NULL DEFAULT '{}',
  utr_number        TEXT,
  bank_account_last4 CHAR(4),          -- SECURITY: last 4 digits only
  initiated_by      UUID               NOT NULL REFERENCES profiles(id),
  initiated_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  failure_reason    TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tutor_payouts.bank_account_last4 IS
  'SECURITY: Only last 4 digits of bank account. Full account numbers are never stored.';

-- ─── payment_gateway_config ───────────────────────────────────────────────────
-- Metadata only — NO secrets stored in DB.
-- Actual credentials come from environment variables.

CREATE TABLE payment_gateway_config (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway           payment_gateway_enum NOT NULL UNIQUE,
  is_active         BOOLEAN NOT NULL DEFAULT FALSE,
  is_live_mode      BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_url       TEXT,
  -- SECURITY: No key_id, key_secret, or webhook_secret stored here.
  -- These live in environment variables only.
  notes             TEXT,
  configured_by     UUID    REFERENCES profiles(id),
  configured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO payment_gateway_config (gateway, is_active, is_live_mode, notes)
VALUES ('manual', TRUE, FALSE, 'Default phase-1 mode — admin records payments manually.')
ON CONFLICT (gateway) DO NOTHING;

-- ─── Triggers ────────────────────────────────────────────────────────────────

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_payouts_updated_at
  BEFORE UPDATE ON tutor_payouts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Auto-create ledger entries on payment status change ─────────────────────

CREATE OR REPLACE FUNCTION fn_create_ledger_entries()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- On payment confirmed (paid via webhook)
  IF NEW.status = 'paid' AND
     NEW.verified_by_webhook = TRUE AND
     (OLD.status IS DISTINCT FROM 'paid' OR OLD.verified_by_webhook = FALSE) THEN

    -- 1. Parent account: debit (money leaves parent)
    INSERT INTO payment_ledger (payment_id, entry_type, amount_paise, direction, account, description)
    VALUES (NEW.id, 'payment_received', NEW.amount_paise, 'debit', 'parent',
            'Tuition payment ' || NEW.transaction_id);

    -- 2. Platform account: credit platform fee
    IF NEW.platform_fee_paise > 0 THEN
      INSERT INTO payment_ledger (payment_id, entry_type, amount_paise, direction, account, description)
      VALUES (NEW.id, 'platform_fee', NEW.platform_fee_paise, 'credit', 'platform',
              'Platform fee for ' || NEW.transaction_id);
    END IF;

    -- 3. Tutor account: credit tutor earning
    INSERT INTO payment_ledger (payment_id, entry_type, amount_paise, direction, account, description)
    VALUES (NEW.id, 'tutor_earning', NEW.tutor_amount_paise, 'credit', 'tutor',
            'Tutor earnings for ' || NEW.transaction_id);
  END IF;

  -- On refund
  IF NEW.status IN ('refunded', 'partially_refunded') AND
     OLD.status NOT IN ('refunded', 'partially_refunded') THEN
    DECLARE
      refund_amt INTEGER := NEW.refunded_amount_paise - COALESCE(OLD.refunded_amount_paise, 0);
    BEGIN
      IF refund_amt > 0 THEN
        INSERT INTO payment_ledger (payment_id, entry_type, amount_paise, direction, account, description)
        VALUES (NEW.id, 'refund_issued', refund_amt, 'credit', 'parent',
                'Refund for ' || NEW.transaction_id);
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_ledger
  AFTER INSERT OR UPDATE OF status, verified_by_webhook, refunded_amount_paise
  ON payments
  FOR EACH ROW EXECUTE FUNCTION fn_create_ledger_entries();

-- ─── Prevent direct updates to verified_by_webhook from app layer ─────────────
-- Application code uses the webhook route (which has service-role access).
-- Regular authenticated users cannot flip this field.
-- This is enforced at application layer + RLS.

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_invoices_enrollment   ON invoices(enrollment_id);
CREATE INDEX idx_invoices_parent       ON invoices(parent_id);
CREATE INDEX idx_invoices_tutor        ON invoices(tutor_id);
CREATE INDEX idx_invoices_status       ON invoices(status);

CREATE INDEX idx_payments_parent       ON payments(parent_id);
CREATE INDEX idx_payments_tutor        ON payments(tutor_id);
CREATE INDEX idx_payments_enrollment   ON payments(enrollment_id);
CREATE INDEX idx_payments_status       ON payments(status);
CREATE INDEX idx_payments_gateway_pid  ON payments(gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;
CREATE INDEX idx_payments_transaction  ON payments(transaction_id);

CREATE INDEX idx_ledger_payment        ON payment_ledger(payment_id);
CREATE INDEX idx_ledger_account        ON payment_ledger(account, created_at DESC);

CREATE INDEX idx_payouts_tutor         ON tutor_payouts(tutor_id);
CREATE INDEX idx_payouts_status        ON tutor_payouts(status);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_ledger       ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_payouts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateway_config ENABLE ROW LEVEL SECURITY;

-- Invoices
CREATE POLICY "invoices_parent"    ON invoices FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "invoices_tutor"     ON invoices FOR SELECT
  USING (tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "invoices_admin"     ON invoices FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Payments — parents see own; tutors see own; admins see all
-- SECURITY: notes column (admin-only) is not restricted at row level here;
-- it must be excluded from API responses to non-admins at the application layer.
CREATE POLICY "payments_parent"    ON payments FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "payments_tutor"     ON payments FOR SELECT
  USING (tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "payments_admin"     ON payments FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Ledger — read-only for participants; admin manages
CREATE POLICY "ledger_parent"      ON payment_ledger FOR SELECT
  USING (payment_id IN (SELECT id FROM payments WHERE parent_id = auth.uid()));
CREATE POLICY "ledger_tutor"       ON payment_ledger FOR SELECT
  USING (payment_id IN (
    SELECT id FROM payments WHERE tutor_id IN
      (SELECT id FROM tutor_profiles WHERE user_id = auth.uid())
  ));
CREATE POLICY "ledger_admin"       ON payment_ledger FOR SELECT USING (is_admin());
CREATE POLICY "ledger_system_insert" ON payment_ledger FOR INSERT
  WITH CHECK (is_admin() OR current_setting('role') = 'service_role');

-- Payouts — tutors see own; admin manages
CREATE POLICY "payouts_tutor"      ON tutor_payouts FOR SELECT
  USING (tutor_id IN (SELECT id FROM tutor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "payouts_admin"      ON tutor_payouts FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Gateway config — super admin only
CREATE POLICY "gateway_config_admin" ON payment_gateway_config FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());
