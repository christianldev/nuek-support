-- SQL to create parking reservations table (Oracle)
CREATE TABLE parking_reservations (
  id VARCHAR2(64) PRIMARY KEY,
  user_id VARCHAR2(200),
  spot_id VARCHAR2(100) NOT NULL,
  license_plate VARCHAR2(20) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR2(20),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_parking_spot_time ON parking_reservations(spot_id, start_time, end_time);

-- Notes: The API expects the table above to exist. The Nest service uses the Oracle connection
-- configured via ORACLE_DB_USER, ORACLE_DB_PASSWORD and ORACLE_DB_CONNECT_STRING environment variables.
