# Contributing to Blog Manager

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/Blog-Manager-Example.git`
3. Install dependencies: `npm install`
4. Start dev server: `npm run dev`
5. Start Tauri app: `npm run tauri dev`

## Development Workflow

```bash
# Check code style
npm run lint

# Type-check
npx tsc --noEmit

# Build frontend
npm run build

# Build desktop app
npm run tauri build
```

## Pull Request Process

1. Create a feature branch from `main`
2. Keep changes focused — one PR per feature/fix
3. Run lint and type-check before submitting
4. Update README if your change affects usage or setup
5. All PRs require at least one review before merging

## Commit Convention

We use conventional commits:

- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — tooling, config, dependencies
- `refactor:` — code change that neither fixes nor adds
- `docs:` — documentation only

## Code Style

- TypeScript with strict mode
- React functional components with hooks
- Tailwind CSS utility classes for styling
- 2-space indentation

## Issues

- Bug reports: include steps to reproduce, expected vs actual behavior
- Feature requests: describe the use case and proposed solution

## Questions?

Open a [discussion](https://github.com/Miraitowa-alt/Blog-Manager-Example/discussions) or file an issue.
