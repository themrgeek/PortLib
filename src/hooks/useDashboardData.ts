import { useCallback, useEffect, useMemo, useState } from "react";
import { handleApiError } from "../lib/apiClient";
import { borrowService } from "../services/borrowService";
import { authService } from "../services/authService";
import type { Borrow } from "../services/borrowService";

export interface StudentDashboardData {
  studentName: string;
  studentId: string;
  major: string;
  totalBorrows: number;
  activeBorrows: number;
  totalFines: number;
  overdueBooks: Borrow[];
  currentBorrows: Borrow[];
}

interface DashboardState {
  data: StudentDashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isPaying: boolean;
  error: string | null;
  payError: string | null;
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    isPaying: false,
    error: null,
    payError: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const [profile, currentBorrowsRaw, overdueBorrowsRaw] = await Promise.all(
        [
          authService.getProfile().catch(() => null),
          borrowService.getCurrentBorrows(),
          borrowService.getOverdueBorrows(),
        ]
      );

      const currentBorrows = Array.isArray(currentBorrowsRaw)
        ? currentBorrowsRaw
        : [];
      const overdueBorrows = Array.isArray(overdueBorrowsRaw)
        ? overdueBorrowsRaw
        : [];

      const studentName =
        (profile as any)?.fullName ||
        (profile as any)?.full_name || // backend snake_case
        (profile as any)?.name ||
        (profile as any)?.email ||
        "Student";

      const studentId =
        (profile as any)?.studentId ||
        (profile as any)?.student_id ||
        (profile as any)?.id ||
        "N/A";

      const major =
        (profile as any)?.major ||
        (profile as any)?.department ||
        (profile as any)?.program ||
        "Major not set";

      const totalFines = overdueBorrows.reduce((sum, borrow) => {
        const fine = (borrow as any)?.fine ?? borrow.book?.fineAmount ?? 0;
        return sum + (Number.isFinite(fine) ? (fine as number) : 0);
      }, 0);

      const data: StudentDashboardData = {
        studentName,
        studentId,
        major,
        totalBorrows: currentBorrows.length,
        activeBorrows: currentBorrows.length,
        totalFines,
        overdueBooks: overdueBorrows,
        currentBorrows,
      };
      setState((prev) => ({
        ...prev,
        data,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("Dashboard load error:", apiError);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: apiError.message,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isRefreshing: true, error: null }));
    await fetchData();
    setState((prev) => ({ ...prev, isRefreshing: false }));
  }, [fetchData]);

  const payFine = useCallback(
    async (fineId: string, amount: number) => {
      setState((prev) => ({ ...prev, isPaying: true, payError: null }));
      try {
        await borrowService.payFine(fineId, amount);
        await fetchData();
        return { success: true };
      } catch (error) {
        const apiError = handleApiError(error);
        console.error("Pay fine error:", apiError);
        setState((prev) => ({
          ...prev,
          payError: apiError.message,
        }));
        return { success: false, message: apiError.message };
      } finally {
        setState((prev) => ({ ...prev, isPaying: false }));
      }
    },
    [fetchData]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exposedState = useMemo(
    () => ({
      data: state.data,
      isLoading: state.isLoading,
      isRefreshing: state.isRefreshing,
      isPaying: state.isPaying,
      error: state.error,
      payError: state.payError,
      refresh,
      refetch: fetchData,
      payFine,
    }),
    [fetchData, payFine, refresh, state]
  );

  return exposedState;
}
