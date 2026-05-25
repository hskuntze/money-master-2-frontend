import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BarChartIcon from "@mui/icons-material/BarChart";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import PaletteIcon from "@mui/icons-material/Palette";
import SettingsIcon from "@mui/icons-material/Settings";
import SavingsIcon from "@mui/icons-material/Savings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";
import GuidedTour from "../GuidedTour";
import { api, resolveApiAssetUrl } from "@/utils/requests";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  permission?: string;
  anyPermission?: string[];
};

const navItems: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard mensal", icon: <DashboardIcon /> },
  {
    to: "/app/monthly-periods",
    label: "Ciclos mensais",
    icon: <EventRepeatIcon />,
  },
  {
    to: "/app/installment-purchases",
    label: "Compras parceladas",
    icon: <CreditCardIcon />,
  },
  {
    to: "/app/transactions",
    label: "Histórico diário",
    icon: <ReceiptLongIcon />,
  },
  { to: "/app/categories", label: "Categorias", icon: <CategoryIcon /> },
  { to: "/app/savings-jars", label: "Cofrinhos", icon: <SavingsIcon /> },
  { to: "/app/reports", label: "Relatórios", icon: <BarChartIcon /> },
  { to: "/app/chat", label: "Chat IA", icon: <AutoAwesomeIcon /> },
  {
    to: "/app/profile",
    label: "Perfil do usuário",
    icon: <AccountCircleOutlinedIcon />,
  },
  {
    to: "/app/theme",
    label: "Tema",
    icon: <PaletteIcon />,
    permission: "THEME_MANAGE",
  },
  {
    to: "/app/system",
    label: "Sistema",
    icon: <SettingsIcon />,
    anyPermission: ["LOG_READ", "EMAIL_SETTINGS_MANAGE"],
  },
];

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "MM";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AppLayout() {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [tourOpen, setTourOpen] = useState(false);
  const [tourInvitationOpen, setTourInvitationOpen] = useState(false);
  const userAvatarUrl = resolveApiAssetUrl(user?.avatarUrl);

  useEffect(() => {
    if (!user?.email) return;

    api
      .getOnboardingStatus()
      .then((response) => {
        if (!response.data.onboardingCompleted) {
          navigate("/onboarding", { replace: true });
          return;
        }

        const forcedTour =
          sessionStorage.getItem("mm-start-tour-after-onboarding") === "true";
        const alreadyInvited =
          sessionStorage.getItem("mm-tour-invite-shown") === "true";
        const shouldInvite =
          (forcedTour || response.data.shouldInviteTour) &&
          !response.data.tourCompleted &&
          !response.data.tourSkipped &&
          !alreadyInvited;

        if (shouldInvite) {
          sessionStorage.setItem("mm-tour-invite-shown", "true");
          sessionStorage.removeItem("mm-start-tour-after-onboarding");
          setTourInvitationOpen(true);
        }
      })
      .catch(() => {
        // Mantém a navegação se a consulta falhar momentaneamente.
      });
  }, [location.pathname, navigate, user?.email]);

  const startTour = useCallback(() => {
    setTourInvitationOpen(false);
    setTourOpen(true);
  }, []);

  const skipTourInvitation = useCallback(() => {
    setTourInvitationOpen(false);
    api.skipGuidedTour().catch(() => undefined);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/app/dashboard" className="brand-block">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={theme.appName} />
          ) : (
            <span>MM</span>
          )}
          <div>
            <strong>{theme.appName || "Money Master 2"}</strong>
            <small>Kuntze Dev</small>
          </div>
        </NavLink>

        <nav className="side-nav">
          {navItems
            .filter(
              (item) =>
                (!item.permission ||
                  user?.permissions?.includes(item.permission)) &&
                (!item.anyPermission ||
                  item.anyPermission.some((permission) =>
                    user?.permissions?.includes(permission),
                  )),
            )
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-tour={
                  item.to === "/app/monthly-periods"
                    ? "nav-monthly-periods"
                    : item.to === "/app/reports"
                      ? "nav-reports"
                      : undefined
                }
                className={({ isActive }) =>
                  `side-link ${isActive ? "active" : ""}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        <button type="button" className="logout-button" onClick={handleLogout}>
          <LogoutIcon />
          <span>Sair</span>
        </button>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <span>Olá, {user?.name?.split(" ")[0] || "usuário"}</span>
            <strong>Planeje seu ciclo mensal com menos fricção</strong>
          </div>
          <div className="topbar-actions">
            <button
              type="button"
              className="help-tour-button"
              onClick={startTour}
            >
              <HelpOutlineIcon />
              <span>Tour do sistema</span>
            </button>
            <NavLink
              to="/app/profile"
              className="user-chip user-profile-chip"
              aria-label="Abrir perfil do usuário"
            >
              <span className="topbar-avatar">
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="Foto do usuário" />
                ) : (
                  getInitials(user?.name, user?.email)
                )}
              </span>
              <span>{user?.email}</span>
            </NavLink>
          </div>
        </header>
        <Outlet />
      </main>

      {tourInvitationOpen && (
        <div className="modal-backdrop tour-invite-backdrop">
          <section className="modal-card tour-invite-card">
            <h3>Quer fazer um tour rápido?</h3>
            <p>
              Em poucos passos eu te mostro onde ficam o planejamento mensal,
              contas, transações, compras parceladas, cofrinhos e relatórios.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={skipTourInvitation}
              >
                Pular agora
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={startTour}
              >
                Iniciar tour
              </button>
            </div>
          </section>
        </div>
      )}

      <GuidedTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onCompleted={() => setTourInvitationOpen(false)}
        onSkipped={() => setTourInvitationOpen(false)}
      />
    </div>
  );
}
