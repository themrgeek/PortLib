import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Share2,
  CheckCircle,
  Timer,
  Bookmark,
  Maximize,
  Scan,
  AlertCircle,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient, handleApiError } from "../../lib/apiClient";
import { EmptyState } from "./EmptyState";

type AvailabilityStatus = "Available" | "Checked Out" | "On Hold" | string;

export interface BookDetail {
  id: string;
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  barcode: string;
  location?: string;
  published?: string | number;
  availability?: AvailabilityStatus;
  coverImage?: string;
  category?: string;
}

export interface BorrowHistoryItem {
  id: string;
  label: string;
  date: string;
  status?: "returned" | "borrowed" | "pending" | "hold";
}

export interface RelatedBook {
  id: string;
  title: string;
  author?: string;
  coverImage?: string;
  availability?: AvailabilityStatus;
}

interface BookDetailViewProps {
  barcode: string;
  durationDays?: number;
  onBack?: () => void;
  onShare?: (book?: BookDetail) => void;
  onOpenScanner?: (barcode: string) => void;
  onViewAllHistory?: (bookId: string) => void;
  onBorrowSuccess?: () => void;
  onBorrowOverride?: (payload: { barcode: string; durationDays: number }) => Promise<void>;
  initialBookData?: BookDetail;
  initialHistory?: BorrowHistoryItem[];
  initialRelated?: RelatedBook[];
  variant?: "page" | "modal";
  forceLoading?: boolean;
}

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-slate-200 dark:bg-slate-700 rounded ${className} animate-pulse`} />
);

const BookDetailSkeleton: React.FC = () => (
  <div className="pt-16 pb-24 px-md space-y-lg">
    <div className="flex flex-col items-center pt-lg space-y-sm">
      <SkeletonBlock className="w-40 h-56 rounded-lg shadow-md" />
      <SkeletonBlock className="w-64 h-8" />
      <SkeletonBlock className="w-40 h-6" />
      <SkeletonBlock className="w-28 h-6" />
    </div>

    <div className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm space-y-sm">
      <SkeletonBlock className="w-3/4 h-5" />
      <SkeletonBlock className="w-full h-4" />
      <SkeletonBlock className="w-11/12 h-4" />
      <SkeletonBlock className="w-5/6 h-4" />
    </div>

    <div className="grid grid-cols-2 gap-md">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm space-y-xs"
        >
          <SkeletonBlock className="w-16 h-3" />
          <SkeletonBlock className="w-24 h-5" />
        </div>
      ))}
    </div>

    <div className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm flex items-center space-x-md">
      <SkeletonBlock className="w-10 h-10 rounded-md" />
      <div className="flex-1 space-y-xs">
        <SkeletonBlock className="w-1/2 h-4" />
        <SkeletonBlock className="w-32 h-5" />
      </div>
      <SkeletonBlock className="w-6 h-6 rounded" />
    </div>

    <div className="space-y-sm">
      <SkeletonBlock className="w-40 h-6" />
      <div className="space-y-md">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="relative border-l border-slate-200 dark:border-slate-700 ml-md pl-md">
            <SkeletonBlock className="w-4 h-4 rounded-full absolute -left-2.5 top-0" />
            <SkeletonBlock className="w-48 h-4" />
            <SkeletonBlock className="w-32 h-4 mt-1" />
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-sm">
      <SkeletonBlock className="w-56 h-6" />
      <div className="flex space-x-md overflow-x-auto pb-sm">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="w-32 flex-shrink-0 space-y-xs">
            <SkeletonBlock className="w-full h-40 rounded-lg shadow-sm" />
            <SkeletonBlock className="w-24 h-4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Spinner: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={`animate-spin h-5 w-5 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    role="presentation"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  barcode,
  durationDays = 14,
  onBack,
  onShare,
  onOpenScanner,
  onViewAllHistory,
  onBorrowSuccess,
  onBorrowOverride,
  initialBookData,
  initialHistory,
  initialRelated,
  variant = "page",
  forceLoading = false,
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const queryClient = useQueryClient();

  const bookQuery = useQuery({
    queryKey: ["book-detail", barcode],
    queryFn: () =>
      apiClient.get<BookDetail>(`/books/barcode/${encodeURIComponent(barcode)}`),
    enabled: !forceLoading && Boolean(barcode) && !initialBookData,
    initialData: initialBookData,
  });

  const bookError = bookQuery.error ? handleApiError(bookQuery.error) : null;

  const book = bookQuery.data;

  const historyQuery = useQuery({
    queryKey: ["borrow-history", book?.id],
    queryFn: () =>
      apiClient.get<BorrowHistoryItem[]>(
        `/borrow/history?bookId=${encodeURIComponent(book?.id || "")}`
      ),
    enabled: !forceLoading && Boolean(book?.id) && !initialHistory,
    initialData: initialHistory,
  });

  const relatedQuery = useQuery({
    queryKey: ["related-books", book?.category],
    queryFn: () =>
      apiClient.get<RelatedBook[]>(
        `/books/search?category=${encodeURIComponent(
          book?.category || "general"
        )}&limit=5`
      ),
    enabled: !forceLoading && Boolean(book?.category) && !initialRelated,
    initialData: initialRelated,
  });

  const borrowMutation = useMutation({
    mutationFn: async (selectedDuration: number) => {
      if (onBorrowOverride) {
        await onBorrowOverride({ barcode, durationDays: selectedDuration });
        return;
      }
      await apiClient.post("/borrow/borrow", {
        barcode,
        durationDays: selectedDuration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["book-detail", barcode] });
      onBorrowSuccess?.();
    },
  });

  const availabilityStyles = useMemo(() => {
    const status = (book?.availability || "Available").toLowerCase();
    if (status.includes("available")) {
      return {
        className:
          "bg-emerald-100 text-success dark:bg-emerald-900/40 dark:text-emerald-200",
        icon: <CheckCircle className="w-4 h-4 text-success" />,
        label: "Available",
      };
    }
    if (status.includes("checked")) {
      return {
        className:
          "bg-amber-100 text-warning dark:bg-amber-900/40 dark:text-amber-200",
        icon: <Timer className="w-4 h-4 text-warning" />,
        label: "Checked Out",
      };
    }
    return {
      className:
        "bg-primary-100 text-primary dark:bg-blue-900/40 dark:text-blue-200",
      icon: <Bookmark className="w-4 h-4 text-primary" />,
      label: "On Hold",
    };
  }, [book?.availability]);

  const descriptionPreview =
    book?.description && !showFullDescription
      ? `${book.description.slice(0, 320)}${
          book.description.length > 320 ? "..." : ""
        }`
      : book?.description;

  const renderBookCover = () => {
    if (book?.coverImage) {
      return (
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-40 h-56 rounded-lg shadow-md object-cover"
        />
      );
    }
    return (
      <div className="w-40 h-56 rounded-lg shadow-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        <Bookmark className="w-10 h-10 text-slate-400" />
      </div>
    );
  };

  const content = () => {
    if (bookQuery.isLoading) {
      return <BookDetailSkeleton />;
    }

    if (bookError || !book) {
      return (
        <div className="pt-16 pb-24 px-md">
          <EmptyState
            title="Book not found"
            description={bookError?.message || "Please try another selection."}
            actionLabel="Go back"
            onAction={onBack}
            icon={<AlertCircle className="w-16 h-16 text-error" />}
          />
        </div>
      );
    }

    return (
      <div className="pt-16 pb-24 px-md space-y-lg">
        <section className="flex flex-col items-center pt-lg">
          {renderBookCover()}
          <h1 className="text-slate-900 dark:text-white font-bold text-h1 mt-md text-center">
            {book.title}
          </h1>
          <p className="text-slate-700 dark:text-slate-300 text-h4 mt-xs text-center">
            {book.author}
          </p>
          <span
            className={`inline-flex items-center space-x-xs rounded-full px-sm py-xs mt-md text-sm font-semibold ${availabilityStyles.className}`}
          >
            {availabilityStyles.icon}
            <span>{availabilityStyles.label}</span>
          </span>
        </section>

        <section className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm">
          <p className="text-slate-700 dark:text-slate-200 text-body leading-relaxed">
            {descriptionPreview || "No description available."}
          </p>
          {book.description && book.description.length > 320 && (
            <button
              onClick={() => setShowFullDescription((prev) => !prev)}
              className="mt-sm text-primary font-semibold text-sm hover:underline"
              aria-label={showFullDescription ? "Show less" : "Read more"}
            >
              {showFullDescription ? "Show Less" : "Read More"}
            </button>
          )}
        </section>

        <section className="grid grid-cols-2 gap-md">
          {[
            { label: "ISBN", value: book.isbn || "N/A" },
            { label: "BARCODE", value: book.barcode },
            { label: "LOCATION", value: book.location || "Unknown" },
            { label: "PUBLISHED", value: book.published || "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm"
            >
              <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                {item.label}
              </p>
              <p className="text-slate-900 dark:text-white text-body font-semibold mt-xs">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="bg-surface dark:bg-slate-800 p-md rounded-lg shadow-sm flex items-center space-x-md">
          <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Scan className="w-6 h-6 text-primary" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-slate-700 dark:text-slate-300 text-body">
              Scan for checkout
            </p>
            <p className="text-slate-900 dark:text-white font-semibold text-body">
              {book.barcode}
            </p>
          </div>
          <button
            onClick={() => onOpenScanner?.(book.barcode)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open fullscreen scanner"
          >
            <Maximize className="w-6 h-6 text-slate-900 dark:text-white" />
          </button>
        </section>

        <section>
          <div className="flex justify-between items-center mb-sm">
            <h3 className="text-slate-900 dark:text-white font-bold text-h3">
              Borrow History
            </h3>
            <button
              onClick={() => onViewAllHistory?.(book.id)}
              className="text-primary font-medium text-sm hover:underline"
              aria-label="View all borrow history"
            >
              View All
            </button>
          </div>
          {historyQuery.isLoading ? (
            <div className="space-y-md">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative border-l border-slate-200 dark:border-slate-700 ml-md pl-md"
                >
                  <SkeletonBlock className="w-4 h-4 rounded-full absolute -left-2.5 top-0" />
                  <SkeletonBlock className="w-48 h-4" />
                  <SkeletonBlock className="w-32 h-4 mt-1" />
                </div>
              ))}
            </div>
          ) : !historyQuery.data || historyQuery.data.length === 0 ? (
            <EmptyState
              title="No history yet"
              description="Borrow activity for this book will appear here."
              icon={<Bookmark className="w-12 h-12 text-slate-400" />}
            />
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-700 ml-md">
              {historyQuery.data.map((item) => {
                const isActive =
                  item.status === "borrowed" || item.status === "pending";
                const dotColor = item.status === "returned" ? "bg-emerald-500" : isActive ? "bg-primary" : "bg-slate-300";
                return (
                  <div key={item.id} className="pb-md relative pl-md">
                    <span
                      className={`absolute -left-2.5 top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${dotColor}`}
                      aria-hidden
                    />
                    <p className="text-slate-900 dark:text-white font-medium text-body">
                      {item.label}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-xs">
                      {item.date}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h3 className="text-slate-900 dark:text-white font-bold text-h3 mb-sm">
            You might also like
          </h3>
          {relatedQuery.isLoading ? (
            <div className="flex space-x-md overflow-x-auto pb-sm">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="w-32 flex-shrink-0 space-y-xs">
                  <SkeletonBlock className="w-full h-40 rounded-lg shadow-sm" />
                  <SkeletonBlock className="w-24 h-4" />
                </div>
              ))}
            </div>
          ) : !relatedQuery.data || relatedQuery.data.length === 0 ? (
            <EmptyState
              title="No related books"
              description="Explore other categories to find similar titles."
              icon={<Bookmark className="w-12 h-12 text-slate-400" />}
            />
          ) : (
            <div className="flex overflow-x-auto space-x-md pb-sm">
              {relatedQuery.data.map((related) => (
                <div
                  key={related.id}
                  className="w-32 flex-shrink-0"
                  role="group"
                  aria-label={`Related book ${related.title}`}
                >
                  {related.coverImage ? (
                    <img
                      src={related.coverImage}
                      alt={related.title}
                      className="w-full h-40 rounded-lg shadow-sm object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg shadow-sm bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <Bookmark className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <p className="text-slate-900 dark:text-white font-medium text-sm mt-xs line-clamp-2">
                    {related.title}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const isAvailable =
    (book?.availability || "").toLowerCase().includes("available");

  return (
    <div
      className={`bg-background dark:bg-slate-900 flex flex-col min-h-screen ${
        variant === "modal"
          ? "md:max-w-4xl md:mx-auto md:rounded-2xl md:shadow-lg"
          : ""
      }`}
      role="main"
      aria-label="Book details"
    >
      <header className="fixed top-0 left-0 w-full h-16 bg-surface dark:bg-slate-800 flex items-center justify-between px-md shadow-sm z-10">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
        <h2 className="text-slate-900 dark:text-white font-bold text-h4">
          Book Details
        </h2>
        <button
          onClick={() => onShare?.(book)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Share book"
        >
          <Share2 className="w-6 h-6 text-slate-900 dark:text-white" />
        </button>
      </header>

      <main className="flex-1">
        {forceLoading ? <BookDetailSkeleton /> : content()}
      </main>

      {isAvailable && (
        <div className="fixed bottom-0 left-0 w-full bg-surface dark:bg-slate-800 p-md shadow-lg flex justify-center z-10">
          <button
            onClick={() => borrowMutation.mutate(durationDays)}
            disabled={borrowMutation.isPending}
            className="w-full max-w-sm bg-primary text-white py-md rounded-lg font-semibold text-body flex items-center justify-center space-x-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Borrow book"
          >
            {borrowMutation.isPending ? (
              <>
                <Spinner className="text-white" />
                <span>Borrowing...</span>
              </>
            ) : (
              <>
                <Bookmark className="w-5 h-5 text-white" />
                <span>Borrow Book</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
