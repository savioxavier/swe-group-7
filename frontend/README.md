<!-- markdownlint-disable no-inline-html -->

# Task Garden Frontend 🌱

React 19 + TypeScript + Vite frontend for the Task Garden productivity app.

## Features

- **Modern Stack**: React 19, TypeScript, Vite for fast development
- **Beautiful UI**: Tailwind CSS with custom animations via Framer Motion
- **Sound System**: Howler.js for immersive audio feedback
- **Canvas Rendering**: High-performance plant visualization
- **Responsive Design**: Mobile-first approach with touch optimization
- **Real-time Updates**: Optimistic UI with Supabase integration

## Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Production-ready animations
- **Howler.js** - Cross-browser audio library
- **Lucide React** - Beautiful icon library
- **Supabase** - Real-time database client

## Quick Start

### Prerequisites

- **Node.js 16+** and **npm/pnpm**
- **Backend running** on `http://localhost:8000`

### Installation

**Navigate to frontend directory:**

```bash
cd frontend
```

**Install dependencies:**

<details>
<summary>Using pnpm (recommended)</summary>

```bash
pnpm install
```

</details>

<details>
<summary>Using npm</summary>

```bash
npm install
```

</details>

### Development

**Start development server:**

<details>
<summary>Using pnpm</summary>

```bash
pnpm dev
```

</details>

<details>
<summary>Using npm</summary>

```bash
npm run dev
```

</details>

**Access the application:**

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

### Production Build

**Build for production:**

<details>
<summary>Using pnpm</summary>

```bash
pnpm build
```

</details>

<details>
<summary>Using npm</summary>

```bash
npm run build
```

</details>

**Preview production build:**

<details>
<summary>Using pnpm</summary>

```bash
pnpm preview
```

</details>

<details>
<summary>Using npm</summary>

```bash
npm run preview
```

</details>

## Available Scripts

| Command | Description |
|---------|-------------|
| `dev` | Start development server with HMR |
| `build` | Build for production |
| `preview` | Preview production build locally |
| `lint` | Run ESLint for code quality |

## Project Structure

```text
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── garden/           # Core garden system
│   │   │   ├── CanvasGarden.tsx      # Main garden component
│   │   │   ├── TaskPanel.tsx         # Task management panel
│   │   │   ├── GardenCanvas.tsx      # Plant rendering
│   │   │   └── constants.ts          # Grid & plant config
│   │   ├── animations/       # Animation components
│   │   │   ├── CinematicPlanting.tsx # Plant creation flow
│   │   │   ├── PlantGrowthEffects.tsx # Growth celebrations
│   │   │   └── XPGainEffects.tsx     # XP feedback
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   │   ├── useCinematicPlanting.ts   # Plant creation UX
│   │   ├── usePlantGrowthAnimations.ts
│   │   └── useXPAnimations.ts
│   ├── lib/                  # Utilities and services
│   │   ├── sounds/           # Sound system
│   │   │   ├── soundManager.ts       # Core audio manager
│   │   │   ├── types.ts              # Sound type definitions
│   │   │   └── index.ts              # React hook
│   │   ├── api.ts            # Backend API client
│   │   └── supabase.ts       # Database client
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication state
│   ├── pages/                # Page components
│   │   ├── Home.tsx          # Main garden page
│   │   ├── SignIn.tsx        # Login page
│   │   └── SignUp.tsx        # Registration page
│   ├── types/                # TypeScript definitions
│   │   └── index.ts          # Shared type definitions
│   ├── App.tsx               # Root component
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
│   ├── assets/               # Images, sounds, sprites
│   │   ├── Virtual-Bloom.mp3 # Background music
│   │   └── Sprites/          # Plant sprite images
│   └── vite.svg              # Vite favicon
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Key Components

### Core Garden System

- **`CanvasGarden.tsx`** - Central garden state management and plant interactions
- **`GardenCanvas.tsx`** - HTML5 Canvas rendering for plants and animations  
- **`TaskPanel.tsx`** - Task management sidebar with multi-step support

### Animation System

- **`CinematicPlanting.tsx`** - Smooth plant creation flow with camera effects
- **`PlantGrowthEffects.tsx`** - Particle effects and growth celebrations
- **`XPGainEffects.tsx`** - Floating XP numbers and progress feedback

### Sound System

- **`soundManager.ts`** - Web Audio API wrapper with fallbacks
- **`useSounds()`** - React hook for playing UI and plant sounds
- **Background Music** - Looping ambient music with user controls

## Configuration

### Environment Variables

Create `.env` in the frontend directory (optional):

```env
# Backend API URL (default: http://localhost:8000)
VITE_API_URL=http://localhost:8000

# Supabase configuration (if needed)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Tailwind Configuration

The project uses a custom Tailwind configuration with:

- **Green color palette** for nature theme
- **Custom animations** for plant effects
- **Responsive breakpoints** for mobile optimization

### TypeScript Configuration

- **Strict mode** enabled for type safety
- **Path mapping** for clean imports
- **Modern target** (ES2020) for latest features

## Development Guidelines

### Code Style

- Use **TypeScript** for all new files
- Follow **React best practices** (hooks, functional components)
- Use **Tailwind utilities** over custom CSS
- Implement **proper error handling** with try/catch

### Performance

- Use **React.memo** for expensive components
- Implement **optimistic UI updates** for better UX
- **Lazy load** heavy components when possible
- **Optimize images** and audio assets

### Animations

- Use **Framer Motion** for complex animations
- Target **60fps** for smooth performance
- Add **reduced motion** support for accessibility
- Test on **mobile devices** for performance

## Troubleshooting

### Common Issues

**Development server won't start:**

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Build errors:**

```bash
# Check TypeScript errors
pnpm build

# Run linting
pnpm lint
```

**Audio not working:**

- Audio requires user interaction on mobile
- Check browser audio permissions
- Verify audio files are in `public/assets/`

**Slow performance:**

- Check browser developer tools for bottlenecks
- Disable sound effects temporarily
- Reduce animation complexity

### Browser Support

- **Chrome/Edge 90+** (recommended)
- **Firefox 88+**
- **Safari 14+**
- **Mobile browsers** with touch support

## Contributing

1. **Use conventional commits** for clear history
2. **Test on multiple browsers** before submitting
3. **Check mobile responsiveness**
4. **Update documentation** for new features

## Related Documentation

- [Main Project README](../README.md)
- [Backend Documentation](../backend/)

---

Built with ❤️ by The Growth Hackers team
