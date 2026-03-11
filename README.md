# 🔥 FireWatch - Emergency Fire Management System

![FireWatch Logo](https://img.shields.io/badge/FireWatch-Emergency%20Management-red?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A comprehensive web-based emergency fire management system designed to revolutionize fire incident reporting, response coordination, and resource management. FireWatch bridges the communication gap between civilians and emergency responders through real-time notifications, interactive mapping, and intelligent route optimization.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## ✨ Features

### Core Functionality
- 🚨 **Real-time Fire Incident Reporting** - Citizens can report fires with GPS coordinates and media uploads
- 📍 **Interactive Dashboard** - Live map with color-coded incident markers
- 🔔 **Multi-channel Notifications** - Email and browser push notifications
- 🗺️ **Route Optimization** - Automatic nearest fire station detection with turn-by-turn navigation
- 📊 **Analytics & Statistics** - Comprehensive incident trends and performance metrics
- 🚒 **Fire Station Management** - Auto-discovery from OpenStreetMap + manual entry
- 👥 **Role-based Access Control** - Separate interfaces for public, responders, and admins

### Advanced Features
- ⚡ **Socket.IO Real-time Updates** - Live incident status changes across all connected clients
- 📝 **Manual Incident Logging** - For phone-in reports and emergency calls
- 📈 **Interactive Charts** - Recharts-powered visualizations (trends, distribution, time analysis)
- 🎯 **Responder Assignment** - Intuitive checkbox-based assignment system
- 🌐 **Geospatial Queries** - MongoDB 2dsphere indexing for efficient location-based operations
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **Mapping:** React Leaflet (OpenStreetMap)
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Styling:** CSS3 with custom variables

### Backend
- **Runtime:** Node.js 14+
- **Framework:** Express.js
- **Database:** MongoDB 4.4+
- **ODM:** Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** Bcrypt
- **File Upload:** Multer
- **Email:** Nodemailer
- **Real-time:** Socket.IO Server
- **Validation:** Express Validator

### External Services
- **Geocoding:** OpenStreetMap Nominatim API
- **Fire Station Data:** Overpass API
- **Navigation:** Google Maps & Waze
- **Email Service:** Gmail SMTP

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **MongoDB** (v4.4 or higher)
- **Git** (for version control)

Optional:
- **MongoDB Compass** (GUI for MongoDB)
- **Postman** (API testing)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/firewatch.git
cd firewatch
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/fire-management

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
```

### Frontend Configuration

Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Email Setup (Gmail App Password)

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password (no spaces)
6. Paste it in `EMAIL_PASS` in backend `.env`

## 🏃 Running the Application

### Start MongoDB

```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

### Start Backend Server

```bash
cd backend
npm start
```

Backend will run on: `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

Frontend will run on: `http://localhost:3000`

### Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

## 📁 Project Structure

```
firewatch/
├── backend/
│   ├── models/
│   │   ├── User.js              # User authentication & profiles
│   │   ├── Incident.js          # Fire incident reports
│   │   └── FireStation.js       # Fire station locations (2dsphere indexed)
│   ├── routes/
│   │   ├── auth.js              # Login, register, JWT
│   │   ├── incidents.js         # CRUD, status updates, statistics
│   │   ├── users.js             # User management
│   │   └── fireStations.js      # CRUD, nearest station, auto-discovery
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   └── upload.js            # Multer file upload
│   ├── services/
│   │   └── notification.js      # Email & push notifications
│   ├── uploads/                 # Uploaded media files
│   ├── .env                     # Environment variables
│   ├── server.js                # Express app + Socket.IO
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navigation.js/css       # Auto-hide navbar
│   │   │   ├── ProtectedRoute.js       # Route guards
│   │   │   └── IncidentDetails.js/css  # Incident modal
│   │   ├── pages/
│   │   │   ├── Home.js/css             # Landing page
│   │   │   ├── Login.js, Register.js   # Authentication
│   │   │   ├── ReportFire.js/css       # Public fire reporting
│   │   │   ├── Dashboard.js/css        # Real-time incident map
│   │   │   ├── ManualEntry.js/css      # Phone-in incident logging
│   │   │   ├── FireStations.js/css     # Station management + auto-discovery
│   │   │   └── Statistics.js/css       # Analytics dashboard
│   │   ├── context/
│   │   │   └── AuthContext.js          # Global auth state
│   │   ├── services/
│   │   │   ├── api.js                  # Axios instance
│   │   │   ├── socket.js               # Socket.IO client
│   │   │   └── pushNotifications.js    # Browser push API
│   │   ├── App.js                      # Main app component
│   │   ├── App.css                     # Global styles + CSS variables
│   │   └── index.js                    # React entry point
│   ├── .env                            # Frontend env variables
│   └── package.json
│
├── README.md                            # This file
├── .gitignore                           # Git ignore rules
└── LICENSE                              # MIT License
```

## 📡 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # Login user (returns JWT)
POST   /api/auth/logout         # Logout user
```

### Incident Endpoints

```
GET    /api/incidents           # Get all incidents (with filters)
GET    /api/incidents/:id       # Get incident by ID
POST   /api/incidents           # Create new incident
PUT    /api/incidents/:id       # Update incident
PUT    /api/incidents/:id/status    # Update incident status
PUT    /api/incidents/:id/assign    # Assign responders (admin)
GET    /api/incidents/statistics     # Get analytics data
```

### Fire Station Endpoints

```
GET    /api/fire-stations                     # Get all active stations
GET    /api/fire-stations/nearest/:lon/:lat   # Get nearest station
POST   /api/fire-stations                     # Create station (admin)
PUT    /api/fire-stations/:id                 # Update station (admin)
DELETE /api/fire-stations/:id                 # Soft-delete station (admin)
POST   /api/fire-stations/discover            # Auto-discover from OSM (admin)
```

### User Endpoints

```
GET    /api/users              # Get all users (admin)
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user (admin)
DELETE /api/users/:id          # Delete user (admin)
```

## 👥 User Roles

### Public User
- Report fire incidents anonymously
- Upload photos/videos
- View incident status

### Responder
- All public user capabilities
- Access real-time dashboard
- Update incident status
- Log manual incidents (phone-in reports)
- View route to nearest fire station
- Receive email & push notifications

### Administrator
- All responder capabilities
- Manage fire stations (add, edit, delete, auto-discover)
- Assign responders to incidents
- View comprehensive analytics
- Manage user accounts
- **Note:** Admins do not see "Report Fire" button

## 📸 Screenshots

### Dashboard
Real-time incident map with color-coded markers based on priority.

### Fire Station Management
Auto-discovery from OpenStreetMap and manual entry with geocoding.

### Analytics
Interactive charts showing incident trends, distribution, and performance metrics.

### Route Optimization
Automatic nearest fire station detection with Google Maps/Waze navigation.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Use ES6+ syntax
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Project Maintainer:** Your Name

- Email: your.email@example.com
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- OpenStreetMap for mapping data
- Leaflet for map visualization
- Socket.IO for real-time communication
- MongoDB for geospatial capabilities
- All contributors and testers

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] SMS notifications (Twilio integration)
- [ ] Weather API integration
- [ ] Predictive analytics using ML
- [ ] Multi-language support
- [ ] Offline mode with service workers
- [ ] Video call integration for remote assessment
- [ ] Drone integration for aerial surveillance
- [ ] Public alert system
- [ ] Heat map visualization

---

**Built with ❤️ for emergency response teams worldwide**

🔥 **Stay Safe. Stay Prepared. FireWatch.**
