# AGENTS.md
Guidance for coding agents working in this repository.

## Repository overview
- Monorepo with npm workspaces.
- Apps:
  - `apps/web` - Vite + React PWA shell.
  - `apps/desktop` - Electron main/preload + packaging.
- Packages:
  - `packages/core` - shared types and core logic.
  - `packages/ui` - shared React UI and platform bridge.
- Language: TypeScript across the repo.
- Package manager: npm (`package-lock.json` present).

## Setup
- Install deps: `npm install`

## Build/lint/test/typecheck commands
Run from repo root unless noted.

### Root scripts
- Web dev: `npm run dev:web`
- Desktop dev: `npm run dev:desktop`
- Build web: `npm run build:web`
- Build desktop: `npm run build:desktop`
- Lint all: `npm run lint`
- Typecheck all: `npm run typecheck`
- Test all: `npm test`

### Workspace scripts
- `@photobooth/web`
  - `npm --workspace @photobooth/web run dev`
  - `npm --workspace @photobooth/web run build`
  - `npm --workspace @photobooth/web run typecheck`
  - `npm --workspace @photobooth/web run test`
- `@photobooth/desktop`
  - `npm --workspace @photobooth/desktop run dev`
  - `npm --workspace @photobooth/desktop run build`
  - `npm --workspace @photobooth/desktop run typecheck`
  - `npm --workspace @photobooth/desktop run test`
- `@photobooth/core`
  - `npm --workspace @photobooth/core run typecheck`
  - `npm --workspace @photobooth/core run test`
- `@photobooth/ui`
  - `npm --workspace @photobooth/ui run typecheck`
  - `npm --workspace @photobooth/ui run test`

## Single-test recipes (Vitest)
Vitest is the test runner. Existing tests are in `packages/core/src/*.test.ts`.

- Run one test file:
  - `npm --workspace @photobooth/core run test -- src/frame.test.ts`
- Run one test name pattern:
  - `npm --workspace @photobooth/core run test -- -t "computes cover fit"`
- Run one file + one test name:
  - `npm --workspace @photobooth/core run test -- src/frame.test.ts -t "computes cover fit"`
- Watch a single file:
  - `npm --workspace @photobooth/core exec vitest src/frame.test.ts --watch`

Notes:
- Use `--` so npm forwards args to Vitest.
- Some workspace test scripts use `--passWithNoTests`.

## Linting and static analysis
- ESLint config: `eslint.config.mjs`.
- Ignore paths include:
  - `**/dist/**`
  - `**/release/**`
  - `**/node_modules/**`
  - `**/coverage/**`
  - `**/.opencode/**`
- Rulesets enabled:
  - `@eslint/js` recommended.
  - `typescript-eslint` recommended.
  - `react-hooks` recommended.
- No Prettier config is present; preserve existing formatting style.

## TypeScript baseline
- Base config: `tsconfig.base.json`.
- Important options:
  - `strict: true`
  - `target: ES2022`
  - `module: ESNext` (desktop overrides to `CommonJS`)
  - `moduleResolution: Bundler` (desktop overrides to `Node`)
  - `isolatedModules: true`
- Path aliases:
  - `@photobooth/core`
  - `@photobooth/ui`
  - `@photobooth/ui/*`

## Code style guidelines
Follow existing repository patterns over personal defaults.

### Imports
- Use ESM import syntax.
- Prefer named exports/imports in shared modules.
- Keep type imports explicit (`import type` or inline `type`).
- Group imports in stable order when possible:
  1) external/runtime libs,
  2) Node built-ins (`node:*`),
  3) workspace aliases,
  4) relative imports.
- Avoid unnecessary import reordering churn.

### Formatting
- Use semicolons.
- Use double quotes.
- Split long objects/params across lines for readability.
- Keep formatting consistent with surrounding code.
- Use ASCII unless non-ASCII is required by existing content.

### Types
- Avoid `any`; prefer concrete types, unions, and generics.
- Keep shared contracts centralized in `packages/core/src/types.ts`.
- Use literal unions for constrained values when appropriate.
- Keep preload/renderer/main bridge types synchronized.

### Naming
- `PascalCase` for components and type aliases.
- `camelCase` for functions, hooks, state, and variables.
- `UPPER_SNAKE_CASE` for constants.
- Prefer descriptive function names (for example `saveActiveCapture`).

### React conventions
- Functional components and hooks only.
- Keep side effects in `useEffect` with proper cleanup.
- Use `useMemo` for reused derived values.
- Prefer early-return guards in handlers/effects.
- Preserve accessibility patterns (labels, roles, escape behavior).

### Error handling
- Use `try/catch` around async operations that can fail.
- Normalize caught values as:
  - `error instanceof Error ? error.message : "Fallback message"`
- Surface clear user-facing errors for UI actions.
- Do not silently swallow failures without a fallback path.

### Electron and IPC
- Keep channel names namespaced as `photobooth:*`.
- Validate untrusted inputs in Electron main handlers.
- Keep BrowserWindow security posture:
  - `contextIsolation: true`
  - `nodeIntegration: false`
- Expose minimal preload APIs and keep them typed.

### Testing conventions
- Framework: Vitest.
- Naming: `*.test.ts` colocated with source in `src/`.
- Style: `describe` + `it` + `expect`.
- Prefer deterministic, fast unit tests for core logic.

## Cursor and Copilot rule files
Checked and not present:
- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

If any of these files are added later, merge their rules into this document and follow them as local agent instructions.

## Documentation and setup workflow
- Always use Context7 MCP first when API/library documentation is needed, or when doing code generation, setup, or configuration work, without requiring an explicit user request.
