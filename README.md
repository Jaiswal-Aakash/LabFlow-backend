# LabFlow Backend

This is the **REST API** behind [LabFlow](https://lab-flow-dash.vercel.app) — a lab workspace for IT and CS students.

Students use the [frontend app](https://github.com/Jaiswal-Aakash/LabFlow-frontend) to save lab outputs and build Word reports. This repo handles authentication, file uploads, MongoDB storage, and `.docx` generation.

**Live API:** [labflow-backend-92la.onrender.com](https://labflow-backend-92la.onrender.com)  
**Frontend:** [LabFlow-frontend](https://github.com/Jaiswal-Aakash/LabFlow-frontend)

---

## What this API does

In plain terms, the backend lets each student:

1. **Sign up and log in** with a JWT — every lab record is tied to their account
2. **Create subjects and sessions** — folders for courses and practical days
3. **Upload lab outputs** — screenshots with notes, code, and tags
4. **Search** past outputs by keyword or tag
5. **Build Word documents** — pick outputs, reorder blocks, save a report recipe in MongoDB, download `.docx` on demand
6. **Share reports** — generate a public link so someone can download a report without logging in

Images go to **Cloudinary** in production (so they survive redeploys) or to a local `uploads/` folder in development.

---

## How data is organised

Everything belongs to a user. The hierarchy looks like this:

```
User
 └── Subject          (e.g. "Java Lab")
      └── LabSession  (e.g. "Week 3 — JDBC")
           └── Output (image + title + note + code + tags)
      └── LabReport   (saved Word doc recipe: title + ordered blocks)
```

Reports are stored as **recipes** in MongoDB (title, blocks, linked sessions). The actual `.docx` file is generated when the user hits export — nothing is stored as a binary blob in the database.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt |
| Uploads | Multer → Cloudinary (prod) or local disk (dev) |
| Documents | `docx` package for Word export |
| Security | Helmet, CORS whitelist, rate limiting |
| Hosting | [Render](https://render.com) |

The server can run as a single process (`npm start`) or with multiple workers via `cluster.js` for heavier traffic.

---

## Run locally

### Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Setup

```bash
git clone https://github.com/Jaiswal-Aakash/LabFlow-backend.git
cd LabFlow-backend
npm install
cp .env.example .env
# Edit .env — at minimum set MONGO_URI and JWT_SECRET
npm run dev
```

The API listens on **port 4000** by default (or whatever you set in `PORT`).

Quick health check:

```bash
curl http://localhost:4000/health
# {"status":"ok","uptime":...}
```

---

## Environment variables

Copy `.env.example` and fill in the values you need.

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `4000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | At least 32 characters in production |
| `CORS_ORIGINS` | Prod | Comma-separated frontend URLs, e.g. `https://lab-flow-dash.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Prod | Cloudinary credentials for image storage |
| `CLOUDINARY_API_KEY` | Prod | |
| `CLOUDINARY_API_SECRET` | Prod | |
| `CLOUDINARY_FOLDER` | No | Upload folder prefix (default `labflow`) |
| `MAX_UPLOAD_MB` | No | Max size per image (default 5) |
| `MAX_UPLOAD_FILES` | No | Max files per bulk upload (default 20) |
| `BCRYPT_ROUNDS` | No | Password hashing cost (default 10) |
| `RATE_LIMIT_MAX` | No | Global requests per IP per minute |
| `AUTH_RATE_LIMIT_MAX` | No | Auth attempts per IP per minute |

**Local dev tip:** `http://localhost:5173` is always allowed for CORS, even if you forget to add it to `CORS_ORIGINS`.

**Production tip:** Without Cloudinary, uploads land on the server’s disk and disappear when Render redeploys. Set all three Cloudinary vars for production.

---

## Deploy to Render

1. Create a **Web Service** on Render and connect this GitHub repo.
2. Set **Build command:** `npm install`
3. Set **Start command:** `npm start`
4. Add environment variables from the table above (especially `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGINS`, Cloudinary).
5. After each push to `main`, trigger **Manual Deploy** if auto-deploy is off.

Verify after deploy:

```bash
curl https://your-service.onrender.com/api/stats
# {"userCount":4,"outputCount":2,"sessionCount":1}
```

If you only see `userCount`, the latest code has not been deployed yet.

---

## API overview

All routes under `/api` except where noted. Protected routes need:

```
Authorization: Bearer <jwt>
```

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness (MongoDB connected) |
| GET | `/api/stats` | Public landing-page counts |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT |
| GET | `/api/shared/reports/:shareToken` | Shared report metadata |
| GET | `/api/shared/reports/:shareToken/download` | Download shared `.docx` |

### Auth (protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/profile` | Current user |
| PATCH | `/api/auth/profile` | Update name or tour preferences |

### Subjects

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subjects` | List subjects |
| POST | `/api/subjects` | Create subject |
| GET | `/api/subjects/:id` | Get one subject |
| PATCH | `/api/subjects/:id` | Rename / update |
| DELETE | `/api/subjects/:id` | Delete subject and related data |

### Sessions (nested under subject)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subjects/:id/sessions` | List sessions |
| POST | `/api/subjects/:id/sessions` | Create session |
| GET | `/api/subjects/:id/sessions/:sessionId` | Get session |
| PATCH | `/api/subjects/:id/sessions/:sessionId` | Update session |
| DELETE | `/api/subjects/:id/sessions/:sessionId` | Delete session |

### Outputs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subjects/:id/sessions/:sessionId/outputs` | List outputs in session |
| POST | `/api/subjects/:id/sessions/:sessionId/outputs` | Bulk upload (multipart) |
| GET | `/api/outputs/:outputId` | Get output |
| PATCH | `/api/outputs/:outputId` | Update title, note, code, tags |
| DELETE | `/api/outputs/:outputId` | Delete output |
| GET | `/api/outputs/:outputId/download-image` | Download original image |

### Search

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=&tag=` | Search outputs |
| GET | `/api/search/tags` | List tags used by the user |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subjects/:id/reports` | List saved reports for subject |
| POST | `/api/subjects/:id/reports` | Create new report |
| POST | `/api/subjects/:id/reports/export` | Export draft without saving |
| GET | `/api/reports/:reportId` | Get report recipe |
| PATCH | `/api/reports/:reportId` | Update report |
| DELETE | `/api/reports/:reportId` | Delete report |
| GET | `/api/reports/:reportId/export` | Download `.docx` |
| POST | `/api/reports/:reportId/share` | Enable public share link |
| DELETE | `/api/reports/:reportId/share` | Disable share link |

Static files from local dev uploads are served at `/uploads/...` when Cloudinary is not configured.

---

## Project structure

```
backend/
├── app.js                 # Express app, middleware, route mounting
├── server.js              # Start server + DB connection
├── cluster.js             # Optional multi-worker entry
├── config/                # DB, env validation, Cloudinary
├── controllers/           # Route handlers
├── middleware/            # Auth, uploads, rate limits, errors
├── models/                # User, Subject, LabSession, Output, LabReport
├── routes/                # Express routers
├── services/              # docxBuilder, imageStorage
└── utils/                 # Shared helpers
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Nodemon — auto-restart on file changes |
| `npm start` | Production server (single worker) |
| `npm run start:cluster` | Multi-worker mode |

---

## Production notes

- **CORS:** Set `CORS_ORIGINS` to your Vercel frontend URL. Without it, the browser will block login and API calls from production.
- **Cloudinary:** Required for persistent images on Render’s ephemeral filesystem.
- **JWT_SECRET:** Use a long random string — never commit it.
- **Rate limiting:** Auth routes are stricter than general API traffic to reduce brute-force attempts.
- **Stats endpoint:** `/api/stats` is cached for 60 seconds and powers the landing page counters.

---

## Team

LabFlow was built by a team of **four**:

| Person | Role |
|--------|------|
| **Aakash** | Backend development and parts of the frontend |
| **Ninad** | Most of the frontend — UI, pages, and lab workflow |
| **Divya** | Database design and parts of the backend |
| **Vardhan** | Testing and QA |

---

## License

Part of the LabFlow project. See the frontend repo for UI setup and screenshots.
