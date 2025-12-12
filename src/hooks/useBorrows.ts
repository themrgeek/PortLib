/**
 * React Query hooks for borrow-related API calls
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../lib/apiClient";

// Types
export interface Borrow {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCover?: string;
  borrowDate: string;
  dueDate: string;
  daysLeft: number;
  isOverdue: boolean;
}

export interface OverdueStatus {
  hasOverdue: boolean;
  overdueCount: number;
  totalFine: number;
  overdueItems: Borrow[];
}

export interface BookSearchResult {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  cover?: string;
}

// API Functions
async function fetchCurrentBorrows(): Promise<Borrow[]> {
  return apiClient.get<Borrow[]>("/api/borrow/current");
}

async function fetchOverdueStatus(): Promise<OverdueStatus> {
  return apiClient.get<OverdueStatus>("/api/borrow/overdue");
}

async function searchBooks(query: string): Promise<BookSearchResult[]> {
  if (!query.trim()) return [];
  return apiClient.get<BookSearchResult[]>(
    `/api/books/search?q=${encodeURIComponent(query)}`
  );
}

async function requestReturn(
  borrowId: string
): Promise<{ success: boolean; message?: string }> {
  return apiClient.post<{ success: boolean; message?: string }>(
    "/api/borrow/request-return",
    {
      borrowId,
    }
  );
}

// React Query Hooks
export function useCurrentBorrows() {
  return useQuery({
    queryKey: ["borrows", "current"],
    queryFn: fetchCurrentBorrows,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

export function useOverdueStatus() {
  return useQuery({
    queryKey: ["borrows", "overdue"],
    queryFn: fetchOverdueStatus,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}

export function useBookSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["books", "search", query],
    queryFn: () => searchBooks(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 60000, // 1 minute
  });
}

export function useRequestReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestReturn,
    onSuccess: () => {
      // Invalidate and refetch current borrows
      queryClient.invalidateQueries({ queryKey: ["borrows", "current"] });
      queryClient.invalidateQueries({ queryKey: ["borrows", "overdue"] });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error("Request return error:", apiError);
      throw apiError;
    },
  });
}
