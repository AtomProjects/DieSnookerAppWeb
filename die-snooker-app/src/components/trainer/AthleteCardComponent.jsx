import React from 'react';
import cardStyles from '../../styles/Card.module.css'; // Import card styles

const AthleteCardComponent = ({ athleteConnection, onSelect }) => {
  const athleteProfile = athleteConnection.otherUserProfile;

  if (!athleteProfile) {
    return (
      <div className={`${cardStyles.card} ${cardStyles.errorCard}`}> {/* Assuming an errorCard style if needed */}
        <p className={cardStyles.cardHeader}>Error</p>
        <p>Athlete profile data missing for this connection.</p>
      </div>
    );
  }

  const statusClass = athleteConnection.status === 'ACTIVE' ? cardStyles.statusActive :
                      athleteConnection.status === 'PENDING' ? cardStyles.statusPending :
                      cardStyles.statusOther;

  return (
    <div
      className={cardStyles.athleteCard}
      onClick={() => onSelect(athleteConnection)}
      role="button" // For accessibility
      tabIndex={0}  // For keyboard navigation
      onKeyPress={(e) => e.key === 'Enter' && onSelect(athleteConnection)} // Allow selection with Enter key
    >
      <h4 className={cardStyles.cardHeader}>{athleteProfile.displayName || athleteProfile.email}</h4>
      <div className={cardStyles.cardBody}>
        <p>Email: {athleteProfile.email}</p>
        <p>
          Connection Type: <strong>{athleteConnection.trainerType?.replace('_', ' ') || 'N/A'}</strong>
        </p>
        <p>
          Status: <span className={statusClass}>{athleteConnection.status}</span>
        </p>
        {/* Future: Add more summary data here */}
      </div>
      <div className={cardStyles.cardFooter} style={{borderTop: 'none', paddingTop: 0}}> {/* Overriding footer style for this button */}
         <button
            onClick={(e) => { e.stopPropagation(); onSelect(athleteConnection); }}
            className={cardStyles.athleteCardButton}
        >
            View Details
        </button>
      </div>
    </div>
  );
};

export default AthleteCardComponent;
