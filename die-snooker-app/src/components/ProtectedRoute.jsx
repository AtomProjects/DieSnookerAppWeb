import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useUserProfile } from '../contexts/UserProfileContext.jsx'; // Will be used for role-based protection

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, loadingAuthState } = useAuth();
  const { userProfile, loadingProfile } = useUserProfile();

  if (loadingAuthState || loadingProfile) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles are specified, check if the user's role is included
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
    // Redirect to a default page or an unauthorized page if role doesn't match
    // For now, redirecting to player app if role mismatch for a trainer route, or vice-versa
    if (userProfile.role === 'PLAYER') {
        return <Navigate to="/" replace />;
    } else if (userProfile.role === 'TRAINER' || userProfile.role === 'MENTAL_TRAINER') {
        return <Navigate to="/trainer/dashboard" replace />;
    }
    return <Navigate to="/login" replace />; // Fallback if role is unexpected
  }

  return <Outlet />; // Render child route content
};

export default ProtectedRoute;
