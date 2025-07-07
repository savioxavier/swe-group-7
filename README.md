# Task Garden

A gamified productivity app that turns your tasks into a thriving virtual garden.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Framer Motion
- **Backend**: FastAPI + Python
- **Database**: Supabase
- **Hosting**: Vercel (Frontend) + Render (Backend)

## Development Setup

### Prerequisites

- Python 3.8+
- Node.js 16+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with Supabase credentials
```

6. Start the backend server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env if needed
```

4. Start the development server:
```bash
npm run dev
```

## Team: The Growth Hackers

- Frontend Lead: Savio Xavier
- Backend Lead: Cesar Valentin
- Project Manager: Weien Xu
- Scrum Master: Fernando Amado-Pupo

## Communication Tools

- Kanban Board: https://trello.com/b/QcR6HNmP/taskgarden
- Event Timeline: https://docs.google.com/spreadsheets/d/1tOB8js2qUY5uYMcYf_fCWPlvhZle_kEK4yBx3QX4nDQ/edit?gid=0#gid=0
- 
