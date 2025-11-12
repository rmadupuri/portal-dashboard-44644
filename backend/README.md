# cBioPortal Dashboard - Backend API v2.0

**Simplified backend with LevelDB and Role-Based Access Control**

## 🎯 Overview

This backend provides a RESTful API for the cBioPortal Data Contribution Dashboard with:
- ✅ **LevelDB** - Simple, fast key-value storage (no database server needed)
- ✅ **Role-Based Access Control** - Super users vs Common users
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Data Filtering** - Automatic filtering by user role

## 👥 User Roles

### Super Users (`role: 'super'`)
- **Full access** to all data
- Can see ALL columns in tracker:
  - Study ID, Cancer Type, Status, Submission Date
  - Contact Name, Contact Email, Institution
  - Data Type, Sample Count, Validation Notes, File URL
- Can manage users (change roles, delete users)
- Can approve/reject submissions

### Common Users (`role: 'user'`)
- **Limited access** to tracker data
- Can only see PUBLIC columns:
  - Study ID
  - Cancer Type
  - Status
  - Submission Date
- Can create and manage their own submissions
- Cannot see other users' contact information

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**

**No database server required!** LevelDB stores data as files on disk.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:8080
```

### 3. Start Server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

The `data/` folder will be automatically created to store LevelDB files.

## 📁 Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── index.js          # LevelDB setup
│   │   ├── users.js          # User database operations
│   │   └── submissions.js    # Submission database operations
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   └── roleCheck.js      # Role-based access control
│   ├── routes/
│   │   ├── authRoutes.js     # Authentication endpoints
│   │   ├── trackerRoutes.js  # Tracker/submission endpoints
│   │   └── userRoutes.js     # User management endpoints
│   ├── utils/
│   │   ├── jwt.js            # JWT helper functions
│   │   └── filters.js        # Role-based data filtering
│   └── server.js             # Main application
├── data/                     # LevelDB storage (auto-created)
│   ├── users/                # User database
│   ├── submissions/          # Submissions database
│   └── sessions/             # Session database
├── .env                      # Environment variables
├── .env.example              # Example environment file
└── package.json              # Dependencies
```

## 🛣️ API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "institution": "Stanford University",
  "role": "user"  // optional, defaults to "user"
}

Response:
{
  "status": "success",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "status": "success",
  "data": {
    "user": { ... },
    "token": "jwt_token_here"
  }
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "data": {
    "user": { ... }
  }
}
```

### Tracker (Submissions)

#### Get All Submissions (Filtered by Role)
```http
GET /api/tracker
Authorization: Bearer {token}

# Optional query params:
# ?status=pending
# ?cancerType=Breast Cancer

Response for Common Users:
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "id": "...",
        "studyId": "BRCA_2024",
        "cancerType": "Breast Cancer",
        "status": "approved",
        "submissionDate": "2025-01-01"
      }
    ],
    "count": 1
  }
}

Response for Super Users (all fields included):
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "id": "...",
        "studyId": "BRCA_2024",
        "cancerType": "Breast Cancer",
        "status": "approved",
        "submissionDate": "2025-01-01",
        "contactName": "Jane Smith",
        "contactEmail": "jane@stanford.edu",
        "institutionName": "Stanford University",
        "dataType": "Mutation",
        "sampleCount": 150,
        "validationNotes": "...",
        "fileUrl": "...",
        "userId": "...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "count": 1
  }
}
```

#### Get My Submissions
```http
GET /api/tracker/my
Authorization: Bearer {token}

# Users can see full details of their own submissions
```

#### Create Submission
```http
POST /api/tracker
Authorization: Bearer {token}
Content-Type: application/json

{
  "studyId": "BRCA_2024",
  "cancerType": "Breast Cancer",
  "contactName": "Jane Smith",
  "contactEmail": "jane@stanford.edu",
  "institutionName": "Stanford University",
  "dataType": "Mutation",
  "sampleCount": 150,
  "validationNotes": "Initial submission",
  "fileUrl": ""
}
```

#### Update Submission
```http
PUT /api/tracker/:id
Authorization: Bearer {token}
Content-Type: application/json

# Owner or super user can update
{
  "validationNotes": "Updated notes",
  "sampleCount": 200
}
```

#### Update Status (Super Users Only)
```http
PATCH /api/tracker/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved"  // pending, approved, rejected
}
```

#### Delete Submission
```http
DELETE /api/tracker/:id
Authorization: Bearer {token}

# Owner or super user can delete
```

#### Get Statistics (Super Users Only)
```http
GET /api/tracker/stats
Authorization: Bearer {token}

Response:
{
  "status": "success",
  "data": {
    "total": 100,
    "pending": 25,
    "approved": 60,
    "rejected": 15,
    "byCancerType": {
      "Breast Cancer": 30,
      "Lung Cancer": 25,
      ...
    }
  }
}
```

### User Management (Super Users Only)

#### Get All Users
```http
GET /api/users
Authorization: Bearer {token}
```

#### Change User Role
```http
PUT /api/users/:id/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "super"  // or "user"
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer {token}
```

## 🔐 Authentication Flow

1. **Register** or **Login** to get JWT token
2. Include token in all subsequent requests:
   ```
   Authorization: Bearer {your_token}
   ```
3. Token expires after 7 days (configurable in .env)

## 🗄️ Database Structure

### Users Collection
```javascript
{
  id: "uuid",
  email: "user@example.com",
  password: "hashed_password",
  name: "John Doe",
  institution: "Stanford",
  role: "super" | "user",
  createdAt: "ISO_date",
  lastLogin: "ISO_date"
}
```

### Submissions Collection
```javascript
{
  id: "uuid",
  userId: "user_uuid",
  
  // Public fields (all users)
  studyId: "BRCA_2024",
  cancerType: "Breast Cancer",
  status: "pending" | "approved" | "rejected",
  submissionDate: "ISO_date",
  
  // Restricted fields (super users only)
  contactName: "Jane Smith",
  contactEmail: "jane@stanford.edu",
  institutionName: "Stanford University",
  dataType: "Mutation",
  sampleCount: 150,
  validationNotes: "...",
  fileUrl: "...",
  
  createdAt: "ISO_date",
  updatedAt: "ISO_date"
}
```

## 🧪 Testing with cURL

### Register a super user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "name": "Admin User",
    "institution": "cBioPortal",
    "role": "super"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Get tracker data (replace TOKEN)
```bash
curl -X GET http://localhost:5000/api/tracker \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRE | Token expiration | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:8080 |

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Reset database
```bash
# Delete data folder and restart
rm -rf data/
npm run dev
```

### Token expired
- Login again to get a new token
- Tokens expire after 7 days by default

## 📊 Role-Based Filtering Example

When a **common user** requests tracker data:
```javascript
// Original submission
{
  id: "123",
  studyId: "BRCA_2024",
  cancerType: "Breast",
  status: "approved",
  submissionDate: "2025-01-01",
  contactEmail: "secret@example.com",  // FILTERED OUT
  sampleCount: 150                      // FILTERED OUT
}

// Filtered response for common user
{
  id: "123",
  studyId: "BRCA_2024",
  cancerType: "Breast",
  status: "approved",
  submissionDate: "2025-01-01"
}
```

## 🚀 Next Steps

1. ✅ Backend setup complete with LevelDB
2. 🔄 Connect frontend to backend
3. 🔄 Add file upload functionality
4. 🔄 Implement email notifications
5. 🔄 Add data validation

## 📝 License

ISC

## 🤝 Support

For issues or questions, please check the documentation or contact the development team.
