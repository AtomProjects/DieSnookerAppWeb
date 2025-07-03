import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useUserProfile } from '../../contexts/UserProfileContext.jsx';
import styles from '../../styles/Layout.module.css'; // Import layout styles

const TrainerSidebarComponent = ({ activeView, setActiveView }) => {
  const { currentUser, logout } = useAuth();
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/trainer/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const navItems = [
    { name: 'Athletes', view: 'athletes' },
    { name: 'My Profile', view: 'profile' },
  ];

  return (
    // Using trainerSidebar which composes sidebar but can have overrides
    <aside className={styles.trainerSidebar}>
      <h2 className={styles.sidebarHeader}>Trainer Dashboard</h2>
      <nav className={styles.sidebarNav}>
        <ul>
          {navItems.map(item => (
            <li key={item.view} className={styles.sidebarNavItem}>
              <button
                onClick={() => setActiveView(item.view)}
                // Example of applying active class based on prop
                className={activeView === item.view ? styles.active : ''}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarFooter}>
        {userProfile && (
          <>
            <p><strong>{userProfile.displayName || currentUser?.email}</strong></p>
            <p style={{ fontSize: '0.9em', textTransform: 'capitalize' }}>{userProfile.role?.replace('_', ' ').toLowerCase()}</p>
          </>
        )}
        {currentUser && <p className={styles.email}>{currentUser.email}</p>}
        <button
          onClick={handleLogout}
          className={styles.logoutButton} // General logout button style from Layout.module.css
                                           // Specific trainer logout button style is applied via .trainerSidebar .logoutButton
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default TrainerSidebarComponent;
