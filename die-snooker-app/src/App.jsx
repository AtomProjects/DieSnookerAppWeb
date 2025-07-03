import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';

import ProtectedRoute from './components/ProtectedRoute';
import PlayerApp from './pages/PlayerApp';
import LoginPage from './pages/LoginPage';
import TrainerRegistrationPage from './pages/trainer/TrainerRegistrationPage';
import TrainerDashboardPage from './pages/trainer/TrainerDashboardPage';
// import TrainerLoginPage from './pages/trainer/TrainerLoginPage'; // No longer separate
import LoginPage from './pages/LoginPage'; // Used for trainer login as well

import './App.css'; // Keep or modify global styles

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
