## 🚀 Quick Start

### Configure Environment Variables (one time)
1. Rename the example env files so you have real ones to edit:
   ```bash
   mv backend/.env.example backend/.env
   mv frontend/.env.example frontend/.env
   ```
2. Generate Google OAuth credentials:
   - Open the [Google Cloud Console](https://console.cloud.google.com/), choose your project (or create one), and go to **APIs & Services → OAuth consent screen** to set up the consent screen (add `localhost` to Authorized domains).
   - Still in **APIs & Services**, open **Credentials → Create Credentials → OAuth client ID**, pick **Web application**, add `http://localhost:8080` to Authorized JavaScript origins, and `http://localhost:5001/api/auth/google/callback` to Authorized redirect URIs.
   - Copy the Client ID/Secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` inside `backend/.env`.
3. Generate GitHub OAuth credentials:
   - Navigate to [GitHub Developer Settings](https://github.com/settings/developers), choose **OAuth Apps → New OAuth App**, set the Homepage URL to `http://localhost:8080`, and set the Authorization callback URL to `http://localhost:5001/api/auth/github/callback`.
   - After creation grab the **Client ID** and **Client Secret**, then paste them into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `backend/.env`.
4. Create a JWT secret for signing tokens:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Put the generated string into `JWT_SECRET=` in `backend/.env` (keep `JWT_EXPIRE=7d` unless you need a different lifetime).
5. Double-check the rest of `backend/.env` matches your local URLs (`BACKEND_URL=http://localhost:5001`, `FRONTEND_URL=http://localhost:8080`) and save the file. No other commands will work until this file is in place.

### Terminal 1: Start Backend
```bash
cd Github/portal-dashboard-44644/backend
npm install
npm run dev
```

### Terminal 2: Start Frontend
```bash
cd Github/portal-dashboard-44644/frontend
npm install
npm run dev
```

### Open Browser
- Frontend: http://localhost:8080
- Login page: http://localhost:8080/login
- Backend API: http://localhost:5001
