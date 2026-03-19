-- Seed data for parking_spots and parking_reservations (Oracle XE)
-- Safe to run multiple times: uses MERGE to avoid duplicates by primary key.

-- Spots
MERGE INTO parking_spots t
USING (SELECT 'A1' id, 'A1' name, 'Level 1' location FROM dual) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET t.name = s.name, t.location = s.location
WHEN NOT MATCHED THEN INSERT (id, name, location) VALUES (s.id, s.name, s.location);

MERGE INTO parking_spots t
USING (SELECT 'A2' id, 'A2' name, 'Level 1' location FROM dual) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET t.name = s.name, t.location = s.location
WHEN NOT MATCHED THEN INSERT (id, name, location) VALUES (s.id, s.name, s.location);

MERGE INTO parking_spots t
USING (SELECT 'A3' id, 'A3' name, 'Level 1' location FROM dual) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET t.name = s.name, t.location = s.location
WHEN NOT MATCHED THEN INSERT (id, name, location) VALUES (s.id, s.name, s.location);

MERGE INTO parking_spots t
USING (SELECT 'B1' id, 'B1' name, 'Level 2' location FROM dual) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET t.name = s.name, t.location = s.location
WHEN NOT MATCHED THEN INSERT (id, name, location) VALUES (s.id, s.name, s.location);

MERGE INTO parking_spots t
USING (SELECT 'B2' id, 'B2' name, 'Level 2' location FROM dual) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET t.name = s.name, t.location = s.location
WHEN NOT MATCHED THEN INSERT (id, name, location) VALUES (s.id, s.name, s.location);

MERGE INTO parking_spots t
USING (SELECT 'C1' id, 'C1' name, 'Basement' location FROM dual) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET t.name = s.name, t.location = s.location
WHEN NOT MATCHED THEN INSERT (id, name, location) VALUES (s.id, s.name, s.location);

-- Reservations
-- Note: ranges are chosen to not overlap for the same spot so API checks remain consistent.
MERGE INTO parking_reservations t
USING (
  SELECT
    'RES-001' id,
    'u001' user_id,
    'A1' spot_id,
    CAST(TRUNC(SYSDATE) + 8/24 AS TIMESTAMP) start_time,
    CAST(TRUNC(SYSDATE) + 10/24 AS TIMESTAMP) end_time,
    'active' status
  FROM dual
) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET
  t.user_id = s.user_id,
  t.spot_id = s.spot_id,
  t.start_time = s.start_time,
  t.end_time = s.end_time,
  t.status = s.status
WHEN NOT MATCHED THEN INSERT (id, user_id, spot_id, start_time, end_time, status, created_at)
VALUES (s.id, s.user_id, s.spot_id, s.start_time, s.end_time, s.status, SYSTIMESTAMP);

MERGE INTO parking_reservations t
USING (
  SELECT
    'RES-002' id,
    'u002' user_id,
    'A1' spot_id,
    CAST(TRUNC(SYSDATE) + 10.5/24 AS TIMESTAMP) start_time,
    CAST(TRUNC(SYSDATE) + 12/24 AS TIMESTAMP) end_time,
    'completed' status
  FROM dual
) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET
  t.user_id = s.user_id,
  t.spot_id = s.spot_id,
  t.start_time = s.start_time,
  t.end_time = s.end_time,
  t.status = s.status
WHEN NOT MATCHED THEN INSERT (id, user_id, spot_id, start_time, end_time, status, created_at)
VALUES (s.id, s.user_id, s.spot_id, s.start_time, s.end_time, s.status, SYSTIMESTAMP);

MERGE INTO parking_reservations t
USING (
  SELECT
    'RES-003' id,
    'u003' user_id,
    'A2' spot_id,
    CAST(TRUNC(SYSDATE) + 9/24 AS TIMESTAMP) start_time,
    CAST(TRUNC(SYSDATE) + 11/24 AS TIMESTAMP) end_time,
    'active' status
  FROM dual
) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET
  t.user_id = s.user_id,
  t.spot_id = s.spot_id,
  t.start_time = s.start_time,
  t.end_time = s.end_time,
  t.status = s.status
WHEN NOT MATCHED THEN INSERT (id, user_id, spot_id, start_time, end_time, status, created_at)
VALUES (s.id, s.user_id, s.spot_id, s.start_time, s.end_time, s.status, SYSTIMESTAMP);

MERGE INTO parking_reservations t
USING (
  SELECT
    'RES-004' id,
    'u004' user_id,
    'B1' spot_id,
    CAST(TRUNC(SYSDATE) + 13/24 AS TIMESTAMP) start_time,
    CAST(TRUNC(SYSDATE) + 15/24 AS TIMESTAMP) end_time,
    'active' status
  FROM dual
) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET
  t.user_id = s.user_id,
  t.spot_id = s.spot_id,
  t.start_time = s.start_time,
  t.end_time = s.end_time,
  t.status = s.status
WHEN NOT MATCHED THEN INSERT (id, user_id, spot_id, start_time, end_time, status, created_at)
VALUES (s.id, s.user_id, s.spot_id, s.start_time, s.end_time, s.status, SYSTIMESTAMP);

MERGE INTO parking_reservations t
USING (
  SELECT
    'RES-005' id,
    'u005' user_id,
    'B2' spot_id,
    CAST(TRUNC(SYSDATE) + 15.5/24 AS TIMESTAMP) start_time,
    CAST(TRUNC(SYSDATE) + 17/24 AS TIMESTAMP) end_time,
    'cancelled' status
  FROM dual
) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET
  t.user_id = s.user_id,
  t.spot_id = s.spot_id,
  t.start_time = s.start_time,
  t.end_time = s.end_time,
  t.status = s.status
WHEN NOT MATCHED THEN INSERT (id, user_id, spot_id, start_time, end_time, status, created_at)
VALUES (s.id, s.user_id, s.spot_id, s.start_time, s.end_time, s.status, SYSTIMESTAMP);

MERGE INTO parking_reservations t
USING (
  SELECT
    'RES-006' id,
    'u006' user_id,
    'C1' spot_id,
    CAST(TRUNC(SYSDATE) + 18/24 AS TIMESTAMP) start_time,
    CAST(TRUNC(SYSDATE) + 20/24 AS TIMESTAMP) end_time,
    'active' status
  FROM dual
) s
ON (t.id = s.id)
WHEN MATCHED THEN UPDATE SET
  t.user_id = s.user_id,
  t.spot_id = s.spot_id,
  t.start_time = s.start_time,
  t.end_time = s.end_time,
  t.status = s.status
WHEN NOT MATCHED THEN INSERT (id, user_id, spot_id, start_time, end_time, status, created_at)
VALUES (s.id, s.user_id, s.spot_id, s.start_time, s.end_time, s.status, SYSTIMESTAMP);

COMMIT;

PROMPT Seed completed.
SELECT COUNT(*) AS spots_count FROM parking_spots;
SELECT COUNT(*) AS reservations_count FROM parking_reservations;
