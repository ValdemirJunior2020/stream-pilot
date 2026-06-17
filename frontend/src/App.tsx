import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { useAuthStore } from "./store/authStore";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { MediaListPage } from "./pages/MediaListPage";
import { SeriesPage } from "./pages/SeriesPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { ContinuePage } from "./pages/ContinuePage";
import { PlayerPage } from "./pages/PlayerPage";
import { SearchPage } from "./pages/SearchPage";
import { GuidePage } from "./pages/GuidePage";

export function App() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="live" element={<MediaListPage title="TV ao Vivo" type="LIVE" />} />
          <Route path="movies" element={<MediaListPage title="Filmes" type="MOVIE" />} />
          <Route path="series" element={<SeriesPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="continue" element={<ContinuePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="player/:id" element={<PlayerPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
