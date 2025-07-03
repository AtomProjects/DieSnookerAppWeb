import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { updateUserProfile } from '../../services/UserProfileService'; // Using the service here

const ProfileViewComponent = () => {
  const { currentUser } = useAuth();
  const { userProfile, fetchUserProfile } = useUserProfile(); // fetchUserProfile to refresh after update

  const [experience, setExperience] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setExperience(userProfile.experience || '');
    }
  }, [userProfile]);

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, revert experience to original from profile
      setExperience(userProfile?.experience || '');
    }
    setIsEditing(!isEditing);
    setError('');
    setMessage('');
  };

  const handleSave = async () => {
    if (!currentUser || !userProfile) {
      setError("User not found. Cannot save profile.");
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await updateUserProfile(currentUser.uid, { experience });
      setMessage("Profile updated successfully!");
      setIsEditing(false);
      // Refresh the profile in the context
      if (fetchUserProfile) { // fetchUserProfile is from UserProfileContext
        await fetchUserProfile(currentUser.uid);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: '700px', margin: 'auto' }}>
      <h2>My Trainer Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <p><strong>Display Name:</strong> {userProfile.displayName}</p>
        <p><strong>Email:</strong> {userProfile.email}</p>
        <p><strong>Role:</strong> {userProfile.role?.replace('_', ' ')}</p>

        <div style={{ marginTop: '15px' }}>
          <strong>Experience:</strong>
          {isEditing ? (
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', borderColor: error ? 'red' : '#ccc' }}
              placeholder="Describe your coaching experience, qualifications, etc."
            />
          ) : (
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '5px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fff' }}>
              {experience || "No experience information provided."}
            </p>
          )}
        </div>

        <div style={{ marginTop: '20px' }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{ padding: '10px 15px', marginRight: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleEditToggle}
                disabled={loading}
                style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleEditToggle}
              style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Edit Experience
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileViewComponent;
