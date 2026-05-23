import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultTheme, ThemeResponse } from "@/types/theme";
import { api } from "@/utils/requests";

export type ThemeContextType = {
  theme: ThemeResponse;
  loading: boolean;
  applyPreview: (theme: ThemeResponse) => void;
  reloadTheme: () => Promise<void>;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  loading: true,
  applyPreview: () => null,
  reloadTheme: async () => undefined,
});

function applyCssVariables(theme: ThemeResponse) {
  const root = document.documentElement;
  root.style.setProperty(
    "--mm-primary",
    theme.primaryColor || defaultTheme.primaryColor,
  );
  root.style.setProperty(
    "--mm-secondary",
    theme.secondaryColor || defaultTheme.secondaryColor,
  );
  root.style.setProperty(
    "--mm-accent",
    theme.accentColor || defaultTheme.accentColor,
  );
  root.style.setProperty(
    "--mm-background",
    theme.backgroundColor || defaultTheme.backgroundColor,
  );
  root.style.setProperty(
    "--mm-text",
    theme.textColor || defaultTheme.textColor,
  );
  root.style.setProperty(
    "--mm-card",
    theme.cardColor || defaultTheme.cardColor,
  );
  document.title = theme.appName || defaultTheme.appName;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeResponse>(defaultTheme);
  const [loading, setLoading] = useState(true);

  const reloadTheme = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getTheme();
      setTheme(response.data);
      applyCssVariables(response.data);
    } catch {
      setTheme(defaultTheme);
      applyCssVariables(defaultTheme);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyPreview = useCallback((preview: ThemeResponse) => {
    setTheme(preview);
    applyCssVariables(preview);
  }, []);

  useEffect(() => {
    reloadTheme();
  }, [reloadTheme]);

  const value = useMemo(
    () => ({ theme, loading, applyPreview, reloadTheme }),
    [theme, loading, applyPreview, reloadTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
