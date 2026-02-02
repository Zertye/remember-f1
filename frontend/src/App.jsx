/**
 * App.jsx - Composant racine F1 Championship Manager
 * Gère le routing et les providers de contexte
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
import { Standings } from "./pages/public/Standings"; // Nouvelle page Classements
import { Calendar } from "./pages/public/Calendar";   // Nouvelle page Calendrier

// Pages privées (Dashboard & Admin)
import { Dashboard } from "./pages/private/Dashboard";
import { AdminRaceControl } from "./pages/private/AdminRaceControl"; // Gestion des courses
import { AdminTeams } from "./pages/private/AdminTeams";             // Gestion des écuries

/**
 * Composant App principal
 */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* --- ROUTES PUBLIQUES --- */}
            
            {/* Landing page (Accueil) */}
            <Route path="/" element={<Landing />} />
            
            {/* Login - Redirige vers dashboard si déjà connecté */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />

            {/* --- ROUTES MEMBRES (PROTECTED) --- */}
            {/* Accessibles à tout utilisateur connecté */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/standings"
              element={
                <ProtectedRoute>
                  <Standings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />

            {/* --- ROUTES ADMIN (RACE CONTROL) --- */}
            {/* Accessibles uniquement aux admins */}

            <Route
              path="/admin/races"
              element={
                <AdminRoute>
                  <AdminRaceControl />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/teams"
              element={
                <AdminRoute>
                  <AdminTeams />
                </AdminRoute>
              }
            />

            {/* --- CATCH-ALL --- */}
            {/* Redirige vers l'accueil si route inconnue */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
