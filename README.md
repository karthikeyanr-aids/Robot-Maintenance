# ROBOCARE: AI-Based Predictive Maintenance and Health Monitoring System for Industrial Robots

ROBOCARE is a full-stack MERN industrial telemetry monitoring and predictive maintenance platform powered by an embedded TensorFlow.js neural network. It continuously evaluates multi-axial robot sensor telemetry, predicts impending failure probabilities, classifies operational risk, and generates prescriptive maintenance recommendations.

---

## System Architecture & Workflow

```
Robotic Workcell Sensor Telemetry (Temp, Vibration, Runtime, Errors, Component Life)
                                      ↓
                     Feature Extraction & Z-Score Normalization
                                      ↓
                   TensorFlow.js Neural Network Inference
                                      ↓
          Failure Probability (0 - 100%) & Health Score (100 - Failure%)
                                      ↓
          Risk Level Classification (LOW / MEDIUM / HIGH / CRITICAL)
                                      ↓
                 Rule-Based Prescriptive Maintenance Engine
                                      ↓
               Automated Alert Notifications (for HIGH/CRITICAL)
                                      ↓
              Maintenance Scheduling & Technician Assignment
                                      ↓
           Task Execution, Status Updates & Historical Log Archival
```

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React
- **Backend**: Node.js, Express.js REST API, Mongoose, JWT Authentication, Bcrypt.js
- **Machine Learning**: TensorFlow.js (`@tensorflow/tfjs`) running directly inside Node.js backend
- **Database**: MongoDB (Local or Atlas)

---

## Machine Learning Pipeline

### 1. Primary Input Features (7 Metrics)
1. **`runtimeHours`**: Cumulative operating hours of the robot (0 - 15,000 hrs).
2. **`errorCount`**: Number of active/unresolved alarms and fault codes.
3. **`temperature`**: Operating temperature in Celsius (°C).
4. **`vibration`**: RMS mechanical vibration velocity in mm/s.
5. **`componentLifePercent`**: Minimum remaining lifespan percentage across critical subsystems (0 - 100%).
6. **`daysSinceMaintenance`**: Number of elapsed days since the last certified service overhaul.
7. **`previousFailures`**: Historical failure count for the robot.

### 2. Neural Network Architecture
- **Input Layer**: 7 normalized features
- **Hidden Layer 1**: Dense(16 neurons, Activation: `ReLU`, Kernel Initializer: `glorotUniform`)
- **Hidden Layer 2**: Dense(8 neurons, Activation: `ReLU`, Kernel Initializer: `glorotUniform`)
- **Output Layer**: Dense(1 neuron, Activation: `Sigmoid`)
- **Loss Function**: `binaryCrossentropy` | **Optimizer**: `Adam` (lr=0.005)

### 3. Risk Level & Health Score Formulas
- **Failure Probability**: Model output between `0.0` and `1.0` (expressed as `0% - 100%`).
- **Health Score**: $\text{healthScore} = \text{round}((1 - \text{failureProbability}) \times 100)$
- **Risk Classifications**:
  - **LOW**: 0% - 39%
  - **MEDIUM**: 40% - 69%
  - **HIGH**: 70% - 84%
  - **CRITICAL**: 85% - 100%

---

## Folder Structure

```
d:/Projects/FSD/
├── package.json                   # Root orchestrator scripts
├── README.md                      # Comprehensive project documentation
├── test-api.js                    # End-to-end API test verification suite
├── test-frontend.js               # Frontend server verification script
│
├── server/
│   ├── package.json               # Backend dependencies
│   ├── server.js                  # Express application entry point
│   ├── .env                       # Environment variables
│   ├── .env.example               # Environment variables template
│   ├── config/
│   │   └── db.js                  # MongoDB Mongoose connection
│   ├── models/
│   │   ├── User.js                # User accounts with roles (ADMIN, MANAGER, TECHNICIAN)
│   │   ├── Robot.js               # Robot telemetry, specs, health index
│   │   ├── Component.js           # Subsystem degradation (Motor, Gearbox, Bearing, etc.)
│   │   ├── ErrorLog.js            # Fault codes and alarms
│   │   ├── MaintenanceRecord.js   # Work orders and service logs
│   │   ├── Prediction.js          # Inferences, risk levels, and recommendations
│   │   └── Notification.js        # High/critical risk automated alerts
│   ├── middleware/
│   │   ├── auth.js                # JWT verification & role authorization
│   │   └── errorHandler.js        # Global API exception handling
│   ├── ml/
│   │   ├── generateData.js        # Synthetic multi-axial sensor dataset generator (3k records)
│   │   ├── trainModel.js          # TensorFlow.js neural network training script
│   │   └── model/                 # Saved model.json, weights.bin, scaler.json
│   ├── services/
│   │   ├── predictionService.js   # Feature extraction, scaling & inference engine
│   │   └── recommendationEngine.js# Root-cause diagnostic & prescription logic
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth
│   │   ├── robotRoutes.js         # /api/robots
│   │   ├── componentRoutes.js     # /api/components
│   │   ├── errorRoutes.js         # /api/errors
│   │   ├── maintenanceRoutes.js   # /api/maintenance
│   │   ├── predictionRoutes.js    # /api/predictions & /api/predictions/analyze/:id
│   │   ├── notificationRoutes.js  # /api/notifications
│   │   ├── analyticsRoutes.js     # /api/analytics
│   │   └── userRoutes.js          # /api/users
│   └── seed/
│       └── seedData.js            # Seeder with 16 realistic industrial robots
│
└── client/
    ├── package.json               # Frontend dependencies
    ├── vite.config.js             # Vite configuration with /api proxy
    ├── tailwind.config.js         # Tailwind styling
    ├── index.html                 # Single page application entry
    └── src/
        ├── App.jsx                # Router & role-based route guards
        ├── main.jsx               # React entry with Context providers
        ├── index.css              # Custom styles, glass effects, typography
        ├── context/
        │   ├── AuthContext.jsx    # Authentication & role authorization state
        │   └── NotificationContext.jsx # Real-time alerts & unread badges
        ├── services/
        │   └── api.js             # Axios client with JWT interceptor
        ├── components/
        │   ├── layout/            # Sidebar, Navbar, and Layout shell
        │   ├── common/            # HealthBadge, RiskBadge, StatusBadge, StatCard, Modal
        │   └── robots/            # TelemetryGauge, AddRobotModal, ScheduleMaintenanceModal
        └── pages/
            ├── Login.jsx          # Login screen with 1-click demo accounts
            ├── Dashboard.jsx      # KPI summary, Recharts visualizations & feeds
            ├── Robots.jsx         # Robot fleet grid/table with search & filters
            ├── RobotDetails.jsx   # Live telemetry gauges, ML prediction trigger & tabs
            ├── Predictions.jsx    # Historical prediction inference logs
            ├── Maintenance.jsx    # Work orders Kanban/table with status transitions
            ├── ErrorLogs.jsx      # Fault alarms and resolution modal
            ├── Analytics.jsx      # MTBF, component degradation & downtime metrics
            └── Users.jsx          # Admin-only user management
```

---

## Quick Start & Running Locally

### Prerequisites
- Node.js (v18+ or v24+ LTS)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or configured via `.env`

### 1. Install Dependencies
```bash
# Install all dependencies across root, server, and client
npm run install:all
```

### 2. Train the ML Model
```bash
# Trains TensorFlow.js neural network and saves model artifacts to server/ml/model/
npm run train:model
```

### 3. Seed Database
```bash
# Seeds 16 realistic industrial robots, components, errors, maintenance, and demo accounts
npm run seed
```

### 4. Start the Application
```bash
# Runs both backend (port 5000) and frontend (port 3000) concurrently
npm run dev
```

Open your browser to: **`http://localhost:3000`**

---

## Default Credentials

You can sign in with the pre-seeded accounts:

| Role | Username / Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` / `admin@robocare.com` | `Admin@123` | Full access, Robot/Component CRUD, Work orders, User management |
| **Technician** | `technician` / `technician@robocare.com` | `Admin@123` | View Fleet Telemetry, Run AI Predictions, Execute & Complete Work Orders, Resolve Alarms |

---

## REST API Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Authenticate & retrieve JWT token
- `GET /api/auth/me` - Get active user profile *(Protected)*

### Robotic Fleet
- `GET /api/robots` - List robots with search, filters, pagination
- `GET /api/robots/:id` - Get robot by ID with populated components, errors, and predictions
- `POST /api/robots` - Create new robot *(Admin)*
- `PUT /api/robots/:id` - Update robot telemetry / metadata
- `DELETE /api/robots/:id` - Delete robot & cascade subdocuments *(Admin)*

### Machine Learning Predictions
- `GET /api/predictions` - Get all predictions history with risk filters
- `GET /api/predictions/:robotId` - Get prediction history for a specific robot
- `POST /api/predictions/analyze/:robotId` - **Core ML Endpoint**: Extracts live 7 features, runs TensorFlow.js model, calculates failure probability, generates root-cause reasons & recommendations, saves record, updates robot health, and emits notifications if risk is HIGH/CRITICAL.

### Maintenance Work Orders
- `GET /api/maintenance` - List work orders (filter by status, priority, robot, technician)
- `GET /api/maintenance/:id` - Get single maintenance record
- `POST /api/maintenance` - Schedule new maintenance task
- `PUT /api/maintenance/:id` - Update status (e.g. `IN_PROGRESS`, `COMPLETED`), action taken, downtime, and cost
- `DELETE /api/maintenance/:id` - Remove maintenance record *(Admin)*

### Error Logs & Alarms
- `GET /api/errors` - List error logs with severity and resolution filters
- `POST /api/errors` - Log new error alarm
- `PUT /api/errors/:id` - Mark error as resolved with resolution notes

### Analytics & Notifications
- `GET /api/analytics/dashboard` - Consolidated KPI metrics, risk distribution, top errors, upcoming maintenance
- `GET /api/analytics/trends` - Component lifespan curves, downtime analysis, health ranking
- `GET /api/notifications` - Unread and recent predictive alert notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/users/technicians` - Get list of technicians for task assignment

---

## Automated Verification

You can verify the entire backend API and live ML model inference at any time by running:
```bash
node test-api.js
```
Expected output: **14/14 tests passing (100%)**.
