/**
 * StudentDashboard component for LibrarySync Pro
 * A comprehensive dashboard showing current borrows, overdue items, and quick actions
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Bell,
  Search,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Timer,
  AlertCircle,
  Book,
  Home,
  Scan,
  User,
  Sun,
  Moon,
  User as UserIcon,
} from "lucide-react";
import {
  useCurrentBorrows,
  useOverdueStatus,
  useRequestReturn,
} from "../../hooks/useBorrows";
import { EmptyState } from "./EmptyState";
import { BookCardSkeleton, OverdueCardSkeleton } from "./LoadingSkeleton";
import { handleApiError } from "../../lib/apiClient";

// Types
interface User {
  name: string;
  avatar?: string;
  isOnline?: boolean;
}

interface ThemeContextType {
  mode: "light" | "dark";
  toggleTheme: () => void;
}

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Days Left Badge Component
interface DaysLeftBadgeProps {
  daysLeft: number;
}

const DaysLeftBadge: React.FC<DaysLeftBadgeProps> = ({ daysLeft }) => {
  if (daysLeft > 7) {
    return (
      <span className="inline-flex items-center space-x-xs rounded-full px-sm py-xs text-sm font-semibold bg-success-light text-success">
        <CheckCircle className="w-4 h-4" />
        <span>{daysLeft} Days Left</span>
      </span>
    );
  }

  if (daysLeft >= 3) {
    return (
      <span className="inline-flex items-center space-x-xs rounded-full px-sm py-xs text-sm font-semibold bg-warning-light text-warning">
        <Timer className="w-4 h-4" />
        <span>{daysLeft} Days Left</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-xs rounded-full px-sm py-xs text-sm font-semibold bg-error-light text-error">
      <AlertCircle className="w-4 h-4" />
      <span>{daysLeft === 1 ? "1 Day Left" : `${daysLeft} Days Left`}</span>
    </span>
  );
};

// Main Component
export const StudentDashboard: React.FC = () => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User>({ name: "Alex", isOnline: true });
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [showReturnConfirm, setShowReturnConfirm] = useState<string | null>(
    null
  );

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // API Hooks
  const {
    data: currentBorrows,
    isLoading: isLoadingBorrows,
    error: borrowsError,
  } = useCurrentBorrows();
  const { data: overdueStatus, isLoading: isLoadingOverdue } =
    useOverdueStatus();
  const requestReturnMutation = useRequestReturn();

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
    // In a real app, this would update a theme context/provider
    document.documentElement.classList.toggle("dark");
  }, []);

  // Handle return request
  const handleRequestReturn = useCallback(
    async (borrowId: string) => {
      try {
        await requestReturnMutation.mutateAsync(borrowId);
        setShowReturnConfirm(null);
        // Show success toast (would use NotificationSystem in real app)
        alert("Return request submitted successfully");
      } catch (error) {
        const apiError = handleApiError(error);
        // Show error toast (would use NotificationSystem in real app)
        alert(`Error: ${apiError.message}`);
      }
    },
    [requestReturnMutation]
  );

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  // Calculate days left
  const calculateDaysLeft = useCallback((dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Get greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Navigation handlers
  const handleNavigate = useCallback((route: string) => {
    // In a real app, this would use React Router or similar
    console.log(`Navigate to ${route}`);
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface dark:bg-slate-800 shadow-sm z-50">
        <div className="h-full flex items-center justify-between px-md">
          {/* Left: User Avatar & App Name */}
          <div className="flex items-center space-x-md">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full ml-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-full ml-md bg-primary-light dark:bg-slate-700 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-primary dark:text-slate-300" />
                </div>
              )}
              {user.isOnline && (
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-success border-2 border-white dark:border-slate-800" />
              )}
            </div>
            <h1 className="text-slate-900 dark:text-white font-bold text-xl">
              LibrarySync
            </h1>
          </div>

          {/* Right: Notifications & Theme Toggle */}
          <div className="flex items-center space-x-md">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {themeMode === "light" ? (
                <Moon className="w-6 h-6" />
              ) : (
                <Sun className="w-6 h-6" />
              )}
            </button>
            <div className="relative">
              <button
                className="p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors mr-md"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6" />
              </button>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 pb-20 px-md">
        <div className="max-w-4xl mx-auto space-y-lg">
          {/* Greeting Section */}
          <section className="space-y-xs">
            <h2 className="text-slate-900 dark:text-white font-bold text-h2">
              {greeting}, {user.name}
            </h2>
            <p className="text-slate-900 dark:text-slate-300 opacity-70 text-body">
              Let's see what you're reading today.
            </p>
          </section>

          {/* Quick Book Search Bar */}
          <section>
            <div className="bg-surface dark:bg-slate-800 rounded-lg shadow-sm py-sm px-md flex items-center space-x-md">
              <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search for books, authors, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-slate-700 dark:text-slate-300 text-body border-none focus:outline-none bg-transparent placeholder:text-slate-500 dark:placeholder:text-slate-400"
                aria-label="Search for books"
              />
            </div>
          </section>

          {/* Overdue Status Card */}
          {isLoadingOverdue ? (
            <OverdueCardSkeleton />
          ) : overdueStatus?.hasOverdue ? (
            <section className="bg-error rounded-lg p-md shadow-md">
              <div className="flex items-center space-x-sm mb-xs">
                <AlertTriangle className="w-5 h-5 text-white" />
                <span className="text-white font-semibold text-sm">
                  ACTION REQUIRED
                </span>
              </div>
              <h3 className="text-white font-bold text-h3 mt-xs">
                {overdueStatus.overdueCount} Overdue{" "}
                {overdueStatus.overdueCount === 1 ? "Book" : "Books"}
              </h3>
              <p className="text-white font-medium text-body mt-xs">
                Total Fine Pending: ${overdueStatus.totalFine.toFixed(2)}
              </p>
              <button
                onClick={() => handleNavigate("/fines")}
                className="w-full mt-lg bg-white text-error font-semibold text-body py-sm px-md rounded-lg flex items-center justify-center space-x-sm hover:bg-slate-50 transition-colors"
                aria-label="Pay fines"
              >
                <span>Pay Fines</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </section>
          ) : null}

          {/* Current Borrows Section */}
          <section>
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-slate-900 dark:text-white font-bold text-h3">
                My Books
              </h3>
              <button
                onClick={() => handleNavigate("/books")}
                className="text-primary dark:text-blue-400 font-medium text-sm hover:underline"
                aria-label="View all books"
              >
                View All
              </button>
            </div>

            {isLoadingBorrows ? (
              <div className="space-y-md">
                <BookCardSkeleton />
                <BookCardSkeleton />
              </div>
            ) : borrowsError ? (
              <div className="bg-error-light dark:bg-red-900/20 rounded-lg p-md">
                <p className="text-error dark:text-red-400 text-body">
                  Error loading books. Please try again later.
                </p>
              </div>
            ) : !currentBorrows || currentBorrows.length === 0 ? (
              <EmptyState
                icon={<Book className="w-16 h-16 text-slate-400" />}
                title="No books currently borrowed"
                description="Start exploring our library collection!"
                actionLabel="Browse Books"
                onAction={() => handleNavigate("/books")}
              />
            ) : (
              <div className="space-y-md">
                {currentBorrows.map((borrow) => {
                  const daysLeft = calculateDaysLeft(borrow.dueDate);
                  return (
                    <div
                      key={borrow.id}
                      className="bg-surface dark:bg-slate-800 rounded-lg p-md flex items-center space-x-md shadow-sm"
                    >
                      {/* Book Cover */}
                      {borrow.bookCover ? (
                        <img
                          src={borrow.bookCover}
                          alt={borrow.bookTitle}
                          className="w-20 h-28 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <Book className="w-10 h-10 text-slate-400" />
                        </div>
                      )}

                      {/* Book Details */}
                      <div className="flex-1">
                        <h4 className="text-slate-900 dark:text-white font-semibold text-h4 mb-xs">
                          {borrow.bookTitle}
                        </h4>
                        {borrow.bookAuthor && (
                          <p className="text-slate-700 dark:text-slate-300 text-body mb-xs">
                            {borrow.bookAuthor}
                          </p>
                        )}
                        <p className="text-slate-700 dark:text-slate-300 text-body mb-xs">
                          Due: {formatDate(borrow.dueDate)}
                        </p>
                        <div className="flex items-center justify-between mt-xs">
                          <DaysLeftBadge daysLeft={daysLeft} />
                          <button
                            onClick={() => setShowReturnConfirm(borrow.id)}
                            className="text-primary dark:text-blue-400 font-medium text-sm hover:underline ml-auto"
                            aria-label={`Request return for ${borrow.bookTitle}`}
                          >
                            Request Return
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface dark:bg-slate-800 shadow-lg sm:hidden z-50">
        <div className="h-full flex justify-around items-center">
          <button
            onClick={() => handleNavigate("/")}
            className="flex flex-col items-center justify-center p-sm text-slate-500 dark:text-slate-400"
            aria-label="Home"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => handleNavigate("/scan")}
            className="flex flex-col items-center justify-center p-sm bg-primary-light dark:bg-blue-900/30 rounded-lg text-primary dark:text-blue-400"
            aria-label="Scan"
          >
            <Scan className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Scan</span>
          </button>
          <button
            onClick={() => handleNavigate("/books")}
            className="flex flex-col items-center justify-center p-sm text-slate-500 dark:text-slate-400"
            aria-label="Books"
          >
            <Book className="w-6 h-6" />
            <span className="text-xs mt-1">Books</span>
          </button>
          <button
            onClick={() => handleNavigate("/profile")}
            className="flex flex-col items-center justify-center p-sm text-slate-500 dark:text-slate-400"
            aria-label="Profile"
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </nav>

      {/* Return Confirmation Modal */}
      {showReturnConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-md">
          <div className="bg-surface dark:bg-slate-800 rounded-lg p-lg max-w-md w-full shadow-xl">
            <h3 className="text-slate-900 dark:text-white font-bold text-h3 mb-md">
              Confirm Return Request
            </h3>
            <p className="text-slate-700 dark:text-slate-300 text-body mb-lg">
              Are you sure you want to request a return for this book?
            </p>
            <div className="flex space-x-md">
              <button
                onClick={() => setShowReturnConfirm(null)}
                className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold text-body py-sm px-md rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestReturn(showReturnConfirm)}
                disabled={requestReturnMutation.isPending}
                className="flex-1 bg-primary text-white font-semibold text-body py-sm px-md rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {requestReturnMutation.isPending ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
