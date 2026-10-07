# TECHNO JIGYASA CLUB — Smart Attendance Management System

An automated, full-stack smart attendance management platform built for the **Techno Jigyasa Club**. The system replaces manual attendance sheets with cryptographically signed dynamic QR code passes, high-speed camera scanning, real-time analytics, and dual daily session tracking.

---

## 🛠️ Technology Stack

### Frontend (`client/`)
- **Core Framework:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS (custom club theme with dark-mode aesthetic)
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **QR Code Engine:** `qrcode.react` (card generation) & `html5-qrcode` (camera scanner)

### Backend (`server/`)
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma ORM
- **Database:** PostgreSQL
- **Security & Utilities:** Helmet, CORS, Cookie-Parser, Bcrypt.js, JsonWebToken, Zod, Multer

---

## 📋 Required Software
- **Node.js:** v20.x or higher
- **NPM:** v10.x or higher
- **PostgreSQL:** v14 or higher (or cloud PostgreSQL provider such as Neon / Supabase / Railway)

---

## 🚀 Environment Setup

### 1. Server Configuration
Navigate to the `server/` directory and create `.env` from the provided example:
```bash
cd server
copy .env.example .env
```
Configure your environment variables:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/techno_jigyasa_attendance?schema=public"

# Security Secrets (generate strong random keys in production)
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"
JWT_REFRESH_EXPIRES_IN="7d"
COOKIE_SECRET="your_cookie_secret_key"
QR_SECRET="your_cryptographic_qr_secret_key"

# Uploads
UPLOAD_DIR="uploads/profiles"
MAX_FILE_SIZE_MB=2
```

---

## 🗄️ Database Setup & Prisma Migrations

Prisma handles migrations and type-safe client generation.

### 1. Validate Prisma Schema
```bash
cd server
npx prisma validate
```

### 2. Generate Prisma Client
```bash
cd server
npx prisma generate
```

### 3. Run Initial Migration
Ensure your PostgreSQL database service is running and `DATABASE_URL` is configured, then apply the migration:
```bash
cd server
npx prisma migrate dev --name init
```
For production deployments:
```bash
npx prisma migrate deploy
```

---

## 🏃‍♂️ How to Run the Application

### 1. Backend Server
```bash
cd server
npm run dev
```
The server starts at `http://localhost:5000` with health check at `http://localhost:5000/api/health`.

### 2. Frontend Client
```bash
cd client
npm run dev
```
The client starts at `http://localhost:5173`.

---

## 📁 Project Structure

```text
techno-jigyasa-attendance/
│
├── client/                     # Frontend (React + TS + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Common, Layout, Student, Admin components
│   │   ├── context/            # Global Auth and State providers
│   │   ├── hooks/              # Custom React hooks (scanner, auth, debounce)
│   │   ├── pages/              # Auth, Student, Admin pages
│   │   ├── routes/             # App routing and protection guards
│   │   ├── services/           # Axios API clients
│   │   ├── types/              # Frontend TypeScript definitions
│   │   └── utils/              # Export formatters & card canvas helpers
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Backend (Node.js + Express + TS + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma       # Database models, enums & relationships
│   │   └── migrations/         # PostgreSQL migration files
│   ├── src/
│   │   ├── config/             # Environment, DB, Constants
│   │   ├── controllers/        # Express route handlers
│   │   ├── middlewares/        # JWT auth, RBAC, Zod validation, Multer
│   │   ├── routes/             # API routes
│   │   ├── services/           # QR crypto engine, Attendance, Export
│   │   ├── types/              # Backend typings
│   │   ├── utils/              # Hash & Token utilities
│   │   ├── validators/         # Zod schemas
│   │   └── index.ts            # Server entry point
│   ├── .env.example            # Environment variables template
│   └── package.json
│
├── uploads/                    # Local storage directory for student photos
│   └── profiles/
├── DEVELOPMENT_PLAN.md         # Complete system architecture & phase roadmap
├── README.md                   # Project documentation and quickstart
└── .gitignore                  # Monorepo git ignore rules
```

---

## 🛡️ Database Models & Constraints

1. **`Admin`**: Club administrators with hashed credentials and roles (`SUPER_ADMIN`, `ADMIN`).
2. **`Student`**: Registered students with unique `erpId`, department, section, profile image, and versioned `qrTokenVersion`.
3. **`AttendanceSession`**: Two daily attendance periods (`SESSION_1` morning, `SESSION_2` afternoon) with `UNIQUE(date, sessionType)` constraint.
4. **`AttendanceRecord`**: Immutable attendance log protected by `UNIQUE(studentId, sessionId)` constraint against race conditions and double scans.
5. **`ActivityLog`**: Comprehensive audit log recording all administrative modifications and scan verifications.

---

## 📜 License
Developed for Techno Jigyasa Club. All rights reserved.
