# COFCOF.CO ERP - Self-Hosted Guide

This guide is specifically for independent roasters and cafes that are running the COFCOF ERP on their own local machines (e.g., a mini PC or server in the back office).

## Overview

The COFCOF ERP is designed to be multi-tenant in the cloud, but can be seamlessly run on a single machine as a single-tenant self-hosted system. 

When self-hosting:
- You control your own data.
- The server runs on your local network (e.g., `http://192.168.1.100:3000`).
- You are responsible for your own database backups.

## Installation Methods

### Method A: Fully Local (Docker for DB only)

1. **Install Node.js** (v18 or v20).
2. **Install Docker Desktop** (for Windows/Mac) or Docker Engine (for Linux).
3. Open a terminal in the project folder and run:
   ```bash
   docker-compose up -d
   ```
   *(This starts the PostgreSQL database)*
4. Create your `.env` file:
   ```bash
   cp .env.example .env
   ```
5. Install dependencies and setup the database:
   ```bash
   npm install
   npm run db:setup
   ```
6. Start the development server (for use) or build for production:
   ```bash
   npm run build
   npm run start
   ```

You can now access the ERP in your browser at `http://localhost:3000`.

To access it from other computers (like a tablet or a computer in the roasting area), find your computer's IP address (e.g., `192.168.1.50`) and visit `http://192.168.1.50:3000` from those devices.

### Method B: Backup & Restore

Since you are hosting the database, you MUST back it up. 
We've included basic scripts in `/scripts` to help with this.

**To Backup:**
Run `./scripts/backup.sh` (Linux/Mac) or `scripts\backup.ps1` (Windows).
This will dump your PostgreSQL database into a secure `.sql` file. Keep this file safe (e.g., in a Google Drive or external HD).

**To Restore:**
Run `./scripts/restore.sh path_to_backup.sql`.

## Security Warnings

- **Never** expose port 3000 to the public internet directly without a secure VPN, Tailscale, or Cloudflare Tunnel unless you know exactly what you are doing.
- Change the `JWT_SECRET` in your `.env` file!
- Change the default Admin password after you log in for the first time.
