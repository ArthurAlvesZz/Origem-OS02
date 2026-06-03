# COFCOF.CO ERP - Deployment Guide

This guide covers the deployment of the COFCOF ERP using a standard Node.js server with PostgreSQL. 

The application is built with Vite (Frontend) and Express (Backend), and compiles into a single file for production.

---

## 1. Prerequisites

- **Node.js**: v18 or v20+
- **PostgreSQL**: v14+ (can be run via Docker)
- **Environment Variables**: A `.env` file configured.

---

## 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure you change **`JWT_SECRET`** to a secure random string and update the **`DATABASE_URL`** to match your Postgres configuration.

**Recommended Production Settings:**
- `NODE_ENV=production`
- `DATA_MODE=api`
- `APP_PUBLIC_URL=https://sua-url-publica.com`

---

## 3. Database Setup

You need an active PostgreSQL instance. 

If you want to run it via Docker Compose on your server:

```bash
docker-compose up -d
```

Then, run the database migrations and seed the initial data:

```bash
npm run db:setup
```

*(This runs `prisma generate`, `prisma migrate deploy`, and `prisma db seed`)*

---

## 4. Build and Start

First, build the application for production:

```bash
npm install
npm run build
```

Then, start the production server:

```bash
npm run start
```

This will run `node dist/server.cjs` and the app will operate on `0.0.0.0` at the port specified in your `.env`.

---

## 5. Reverse Proxy (Nginx)

We recommend running the app behind an Nginx reverse proxy with SSL (Let's Encrypt).

Example Nginx config:

```nginx
server {
    listen 80;
    server_name erp.cofcof.co;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 6. Process Manager (PM2)

To keep your application running in the background, use PM2:

```bash
npm install -g pm2
pm2 start dist/server.cjs --name "cofcof-erp"
pm2 save
pm2 startup
```

## 7. Mock Mode Fallback

If `DATABASE_URL` is unavailable or PostgreSQL is down, the frontend will automatically attempt to use `DATA_MODE=mock` in development. In production, however, a missing database connection will result in explicit errors for data endpoints.
