# ✦ NoteApp

A clean, full-featured notes app built with **Node.js + Express**.
Designed as a practical project for learning **Docker** and **CI/CD** with GitHub Actions.

## Features
- Create, edit, delete notes
- Pin important notes to the top
- Color-code notes with swatches
- Tag notes and filter by tag
- Full-text search across title, content, and tags
- REST API (`/api/notes`)
- Responsive design (mobile-friendly)

## Getting Started

### Run locally
npm install
npm run dev
Open http://localhost:3000

### Run with Docker
docker build -t noteapp .
docker run -p 3000:3000 noteapp

### Run with Docker Compose
docker-compose up --build

### Run tests
npm test

## Project Structure
noteapp/
├── .github/workflows/ci.yml
├── public/
│   ├── css/style.css
│   ├── js/app.js
│   └── index.html
├── src/
│   ├── routes/notes.js
│   ├── store/notes.js
│   └── server.js
├── tests/notes.test.js
├── Dockerfile
├── docker-compose.yml
└── package.json

## REST API
| Method | Endpoint        | Description     |
|--------|-----------------|-----------------|
| GET    | /api/notes      | List all notes  |
| GET    | /api/notes?q=   | Search notes    |
| GET    | /api/notes/:id  | Get one note    |
| POST   | /api/notes      | Create note     |
| PUT    | /api/notes/:id  | Update note     |
| DELETE | /api/notes/:id  | Delete note     |

## Dockerfile Stages
| Stage      | Purpose                               |
|------------|---------------------------------------|
| deps       | Install production deps only          |
| test       | Run test suite                        |
| production | Lean final image, non-root user       |

## CI/CD Pipeline
1. Test — runs Jest on Node 18 & 20
2. Build — builds and pushes Docker image to GitHub Container Registry
3. Deploy — plug in your own deploy command (Fly.io, Railway, Render, etc.)

## Next Steps
- [ ] Add a real database (SQLite or MongoDB)
- [ ] Add user authentication (JWT)
- [ ] Deploy to Fly.io, Railway, or Render
- [ ] Add ESLint to the CI pipeline
