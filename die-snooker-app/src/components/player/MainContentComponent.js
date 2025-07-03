import React from 'react';
import SelfAssessmentSection from '../../pages/player/SelfAssessmentSection';
import ExercisesSection from '../../pages/player/ExercisesSection';
import TasksSection from '../../pages/player/TasksSection';
import TrainingsplanSection from '../../pages/player/TrainingsplanSection';
import UserManagementConnectionsSection from '../../pages/player/UserManagementConnectionsSection';
import styles from '../../styles/Layout.module.css'; // Import layout styles

const MainContentComponent = ({ activeSection }) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'selfAssessment':
        return <SelfAssessmentSection />;
      case 'exercises':
        return <ExercisesSection />;
      case 'tasks':
        return <TasksSection />;
      case 'trainingPlan':
        return <TrainingsplanSection />;
      case 'connections':
        return <UserManagementConnectionsSection />;
      default:
        return <SelfAssessmentSection />;
    }
  };

  return (
    <main className={styles.mainContent}>
      {renderSection()}
    </main>
  );
};

export default MainContentComponent;
