/**
 * Storybook stories for StudentDashboard component
 * Provides isolated QueryClient per story to avoid cross-story cache bleed.
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudentDashboard } from "./StudentDashboard";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

const meta = {
  title: "Components/StudentDashboard",
  component: StudentDashboard,
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
} satisfies Meta<typeof StudentDashboard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: "dark",
    },
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
};
