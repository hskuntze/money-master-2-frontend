import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BarChartIcon from "@mui/icons-material/BarChart";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import LogoutIcon from "@mui/icons-material/Logout";
import PaletteIcon from "@mui/icons-material/Palette";
import SettingsIcon from "@mui/icons-material/Settings";
import SavingsIcon from "@mui/icons-material/Savings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { ReactNode, useContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { ThemeContext } from "@/contexts/ThemeContext";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  permission?: string;
  anyPermission?: string[];
};

const navItems: NavItem[] = [
  { to: "/app/dashboard", label: "Início", icon: <DashboardIcon /> },
  { to: "/app/chat", label: "Chat IA", icon: <AutoAwesomeIcon /> },
  { to: "/app/transactions", label: "Transações", icon: <ReceiptLongIcon /> },
  { to: "/app/accounts", label: "Contas", icon: <AccountBalanceWalletIcon /> },
  { to: "/app/categories", label: "Categorias", icon: <CategoryIcon /> },
  { to: "/app/savings-jars", label: "Cofrinhos", icon: <SavingsIcon /> },
  {
    to: "/app/monthly-periods",
    label: "Virada do mês",
    icon: <EventRepeatIcon />,
  },
  { to: "/app/reports", label: "Relatórios", icon: <BarChartIcon /> },
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

export default function AppLayout() {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

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
            <strong>Controle suas finanças com clareza</strong>
          </div>
          <div className="user-chip">{user?.email}</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
