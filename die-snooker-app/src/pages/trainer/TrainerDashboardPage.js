import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import TrainerSidebarComponent from '../../components/trainer/SidebarComponent';
import AthletesView from './AthletesView';
import ProfileViewComponent from './ProfileViewComponent';
import styles from '../../styles/Layout.module.css'; // Import layout styles

const TrainerDashboardPage = () => {
  const { currentUser } = useAuth();
  const { userProfile, loadingProfile } = useUserProfile();
  const [activeView, setActiveView] = useState('athletes');

  if (loadingProfile) {
    return <div style={{padding: '20px', textAlign: 'center'}}>Loading user profile...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/trainer/login" replace />;
  }

  if (!userProfile && !loadingProfile) {
    console.error("TrainerDashboardPage: User authenticated but no profile found. This is unexpected for a trainer.");
    return <Navigate to="/trainer/login" />;
  }

  if (userProfile && userProfile.role !== 'TRAINER' && userProfile.role !== 'MENTAL_TRAINER') {
    console.warn(`User with role ${userProfile.role} accessed trainer dashboard. Redirecting.`);
    return <Navigate to="/" replace />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'athletes':
        return <AthletesView />;
      case 'profile':
        return <ProfileViewComponent />;
      default:
        return <AthletesView />;
    }
  };

  return (
    <div className={styles.appLayout}>
      <TrainerSidebarComponent activeView={activeView} setActiveView={setActiveView} />
      <main className={styles.mainContent}> {/* Use mainContent for consistency, specific bg handled by appLayout or mainContent itself */}
        {renderActiveView()}
      </main>
    </div>
  );
};

export default TrainerDashboardPage;
