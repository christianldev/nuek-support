-- Add license plate to existing parking_reservations table
ALTER TABLE parking_reservations ADD (license_plate VARCHAR2(20));

-- Optional: normalize existing data before enforcing NOT NULL
UPDATE parking_reservations
SET license_plate = NVL(license_plate, 'PENDING')
WHERE license_plate IS NULL;

ALTER TABLE parking_reservations MODIFY (license_plate NOT NULL);
