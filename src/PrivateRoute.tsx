import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";

export default function PrivateRoute({ children, permissions }: { children: React.ReactNode; permissions?: string[] }) {
  const { authenticated, loading, user } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div className="page-loading">Carregando...</div>;
  if (!authenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (permissions?.length && !permissions.some((p) => user?.permissions?.includes(p))) {
    return <Navigate to="/app/denied" replace />;
  }

  return <>{children}</>;
}
