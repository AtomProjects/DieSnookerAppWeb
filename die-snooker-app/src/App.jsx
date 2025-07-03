import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { UserProfileProvider } from './contexts/UserProfileContext.jsx';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import PlayerApp from './pages/PlayerApp.jsx';
import LoginPage from './pages/LoginPage.jsx';
import TrainerRegistrationPage from './pages/trainer/TrainerRegistrationPage.jsx'; // Renamed
import TrainerDashboardPage from './pages/trainer/TrainerDashboardPage.jsx'; // Renamed

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProfileProvider>
          <Routes>
            {/* Player Routes */}
            <Route path="/" element={<ProtectedRoute allowedRoles={['PLAYER', 'TRAINER', 'MENTAL_TRAINER']} />}>
              <Route index element={<PlayerApp />} />
            </Route>
            <Route path="/login" element={<LoginPage />} /> {/* Player login */}

            {/* Trainer Routes */}
            <Route path="/trainer/register" element={<TrainerRegistrationPage />} />
            <Route path="/trainer/login" element={<LoginPage />} /> {/* Trainer login also uses LoginPage */}
            <Route path="/trainer/dashboard" element={<ProtectedRoute allowedRoles={['TRAINER', 'MENTAL_TRAINER']} />}>
              <Route index element={<TrainerDashboardPage />} />
            </Route>

            {/* Redirect unknown paths - consider a 404 page later */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </UserProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
