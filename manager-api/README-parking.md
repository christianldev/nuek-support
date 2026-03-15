Parking reservations API — setup and usage

This document describes how to set up the parking reservations feature and how to test it locally.

1) Database

- The project expects an Oracle database. Two SQL files are included in `manager-api/db`:
  - `parking_spots.sql` — create `parking_spots` table and insert sample spots.
  - `parking_reservations.sql` — create `parking_reservations` table and index.

Run both scripts using your preferred Oracle client (SQL*Plus, SQL Developer, etc.).

2) Environment variables for `manager-api`

Create `manager-api/.env` with at least:

```
ORACLE_DB_USER=your_user
ORACLE_DB_PASSWORD=your_password
ORACLE_DB_CONNECT_STRING=host:port/service_name

Important: set `CLIENT_ORIGIN` to the frontend dev origin(s) so CORS allows requests. Example:

```
CLIENT_ORIGIN=http://localhost:5173
```
```

3) Start backend

```bash
cd manager-api
npm install
npm run start:dev
```

4) Start frontend

```bash
cd manager-client
pnpm install
pnpm dev
# or with npm
# npm install
# npm run dev
```

5) Test flows

- GET `/parking/spots` — returns available parking spots.
- GET `/parking/reservations?start=<iso>&end=<iso>` — returns reservations between the range.
- POST `/parking/reservations` — create reservation. Body: `{ id, spotId, start (ISO), end (ISO), userId }`.
- PATCH `/parking/reservations/:id` — update reservation with partial body `{ spotId?, start?, end? }`.
- DELETE `/parking/reservations/:id` — delete reservation.

The API returns JSON in the form `{ status: 0, data: ... }` on success. Conflicts return HTTP 409.

6) Frontend

The calendar UI consumes the API and performs local overlap checks to provide immediate feedback. If the backend also detects a conflict, a 409 is returned and the frontend shows a toast.

7) Improvements / next steps

- Add authentication and wire `userId` from the logged-in user.
- Add server-side transactions if multiple operations are required.
- Improve UI: show spot labels on calendar, color-code by spot, list available spots per timeslot.

*** End of file
