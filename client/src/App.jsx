import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { Splash } from "./components/ui/Splash";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RootLayout } from "./layouts/RootLayout";
import { AuthLayout } from "./layouts/AuthLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./pages/Lobby";
import DungeonSelect from "./pages/DungeonSelect";
import Room from "./pages/Room";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";

function App() {
  const init = useAuthStore((s) => s.init);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => { init(); }, [init]);

  if (!initialized) return <Splash message="Entering Mathoria…" />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/dungeons" element={<DungeonSelect />} />
          <Route path="/room/:code" element={<Room />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/inventory" element={<Inventory />} />
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;