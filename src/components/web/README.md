# StudentDashboard Component

A comprehensive React TypeScript dashboard component for the LibrarySync Pro application, built with Tailwind CSS and following the design system specifications.

## Features

- **Top Navigation Bar**: User avatar with online status, app name, notifications, and theme switcher
- **Greeting Section**: Personalized greeting based on time of day
- **Quick Book Search**: Debounced search bar for books, authors, or ISBN
- **Overdue Status Card**: Prominent display of overdue items and fines
- **Current Borrows Section**: List of currently borrowed books with due dates and status badges
- **Bottom Navigation**: Mobile-only navigation bar
- **Loading States**: Shimmer effect skeletons for data fetching
- **Empty States**: User-friendly empty state components
- **Dark Mode**: Full dark mode support with theme toggle
- **Accessibility**: ARIA labels, keyboard navigation, proper contrast ratios

## Installation

### Required Dependencies

```bash
npm install @tanstack/react-query lucide-react
npm install -D tailwindcss postcss autoprefixer
```

### Setup Tailwind CSS

1. Initialize Tailwind (if not already done):

```bash
npx tailwindcss init -p
```

2. The `tailwind.config.js` and `postcss.config.js` files are already configured in the project root.

3. Add Tailwind directives to your main CSS file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Setup React Query

Wrap your app with QueryClientProvider:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StudentDashboard />
    </QueryClientProvider>
  );
}
```

## Usage

```tsx
import { StudentDashboard } from "./components/web/StudentDashboard";

function App() {
  return <StudentDashboard />;
}
```

## API Integration

The component uses the following API endpoints:

- `GET /api/borrow/current` - Fetch current borrows
- `GET /api/borrow/overdue` - Fetch overdue status
- `GET /api/books/search?q={query}` - Search books
- `POST /api/borrow/request-return` - Request book return

Make sure your API client is configured correctly in `src/lib/apiClient.ts`.

## Design System

The component follows the specified design system:

- **Colors**: Primary (#2563EB), Success (#059669), Warning (#D97706), Error (#DC2626)
- **Typography**: h1 (40px), h2 (32px), h3 (24px), h4 (20px), body (16px)
- **Spacing**: xs (4px), sm (8px), md (16px), lg (24px)
- **Shadows**: sm, md, lg

## Storybook

Storybook stories are available at `src/components/web/StudentDashboard.stories.tsx`:

- Default state
- Empty state
- Overdue state
- Loading state
- Dark mode variation

## Accessibility

- All interactive elements have appropriate `aria-labels`
- Keyboard navigation support
- Proper color contrast ratios
- Semantic HTML structure

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (mobile-first design)
- Dark mode support
