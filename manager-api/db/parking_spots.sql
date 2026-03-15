-- SQL to create parking spots table (Oracle)
CREATE TABLE parking_spots (
  id VARCHAR2(64) PRIMARY KEY,
  name VARCHAR2(200) NOT NULL,
  location VARCHAR2(200)
);

INSERT INTO parking_spots (id, name, location) VALUES ('A1', 'A1', 'Level 1');
INSERT INTO parking_spots (id, name, location) VALUES ('A2', 'A2', 'Level 1');
INSERT INTO parking_spots (id, name, location) VALUES ('B1', 'B1', 'Level 2');
