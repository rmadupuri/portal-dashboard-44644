### Frontend (http://localhost:8080)
- ✅ Login page with Google & GitHub buttons
- ✅ All routes configured
- ✅ Connects to backend API
- ✅ Environment variables configured

### Backend (http://localhost:5000)  
- ✅ LevelDB database setup
- ✅ User authentication (email/password)
- ✅ JWT token system
- ✅ Role-based access control
- ✅ Submission tracking API
- ✅ Data filtering by user role

## 🚀 Quick Start

### Terminal 1: Start Backend
```bash
cd /Users/madupurr/Github/portal-dashboard-44644/backend
npm install
npm run dev
```

### Terminal 2: Start Frontend
```bash
cd /Users/madupurr/Github/portal-dashboard-44644/frontend
npm run dev
```

### Open Browser
- Frontend: http://localhost:8080
- Login page: http://localhost:8080/login
- Backend API: http://localhost:5000

## 🎯 User Roles Explained

### 1. Common Users (`role: 'user'`)
**What they can do:**
- Register and login
- Create submissions
- View their own submissions (full details)
- View ALL submissions but with LIMITED columns:
  - ✅ Study ID
  - ✅ Cancer Type
  - ✅ Status
  - ✅ Submission Date
  - ❌ Contact info (hidden)
  - ❌ Institution details (hidden)
  - ❌ File URLs (hidden)

### 2. Super Users (`role: 'super'`)
**What they can do:**
- Everything common users can do PLUS:
- View ALL columns in tracker
- Approve/reject submissions
- Manage users (change roles, delete users)
- View statistics
- Access user management endpoints

## 📝 Creating Your First Users

### Step 1: Register a Common User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "commonuser@example.com",
    "password": "password123",
    "name": "Common User",
    "institution": "University X"
  }'
```

Response will include a JWT token.

### Step 2: Register a Super User
**First register normally, then you'll need to manually upgrade:**

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Super Admin"
  }'

# 2. Login with first user and use their token to upgrade second user
# (You'll need to implement a way to bootstrap the first super user)
```

**Temporary Solution:** Modify the register endpoint to allow creating super users during development.

## 🧪 Testing the System

### 1. Test Login Page (Frontend)
```bash
# Visit: http://localhost:8080/login
# You should see Google and GitHub login buttons
# They will redirect to backend OAuth endpoints
```

### 2. Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### 3. Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'
```

### 4. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

Save the `token` from the response!

### 5. Test Tracker (with token)
```bash
# Replace <TOKEN> with your actual token
curl http://localhost:5000/api/tracker \
  -H "Authorization: Bearer <TOKEN>"
```

### 6. Create a Submission
```bash
curl -X POST http://localhost:5000/api/tracker \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "studyId": "BRCA_2024",
    "cancerType": "Breast Cancer",
    "contactName": "Dr. Jane Smith",
    "contactEmail": "jane.smith@university.edu",
    "institutionName": "Stanford University",
    "dataType": "Mutation Data",
    "sampleCount": 150,
    "validationNotes": "All samples passed QC"
  }'
```

## 📊 Data Filtering in Action

### Common User Views Tracker:
```json
{
  "submissions": [
    {
      "id": "submission_123",
      "studyId": "BRCA_2024",
      "cancerType": "Breast Cancer",
      "status": "pending",
      "submissionDate": "2025-01-15"
    }
  ]
}
```

### Super User Views Same Data:
```json
{
  "submissions": [
    {
      "id": "submission_123",
      "studyId": "BRCA_2024",
      "cancerType": "Breast Cancer",
      "status": "pending",
      "submissionDate": "2025-01-15",
      "contactName": "Dr. Jane Smith",
      "contactEmail": "jane.smith@university.edu",
      "institutionName": "Stanford University",
      "dataType": "Mutation Data",
      "sampleCount": 150,
      "validationNotes": "All samples passed QC",
      "fileUrl": "s3://bucket/file.maf"
    }
  ]
}
```

## 🗄️ Database Location

LevelDB stores data in:
```
backend/data/
├── users/        - User accounts
├── submissions/  - Data submissions
└── sessions/     - Session tokens
```

This directory is created automatically on first run.

## 📁 Complete Project Structure

```
portal-dashboard-44644/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Login.tsx         ✅ Working
│   │   ├── components/           ✅ All components
│   │   └── App.tsx              ✅ Routes configured
│   ├── .env                      ✅ Backend URL configured
│   └── package.json              ✅ All dependencies
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js          ✅ LevelDB setup
│   │   │   ├── users.js          ✅ User operations
│   │   │   └── submissions.js    ✅ Submission operations
│   │   ├── middleware/
│   │   │   ├── auth.js           ✅ JWT authentication
│   │   │   └── roleCheck.js      ✅ Role-based access
│   │   ├── routes/
│   │   │   ├── authRoutes.js     ✅ Login/Register
│   │   │   ├── trackerRoutes.js  ✅ Submissions CRUD
│   │   │   └── userRoutes.js     ✅ User management
│   │   ├── utils/
│   │   │   ├── jwt.js            ✅ Token helpers
│   │   │   └── filters.js        ✅ Data filtering
│   │   ├── config/
│   │   │   └── passport.js       ✅ OAuth config
│   │   └── server.js             ✅ Main server
│   ├── data/                     🔄 Created automatically
│   ├── .env                      ✅ Configuration
│   └── package.json              ✅ All dependencies
│
└── README files
    ├── BACKEND_FIXED_README.md   📖 Backend guide
    ├── LOGIN_SETUP_COMPLETE.md   📖 Frontend guide
    └── QUICK_START.md            📖 This file
```

## 🎓 Learning Resources

### Understanding the Stack
- **LevelDB**: Simple key-value database (no server needed!)
- **JWT**: Tokens for authentication (instead of sessions)
- **Express**: Web framework for Node.js
- **React**: Frontend framework

### How Authentication Works
1. User registers → Password hashed → Stored in LevelDB
2. User logs in → Password verified → JWT token created
3. User makes requests → Token verified → Access granted/denied
4. Token includes role → Controls what data user can see

### How Role-Based Access Works
1. Every user has a `role` field: 'user' or 'super'
2. Middleware checks role before allowing access
3. Data filtering removes sensitive fields for common users
4. Super users bypass all filters

