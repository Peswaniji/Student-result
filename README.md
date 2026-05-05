# 📚 Student Result Management System

Mobile-first web application for teachers to manage student test results and for students to access their results.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React + Vite)             │
│  - Admin Dashboard (Teacher Portal)         │
│  - Student Result Page                      │
│  - Public Test View                         │
└─────────────────┬───────────────────────────┘
                  │
                  │ API Calls (Axios)
                  ▼
┌─────────────────────────────────────────────┐
│     Backend (Express + Node.js)             │
│  - Authentication (JWT)                     │
│  - Test Management                          │
│  - Student Management                       │
│  - Result Management                        │
└─────────────────┬───────────────────────────┘
                  │
                  │ Database Queries
                  ▼
┌─────────────────────────────────────────────┐
│    MongoDB (Atlas Cloud)                    │
│  - Students Collection                      │
│  - Tests Collection                         │
│  - Results Collection                       │
│  - Admin Users Collection                   │
└─────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm run install-all

# 2. Setup environment variables
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret

# Frontend
cp frontend/.env.example frontend/.env.local
# Keep default: VITE_API_URL=http://localhost:5000/api

# 3. Start both servers (requires concurrently)
npm run dev

# OR separately:
npm run dev:backend  # Terminal 1
npm run dev:frontend # Terminal 2

# 4. Open browser
http://localhost:5173
```

### Backend Setup

```bash
cd backend
npm install
npm run dev  # Runs with nodemon for hot reload
```

**Backend runs on:** `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Runs with Vite dev server
```

**Frontend runs on:** `http://localhost:5173`

## 🌐 Deployment (Render)

### Option 1: Automated (Recommended)

1. Push code to GitHub
2. Go to https://render.com
3. Create new Web Service
4. Connect GitHub repository
5. Add environment variables
6. Deploy!

**See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed steps**

### Option 2: Manual Build

```bash
# Build frontend
cd frontend
npm run build

# Backend will serve static files from frontend/dist
cd ../backend
npm start
```

## 📋 Environment Variables

### Backend (.env)

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:5000/api
```

## 📁 Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # API controllers
│   ├── middleware/      # Authentication, uploads
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── uploads/         # User uploads folder
│   ├── server.js        # Express app
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service (Axios)
│   │   ├── App.jsx      # Main component
│   │   └── main.jsx     # Entry point
│   ├── vite.config.js   # Vite configuration
│   └── package.json
│
├── render.yaml          # Render deployment config
├── DEPLOYMENT_GUIDE.md  # Step-by-step deployment
└── package.json         # Root scripts
```

## 🔑 Features

### 👨‍🏫 Admin Portal (Teachers)
- Create and manage tests
- Add students (manual + bulk CSV upload)
- Upload student answer sheets
- Enter and edit marks
- Preview and finalize results
- View all test results

### 👨‍🎓 Student Portal
- View their test results privately
- Search and access results by test name
- See marks, percentage, rank (if enabled)
- Mobile-friendly interface

### 🔐 Security
- JWT-based authentication
- Password hashing with bcryptjs
- CORS configuration
- Role-based access control

## 🛠️ Tech Stack

**Frontend:**
- React 19
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (HTTP client)
- React Router (navigation)

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT (authentication)
- Multer (file uploads)
- bcryptjs (password hashing)

## 📦 API Endpoints

### Authentication
```
POST   /api/auth/register   - Register admin
POST   /api/auth/login      - Login admin
```

### Tests
```
GET    /api/tests           - Get all tests
GET    /api/tests/:id       - Get test details
POST   /api/tests           - Create test (admin only)
PUT    /api/tests/:id       - Update test (admin only)
DELETE /api/tests/:id       - Delete test (admin only)
```

### Students
```
GET    /api/students        - Get all students
POST   /api/students        - Add student (admin only)
POST   /api/students/bulk   - Bulk upload (CSV)
DELETE /api/students/:id    - Delete student (admin only)
```

### Results
```
GET    /api/results/:testId - Get test results
POST   /api/results         - Enter marks (admin only)
PUT    /api/results/:id     - Update marks (admin only)
GET    /api/results/student/:studentId - Get student's results
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (Windows)
taskkill /PID <PID> /F
```

### MongoDB connection error
- Check connection string in `.env`
- Verify MongoDB Atlas network access
- Ensure IP whitelist includes your IP

### CORS errors
- Check `FRONTEND_URL` in backend `.env`
- Verify proxy settings in `vite.config.js`

### Build fails
```bash
npm install  # Reinstall all dependencies
npm run build # Try build again
```

## 📚 Learn More

- [Express Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## 📄 License

ISC

## 👨‍💻 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

**Happy Deploying! 🚀**
