# AGENTS.md

> Instructions for AI coding agents working on MCP Workbench.

## Project Overview

MCP Workbench is a visual debugger and test client for Model Context Protocol (MCP) servers. It's a React-based single-page application that connects to MCP servers over Streamable HTTP.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom terminal theme
- **State Management**: React Context API
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI primitives (Button, Input)
│   ├── icons/          # Custom icon components
│   ├── ToolTester.tsx  # Tool execution interface
│   ├── PromptTester.tsx # Prompt testing interface
│   ├── TaskManager.tsx # Task polling interface
│   └── ...
├── contexts/           # React Context providers
│   ├── MCPContext.tsx  # MCP client state
│   └── ThemeContext.tsx # Theme toggle
├── lib/                # Utilities and helpers
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## Coding Guidelines

### Do

- Use TypeScript with strict typing
- Follow existing component patterns
- Use Tailwind CSS classes for styling
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Keep components focused and single-purpose
- Use semantic HTML elements
- Add proper error handling for async operations

### Don't

- Don't use inline styles
- Don't create new CSS files (use Tailwind)
- Don't use `any` type unless absolutely necessary
- Don't modify `public/` assets without explicit permission
- Don't add new dependencies without discussion
- Don't use class components (use functional with hooks)

## Commands

```bash
# Development server
npm run dev

# Type checking
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Patterns

### MCP Context Usage
```tsx
import { useMCP } from '@/contexts/MCPContext';

const { client, status, error, connectToServer } = useMCP();
```

### Theme Usage
```tsx
import { useTheme } from '@/contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();
```

### Component Styling
```tsx
// Use terminal theme variables
className="bg-terminal-surface text-terminal-text border-terminal-border"

// Use Tailwind utilities
className="p-4 rounded-lg shadow-sm hover:bg-terminal-surface/50"
```

## Security Boundaries

### Never Modify

- OAuth token handling logic without security review
- API key storage/transmission patterns
- CORS configuration documentation

### Always Ask First

- Changes to MCP protocol implementation
- New authentication methods
- Changes to public/ static assets

## Testing

Currently no automated tests. When adding features:
1. Manually test in both light and dark themes
2. Verify MCP protocol compliance
3. Test with demo server and real servers
4. Check browser console for errors

## File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts` in relevant directory
- Styles: Use Tailwind, no separate CSS files
