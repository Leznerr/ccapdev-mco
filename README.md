# ArcherLabs (CCAPDEV MCO)

Phase 2 backend + view engine scaffold is initialized with Node.js, Express, MongoDB (Mongoose), and Handlebars.

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (default: `mongodb://127.0.0.1:27017`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. (Optional) Update `.env` values:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/archerlabs_phase2
```

## Seed Database

Load initial sample data (at least 5 entries per model):

```bash
npm run seed
```

## Run Application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Server runs at:

`http://localhost:3000`

Health endpoint:

`http://localhost:3000/health`

## Current Milestone Coverage

- Database connection setup (`model/db.js`)
- Mongoose models (`model/`)
  - `User`
  - `Building`
  - `Lab`
  - `Reservation`
- Seed data and runner (`model/seed-data.js`, `scripts/seed.js`)
- Express server/bootstrap + routes (`server.js`, `src/app.js`, `src/routes/viewRoutes.js`)
- Handlebars views and shared partials (`views/pages`, `views/partials`)
  - `/index.hbs`
  - `/login.hbs`
  - `/register.hbs`
  - `/profile.hbs`
  - `/view-lab.hbs`
  - `/admin-dashboard.hbs`
- API routes + controllers (`src/routes/api`, `src/controllers`)
  - `POST /api/auth/login`
  - `GET /api/users`, `GET /api/users/:username`, `POST /api/users`, `PUT /api/users/:username`, `DELETE /api/users/:username`
  - `GET /api/buildings`, `GET /api/buildings/:code`, `GET /api/buildings/:code/labs`
  - `GET /api/labs`, `GET /api/labs/:code`, `GET /api/labs/:code/availability`
  - `GET /api/reservations`, `GET /api/reservations/:reservationId`, `GET /api/reservations/group/:groupId`
  - `POST /api/reservations`, `PUT /api/reservations/:reservationId`, `PUT /api/reservations/group/:groupId`
  - `DELETE /api/reservations/:reservationId`, `DELETE /api/reservations/group/:groupId`
- Validation and error handling
  - Request validation via `express-validator` (400 on invalid input)
  - Not found handling (404 for missing API resources/routes)
  - Server errors (500 fallback)
  - Duplicate/booking conflict handling (409)
- Frontend integration (Milestone 4)
  - `js/auth.js`, `js/view-lab.js`, `js/profile.js`, and `js/admin.js` now use async `fetch()` via `js/data.js` API wrappers.
  - Local array persistence logic has been replaced with backend API reads/writes.
