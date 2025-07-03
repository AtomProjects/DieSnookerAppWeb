import React, { useState, useEffect, useCallback } from 'react';
import { fetchUserExerciseDefinitions } from '../../services/ExerciseDefinitionService';
import RawDataViewComponent from './RawDataViewComponent';
import styles from './AthleteDetailView.module.css'; // Import CSS module

// Shared components
import DateRangePicker from '../../components/shared/DateRangePicker';

// Trainer chart components (placeholders for now)
import ExerciseTypeFilterDropdownComponent from '../../components/trainer/charts/ExerciseTypeFilterDropdownComponent';
import CompletionRateChartComponent from '../../components/trainer/charts/CompletionRateChartComponent';
import TrainingsplanAdherenceChartComponent from '../../components/trainer/charts/TrainingsplanAdherenceChartComponent';
import PerformanceTrendsChartComponent from '../../components/trainer/charts/PerformanceTrendsChartComponent';
import SelfAssessmentChartComponent from '../../components/trainer/charts/SelfAssessmentChartComponent';


const AthleteDetailViewComponent = ({ athleteConnection, onBack }) => {
  // athleteConnection is the full connection object, including .otherUserProfile and .permissions
  const athlete = athleteConnection.otherUserProfile;
  const connectionDetails = athleteConnection; // Contains .permissions, .trainerAccess, .mentalTrainerAccess

  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedExerciseId, setSelectedExerciseId] = useState(''); // For ExerciseTypeFilterDropdown

  const [athleteExerciseDefs, setAthleteExerciseDefs] = useState({}); // Map: id -> def
  const [loadingDefs, setLoadingDefs] = useState(true);
  const [errorDefs, setErrorDefs] = useState('');

  const [showRawDataView, setShowRawDataView] = useState(false);

  // Fetch exercise definitions for this specific athlete
  const loadAthleteExerciseDefinitions = useCallback(async () => {
    if (!athlete?.id) return;
    setLoadingDefs(true);
    setErrorDefs('');
    try {
      const defs = await fetchUserExerciseDefinitions(athlete.id);
      setAthleteExerciseDefs(defs);
    } catch (err) {
      console.error(`Error fetching exercise definitions for athlete ${athlete.id}:`, err);
      setErrorDefs('Failed to load exercise definitions.');
    } finally {
      setLoadingDefs(false);
    }
  }, [athlete?.id]);

  useEffect(() => {
    loadAthleteExerciseDefinitions();
  }, [loadAthleteExerciseDefinitions]);

  // Permissions check (example, adjust based on actual structure in connectionDetails.permissions or .trainerAccess etc.)
  // The project description mentions: connection.trainerAccess and connection.mentalTrainerAccess
  // Let's assume these are objects like: { viewScores: true, viewRawData: false }
  const canViewExerciseCharts = connectionDetails?.trainerAccess?.viewExerciseData || connectionDetails?.permissions?.trainerAccess?.viewExerciseData || false;
  const canViewMentalCharts = connectionDetails?.mentalTrainerAccess?.viewMentalData || connectionDetails?.permissions?.mentalTrainerAccess?.viewMentalData || false;
  // Fallback to general permissions if specific access fields aren't populated yet (e.g. during player request phase)
  const generalExercisePermission = connectionDetails?.permissions?.viewExerciseData || false;
  const generalMentalPermission = connectionDetails?.permissions?.viewMentalData || false;


  if (!athlete) {
    return <div>Error: Athlete data not available. <button onClick={onBack}>Back</button></div>;
  }

  if (showRawDataView) {
    return <RawDataViewComponent athlete={athlete} athleteExerciseDefs={athleteExerciseDefs} onBack={() => setShowRawDataView(false)} />;
  }

  return (
    <div>
      <button onClick={onBack} className={styles.backButton}>
        &larr; Back to Athletes List
      </button>
      <h2 className={styles.detailHeader}>
        Athlete Details: {athlete.displayName}
      </h2>
      <p><strong>Email:</strong> {athlete.email}</p>
      <p><strong>Connection Type:</strong> {connectionDetails.trainerType}</p>

      <div className={styles.globalFilters}>
        <h3>Global Filters</h3>
        <DateRangePicker dateRange={dateRange} onDateChange={setDateRange} />
        <button onClick={() => setShowRawDataView(true)} className={styles.rawDataButton}>
            View Raw Data
        </button>
      </div>

      {(canViewExerciseCharts || generalExercisePermission) ? (
        <section className={styles.exercisePerformanceArea}>
          <h3>Exercise Performance Area</h3>
          {loadingDefs && <p>Loading exercise definitions...</p>}
          {errorDefs && <p className={styles.errorMessage}>{errorDefs}</p>} {/* Assuming errorMessage class in this module or global */}
          {!loadingDefs && !errorDefs && (
            <ExerciseTypeFilterDropdownComponent
              exerciseDefinitionsMap={athleteExerciseDefs}
              selectedExerciseId={selectedExerciseId}
              onChange={setSelectedExerciseId}
            />
          )}
          <CompletionRateChartComponent athleteId={athlete.id} dateRange={dateRange} exerciseId={selectedExerciseId} exerciseDefinitionsMap={athleteExerciseDefs} />
          <PerformanceTrendsChartComponent athleteId={athlete.id} dateRange={dateRange} exerciseId={selectedExerciseId} athleteExerciseDefs={athleteExerciseDefs} />
        </section>
      ) : (
        <p className={styles.noPermissionMessage}>No permission to view exercise charts for this athlete.</p>
      )}

      {(canViewMentalCharts || generalMentalPermission) ? (
        <section className={styles.mentalPerformanceArea}>
          <h3>Mental Performance Area</h3>
          <SelfAssessmentChartComponent athleteId={athlete.id} dateRange={dateRange} />
          <TrainingsplanAdherenceChartComponent athleteId={athlete.id} dateRange={dateRange} />
        </section>
      ) : (
         <p className={styles.noPermissionMessage}>No permission to view mental performance charts for this athlete.</p>
      )}
    </div>
  );
};

export default AthleteDetailViewComponent;
