-- ===========================================
-- DAILY
-- ===========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_device_payments_day AS
WITH payments AS (
  SELECT
    e.device_id,
    (to_timestamp((e.payload->>'timestemp')::bigint / 1000) AT TIME ZONE 'Asia/Bangkok')::date AS day,
    e.payload
  FROM tbl_devices_events e
  WHERE e.payload->>'type' = 'PAYMENT'
)
SELECT
  p.device_id,
  p.day,
  p.payload->>'status' AS status,
  SUM((p.payload->>'total_amount')::numeric) AS total_amount,
  SUM(COALESCE(c.coin_sum, 0))              AS coin_sum,
  SUM(COALESCE(b.bank_sum, 0))              AS bank_sum,
  SUM(COALESCE(q.qr_net_sum, 0))            AS qr_net_sum
FROM payments p
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS coin_sum
  FROM jsonb_each_text(p.payload->'coin') kv
) c ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS bank_sum
  FROM jsonb_each_text(p.payload->'bank') kv
) b ON TRUE
LEFT JOIN LATERAL (
  SELECT (p.payload->'qr'->>'net_amount')::numeric AS qr_net_sum
) q ON TRUE
GROUP BY p.device_id, p.day, p.payload->>'status';

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_device_payments_day
  ON mv_device_payments_day (device_id, day, status);



-- ===========================================
-- MONTHLY
-- ===========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_device_payments_month AS
WITH payments AS (
  SELECT
    e.device_id,
    date_trunc(
      'month',
      to_timestamp((e.payload->>'timestemp')::bigint / 1000) AT TIME ZONE 'Asia/Bangkok'
    )::date AS month_start,
    e.payload
  FROM tbl_devices_events e
  WHERE e.payload->>'type' = 'PAYMENT'
)
SELECT
  p.device_id,
  p.month_start,
  p.payload->>'status' AS status,
  SUM((p.payload->>'total_amount')::numeric) AS total_amount,
  SUM(COALESCE(c.coin_sum, 0))              AS coin_sum,
  SUM(COALESCE(b.bank_sum, 0))              AS bank_sum,
  SUM(COALESCE(q.qr_net_sum, 0))            AS qr_net_sum
FROM payments p
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS coin_sum
  FROM jsonb_each_text(p.payload->'coin') kv
) c ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS bank_sum
  FROM jsonb_each_text(p.payload->'bank') kv
) b ON TRUE
LEFT JOIN LATERAL (
  SELECT (p.payload->'qr'->>'net_amount')::numeric AS qr_net_sum
) q ON TRUE
GROUP BY p.device_id, p.month_start, p.payload->>'status';

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_device_payments_month
  ON mv_device_payments_month (device_id, month_start, status);




-- ===========================================
-- YEARLY
-- ===========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_device_payments_year AS
WITH payments AS (
  SELECT
    e.device_id,
    date_trunc(
      'year',
      to_timestamp((e.payload->>'timestemp')::bigint / 1000) AT TIME ZONE 'Asia/Bangkok'
    )::date AS year_start,
    e.payload
  FROM tbl_devices_events e
  WHERE e.payload->>'type' = 'PAYMENT'
)
SELECT
  p.device_id,
  p.year_start,
  p.payload->>'status' AS status,
  SUM((p.payload->>'total_amount')::numeric) AS total_amount,
  SUM(COALESCE(c.coin_sum, 0))              AS coin_sum,
  SUM(COALESCE(b.bank_sum, 0))              AS bank_sum,
  SUM(COALESCE(q.qr_net_sum, 0))            AS qr_net_sum
FROM payments p
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS coin_sum
  FROM jsonb_each_text(p.payload->'coin') kv
) c ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS bank_sum
  FROM jsonb_each_text(p.payload->'bank') kv
) b ON TRUE
LEFT JOIN LATERAL (
  SELECT (p.payload->'qr'->>'net_amount')::numeric AS qr_net_sum
) q ON TRUE
GROUP BY p.device_id, p.year_start, p.payload->>'status';

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_device_payments_year
  ON mv_device_payments_year (device_id, year_start, status);






  -- ===========================================
-- HOURLY
-- ===========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_device_payments_hour AS
WITH payments AS (
  SELECT
    e.device_id,
    date_trunc(
      'hour',
      to_timestamp((e.payload->>'timestemp')::bigint / 1000) AT TIME ZONE 'Asia/Bangkok'
    ) AS hour_start,          -- เวลาเริ่มชั่วโมงตามโซน Asia/Bangkok
    e.payload
  FROM tbl_devices_events e
  WHERE e.payload->>'type' = 'PAYMENT'
)
SELECT
  p.device_id,
  p.hour_start,
  p.payload->>'status' AS status,
  SUM((p.payload->>'total_amount')::numeric) AS total_amount,
  SUM(COALESCE(c.coin_sum, 0))              AS coin_sum,
  SUM(COALESCE(b.bank_sum, 0))              AS bank_sum,
  SUM(COALESCE(q.qr_net_sum, 0))            AS qr_net_sum
FROM payments p
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS coin_sum
  FROM jsonb_each_text(p.payload->'coin') kv
) c ON TRUE
LEFT JOIN LATERAL (
  SELECT SUM((kv.key)::numeric * (kv.value)::numeric) AS bank_sum
  FROM jsonb_each_text(p.payload->'bank') kv
) b ON TRUE
LEFT JOIN LATERAL (
  SELECT (p.payload->'qr'->>'net_amount')::numeric AS qr_net_sum
) q ON TRUE
GROUP BY p.device_id, p.hour_start, p.payload->>'status';

CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_device_payments_hour
  ON mv_device_payments_hour (device_id, hour_start, status);

