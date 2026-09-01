# Guess the Driver

A small F1 driver guessing app built with Next.js on the frontend and an Express + PostgreSQL backend.

Users can:
- search for drivers by name
- view driver details
- compare a guessed driver against the daily selected driver
- use the `/random` endpoint to get the driver of the day

## Tech Stack

- Frontend: Next.js
- Backend: Express.js
- Database: PostgreSQL
- Styling: Tailwind CSS

## Project Structure

```bash
.
├── src/
│   ├── app/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── model/
│   ├── routes/
│   └── index.js
├── public/
├── package.json
├── .env
├── README.md
├── next.config.mjs
├── postcss.config.mjs
├── eslint.config.mjs
└── jsconfig.json
```

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Create a `.env` file

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=test
DB_TABLE=driver
PORT=5000
```

Make sure PostgreSQL is running locally and the database has the expected table structure.

### 3) Start the backend

```bash
npm run backend
```

This runs the Express API on:

```bash
http://localhost:5000
```

### 4) Start the frontend

In a separate terminal:

```bash
npm run dev
```

Then open:

```bash
http://localhost:3000
```

## API Routes

### GET /health
Returns the backend health status.

### GET /api/drivers
Searches for drivers by name.

Example:

```bash
http://localhost:5000/api/drivers?name=hamilton
```

### GET /api/drivers/names
Returns driver names for the autocomplete list.

### GET /api/drivers/random
Returns the selected driver of the day.

## Database Notes

The app expects a PostgreSQL table named `driver` by default unless `DB_TABLE` is changed.

Common fields used by the app include:
- `drivername`
- `nationality`
- `champion`
- `years_active`
- `active`

## Deployment Notes

### Backend
Deploy the Express server to a service like Render.

Use the real hosted PostgreSQL credentials instead of `localhost` in production.

### Frontend
Deploy the Next.js app to Vercel.

Set a public backend URL in the frontend environment, such as:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Then use that value instead of hardcoded `http://localhost:5000`.

## Notes

- This project is currently set up as a local development environment with a separate frontend and backend.
- For public hosting, the backend must be deployed to a public service and the frontend must use that public URL.

## License

This project is for personal learning and development use.
