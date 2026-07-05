# Expenses Split

A full-stack expense-splitting app for groups, roommates, and friends. Built for a final-year college project.

**Live features:**
- Sign up / log in (JWT auth)
- Create groups (trips, roommates, etc.) and add members
- Add expenses split **equally, by exact amount, by percentage, or by shares**
- Support for **multiple payers** on a single expense
- Automatic **debt simplification** — reduces everyone's balances into the minimum number of payments needed to settle up (the same core algorithm real expense apps use)
- Per-friend and per-group balance tracking
- Settle-up / mark-as-paid flow
- Direct (non-group) expenses between two friends

**Tech stack:**
- Frontend: React (Vite) + Tailwind CSS + React Router + Axios
- Backend: Node.js + Express + PostgreSQL (`pg`) + JWT + bcrypt
- Deployment: Backend on **Render**, frontend on **Vercel**

```
expenses-split/
├── backend/     ← Node/Express API + PostgreSQL
└── frontend/    ← React (Vite) client
```

---

## 1. Push to GitHub

1. Open the `splitwise-clone` folder in VS Code (`File → Open Folder`).
2. Open the built-in terminal (`` Ctrl+` ``) and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Expenses Split"
   ```
3. Create a new empty repository on GitHub (no README/license).
4. Connect and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

> `.env` files are already excluded via `.gitignore` — never commit real secrets.

---

## 2. Set up the database

You need a PostgreSQL database. Two easy free options:

- **Render PostgreSQL** (recommended — see Step 3)
- [Neon](https://neon.tech) or [Supabase](https://supabase.com) (also free tiers)

Once you have a connection string (`postgresql://user:password@host:port/dbname`), use it as `DATABASE_URL` in the backend.

---

## 3. Deploy the backend on Render

1. Go to [render.com](https://render.com) → **New → PostgreSQL**. Create a free database. Copy its **Internal Database URL**.
2. Go to **New → Web Service** → connect your GitHub repo.
3. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the Postgres connection string from step 1 |
   | `DATABASE_SSL` | `true` |
   | `JWT_SECRET` | any long random string |
   | `FRONTEND_URL` | your Vercel URL (update after Step 4) |
5. Deploy. Once live, open the Render **Shell** tab and run:
   ```bash
   npm run migrate
   ```
6. Visit `https://your-backend.onrender.com/health` — you should see `{"status":"ok"}`.

---

## 4. Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the same GitHub repo.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` |
4. Deploy. Vercel gives you a URL like `https://your-app.vercel.app`.
5. Go back to Render → your backend → Environment → update `FRONTEND_URL` to the Vercel URL → redeploy.

---

## 5. Run locally (optional)

**Backend:**
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
npm install
npm run migrate
npm run dev               # starts on http://localhost:5000
```

**Frontend:**
```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # starts on http://localhost:5173
```

---

## How the debt-simplification algorithm works

See `backend/utils/debtSimplify.js`. Each person's net balance (total paid − total owed) is computed, then a greedy algorithm repeatedly matches the biggest debtor with the biggest creditor until everyone's balance is zero.
