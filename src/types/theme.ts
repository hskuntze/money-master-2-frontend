export type ThemeResponse = {
  id?: number;
  appName: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardColor: string;
  loginTitle?: string | null;
  loginSubtitle?: string | null;
};

export type ThemeUpdateRequest = Omit<ThemeResponse, "id">;

export const defaultTheme: ThemeResponse = {
  appName: "Money Master 2",
  logoUrl: "",
  primaryColor: "#2563EB",
  secondaryColor: "#0F172A",
  accentColor: "#22C55E",
  backgroundColor: "#F8FAFC",
  textColor: "#0F172A",
  cardColor: "#FFFFFF",
  loginTitle: "Bem-vindo ao Money Master 2",
  loginSubtitle: "Controle suas finanças conversando com sua IA financeira.",
};
