# QueueLess — Backend API

Node.js + Express + MongoDB + Socket.io backend for the QueueLess Smart Queue Management System.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Server      | Node.js + Express                 |
| Database    | MongoDB (Mongoose ODM)            |
| Real-time   | Socket.io                         |
| Auth        | JWT (jsonwebtoken + bcryptjs)     |
| Validation  | express-validator                 |
| Rate limit  | express-rate-limit                |

---

## Folder Structure

```
queueless-backend/
├── src/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # register, login, me
│   │   ├── shopController.js   # CRUD for shops
│   │   ├── queueController.js  # join, callNext, done, verify…
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + requireRole
│   │   └── errorHandler.js     # Central error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Shop.js
│   │   ├── QueueEntry.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── shops.js
│   │   ├── queue.js
│   │   └── notifications.js
│   ├── socket/
│   │   └── index.js            # Socket.io setup + JWT handshake
│   └── server.js               # Entry point
├── scripts/
│   └── seed.js                 # Demo data seeder
├── src/frontend/               # Drop-in frontend files
│   ├── api.js                  → copy to  src/services/api.js
│   ├── AuthContext.jsx         → copy to  src/context/AuthContext.jsx
│   ├── useSocket.js            → copy to  src/hooks/useSocket.js
│   └── LoginPage.handleLogin.diff.js  (see step 6 below)
├── .env.example
└── package.json
```

---

## Quick Start

### 1. Prerequisites

- **Node.js** ≥ 18
- **MongoDB** — local (`mongod`) or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)

### 2. Install dependencies

```bash
cd queueless-backend
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/queueless   # or your Atlas URI
JWT_SECRET=change_this_to_a_random_32_char_string
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:5173             # your Vite dev server
```

### 4. Seed the database

```bash
npm run seed
```

Creates:
| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@queueless.com      | admin1234   |
| User  | raj@example.com          | user1234    |
| User  | priya@example.com        | user1234    |

Plus 6 shops and demo queue entries.

### 5. Start the server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs at **http://localhost:5000**

---

## Frontend Integration

### Step 1 — Copy files

```
src/frontend/api.js             →  src/services/api.js
src/frontend/AuthContext.jsx    →  src/context/AuthContext.jsx
src/frontend/useSocket.js       →  src/hooks/useSocket.js
```

### Step 2 — Add Vite env vars

In your frontend's `.env` (or `.env.local`):

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3 — Install socket.io-client in the frontend

```bash
npm install socket.io-client
```

### Step 4 — Wrap your app with AuthProvider

In `src/main.jsx`:

```jsx
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// ...

root.render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/"          element={<LoginPage />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/admin"     element={<AdminDashboard />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);
```

### Step 5 — Update LoginPage inputs (5 min change)

See `src/frontend/LoginPage.handleLogin.diff.js` for the exact changes:

- Add `value` / `onChange` props to `InputField`
- Add `email`, `password`, `name`, `phone`, `authErr`, `authLoading` state
- Replace `handleLogin` with the async version that calls the backend
- Wire up `handleRegister` for the register tab

### Step 6 — Replace mock data in AdminDashboard & UserDashboard

The dashboards already use `useAuth()` and `useNavigate()` correctly. To replace mock data:

**AdminDashboard** — replace `INIT_CUSTOMERS` and `INIT_SHOPS` state init:

```jsx
import api from "../services/api";
import useSocket from "../hooks/useSocket";

// In component:
const [customers, setCustomers] = useState([]);
const [shops,     setShops]     = useState([]);
const { socket, joinShop }      = useSocket();

useEffect(() => {
  api.shops.my().then(({ shops }) => setShops(shops));
}, []);

// When a shop is selected, load its queue:
useEffect(() => {
  if (!selectedShopId) return;
  api.queue.get(selectedShopId).then(({ queue }) => setCustomers(queue));
  joinShop(selectedShopId);
  socket?.on("queue:updated", ({ queue }) => setCustomers(queue));
  socket?.on("shop:updated",  (shop)      => setShops(prev => prev.map(s => s._id === shop._id ? shop : s)));
}, [selectedShopId, socket]);
```

Replace `callNext`, `markDone`, `removeCustomer`, `togglePause`, `createShop`, `verifyToken` handlers to call `api.queue.*` and `api.shops.*` instead of `setState` only.

**UserDashboard** — replace `MOCK_SHOPS` and `MOCK_NOTIFS`:

```jsx
useEffect(() => {
  api.shops.list().then(({ shops })           => setShops(shops));
  api.notifications.list().then(({ notifications }) => setNotifs(notifications));
  api.queue.myActive().then(({ entry })       => { if (entry) setMyQueue(entry); });
}, []);
```

---

## API Reference

### Auth
| Method | Path               | Auth  | Body                              |
|--------|--------------------|-------|-----------------------------------|
| POST   | /api/auth/register | ✗     | name, email, password, role, phone|
| POST   | /api/auth/login    | ✗     | email, password, role             |
| GET    | /api/auth/me       | ✓     |                                   |
| PATCH  | /api/auth/me       | ✓     | name, phone, smsNotifications…    |

### Shops
| Method | Path               | Role  |
|--------|--------------------|-------|
| GET    | /api/shops         | any   |
| GET    | /api/shops/my      | admin |
| POST   | /api/shops         | admin |
| PATCH  | /api/shops/:id     | admin |
| DELETE | /api/shops/:id     | admin |

### Queue
| Method | Path                          | Role  |
|--------|-------------------------------|-------|
| GET    | /api/queue/:shopId            | any   |
| GET    | /api/queue/my                 | user  |
| POST   | /api/queue/:shopId/join       | user  |
| PATCH  | /api/queue/entry/:id/cancel   | user  |
| POST   | /api/queue/:shopId/next       | admin |
| PATCH  | /api/queue/entry/:id/done     | admin |
| DELETE | /api/queue/entry/:id          | admin |
| POST   | /api/queue/:shopId/pause      | admin |
| POST   | /api/queue/verify             | admin |
| GET    | /api/queue/:shopId/analytics  | admin |

### Notifications
| Method | Path                           | Role |
|--------|--------------------------------|------|
| GET    | /api/notifications             | any  |
| PATCH  | /api/notifications/read-all    | any  |
| PATCH  | /api/notifications/:id/read    | any  |

---

## Socket Events

### Client → Server
| Event          | Payload    | Description             |
|----------------|------------|-------------------------|
| joinShopRoom   | shopId     | Subscribe to shop queue |
| leaveShopRoom  | shopId     | Unsubscribe             |
| ping           |            | Heartbeat               |

### Server → Client
| Event               | Room         | Payload                      |
|---------------------|--------------|------------------------------|
| queue:joined        | shop:<id>    | { entry, queueLength }       |
| queue:updated       | shop:<id>    | { queue, queueLength }       |
| queue:entryUpdated  | shop:<id>    | { entryId, status }          |
| queue:entryRemoved  | shop:<id>    | { entryId }                  |
| queue:yourTurn      | user:<id>    | { token, shop }              |
| queue:completed     | user:<id>    | { token, shop }              |
| notification:new    | user:<id>    | { title, shop }              |
| shop:created        | global       | shop object                  |
| shop:updated        | shop:<id>    | shop object                  |
| shop:statusChanged  | shop:<id>    | { shopId, status }           |
