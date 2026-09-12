# Story Engine

**A Narrative Intelligence Platform that understands stories like a human listener**

Story Engine treats natural narration as the primary input, extracting entities, relationships, and timeline events to help creators see their stories take shape in real-time.

## 🎯 Philosophy

We're not a writing tool. We're a **narrative understanding engine** that:
- Respects natural storytelling (fragments, emotions, connections)
- Treats AI as an invisible listener who never hijacks your story
- Visualizes understanding through graphs, timelines, and character arcs
- Preserves the sacredness of your raw narration

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account
- Google Gemini API key

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Add your credentials to the .env files

# Start development servers
npm run dev
```

The backend will run on `http://localhost:1100` and frontend on `http://localhost:5173`.

## 📁 Project Structure

```
story-engine/
├── backend/          # NestJS API server
├── frontend/         # React + Vite application
├── supabase/         # Database migrations
├── docs/             # Documentation
└── package.json      # Monorepo root
```

## 🏗️ Tech Stack

- **Backend**: NestJS
- **Frontend**: React + Vite + Redux Toolkit
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini
- **Auth**: Supabase Auth
- **Styling**: ShadCN UI + TailwindCSS

## 📚 Documentation

- [Setup Guide](./docs/SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Contributing](./docs/CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

## 🚢 Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for instructions on deploying to production.

## 📄 License

MIT

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md).

---

Built with ❤️ for storytellers who think in narratives, not outlines.