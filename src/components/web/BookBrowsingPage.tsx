import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bell,
  Search as SearchIcon,
  SlidersHorizontal,
  Dot,
  Bookmark,
  Book as BookIcon,
  Home,
  Search,
  BookOpen,
  User,
  Filter,
  X,
} from "lucide-react";
import {
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient, handleApiError } from "../../lib/apiClient";
import {
  BookCardSkeleton,
  SearchBarSkeleton,
} from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";

type Availability = "Available" | "Checked Out" | "On Hold" | string;

export interface BookListItem {
  id: string;
  title: string;
  author: string;
  coverImage?: string | null;
  availability: Availability;
  dueDate?: string | null;
  category?: string;
  barcode?: string;
}

interface PaginatedBooks {
  items: BookListItem[];
  nextPage?: number | null;
  total?: number;
}

interface BookBrowsingPageProps {
  initialCategory?: string;
  categories?: string[];
  onSelectBook?: (book: BookListItem) => void;
  onBorrowBook?: (book: BookListItem) => void;
  onNotify?: (book: BookListItem) => void;
  onOpenFilters?: () => void;
  initialData?: PaginatedBooks;
  forceLoading?: boolean;
}

const DEFAULT_CATEGORIES = ["All", "Computer Science", "Fiction", "History"];

function useDebounce<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const badgeClassByAvailability = (availability: Availability) => {
  const status = (availability || "").toLowerCase();
  if (status.includes("available")) {
    return "bg-emerald-100 text-success";
  }
  if (status.includes("checked")) {
    return "bg-amber-100 text-warning";
  }
  return "bg-primary-100 text-primary";
};

export const BookBrowsingPage: React.FC<BookBrowsingPageProps> = ({
  initialCategory = "All",
  categories = DEFAULT_CATEGORIES,
  onSelectBook,
  onBorrowBook,
  onNotify,
  onOpenFilters,
  initialData,
  forceLoading = false,
}) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<Availability | "all">("all");
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchBooks = useCallback(
    async ({ pageParam = 1 }: { pageParam?: number }) => {
      const isSearching = debouncedSearch.trim().length >= 2;
      const endpoint = isSearching
        ? `/books/search?q=${encodeURIComponent(debouncedSearch)}&page=${pageParam}&limit=10`
        : `/books/available?page=${pageParam}&limit=10${
            activeCategory && activeCategory !== "All"
              ? `&category=${encodeURIComponent(activeCategory)}`
              : ""
          }`;

      const response = await apiClient.get<PaginatedBooks | BookListItem[]>(
        endpoint
      );

      if (Array.isArray(response)) {
        const filtered = availabilityFilter === "all"
          ? response
          : response.filter(
              (book) =>
                (book.availability || "").toLowerCase() ===
                availabilityFilter.toLowerCase()
            );
        return {
          items: filtered,
          nextPage: null,
        } satisfies PaginatedBooks;
      }

      const filtered = availabilityFilter === "all"
        ? response.items
        : response.items.filter(
            (book) =>
              (book.availability || "").toLowerCase() ===
              availabilityFilter.toLowerCase()
          );

      return {
        ...response,
        items: filtered,
      };
    },
    [activeCategory, availabilityFilter, debouncedSearch]
  );

  const booksQuery = useInfiniteQuery({
    queryKey: ["books-browse", activeCategory, debouncedSearch, availabilityFilter],
    queryFn: fetchBooks,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? null,
    enabled: !forceLoading,
    initialData: initialData
      ? {
          pages: [initialData],
          pageParams: [1],
        }
      : undefined,
  });

  const books = useMemo(
    () => booksQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [booksQuery.data]
  );

  useEffect(() => {
    if (!loadMoreRef.current || forceLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && booksQuery.hasNextPage) {
          booksQuery.fetchNextPage();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [booksQuery.hasNextPage, booksQuery.fetchNextPage]);

  const handleClearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setAvailabilityFilter("all");
    queryClient.removeQueries({ queryKey: ["books-browse"] });
  };

  const formatDueDate = (date?: string | null) => {
    if (!date) return null;
    try {
      const parsed = new Date(date);
      return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return date;
    }
  };

  const renderBookCard = (book: BookListItem) => {
    const isAvailable = (book.availability || "").toLowerCase().includes("available");
    const due = formatDueDate(book.dueDate);
    return (
      <div
        key={book.id}
        className="relative bg-surface dark:bg-slate-800 rounded-lg p-md flex items-center space-x-md shadow-sm"
      >
        <div className="w-24 h-32 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookIcon className="w-10 h-10 text-slate-400" />
          )}
        </div>

        <div className="flex-1 flex flex-col space-y-xs">
          <span
            className={`inline-flex items-center space-x-xs rounded-full px-sm py-xs text-xs font-semibold ${badgeClassByAvailability(
              book.availability
            )}`}
          >
            <Dot className="w-3 h-3" />
            <span>{book.availability}</span>
          </span>
          <h4 className="text-slate-900 dark:text-white font-bold text-h4 line-clamp-2">
            {book.title}
          </h4>
          <p className="text-slate-700 dark:text-slate-300 text-body">
            {book.author}
          </p>
          {!isAvailable && due && (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Due: {due}</p>
          )}

          <div className="flex items-center mt-sm space-x-sm">
            {isAvailable ? (
              <button
                onClick={() => onBorrowBook?.(book)}
                className="bg-primary text-white py-sm px-md rounded-lg font-semibold text-body hover:bg-primary/90 transition-colors"
                aria-label={`Borrow ${book.title}`}
              >
                Borrow
              </button>
            ) : (
              <button
                onClick={() => onSelectBook?.(book)}
                className="bg-surface text-slate-900 dark:text-white py-sm px-md rounded-lg font-semibold text-body border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                aria-label={`View details for ${book.title}`}
              >
                Details
              </button>
            )}
            {!isAvailable && (
              <button
                onClick={() => onNotify?.(book)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-auto"
                aria-label={`Notify when ${book.title} is available`}
              >
                <Bell className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>

        <button
          className="absolute top-2 right-2 p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Save to list"
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const showEmpty =
    !forceLoading && !booksQuery.isLoading && !booksQuery.isFetching && books.length === 0;
  const apiError = booksQuery.error ? handleApiError(booksQuery.error) : null;
  const isLoading = forceLoading || booksQuery.isLoading;

  return (
    <div className="bg-background dark:bg-slate-900 flex flex-col min-h-screen" role="main" aria-label="Browse books page">
      <header className="fixed top-0 left-0 w-full h-16 bg-surface dark:bg-slate-800 flex items-center justify-between px-md shadow-sm z-10">
        <h1 className="text-slate-900 dark:text-white font-bold text-h2">
          Browse Books
        </h1>
        <div className="relative">
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6 text-slate-900 dark:text-white" />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
        </div>
      </header>

      <main className="pt-16 pb-16 px-md space-y-lg">
        <section className="space-y-md">
          {isLoading ? (
            <SearchBarSkeleton />
          ) : (
            <div className="bg-surface dark:bg-slate-800 rounded-lg p-sm px-md flex items-center space-x-sm shadow-sm mt-md">
              <SearchIcon className="w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Title, author, ISBN..."
                className="flex-1 bg-transparent text-slate-700 dark:text-slate-200 text-body placeholder-slate-500 focus:outline-none"
                aria-label="Search books"
              />
              <button
                onClick={() => {
                  setFiltersOpen(true);
                  onOpenFilters?.();
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Filter options"
              >
                <SlidersHorizontal className="w-5 h-5 text-primary" />
              </button>
            </div>
          )}

          <div className="flex overflow-x-auto space-x-sm pt-md pb-sm">
            {categories.map((category) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-md py-sm rounded-full whitespace-nowrap font-medium text-sm transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-surface dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  }`}
                  aria-label={`Filter by ${category}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-md">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-900 dark:text-white font-bold text-body">
              RECENTLY ADDED
            </h3>
            <button
              className="text-primary font-medium text-sm hover:underline"
              aria-label="View all recently added books"
              onClick={() => booksQuery.refetch()}
            >
              View all
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-md">
              <BookCardSkeleton />
              <BookCardSkeleton />
              <BookCardSkeleton />
            </div>
          ) : apiError ? (
            <EmptyState
              title="Unable to load books"
              description={apiError.message}
              actionLabel="Retry"
              onAction={() => booksQuery.refetch()}
              icon={<BookIcon className="w-12 h-12 text-error" />}
            />
          ) : showEmpty ? (
            <EmptyState
              title="No books found"
              description="Try a different search or clear filters."
              actionLabel="Clear Filters"
              onAction={handleClearFilters}
              icon={<BookIcon className="w-12 h-12 text-slate-400" />}
            />
          ) : (
            <div className="space-y-md">
              {books.map(renderBookCard)}
              <div ref={loadMoreRef} />
              {booksQuery.isFetchingNextPage && (
                <div className="space-y-md">
                  <BookCardSkeleton />
                  <BookCardSkeleton />
                </div>
              )}
              {!booksQuery.hasNextPage && (
                <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
                  End of list
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full h-16 bg-surface dark:bg-slate-800 flex justify-around items-center shadow-lg z-10 sm:hidden">
        {[
          { label: "Home", icon: <Home className="w-6 h-6" /> },
          {
            label: "Browse",
            icon: <Search className="w-6 h-6 text-primary" />,
            active: true,
          },
          { label: "My Loans", icon: <BookOpen className="w-6 h-6" /> },
          { label: "Profile", icon: <User className="w-6 h-6" /> },
        ].map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center justify-center p-sm ${
              item.active
                ? "rounded-lg bg-primary-100 text-primary"
                : "text-slate-500 dark:text-slate-400"
            }`}
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {filtersOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 flex justify-end">
          <div className="w-full max-w-sm bg-surface dark:bg-slate-800 h-full shadow-lg p-md space-y-md overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-sm">
                <Filter className="w-5 h-5 text-primary" />
                <h4 className="text-slate-900 dark:text-white font-bold">
                  Advanced Filters
                </h4>
              </div>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Close filters"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-sm">
              <p className="text-slate-700 dark:text-slate-300 text-body font-semibold">
                Availability
              </p>
              {["all", "Available", "Checked Out"].map((status) => (
                <label
                  key={status}
                  className="flex items-center space-x-sm text-slate-700 dark:text-slate-200"
                >
                  <input
                    type="radio"
                    name="availability"
                    value={status}
                    checked={availabilityFilter === status}
                    onChange={() => setAvailabilityFilter(status as Availability | "all")}
                    className="accent-primary"
                  />
                  <span>{status === "all" ? "All" : status}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-sm pt-md">
              <button
                onClick={() => {
                  setFiltersOpen(false);
                  booksQuery.refetch();
                }}
                className="flex-1 bg-primary text-white py-sm rounded-lg font-semibold text-body hover:bg-primary/90"
                aria-label="Apply filters"
              >
                Apply
              </button>
              <button
                onClick={handleClearFilters}
                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white py-sm rounded-lg font-semibold text-body hover:bg-slate-200 dark:hover:bg-slate-600"
                aria-label="Reset filters"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
