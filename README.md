# 🚀 Mini CRM — Client Lead Management System

A full-stack CRM application built with the **MERN stack** to manage,
track, and convert business leads from a clean admin dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Secure Auth** | JWT-based login with role support (admin / manager / agent) |
| ✅ **User Approval** | New registrations require admin approval before login |
| 👥 **User Management** | Admin can manage team members and assign roles |
| 📋 **Lead Management** | Create, view, edit, archive leads with full details |
| 🔄 **Status Pipeline** | Advance leads: New → Contacted → Qualified → Converted |
| 📝 **Notes & Follow-ups** | Add timestamped notes per lead with author tracking |
| 🔍 **Search & Filter** | Live search + filter by status, source, priority |
| 📊 **Analytics** | Charts for status, source, priority, and trends over time |
| 📱 **Responsive UI** | Table view + Card grid view, works on all screen sizes |
| ⚡ **Pagination & Sorting** | Server-side pagination and multi-column sorting |

---

## 🛠️ Tech Stack

**Frontend** — React 18, Vite, TailwindCSS, Chart.js, React Router v6  
**Backend** — Node.js, Express.js, JWT Auth, express-validator  
**Database** — MongoDB + Mongoose  

---

## 📁 Project Structure

```
mini-crm/
├── backend/          # Express REST API
│   ├── config/       # DB connection
│   ├── middleware/   # JWT auth + RBAC
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API route handlers
│   └── server.js
└── frontend/         # React + Vite SPA
    └── src/
        ├── api/      # Axios instance
        ├── components/
        ├── context/  # Auth context
        └── pages/
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or [MongoDB Atlas](https://cloud.mongodb.com))

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/mini-crm.git
cd mini-crm
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create your `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mini_crm
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
NODE_ENV=development
```

Start the backend:

```bash
npm run dev       # development (nodemon)
npm start         # production
```

API will be available at `http://localhost:5000/api`

---

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

App will be available at `http://localhost:5173`

---

### 4. Create your first admin account

There are two ways to create an admin account:

#### Option A: Using the seed scripts (recommended)

```bash
cd backend
node seedHoss.js    # Creates admin user: hoss@gmail.com / Hoss@811
# OR
node seedAdmin.js   # Creates admin user: hossam@gmail.com / Hoss@811
```

If the admin exists but can't login, run:
```bash
node fixAdmin.js    # Fixes isActive/isApproved status
```

#### Option B: Using the UI

Visit `http://localhost:5173/login`, switch to **"Create Account"**,
fill in your details with role **Admin**, and log in.

---

### 5. User Approval Workflow

New user registrations require admin approval before they can login:

1. **Register**: Users self-register via the "Create Account" tab
2. **Pending**: New users see "pending approval" message
3. **Approval**: Admin logs in and goes to Users page
4. **Filter**: Click "Pending" to see unregistered users
5. **Action**: Click ✓ to approve or 🗑 to reject
6. **Login**: Approved users can now login

The first registered user becomes admin automatically.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user (public - requires admin approval after first user) |
| POST | `/api/auth/login` | Login & get JWT (requires approved account) |
| GET  | `/api/auth/me` | Get current user |
| PUT  | `/api/auth/updatepassword` | Change password |
| GET  | `/api/auth/users` | Get all users (admin only) |
| PUT  | `/api/auth/users/:id/role` | Update user role (admin only) |
| PUT  | `/api/auth/users/:id/approve` | Approve a user (admin only) |
| DELETE | `/api/auth/users/:id/reject` | Reject/delete pending user (admin only) |
| PUT  | `/api/auth/users/:id/activate` | Activate/deactivate user (admin only) |

### Leads
| Method | Endpoint | Description |
|---|---|---|
| GET    | `/api/leads` | List leads (filter, search, paginate) |
| POST   | `/api/leads` | Create new lead |
| GET    | `/api/leads/analytics` | Get analytics data |
| GET    | `/api/leads/:id` | Get single lead |
| PUT    | `/api/leads/:id` | Update lead |
| DELETE | `/api/leads/:id` | Archive lead |
| PATCH  | `/api/leads/:id/status` | Quick status update |
| POST   | `/api/leads/:id/notes` | Add note |
| DELETE | `/api/leads/:id/notes/:noteId` | Delete note |

---

## 🔒 Roles & Permissions

| Action | Admin | Manager | Agent |
|---|:---:|:---:|:---:|
| View leads | ✅ | ✅ | ✅ |
| Create leads | ✅ | ✅ | ✅ |
| Edit leads | ✅ | ✅ | ✅ |
| Archive leads | ✅ | ✅ | ❌ |
| Delete leads | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ |
| View Archived leads | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| **Approve/Reject Users** | ✅ | ❌ | ❌ |
| **Activate/Deactivate Users** | ✅ | ❌ | ❌ |

---

## 🖼️ Screenshots

| Dashboard | Leads Table | Lead Detail | Analytics | Users |
|---|---|---|---|---|
| Summary stats + recent leads | Sortable, filterable table | Full lead info + notes | Charts & breakdowns | Team management |

---

## 📜 License

Hossam-Hassan © 2026 Mini CRM