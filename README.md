<!-- markdownlint-disable no-inline-html -->

# TaskGarden

A gamified productivity app that turns your tasks into a thriving virtual garden. Complete tasks to grow plants, track your progress, and build healthy productivity habits!

## Features

- **Gamified Tasks**: Transform your work into growing virtual plants
- **Progress Tracking**: XP system with levels and streaks
- **Multi-Step Tasks**: Break down complex projects into manageable steps
- **Beautiful Animations**: Smooth plant growth and particle effects
- **Audio Feedback**: Immersive sound system with background music
- **Mobile Responsive**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Instant feedback and optimistic UI updates

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Framer Motion + Tailwind CSS + Howler.js
- **Backend**: FastAPI (Python) with a service architecture
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (frontend), Render (backend)

## Quick Start

### Prerequisites

- **Python** (for backend)
- **Node.js** and **npm** (for frontend)
- **Git** (for version control)

### 🚀 Full Application Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/savioxavier/swe-group-7.git
cd swe-group-7
```

#### 2. Backend Setup

**Navigate to backend directory:**

```bash
cd backend
```

**Create and activate virtual environment:**

<details>
<summary>Windows Command Prompt (CMD)</summary>

```cmd
python -m venv venv
venv\Scripts\activate.bat
```

</details>

<details>
<summary>Windows PowerShell</summary>

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

</details>

<details>
<summary>Git Bash / Linux / macOS</summary>

```bash
python -m venv venv
source venv/bin/activate
```

</details>

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Set up environment variables:**

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_KEY=your_supabase_service_key
```

**Start the backend server:**

```bash
uvicorn app.main:app --reload
```

Backend will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

#### 3. Frontend Setup

**Open a new terminal and navigate to frontend directory:**

```bash
cd frontend
```

**Install dependencies:**

<details>
<summary>Using npm</summary>

```bash
npm install
```

</details>

**Set up environment variables (optional):**

```bash
# Copy example if you need custom configuration
cp .env.example .env
```

**Start the development server:**

<details>
<summary>Using npm</summary>

```bash
npm run dev
```

</details>

Frontend will be available at: `http://localhost:5173`

### Done

Open your browser to `http://localhost:5173` and start growing your task garden!

## Project Structure

```text
swe-group-7/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── garden/       # Core garden system
│   │   │   ├── animations/   # Animation components  
│   │   │   └── ui/           # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and services
│   │   │   ├── sounds/       # Sound system
│   │   │   ├── api.ts        # Backend API client
│   │   │   └── supabase.ts   # Database client
│   │   └── types/            # TypeScript definitions
│   └── public/               # Static assets
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── models/           # Pydantic data models
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic layer
│   │   ├── config.py         # Configuration
│   │   └── main.py           # FastAPI app entry
│   └── requirements.txt      # Python dependencies
└── README.md                 # This file
```

## Development Commands

### Backend Commands

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # Linux/macOS/Git Bash
# OR
venv\Scripts\activate.bat  # Windows CMD
# OR  
.\venv\Scripts\Activate.ps1  # Windows PowerShell

# Install new dependencies
pip install package_name
pip freeze > requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

## Environment Variables

### Backend (.env)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### Frontend (.env - optional)

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Team: The Growth Hackers

- **Frontend Lead**: Savio Xavier
- **Backend Lead**: Cesar Valentin  
- **Project Manager**: Weien Xu
- **Scrum Master**: Fernando Amado-Pupo

## Communication

- **Growth Hackers Catalog**: [Project Documentation](https://docs.google.com/document/d/1MyIpB0IGhxp_tIT_w1DIAZpAiOBAQuMNSoPe0142gMs/edit?tab=t.0)
