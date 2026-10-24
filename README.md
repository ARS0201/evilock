# EviLock (SIH26190)
### Secure Digital Document Management and Evidence Integrity System

> **Tagline:** *Protecting Evidence. Preserving Trust.*  
> **Problem Statement:** Smart India Hackathon 2026 SIH26190

---

## 🏛️ 1. Project Overview

**EviLock** is a digital evidence and legal document management platform designed for law enforcement, judicial bodies, forensic laboratories, and audit authorities. It solves critical challenges including document tampering, unauthorized disclosure, fragmented storage, and broken chains of custody.

### Key Pillars
- **Real-Time Cryptographic Verification:** Live SHA-256 computation directly from private vault bytes ($H_{\text{live}} \stackrel{?}{=} H_{\text{ledger}}$).
- **Append-Only Tamper-Evident Ledger:** Sequential hash-chain parent-linking:
  $$H_n = \text{SHA256}(H_{n-1} \parallel \text{doc\_sha256} \parallel \text{version\_id} \parallel \text{event\_type} \parallel \text{actor\_id} \parallel \text{timestamp})$$
- **Role-Based Access Control (RBAC):** Least-privilege server-side enforcement across 7 distinct legal roles.
- **Court Legal Holds:** Statutory preservation orders preventing document disposal or deletion.
- **Controlled Versioning:** Historical versions are immutable and permanently preserved.
- **Courtroom-Worthy Brown & Cream Design System:** High-contrast palette using Dark Espresso Brown (`#3B2923`), Deep Coffee (`#4B342B`), Walnut Brown (`#795548`), Warm Caramel (`#B8875B`), Sand Beige (`#E5D7C8`), and Soft Cream (`#FFFDF9`).

---

## 🔑 2. Pre-Seeded 1-Click Demo Accounts

The database comes pre-seeded with realistic Indian legal/investigation scenarios (FIR No. 204/2026, Forensic Ballistics Dump, Witness Affidavits, and Case `CR-2026-0491`).

| Role | Username | Password | Official Name & Designation |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `Admin@1234` | Vikramaditya Rathore, Director of IT & Security |
| **Investigating Officer** | `io_rajesh` | `Officer@1234` | Insp. Rajesh Kumar, Senior Investigating Officer (CID) |
| **Police Officer** | `po_vikram` | `Police@1234` | Sub-Insp. Vikram Singh, Station Sub-Inspector (CCIC) |
| **Legal Officer / Prosecutor** | `prosecutor_meera` | `Legal@1234` | Adv. Meera Sen, Public Prosecutor (Directorate of Prosecution) |
| **Court-Authorized User** | `judge_sharma` | `Court@1234` | Hon. Justice K. P. Sharma, Additional District Judge |
| **Forensic Expert** | `dr_sunita` | `Forensic@1234` | Dr. Sunita Rao, Head of Digital Forensics (FSL) |
| **Authorized Auditor** | `auditor_verma` | `Audit@1234` | Anand Verma, Principal Security Auditor (CAG/Audit) |

*(Note: In the web UI, you can also use the **1-Click Demo Role Switcher** in the top navigation bar or on the login page to instantly test different permissions without typing credentials).*

---

## 🚀 3. How to Run Locally

### Prerequisites
- **Node.js** v20+ and npm
- **Python** 3.11+ (managed via `uv` or system Python)

### Running the Backend (FastAPI)
```powershell
cd d:\evilock\backend
# Activate virtual environment
.\.venv\Scripts\activate

# Run FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### Running the Frontend (React + Vite)
```powershell
cd d:\evilock\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser at: `http://127.0.0.1:5173/`

### Running Automated Test Suite
```powershell
cd d:\evilock\backend
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -v
```

---

## 🎯 4. Smart India Hackathon Live Jury Demonstration Walkthrough

Follow this scripted 5-minute live demonstration for the jury:

1. **Step 1: Public Portal (`http://127.0.0.1:5173/`)**
   - Show the courtroom-worthy brown and cream visual design.
   - Highlight the 6 feature cards and 6-step chain-of-custody workflow.
   - Click **"Access Portal"**.

2. **Step 2: Instant Demo Authentication**
   - Click on the **"Investigating Officer"** card (`io_rajesh`).
   - Notice the seamless transition to the role-specific dashboard with dynamic Recharts analytics and live database statistics.

3. **Step 3: Evidence Dossier & Real Verification**
   - Click **"Evidence Vault"** in the sidebar.
   - Select **"DOC-2026-10491"** (FIR No. 204/2026).
   - Click **"Verify Live Integrity"**:
     - The system re-hashes physical vault bytes on disk.
     - Displays the **Forest Green `VERIFIED`** banner showing the exact live hash matching Ledger Block #1.

4. **Step 4: The Live Tamper Detection Test (The "WOW" Moment)**
   - Click **"Simulate Tamper"** on the evidence page.
   - A single bit-flip is injected directly into the disk storage file.
   - Click **"Verify Live Integrity"** again:
     - The system immediately flags a **Muted Crimson `TAMPER DETECTED: HASH MISMATCH`** banner!
     - Shows the difference between the recorded ledger hash and the altered disk hash.
     - Logs an unauthorized modification alert into the Audit Trail.

5. **Step 5: Integrity Ledger & Mathematical Chain Audit**
   - Click **"Integrity Ledger"** in the sidebar.
   - Inspect the sequential blocks, previous hash links ($H_{n-1}$), and canonical entry hashes ($H_n$).
   - Click **"Run Cryptographic Chain Audit"** to verify total mathematical continuity across all blocks.

6. **Step 6: Security Auditor Inspection**
   - Using the top bar's 1-click role switcher, select **"Security Auditor"**.
   - Navigate to **"Audit Trail"** to inspect the tamper alert event and export the signed audit certificate CSV.

---

## 🌐 5. Global Database Setup (PostgreSQL)

EviLock includes automated cloud database provisioning and integrity verification scripts that work with any globally distributed PostgreSQL provider (such as **Neon**, **Supabase**, **Render**, **Railway**, or **AWS RDS**).

### Quick Free Global Database (Neon / Supabase):
1. Create a free account at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
2. Create a new PostgreSQL project (e.g. `evilock-global-db`).
3. Copy your database connection string (e.g. `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`).
4. Run the automated database provisioner & chain verification script:

```powershell
# Provision schema, seed 7 roles, insert demo evidence and verify unbroken hash continuity
python scripts/deploy_db.py --url "postgresql+psycopg2://<user>:<password>@<host>/<dbname>?sslmode=require"
```

---

## ☁️ 6. Global Cloud Deployment Options

### Option A: 1-Click Render Blueprint (`render.yaml`)
The repository includes a pre-configured `render.yaml` blueprint deploying:
- **Global Managed PostgreSQL** (`evilock-postgres`)
- **FastAPI Backend Web Service** (`evilock-backend`)
- **Vite React Frontend Static Site** (`evilock-frontend`)

1. Push this repository to GitHub/GitLab.
2. On [Render](https://dashboard.render.com/), click **"New +"** $\rightarrow$ **"Blueprint"**.
3. Select your repository. Render will automatically detect `render.yaml` and deploy all 3 tiers with free HTTPS/SSL!

### Option B: Vercel (Frontend) + Render/Railway (Backend)
1. **Deploy Backend**: Deploy the `backend/` folder on Render or Railway with `DATABASE_URL` pointing to your Neon/Supabase PostgreSQL.
2. **Deploy Frontend on Vercel**:
   - Import the `frontend/` directory into Vercel.
   - Set environment variable: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
   - Click **Deploy**. Vercel routes all SPA pages via the included `vercel.json`.

### Option C: Docker & Docker Compose (Any Cloud VPS / AWS / GCP / DigitalOcean)
Deploy full-stack EviLock (PostgreSQL + FastAPI + React SPA with Nginx reverse proxy) in a single command:

```bash
docker compose up -d --build
```
- Frontend live at: `http://<SERVER_IP>/`
- Backend live at: `http://<SERVER_IP>:8000/docs`
- Persistent evidence vault mounted at volume `vault_data`.
