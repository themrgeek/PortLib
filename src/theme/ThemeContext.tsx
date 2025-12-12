import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemeMode = "light" | "dark";

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  border: string;
  accentGreen: string;
  accentRed: string;
  accentYellow: string;
  accentBlue: string;
  navBackground: string;
  navActiveBackground: string;
  navIconActive: string;
  navIconInactive: string;
  warningBackground: string;
  warningText: string;
  chipBackground: string;
  chipText: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  palette: ThemePalette;
  toggleTheme: () => void;
  ready: boolean;
};

const STORAGE_KEY = "portlib-theme-mode";

const lightPalette: ThemePalette = {
  background: "#F0F4FF",
  surface: "#FFFFFF",
  surfaceAlt: "#E0E7FF",
  primary: "#2563EB",
  textPrimary: "#333333",
  textSecondary: "#666666",
  muted: "#A0A0A0",
  border: "#E5E7EB",
  accentGreen: "#10B981",
  accentRed: "#DC2626",
  accentYellow: "#FBBF24",
  accentBlue: "#2563EB",
  navBackground: "#FFFFFF",
  navActiveBackground: "#E0E7FF",
  navIconActive: "#2563EB",
  navIconInactive: "#A0A0A0",
  warningBackground: "#FEF2F2",
  warningText: "#DC2626",
  chipBackground: "#E0E7FF",
  chipText: "#2563EB",
};

const darkPalette: ThemePalette = {
  background: "#0F172A",
  surface: "#111827",
  surfaceAlt: "#1F2937",
  primary: "#60A5FA",
  textPrimary: "#F9FAFB",
  textSecondary: "#D1D5DB",
  muted: "#9CA3AF",
  border: "#1F2937",
  accentGreen: "#34D399",
  accentRed: "#F87171",
  accentYellow: "#FACC15",
  accentBlue: "#60A5FA",
  navBackground: "#111827",
  navActiveBackground: "#1F2937",
  navIconActive: "#60A5FA",
  navIconInactive: "#6B7280",
  warningBackground: "#2C1B1B",
  warningText: "#FECACA",
  chipBackground: "#1F2937",
  chipText: "#D1D5DB",
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  palette: lightPalette,
  toggleTheme: () => undefined,
  ready: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored === "dark" || stored === "light") {
          setMode(stored);
        }
      } catch (error) {
        console.warn("Failed to load theme preference", error);
      } finally {
        setReady(true);
      }
    };

    load();
  }, []);

  const toggleTheme = async () => {
    const nextMode: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(nextMode);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn("Failed to persist theme preference", error);
    }
  };

  const palette = useMemo(
    () => (mode === "light" ? lightPalette : darkPalette),
    [mode]
  );

  const value = useMemo(
    () => ({
      mode,
      palette,
      toggleTheme,
      ready,
    }),
    [mode, palette, ready]
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeContext);
