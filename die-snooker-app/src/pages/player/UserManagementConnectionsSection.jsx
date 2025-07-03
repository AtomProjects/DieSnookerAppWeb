import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useUserProfile } from '../../contexts/UserProfileContext.jsx';
import { handleAddTrainerConnection, loadUserConnections, deleteConnection } from '../../services/UserConnectionService';

const UserManagementConnectionsSection = () => {
  const { currentUser } = useAuth();
  const { userProfile } = useUserProfile(); // To confirm user is a PLAYER

  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerType, setTrainerType] = useState('TRAINER'); // 'TRAINER' or 'MENTAL_TRAINER'
  // For simplicity, initial permissions are hardcoded or could be more granular checkboxes
  const [requestedPermissions, setRequestedPermissions] = useState({
    viewDashboard: true, // Example permission
    viewExerciseData: true,
    viewMentalData: true, // This might be specific to MENTAL_TRAINER
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!currentUser || userProfile?.role !== 'PLAYER') {
      setLoadingConnections(false);
      if (userProfile && userProfile.role !== 'PLAYER' && userProfile.role !== undefined){ // check if profile is loaded but not player
          setError("This section is for players only.");
      }
      return;
    }
    setLoadingConnections(true);
    setError(''); // Clear previous errors
    try {
      const userConnections = await loadUserConnections(currentUser.uid, userProfile.role);
      setConnections(userConnections);
    } catch (err) {
      console.error("Error loading connections:", err);
      setError("Failed to load connections.");
    } finally {
      setLoadingConnections(false);
    }
  }, [currentUser, userProfile]);

  useEffect(() => {
    // Only fetch if userProfile is loaded and is a PLAYER
    if (userProfile) {
        fetchConnections();
    } else if (currentUser && !userProfile) {
        // User is logged in, but profile is not yet loaded, wait for profile.
        // This case should be minimal if UserProfileProvider works as expected.
        setLoadingConnections(true); // Show loading until profile context resolves
    } else if (!currentUser) {
        setLoadingConnections(false); // Not logged in
    }
  }, [userProfile, currentUser, fetchConnections]);

  const handleAddConnection = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in.");
      return;
    }
    setError('');
    setMessage('');
    setLoadingAction(true);

    const permissionsPayload = {
        // This needs to align with the structure in Firestore: `permissions`, `trainerAccess`, `mentalTrainerAccess`
        // For a player's request, we can populate the 'permissions' field.
        // The actual 'trainerAccess' and 'mentalTrainerAccess' fields would be set by the trainer upon approval.
        // So, let's assume `permissions` field on the connection doc stores the player's requested view.
        // Example structure for the `permissions` field:
        requested: { // Player's request
            ...(trainerType === 'TRAINER' ? { regular: requestedPermissions } : {}),
            ...(trainerType === 'MENTAL_TRAINER' ? { mental: requestedPermissions } : {}),
        },
        // actualGranted: {} // This would be filled by trainer later into trainerAccess/mentalTrainerAccess
    };


    try {
      // The handleAddTrainerConnection service function expects a 'permissions' object.
      // Let's pass the requestedPermissions directly, assuming the service stores it appropriately.
      // The service currently puts the passed 'permissions' object into connectionData.permissions.
      // This is fine for now. Refinement on how permissions are structured (requested vs granted) can be done later.
      await handleAddTrainerConnection(currentUser.uid, trainerEmail, trainerType, requestedPermissions);
      setMessage(`Connection request sent to ${trainerEmail}.`);
      setTrainerEmail('');
      fetchConnections(); // Refresh list
    } catch (err) {
      console.error("Error adding connection:", err);
      setError(err.message || "Failed to send connection request.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteConnection = async (connectionId) => {
    if (!window.confirm("Are you sure you want to remove this connection or cancel the request?")) return;
    setLoadingAction(true);
    setError('');
    setMessage('');
    try {
      await deleteConnection(connectionId);
      setMessage("Connection action processed successfully.");
      fetchConnections(); // Refresh list
    } catch (err) {
      console.error("Error deleting connection:", err);
      setError(err.message || "Failed to process connection action.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setRequestedPermissions(prev => ({ ...prev, [name]: checked }));
  };

  // Wait for userProfile to load before rendering, or show specific message
  if (!userProfile && currentUser) {
      return <div>Loading user data...</div>;
  }

  if (userProfile && userProfile.role !== 'PLAYER') {
    return <p>This section is for players only. Your role: {userProfile.role}</p>;
  }
   if (!currentUser) {
    return <p>Please log in to manage connections.</p>;
  }


  return (
    <div>
      <h2>Manage Trainer Connections</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Add New Trainer Connection</h3>
        <form onSubmit={handleAddConnection}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="trainerEmail">Trainer's Email:</label>
            <input
              type="email"
              id="trainerEmail"
              value={trainerEmail}
              onChange={(e) => setTrainerEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="trainerType">Trainer Type:</label>
            <select
              id="trainerType"
              value={trainerType}
              onChange={(e) => setTrainerType(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="TRAINER">Regular Trainer</option>
              <option value="MENTAL_TRAINER">Mental Trainer</option>
            </select>
          </div>

          <fieldset style={{ marginBottom: '10px', border: '1px solid #eee', padding: '10px'}}>
            <legend>Requested Permissions:</legend>
            <div>
              <input type="checkbox" id="permDashboard" name="viewDashboard" checked={requestedPermissions.viewDashboard} onChange={handlePermissionChange} />
              <label htmlFor="permDashboard"> View Dashboard Summary</label>
            </div>
            <div>
              <input type="checkbox" id="permExData" name="viewExerciseData" checked={requestedPermissions.viewExerciseData} onChange={handlePermissionChange} />
              <label htmlFor="permExData"> View Exercise Data & History</label>
            </div>
            {/* Conditional permission based on trainer type */}
            {trainerType === 'MENTAL_TRAINER' && (
                 <div>
                    <input type="checkbox" id="permMentalData" name="viewMentalData" checked={requestedPermissions.viewMentalData} onChange={handlePermissionChange} />
                    <label htmlFor="permMentalData"> View Mental Assessment Data (Self-Assessment, Questions)</label>
                </div>
            )}
             {trainerType === 'TRAINER' && ( // Regular trainers might also get some mental data if player agrees
                 <div>
                    <input type="checkbox" id="permMentalDataForTrainer" name="viewMentalData" checked={requestedPermissions.viewMentalData} onChange={handlePermissionChange} />
                    <label htmlFor="permMentalDataForTrainer"> View Mental Assessment Data (Self-Assessment, Questions)</label>
                </div>
            )}
          </fieldset>

          <button type="submit" disabled={loadingAction || !trainerEmail} style={{ padding: '10px 15px' }}>
            {loadingAction ? 'Sending...' : 'Send Connection Request'}
          </button>
        </form>
      </div>

      <div>
        <h3>Your Connections</h3>
        {loadingConnections && <p>Loading connections...</p>}
        {!loadingConnections && connections.length === 0 && <p>You have no active or pending trainer connections.</p>}
        {!loadingConnections && connections.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {connections.map(conn => (
              <li key={conn.id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '10px', borderRadius: '4px', backgroundColor: conn.status === 'PENDING' ? '#fffbe6' : (conn.status === 'ACTIVE' ? '#e6fffa' : '#ffebe6') }}>
                <p>
                  <strong>Trainer:</strong> {conn.otherUserProfile?.displayName || conn.otherUserProfile?.email || 'N/A'}
                  ({conn.otherUserProfile?.role === 'TRAINER' ? 'Regular' : (conn.otherUserProfile?.role === 'MENTAL_TRAINER' ? 'Mental' : conn.trainerType )})
                  <br/> <small>{conn.otherUserProfile?.email}</small>
                </p>
                <p><strong>Status:</strong> <span style={{fontWeight: 'bold', color: conn.status === 'ACTIVE' ? 'green' : (conn.status === 'PENDING' ? 'orange' : 'red')}}>{conn.status}</span></p>
                <div>
                  <strong>Requested/Granted Permissions:</strong>
                  <pre style={{fontSize: '0.8em', backgroundColor: '#f0f0f0', padding: '5px', borderRadius: '3px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                    {JSON.stringify(conn.permissions || "Not set", null, 2)}
                    {/* Separately show trainerAccess and mentalTrainerAccess if they exist and differ from general 'permissions' */}
                    {conn.trainerAccess && (<div><strong>Trainer Access (Granted): </strong> {JSON.stringify(conn.trainerAccess, null, 2)}</div>)}
                    {conn.mentalTrainerAccess && (<div><strong>Mental Trainer Access (Granted): </strong> {JSON.stringify(conn.mentalTrainerAccess, null, 2)}</div>)}
                  </pre>
                </div>
                {(conn.status === 'PENDING' || conn.status === 'ACTIVE' || conn.status === 'REJECTED') && (
                  <button
                    onClick={() => handleDeleteConnection(conn.id)}
                    disabled={loadingAction}
                    style={{backgroundColor: conn.status === 'PENDING' ? '#ffc107' : (conn.status === 'REJECTED' ? '#6c757d' : '#dc3545'), color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', marginTop: '10px'}}
                  >
                    {loadingAction && 'Processing...'}
                    {!loadingAction && (conn.status === 'PENDING' ? 'Cancel Request' : (conn.status === 'REJECTED' ? 'Dismiss Notification' : 'Remove Connection'))}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserManagementConnectionsSection;
