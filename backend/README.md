<!-- markdownlint-disable no-inline-html -->

# Task Garden Backend 🌱

FastAPI + Python backend for the Task Garden productivity app.

## Features

- **RESTful API** for all core app features
- **Service Architecture**: Clean separation of business logic
- **Supabase Integration**: PostgreSQL database with real-time support
- **Authentication**: Secure user management
- **Task & Plant Management**: Gamified productivity logic
- **Friend System**: Social features for collaboration

## Tech Stack

- **FastAPI** - Modern, fast Python web framework
- **Pydantic** - Data validation and serialization
- **Supabase** - PostgreSQL database and real-time API
- **Uvicorn** - Lightning-fast ASGI server

## Quick Start

### Prerequisites

- **Python 3.9+**
- **Supabase** project (or PostgreSQL)
- **Node.js** (for frontend, see [../frontend/README.md](../frontend/README.md))

### Installation

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
# Copy the example file (if available)
cp .env.example .env

# Edit .env with your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_anon_key
# DATABASE_URL=your_database_url
# JWT_SECRET=your_jwt_secret
```

**Start the backend server:**

```bash
uvicorn app.main:app --reload
```

- API available at: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Project Structure

```text
backend/
├── app/
│ ├── models/ # Pydantic data models
│ ├── routers/ # API endpoints
│ ├── services/ # Business logic layer
│ ├── config.py # Configuration
│ └── main.py # FastAPI app entry
├── requirements.txt # Python dependencies
└── venv/ # Virtual environment (local only)
```

## Common Commands

```bash
# Activate virtual environment
source venv/bin/activate      # Linux/macOS/Git Bash
# OR
venv\Scripts\activate.bat     # Windows CMD
# OR
.\venv\Scripts\Activate.ps1   # Windows PowerShell

# Install new dependencies
pip install package_name
pip freeze > requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload
```

## Environment Variables

Create a `.env` file in the backend directory with:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## Development Guidelines

- Use **Python 3.9+**
- Follow **PEP8** style guide
- Use **type hints** and **Pydantic** models for data validation
- Organize logic into **services** for maintainability
- Write **docstrings** for all public functions and classes
- Test endpoints using the built-in `/docs` Swagger UI

## Related Documentation

- [Main Project README](../README.md)
- [Frontend Documentation](../frontend/README.md)

---

Built with ❤️ by The Growth Hackers team
