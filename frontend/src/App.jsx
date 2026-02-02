/**
 * App.jsx - Composant racine F1 MANAGER PRO
 * Structure: Public (Vitrine) / Privé (Gestion Écurie) / Admin (FIA)
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Routes protégées
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";

// Pages publiques
import { Landing } from "./pages/public/Landing";
import { Login } from "./pages/public/Login";
import { Standings } from "./pages/public/Standings";
import { Calendar } from "./pages/public/Calendar";
import { TeamsList } from "./pages/public/TeamsList"; // Nouvelle page publique

// Pages privées (Membres)
import { Dashboard } from "./pages/private/Dashboard";
import { MyTeam } from "./pages/private/MyTeam"; // Gestion de l'écurie du joueur

// Pages Admin (FIA)
import { AdminRaceControl } from "./pages/private/AdminRaceControl";

/**
 * Composant App principal
 */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* --- ZONE PUBLIQUE (Accessible sans compte) --- */}
            
            <Route path="/" element={<Landing />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/teams" element={<TeamsList />} />
            
            {/* Login (Uniquement si pas connecté) */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />

            {/* --- PADDOCK PRIVÉ (Compte requis) --- */}
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Gestion de son écurie */}
            <Route
              path="/my-team"
              element={
                <ProtectedRoute>
                  <MyTeam />
                </ProtectedRoute>
              }
            />

            {/* --- FIA CONTROL (Admin uniquement) --- */}
            
            <Route
              path="/admin/race-control"
              element={
                <AdminRoute>
                  <AdminRaceControl />
                </AdminRoute>
              }
            />

            {/* --- CATCH-ALL --- */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
