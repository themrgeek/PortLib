# StudentDashboard Web Component Setup Guide

This guide explains how to set up and use the StudentDashboard web component in your project.

## Prerequisites

This component is designed for web use (React web, not React Native). If you're using Expo, you can run it on web with `npm run web` or `expo start --web`.

## Required Dependencies

Install the following dependencies:

```bash
npm install @tanstack/react-query lucide-react
npm install -D tailwindcss postcss autoprefixer
```

## Configuration Files

### 1. Tailwind CSS Configuration

The `tailwind.config.js` file has been created in the project root with the design system configuration.

### 2. PostCSS Configuration

The `postcss.config.js` file has been created in the project root.

### 3. Global CSS

Import the global CSS file in your main app file:

```tsx
// In your main App.tsx or index.tsx
import "./src/styles/globals.css";
```

### 4. React Query Setup

Wrap your app with QueryClientProvider:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudentDashboard } from "./src/components/web/StudentDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StudentDashboard />
    </QueryClientProvider>
  );
}
```

## API Configuration

Update the API base URL in `src/lib/apiClient.ts`:

```typescript
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:3000";
```

Or set it via environment variables:

- `NEXT_PUBLIC_API_URL` (for Next.js)
- `REACT_APP_API_URL` (for Create React App)

## Authentication Token Storage

The component expects authentication tokens to be stored in `localStorage` with the key `auth_token`. Update `src/lib/apiClient.ts` if you use a different storage mechanism.

## Usage

```tsx
import { StudentDashboard } from "./src/components/web/StudentDashboard";

function App() {
  return <StudentDashboard />;
}
```

## Features Implemented

✅ Top Navigation Bar with user avatar, online status, notifications, and theme switcher  
✅ Greeting section with time-based greeting  
✅ Debounced book search bar  
✅ Overdue status card with fine information  
✅ Current borrows section with book cards  
✅ Days left badges with color coding  
✅ Request return functionality with confirmation modal  
✅ Bottom navigation bar (mobile only)  
✅ Loading skeletons with shimmer effect  
✅ Empty state components  
✅ Dark mode support  
✅ Full accessibility (ARIA labels, keyboard navigation)  
✅ Responsive design (mobile-first)  
✅ Error handling with user-friendly messages

## Design System Compliance

The component follows the specified design system:

- **Colors**: Primary (#2563EB), Success (#059669), Warning (#D97706), Error (#DC2626)
- **Typography**: h1 (40px), h2 (32px), h3 (24px), h4 (20px), body (16px)
- **Spacing**: xs (4px), sm (8px), md (16px), lg (24px)
- **Shadows**: sm, md, lg

## Storybook

Storybook stories are available at `src/components/web/StudentDashboard.stories.tsx`. To run Storybook:

```bash
npm install -D @storybook/react @storybook/react-webpack5
npx storybook init
```

## API Endpoints

The component expects the following API endpoints:

- `GET /api/borrow/current` - Returns array of current borrows
- `GET /api/borrow/overdue` - Returns overdue status object
- `GET /api/books/search?q={query}` - Returns search results
- `POST /api/borrow/request-return` - Request book return

## Troubleshooting

### Tailwind classes not working

1. Ensure `tailwind.config.js` is in the project root
2. Check that your CSS file imports Tailwind directives
3. Verify the content paths in `tailwind.config.js` include your component files

### React Query errors

1. Ensure `@tanstack/react-query` is installed
2. Verify QueryClientProvider wraps your app
3. Check that API endpoints are correctly configured

### Icons not showing

1. Ensure `lucide-react` is installed
2. Check that icons are imported correctly

### Dark mode not working

1. Ensure `darkMode: 'class'` is set in `tailwind.config.js`
2. Verify the `dark` class is toggled on the `html` or root element
3. Check that dark mode classes are applied correctly

## Next Steps

1. Integrate with your routing solution (React Router, Next.js, etc.)
2. Connect to your actual API endpoints
3. Implement the NotificationSystem for toast messages
4. Add user profile loading from your auth service
5. Customize the navigation handlers to match your routing setup
