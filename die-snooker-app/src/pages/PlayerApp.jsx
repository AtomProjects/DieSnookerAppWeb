import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useUserProfile } from '../contexts/UserProfileContext.jsx';
import SidebarComponent from '../components/player/SidebarComponent.jsx';
import MainContentComponent from '../components/player/MainContentComponent.jsx';
import styles from '../styles/Layout.module.css'; // Import layout styles

const PlayerApp = () => {
  const { currentUser } = useAuth();
  const { userProfile, loadingProfile } = useUserProfile();
  const [activeSection, setActiveSection] = useState('selfAssessment');

  if (loadingProfile) {
    return <div style={{padding: '20px', textAlign: 'center'}}>Loading user profile...</div>;
  }

  if (!userProfile && !loadingProfile) {
    console.warn("PlayerApp: No user profile and not loading. Potential redirect to login by ProtectedRoute or this component.");
    return <Navigate to="/login" />;
  }

  if (userProfile && (userProfile.role === 'TRAINER' || userProfile.role === 'MENTAL_TRAINER')) {
    return <Navigate to="/trainer/dashboard" replace />;
  }

  if (userProfile && userProfile.role !== 'PLAYER') {
    console.warn(`PlayerApp: User ${currentUser?.email} has role ${userProfile.role}, expected PLAYER. Redirecting.`);
    return <Navigate to="/login" />;
  }

  return (
    <div className={styles.appLayout}>
      <SidebarComponent activeSection={activeSection} setActiveSection={setActiveSection} />
      <MainContentComponent activeSection={activeSection} />
    </div>
  );
};

export default PlayerApp;
