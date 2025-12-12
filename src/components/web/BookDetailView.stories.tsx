import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BookDetailView,
  BookDetail,
  BorrowHistoryItem,
  RelatedBook,
} from "./BookDetailView";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

const sampleBook: BookDetail = {
  id: "book-1",
  title: "The Pragmatic Programmer",
  author: "David Thomas, Andrew Hunt",
  description:
    "A guide to pragmatic programming that covers topics ranging from personal responsibility and career development to architectural techniques for keeping your code flexible and easy to adapt and reuse.",
  isbn: "978-0135957059",
  barcode: "LIB-00124",
  location: "Shelf A3",
  published: "2019",
  availability: "Available",
  coverImage:
    "https://images-na.ssl-images-amazon.com/images/I/41as+WafrFL._SX380_BO1,204,203,200_.jpg",
  category: "Computer Science",
};

const sampleHistory: BorrowHistoryItem[] = [
  {
    id: "h1",
    label: "Returned by Jane Doe",
    date: "Oct 12, 2023",
    status: "returned",
  },
  {
    id: "h2",
    label: "Borrowed by Jane Doe",
    date: "Sep 01, 2023",
    status: "borrowed",
  },
  {
    id: "h3",
    label: "Returned by John Smith",
    date: "Aug 28, 2023",
    status: "returned",
  },
];

const sampleRelated: RelatedBook[] = [
  {
    id: "r1",
    title: "Clean Code",
    coverImage:
      "https://images-na.ssl-images-amazon.com/images/I/41xShlnTZTL._SX374_BO1,204,203,200_.jpg",
    availability: "Available",
  },
  {
    id: "r2",
    title: "Refactoring",
    coverImage:
      "https://images-na.ssl-images-amazon.com/images/I/41Z87H7Gm-L._SX396_BO1,204,203,200_.jpg",
    availability: "Available",
  },
  {
    id: "r3",
    title: "Design Patterns",
    coverImage:
      "https://images-na.ssl-images-amazon.com/images/I/51kuc0iWoRL._SX342_SY445_QL70_ML2_.jpg",
    availability: "Available",
  },
];

const meta = {
  title: "Components/BookDetailView",
  component: BookDetailView,
  decorators: [
    (Story) => {
      const clientRef = React.useRef(createQueryClient());
      return (
        <QueryClientProvider client={clientRef.current}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#f8fafc" },
        { name: "dark", value: "#0f172a" },
      ],
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BookDetailView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    barcode: sampleBook.barcode,
    initialBookData: sampleBook,
    initialHistory: sampleHistory,
    initialRelated: sampleRelated,
  },
};

export const Loading: Story = {
  args: {
    barcode: sampleBook.barcode,
    forceLoading: true,
  },
};

export const Unavailable: Story = {
  args: {
    barcode: sampleBook.barcode,
    initialBookData: { ...sampleBook, availability: "Checked Out" },
    initialHistory: sampleHistory,
    initialRelated: sampleRelated,
  },
};

export const EmptyHistory: Story = {
  args: {
    barcode: sampleBook.barcode,
    initialBookData: sampleBook,
    initialHistory: [],
    initialRelated: sampleRelated,
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("dark");
      }
      const clientRef = React.useRef(createQueryClient());
      return (
        <QueryClientProvider client={clientRef.current}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
  args: {
    barcode: sampleBook.barcode,
    initialBookData: sampleBook,
    initialHistory: sampleHistory,
    initialRelated: sampleRelated,
  },
};
