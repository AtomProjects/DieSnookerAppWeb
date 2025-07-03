import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import styles from '../../styles/Layout.module.css'; // Import layout styles

const SidebarComponent = ({ activeSection, setActiveSection }) => {
  const { currentUser, logout } = useAuth();
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const navItems = [
    { name: 'Selbsteinschätzung', section: 'selfAssessment' },
    { name: 'Übungen', section: 'exercises' },
    { name: 'Aufgaben', section: 'tasks' },
    { name: 'Trainingsplan', section: 'trainingPlan' },
    { name: 'Verbindungen', section: 'connections' },
  ];

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarHeader}>Die Snooker App</h2>
      <nav className={styles.sidebarNav}>
        <ul>
          {navItems.map(item => (
            <li key={item.section} className={styles.sidebarNavItem}>
              <button
                onClick={() => setActiveSection(item.section)}
                className={activeSection === item.section ? styles.active : ''}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarFooter}>
        {userProfile && <p><strong>{userProfile.displayName || currentUser?.email}</strong></p>}
        {currentUser && <p className={styles.email}>{currentUser.email}</p>}
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default SidebarComponent;
