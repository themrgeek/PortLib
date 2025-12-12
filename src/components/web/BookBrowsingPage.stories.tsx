import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BookBrowsingPage,
  BookListItem,
} from "./BookBrowsingPage";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

const sampleItems: BookListItem[] = [
  {
    id: "b1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    availability: "Available",
    coverImage:
      "https://images-na.ssl-images-amazon.com/images/I/51vv75oglyL._SX320_BO1,204,203,200_.jpg",
  },
  {
    id: "b2",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    availability: "Checked Out",
    dueDate: "2023-10-24",
  },
  {
    id: "b3",
    title: "Design Systems",
    author: "Alla Kholmatova",
    availability: "Available",
    coverImage:
      "https://images-na.ssl-images-amazon.com/images/I/41BBpAABJdL._SX380_BO1,204,203,200_.jpg",
  },
];

const meta = {
  title: "Components/BookBrowsingPage",
  component: BookBrowsingPage,
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
} satisfies Meta<typeof BookBrowsingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialData: { items: sampleItems, nextPage: null },
  },
};

export const Loading: Story = {
  args: {
    forceLoading: true,
  },
};

export const EmptyState: Story = {
  args: {
    initialData: { items: [], nextPage: null },
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
    initialData: { items: sampleItems, nextPage: null },
  },
};
