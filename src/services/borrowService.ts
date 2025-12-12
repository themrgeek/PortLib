import { apiClient } from "../lib/apiClient";

export interface Book {
  id: string;
  title: string;
  author: string;
  dueDate?: string;
  daysLeft?: number;
  isOverdue?: boolean;
  fineAmount?: number;
  cover?: string;
  coverImage?: string;
}

export interface Borrow {
  id: string;
  book: Book;
  borrowDate: string;
  dueDate: string;
  status?: string;
  fine?: number;
}

interface PayFineRequest {
  fineId: string;
  amount: number;
}

interface PayFineResponse {
  success: boolean;
  message?: string;
}

export const borrowService = {
  async getCurrentBorrows(): Promise<Borrow[]> {
    return apiClient.get<Borrow[]>("/api/borrow/current");
  },

  async getOverdueBorrows(): Promise<Borrow[]> {
    return apiClient.get<Borrow[]>("/api/borrow/overdue");
  },

  async payFine(fineId: string, amount: number): Promise<PayFineResponse> {
    const payload: PayFineRequest = { fineId, amount };
    return apiClient.post<PayFineResponse>("/api/borrow/pay-fine", payload);
  },
};
