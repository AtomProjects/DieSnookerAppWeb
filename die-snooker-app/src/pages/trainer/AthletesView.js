import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { loadUserConnections, updateConnectionStatus } from '../../services/UserConnectionService';
import AthleteCardComponent from '../../components/trainer/AthleteCardComponent';
import AthleteDetailViewComponent from './AthleteDetailViewComponent';
import cardStyles from '../../styles/Card.module.css'; // For pendingConnectionCard

const AthletesView = () => {
  const { currentUser } = useAuth();
  const { userProfile } = useUserProfile();

  const [allConnections, setAllConnections] = useState([]); // Includes PENDING
  const [selectedAthleteConnection, setSelectedAthleteConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false); // For accept/reject actions

  const fetchConnections = useCallback(async () => {
    if (!currentUser || !userProfile) return;
    setLoading(true);
    setError('');
    try {
      const connections = await loadUserConnections(currentUser.uid, userProfile.role);
      setAllConnections(connections);
    } catch (err) {
      console.error("Error loading athlete connections:", err);
      setError("Failed to load athlete connections.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleSelectAthlete = (connection) => {
    if (connection.status === 'ACTIVE') {
      setSelectedAthleteConnection(connection);
    } else if (connection.status === 'PENDING') {
        // Actions for PENDING are handled by buttons directly on their cards
        console.log("Clicked on a PENDING connection card for:", connection.otherUserProfile?.displayName);
    }
  };

  const handleConnectionAction = async (connectionId, newStatus) => {
    setActionLoading(true);
    setError('');
    try {
        let connectionToUpdate = allConnections.find(c => c.id === connectionId);
        if (!connectionToUpdate) {
            throw new Error("Connection not found for action.");
        }

        // Use player's requested permissions from connection.permissions when activating
        // These should have been set by the player when creating the request.
        let permissionsPayload = connectionToUpdate.permissions || {};

        // If activating, and the trainer wants to *modify* permissions, a modal would be needed here.
        // For now, we assume the trainer accepts the player's requested permissions or a default.
        // The structure of connection.permissions should be what trainerAccess/mentalTrainerAccess fields expect
        // e.g. { viewDashboard: true, viewExerciseData: true }
        // If `trainerAccess` and `mentalTrainerAccess` are separate fields, the service needs to handle that.
        // The current `updateConnectionStatus` service takes a general `newPermissions` object.
        // Let's assume `permissionsPayload` is what gets stored in the connection's `permissions` field,
        // OR directly into `trainerAccess`/`mentalTrainerAccess` by the service if it's smart.
        // For now, let's ensure permissionsPayload is not undefined if activating.
        if (newStatus === 'ACTIVE' && Object.keys(permissionsPayload).length === 0) {
             console.warn(`Activating connection ${connectionId} without explicit permissions. Using defaults.`);
             permissionsPayload = { viewDashboard: true, viewExerciseData: true }; // Basic default
             if (connectionToUpdate.trainerType === 'MENTAL_TRAINER') {
                 permissionsPayload.viewMentalData = true;
             }
        }
        // The service call `updateConnectionStatus(connectionId, newStatus, permissionsPayload)`
        // should ideally update the main `permissions` field, and potentially also mirror
        // relevant parts to `trainerAccess` and `mentalTrainerAccess` fields based on `trainerType`.
        // This logic can be in the service. For now, we pass what player requested.

        await updateConnectionStatus(connectionId, newStatus, permissionsPayload);
        fetchConnections(); // Refresh connections list
    } catch (err) {
        console.error(`Error updating connection ${connectionId} to ${newStatus}:`, err);
        setError(`Failed to ${newStatus === 'ACTIVE' ? 'accept' : 'reject'} connection: ${err.message}`);
    } finally {
        setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{padding: '20px'}}>Loading athletes list...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  if (selectedAthleteConnection) {
    // Render AthleteDetailViewComponent when an athlete is selected
    return (
      <AthleteDetailViewComponent
        athleteConnection={selectedAthleteConnection}
        onBack={() => setSelectedAthleteConnection(null)}
      />
    );
  }

  const pendingConnections = allConnections.filter(conn => conn.status === 'PENDING');
  const activeConnections = allConnections.filter(conn => conn.status === 'ACTIVE');
  const otherConnections = allConnections.filter(conn => conn.status !== 'PENDING' && conn.status !== 'ACTIVE');


  return (
    <div>
      <h2>My Athletes</h2>

      {pendingConnections.length > 0 && (
        <div style={{marginBottom: '30px'}}>
          <h3>Pending Connection Requests</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {pendingConnections.map(conn => (
              <div key={conn.id} className={cardStyles.pendingConnectionCard}>
                <h4 className={cardStyles.cardHeader}>{conn.otherUserProfile?.displayName || 'Unknown User'}</h4>
                <div className={cardStyles.cardBody}>
                  <p>Email: {conn.otherUserProfile?.email}</p>
                  <p>Type: {conn.trainerType}</p>
                  <div>
                      <p><strong>Requested Permissions:</strong></p>
                      <pre style={{fontSize: '0.8em', backgroundColor: '#fff', border: '1px solid #eee', padding: '5px', borderRadius: '3px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                          {JSON.stringify(conn.permissions || "Not specified", null, 2)}
                      </pre>
                  </div>
                </div>
                <div className={cardStyles.cardFooter} style={{borderTop: 'none', paddingTop: '0.5rem', marginTop: '0.5rem'}}>
                  <button onClick={() => handleConnectionAction(conn.id, 'ACTIVE')} disabled={actionLoading} className={cardStyles.acceptButton}>
                    {actionLoading ? 'Processing...' : 'Accept'}
                  </button>
                  <button onClick={() => handleConnectionAction(conn.id, 'REJECTED')} disabled={actionLoading} className={cardStyles.rejectButton}>
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3>Active Athletes</h3>
      {activeConnections.length === 0 && !loading && <p>You have no active athletes connected.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {activeConnections.map(conn => (
          <AthleteCardComponent
            key={conn.id}
            athleteConnection={conn}
            onSelect={handleSelectAthlete}
          />
        ))}
      </div>

      {otherConnections.length > 0 && (
         <div style={{marginTop: '30px'}}>
            <h4>Other Connections (e.g., Rejected, Terminated)</h4>
             {otherConnections.map(conn => (
              <AthleteCardComponent
                key={conn.id}
                athleteConnection={conn}
                onSelect={() => console.log("Selected non-active, non-pending athlete: ", conn.otherUserProfile?.displayName)} // Or a different handler
              />
            ))}
         </div>
      )}

    </div>
  );
};

export default AthletesView;
