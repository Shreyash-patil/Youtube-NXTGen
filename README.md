# 🎬 Youtube-NXTGen

A full-stack, next-generation YouTube clone built with **Next.js** and **Express.js** — featuring video uploads, real-time WebRTC voice/video calls, tiered subscription plans with Razorpay payments, OTP-based authentication, and a location-aware dynamic theme system.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎥 Core Video Platform
- **Video Upload & Streaming** — Upload videos with metadata (title, description, channel) and stream them directly in-browser
- **Video Player** — Custom player with gesture-based controls (tap-to-seek, pause/resume, navigation)
- **Like / Dislike System** — Toggle likes and dislikes on videos with real-time count updates
- **Comments** — Nested comment system with upvote/downvote support
- **View Tracking** — Automatic view count increment on video playback
- **Search** — Search videos and channels with real-time results
- **Category Tabs** — Filter content by category on the home page

### 👤 User & Channel
- **Google Sign-In** — Firebase Authentication with Google OAuth
- **OTP Verification** — Two-factor verification via email (South India) or SMS (other regions) using IP-based geolocation
- **Channel Pages** — User profiles with channel name, description, subscriber count, video count, and total views
- **Channel Management** — Edit channel name and description
- **Subscriptions** — Subscribe/unsubscribe to channels with subscriber count tracking

### 💰 Premium Plans (Razorpay)
- **Tiered Subscriptions** — Free, Bronze (₹10), Silver (₹50), Gold (₹100)
- **Watch Time Limits** — Free: 5 min, Bronze: 7 min, Silver: 10 min, Gold: Unlimited
- **Razorpay Integration** — Secure payment processing with signature verification
- **Invoice Emails** — Automatic invoice sent to the user's email on successful payment

### 📞 Real-Time Communication
- **WebRTC Voice/Video Calls** — Peer-to-peer calling between users via WebSocket signaling server
- **Room-Based Architecture** — Multi-peer room support with join/leave notifications
- **ICE Candidate Exchange** — Full WebRTC offer/answer/ICE candidate negotiation

### 🎨 Smart Theming
- **Location-Aware Theme** — Automatic light/dark mode based on user's geographic location and IST time
- **South India Detection** — Users in Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, or Telangana get light theme between 10 AM – 12 PM IST
- **Auto-Refresh** — Theme re-evaluates every 60 seconds

### 📚 User Library
- **Watch History** — Tracks videos the user has watched
- **Watch Later** — Save videos to watch later
- **Liked Videos** — View all liked videos in one place
- **Downloads** — Download page for offline access

---

## 🛠 Tech Stack

### Frontend (`/yourtube`)
| Technology | Purpose |
|---|---|
| **Next.js 15** | React framework with Pages Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Radix UI** | Accessible primitives (Avatar, Dialog, Dropdown, Progress, Label) |
| **Lucide React** | Icon library |
| **Firebase** | Google Authentication |
| **Axios** | HTTP client |
| **Sonner** | Toast notifications |
| **date-fns** | Date formatting |
| **next-themes** | Theme management |

### Backend (`/server`)
| Technology | Purpose |
|---|---|
| **Express 5** | Web framework |
| **MongoDB + Mongoose** | Database & ODM |
| **WebSocket (ws)** | Real-time signaling for WebRTC |
| **Razorpay SDK** | Payment processing |
| **Firebase Admin** | Auth verification |
| **Nodemailer** | Email service (OTP & invoices) |
| **JSON Web Tokens** | Authentication tokens |
| **Multer** | File upload handling |
| **Nodemon** | Development auto-reload |

---

## 📁 Project Structure

```
Youtube-NXTGen/
├── .gitignore
├── README.md
│
├── server/                       # Express.js Backend
│   ├── index.js                  # Entry point — Express + WebSocket server
│   ├── package.json
│   ├── .env                      # Server environment variables
│   ├── .gitignore
│   │
│   ├── Modals/                   # Mongoose schemas
│   │   ├── Auth.js               # User model (email, plan, subscribers)
│   │   ├── video.js              # Video model (title, file, views, likes)
│   │   ├── comment.js            # Comment model
│   │   ├── commentvote.js        # Comment upvote/downvote model
│   │   ├── like.js               # Like model
│   │   ├── dislike.js            # Dislike model
│   │   ├── subscription.js       # Subscription model
│   │   ├── payment.js            # Razorpay payment model
│   │   ├── history.js            # Watch history model
│   │   ├── watchlater.js         # Watch later model
│   │   ├── download.js           # Download tracking model
│   │   ├── videoview.js          # View tracking model
│   │   └── otp.js                # OTP model
│   │
│   ├── controllers/              # Business logic
│   │   ├── auth.js               # Auth, profile, plans, subscriptions
│   │   ├── video.js              # Video CRUD & view counting
│   │   ├── comment.js            # Comment CRUD & voting
│   │   ├── like.js               # Like toggling
│   │   ├── dislike.js            # Dislike toggling
│   │   ├── history.js            # Watch history management
│   │   ├── watchlater.js         # Watch later management
│   │   ├── otp.js                # OTP send/verify logic
│   │   └── emailService.js       # Email templates & sending
│   │
│   ├── routes/                   # Express route definitions
│   │   ├── auth.js
│   │   ├── video.js
│   │   ├── comment.js
│   │   ├── like.js
│   │   ├── dislike.js
│   │   ├── history.js
│   │   ├── watchlater.js
│   │   └── otp.js
│   │
│   ├── filehelper/
│   │   └── filehelper.js         # File upload utilities
│   │
│   └── uploads/                  # Uploaded video files
│
├── yourtube/                     # Next.js Frontend
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── .env                      # Frontend environment variables
│   ├── .gitignore
│   │
│   └── src/
│       ├── pages/                # Next.js Pages Router
│       │   ├── _app.tsx          # App wrapper (Auth + Theme providers)
│       │   ├── _document.tsx     # Custom document
│       │   ├── index.tsx         # Home — video grid + category tabs
│       │   ├── watch/            # Video player page
│       │   ├── channel/          # Channel profile page
│       │   ├── search/           # Search results page
│       │   ├── explore/          # Explore/discover page
│       │   ├── liked/            # Liked videos page
│       │   ├── history/          # Watch history page
│       │   ├── watch-later/      # Watch later page
│       │   ├── downloads/        # Downloads page
│       │   ├── subscriptions/    # Subscriptions page
│       │   ├── premium/          # Premium plans page
│       │   ├── calls/            # Voice/video calls page
│       │   └── api/              # Next.js API routes
│       │
│       ├── components/           # React components
│       │   ├── Header.tsx        # App header with search
│       │   ├── Sidebar.tsx       # Navigation sidebar
│       │   ├── MobileBottomNav.tsx # Mobile navigation
│       │   ├── Videogrid.tsx     # Video grid layout
│       │   ├── videocard.tsx     # Individual video card
│       │   ├── Videopplayer.tsx  # Video player with gesture controls
│       │   ├── VideoInfo.tsx     # Video metadata & actions
│       │   ├── VideoUploader.tsx # Video upload dialog
│       │   ├── RelatedVideos.tsx # Related videos sidebar
│       │   ├── Comments.tsx      # Comment section
│       │   ├── SearchResult.tsx  # Search result item
│       │   ├── ChannelHeader.tsx # Channel page header
│       │   ├── ChannelVideos.tsx # Channel's video list
│       │   ├── Channeltabs.tsx   # Channel page tabs
│       │   ├── channeldialogue.tsx # Channel edit dialog
│       │   ├── category-tabs.tsx # Category filter tabs
│       │   ├── OTPVerificationModal.tsx # OTP input modal
│       │   ├── HistoryContent.tsx
│       │   ├── LikedContent.tsx
│       │   ├── WatchLaterContent.tsx
│       │   │
│       │   ├── voip/             # WebRTC components
│       │   │   ├── CallRoom.tsx  # Call room UI
│       │   │   └── useCallSignaling.ts # WebRTC signaling hook
│       │   │
│       │   └── ui/               # Radix UI primitives
│       │       ├── avatar.tsx
│       │       ├── button.tsx
│       │       ├── dialog.tsx
│       │       ├── dropdown-menu.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       ├── progress.tsx
│       │       ├── sonner.tsx
│       │       └── textarea.tsx
│       │
│       ├── lib/                  # Utilities & context
│       │   ├── AuthContext.js    # Auth provider (Google + OTP flow)
│       │   ├── ThemeContext.js   # Location-aware theme provider
│       │   ├── firebase.js      # Firebase config
│       │   ├── axiosinstance.js  # Axios base URL config
│       │   └── utils.ts          # CN utility (clsx + tailwind-merge)
│       │
│       └── styles/               # Global styles
```

---

## 📋 Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud
- **Firebase Project** — for Google Authentication
- **Razorpay Account** — for payment processing (optional for dev)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Shreyash-patil/Youtube-NXTGen.git
cd Youtube-NXTGen
```

### 2. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_DB_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/yourtube

# Firebase (for server-side auth verification)
FIREBASE_API_KEY=your_firebase_api_key

# Razorpay (for premium plans)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (for OTP & invoices)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# JWT
JWT_SECRET=your_jwt_secret
```

Start the server:

```bash
npm start
```

The server runs on `http://localhost:5000` with WebSocket support on the same port.

### 3. Setup the Frontend

```bash
cd yourtube
npm install
```

Create a `.env` file in `/yourtube`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000`.

---

## 🔐 Environment Variables

### Server (`/server/.env`)

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 5000) | No |
| `MONGO_DB_URL` | MongoDB connection string | ✅ Yes |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | For payments |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | For payments |
| `EMAIL_USER` | SMTP email address | For OTP/invoices |
| `EMAIL_PASS` | SMTP app password | For OTP/invoices |
| `JWT_SECRET` | JWT signing secret | ✅ Yes |

### Frontend (`/yourtube/.env`)

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | ✅ Yes |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/user/login` | Login / register via Google |
| `PATCH` | `/user/update/:id` | Update channel profile |
| `GET` | `/user/:id` | Get user by ID (with stats) |
| `GET` | `/user/search?q=` | Search users/channels |

### OTP Verification
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/otp/send` | Send OTP (email or SMS) |
| `POST` | `/otp/verify` | Verify OTP code |

### Videos
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/video/upload` | Upload a video |
| `GET` | `/video/getvideos` | Get all videos |
| `GET` | `/video/:id` | Get video by ID |
| `PATCH` | `/video/view/:id` | Increment view count |

### Likes & Dislikes
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/like/toggle` | Toggle like on a video |
| `GET` | `/like/:videoId/:userId` | Get like status |
| `POST` | `/dislike/toggle` | Toggle dislike on a video |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/comment/post` | Post a comment |
| `GET` | `/comment/:videoId` | Get comments for a video |
| `DELETE` | `/comment/:id` | Delete a comment |
| `POST` | `/comment/vote` | Upvote/downvote a comment |

### Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/user/subscribe/:channelId` | Toggle subscription |
| `GET` | `/user/subscription/:channelId/:userId` | Get subscription status |
| `GET` | `/user/subscriptions/:userId` | Get subscribed channels |

### Premium Plans
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user/plan-limits/:userId` | Get user's plan & limits |
| `POST` | `/user/plan/create-order` | Create Razorpay order |
| `POST` | `/user/plan/verify-payment` | Verify payment & activate plan |

### Library
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/history/add` | Add to watch history |
| `GET` | `/history/:userId` | Get watch history |
| `DELETE` | `/history/:id` | Remove from history |
| `POST` | `/watch/add` | Add to watch later |
| `GET` | `/watch/:userId` | Get watch later list |
| `DELETE` | `/watch/:id` | Remove from watch later |

### WebSocket (Signaling Server)

Connect to `ws://localhost:5000` for WebRTC signaling:

| Message Type | Direction | Description |
|---|---|---|
| `join` | Client → Server | Join a call room |
| `leave` | Client → Server | Leave a call room |
| `peers-existing` | Server → Client | List of peers already in room |
| `peer-joined` | Server → Client | New peer joined the room |
| `peer-left` | Server → Client | Peer left the room |
| `offer` | Relay | WebRTC SDP offer |
| `answer` | Relay | WebRTC SDP answer |
| `ice-candidate` | Relay | ICE candidate exchange |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Next.js Frontend                     │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │  Pages  │  │Components│  │   Contexts       │  │  │
│  │  │ Router  │  │  (React) │  │ (Auth + Theme)   │  │  │
│  │  └────┬────┘  └────┬─────┘  └────────┬────────┘  │  │
│  │       └─────────────┼────────────────┘            │  │
│  │                     │                             │  │
│  │           ┌─────────▼──────────┐                  │  │
│  │           │   Axios Instance   │                  │  │
│  │           └─────────┬──────────┘                  │  │
│  └─────────────────────┼─────────────────────────────┘  │
│                        │  HTTP            WebSocket      │
└────────────────────────┼──────────────────┼──────────────┘
                         │                  │
┌────────────────────────▼──────────────────▼──────────────┐
│                Express.js Backend                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │   Routes   │  │Controllers │  │  WebSocket Server  │  │
│  │  (REST)    │──│  (Logic)   │  │  (WebRTC Signaling)│  │
│  └─────┬──────┘  └─────┬──────┘  └────────────────────┘  │
│        └───────────────┼───────────────────────────────┘  │
│                        │                                  │
│  ┌─────────────────────▼───────────────────────────────┐  │
│  │              Mongoose Models                        │  │
│  │  User │ Video │ Comment │ Like │ Subscription │ ... │  │
│  └─────────────────────┬───────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │    MongoDB      │
                │   (Atlas/Local) │
                └─────────────────┘

External Services:
  🔥 Firebase Auth  │  💳 Razorpay  │  📧 Nodemailer (SMTP)  │  🌍 IP Geolocation APIs
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">
  <b>Built with ❤️ by <a href="https://github.com/Shreyash-patil">Shreyash Patil</a></b>
</div>
