import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProfilePage } from "./UserProfilePage";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });

const sampleProfile = {
  id: "user-1",
  fullName: "Alex Johnson",
  email: "alex.j@uni.edu",
  phone: "+1 555-0123",
  studentId: "20230045",
  department: "Computer Science",
  year: "3rd",
  role: "Student",
  totalBorrowed: 12,
  activeLoans: 2,
};

const meta = {
  title: "Components/UserProfilePage",
  component: UserProfilePage,
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
} satisfies Meta<typeof UserProfilePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialProfile: sampleProfile,
  },
};

export const Loading: Story = {
  args: {
    forceLoading: true,
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
    initialProfile: sampleProfile,
  },
};
