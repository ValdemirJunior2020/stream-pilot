import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LoadingState } from "../components/Status";

export function ProtectedRoute() {
  const { user, token, isHydrating } = useAuthStore();

  if (isHydrating) {
    return <div className="p-6"><LoadingState label="Validando sessão..." /></div>;
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
