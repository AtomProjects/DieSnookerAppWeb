import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import ChartComponentWrapper from '../../shared/ChartComponentWrapper.jsx';
// athleteExerciseDefs might be needed if plan activities are by name and need matching to exercise_records by ID.

// Helper to get week key (YYYY-Www)
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};


const TrainingsplanAdherenceChartComponent = ({ athleteId, dateRange, athleteExerciseDefs }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!athleteId) return;

    const fetchAndProcessData = async () => {
      setLoading(true);
      setError('');
      setChartData({ labels: [], datasets: [] });

      try {
        // 1. Fetch trainingsplan_history
        const plansQuery = query(
          collection(db, 'trainingsplan_history'),
          where('userId', '==', athleteId),
          orderBy('weekStartDate', 'asc') // Assuming weekStartDate is a timestamp/date
        );
        const plansSnapshot = await getDocs(plansQuery);
        const plansHistory = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Fetch exercise_records (actual completed activities)
        const recordsQuery = query(
          collection(db, 'exercise_records'),
          where('userId', '==', athleteId),
          orderBy('timestamp', 'asc')
        );
        const recordsSnapshot = await getDocs(recordsQuery);
        const exerciseRecords = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (plansHistory.length === 0) {
          setError("No training plans found for this athlete to calculate adherence.");
          setLoading(false);
          return;
        }

        const weeklyAdherence = {}; // { 'weekKey': { planned: 0, completed: 0 } }

        for (const plan of plansHistory) {
          const planStartDate = plan.weekStartDate?.toDate ? plan.weekStartDate.toDate() : new Date(plan.weekStartDate);
          const weekKey = getWeekNumber(planStartDate);

          if (!weeklyAdherence[weekKey]) {
            weeklyAdherence[weekKey] = { planned: 0, completed: 0, plannedActivities: new Set() };
          }

          if (plan.items && Array.isArray(plan.items)) {
            plan.items.forEach(item => {
              weeklyAdherence[weekKey].planned++;
              // Store a normalized version of the activity name for matching
              weeklyAdherence[weekKey].plannedActivities.add((item.activity || "").toLowerCase().trim());
            });
          }
        }

        // Correlate exercise records with planned activities for each week
        exerciseRecords.forEach(record => {
            const recordDate = record.timestamp?.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
            const weekKey = getWeekNumber(recordDate);
            const exerciseDef = athleteExerciseDefs ? athleteExerciseDefs[record.exerciseId] : null;
            const activityName = (exerciseDef?.name || "").toLowerCase().trim();

            if (weeklyAdherence[weekKey] && weeklyAdherence[weekKey].plannedActivities.has(activityName)) {
                // Basic: if a planned activity type was done in that week, count it as completed once.
                // More advanced: check if *all* instances of that planned activity were done, or duration matches.
                // For now, simple "was it done at least once this week" for a planned activity type.
                // This logic might oversimplify if multiple same activities are planned.
                // A better way would be to iterate through planned items and check if a corresponding record exists.

                // Let's refine: iterate weeklyAdherence, then for each planned activity in that week, check if a record exists.
                // This requires iterating through planned items again.
                // The current `weeklyAdherence[weekKey].plannedActivities.add` might not be ideal.
                // Let's stick to a simpler interpretation for now: count distinct planned activities in a week,
                // and count distinct *matching* completed activities in that week.
                // This is still not perfect. A truly robust solution needs better data linkage.
            }
        });

        // Refined Adherence Calculation:
        // For each week in `weeklyAdherence`:
        //  Iterate `plan.items` for that week.
        //  For each `planItem.activity`, check if a matching `exerciseRecord` (by name via `athleteExerciseDefs`) exists in that week.

        for (const weekKey of Object.keys(weeklyAdherence)) {
            const planForWeek = plansHistory.find(p => getWeekNumber(p.weekStartDate.toDate ? p.weekStartDate.toDate() : new Date(p.weekStartDate)) === weekKey);
            if (!planForWeek || !planForWeek.items) continue;

            const distinctPlannedActivitiesForWeek = new Set();
            planForWeek.items.forEach(item => distinctPlannedActivitiesForWeek.add((item.activity || "").toLowerCase().trim()));

            weeklyAdherence[weekKey].planned = distinctPlannedActivitiesForWeek.size; // Number of distinct planned activities

            const completedActivitiesThisWeek = new Set();
            exerciseRecords.forEach(record => {
                const recordDate = record.timestamp?.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
                if (getWeekNumber(recordDate) !== weekKey) return;

                const exerciseDef = athleteExerciseDefs ? athleteExerciseDefs[record.exerciseId] : null;
                const performedActivityName = (exerciseDef?.name || "").toLowerCase().trim();

                if (distinctPlannedActivitiesForWeek.has(performedActivityName)) {
                    completedActivitiesThisWeek.add(performedActivityName);
                }
            });
            weeklyAdherence[weekKey].completed = completedActivitiesThisWeek.size;
        }


        const labels = Object.keys(weeklyAdherence).sort();
        // Filter labels by dateRange (startDate and endDate)
        const filteredLabels = labels.filter(wkKey => {
            if (!dateRange.startDate && !dateRange.endDate) return true; // No range, include all

            const year = parseInt(wkKey.substring(0,4));
            const weekNum = parseInt(wkKey.substring(6));
            // Get date of the first day of this weekKey
            const firstDayOfWeek = new Date(year, 0, 1 + (weekNum - 1) * 7);
            if (firstDayOfWeek.getDay() > 4) { // Adjust if week starts on Mon/Sun based on ISO standard
                firstDayOfWeek.setDate(firstDayOfWeek.getDate() - (firstDayOfWeek.getDay() -1));
            } else {
                 firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (1 - firstDayOfWeek.getDay()));
            }
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

            const startRange = dateRange.startDate ? new Date(dateRange.startDate) : null;
            const endRange = dateRange.endDate ? new Date(dateRange.endDate) : null;

            // Check if the week (firstDayOfWeek to lastDayOfWeek) overlaps with dateRange
            if (startRange && lastDayOfWeek < startRange) return false;
            if (endRange && firstDayOfWeek > new Date(endRange.getTime() + 86399999)) return false;
            return true;
        });


        const dataPoints = filteredLabels.map(wkKey => {
          const weekData = weeklyAdherence[wkKey];
          if (!weekData || weekData.planned === 0) return 0; // Avoid division by zero if no activities planned
          return (weekData.completed / weekData.planned) * 100;
        });

        if (filteredLabels.length === 0) {
            setError("No training plan data within the selected date range or no plans found.");
            setLoading(false);
            return;
        }

        setChartData({
          labels: filteredLabels,
          datasets: [{
            label: 'Weekly Training Plan Adherence (%)',
            data: dataPoints,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            type: 'bar', // Can be line or bar
          }],
        });

      } catch (err) {
        console.error("Error processing training plan adherence:", err);
        setError(`Failed to load adherence data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [athleteId, dateRange, athleteExerciseDefs]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Weekly Training Plan Adherence' },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label.includes('%')) label = label.split('%')[0] + '%';
            else label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Adherence Rate (%)' },
      },
      x: {
         title: { display: true, text: 'Week' }
      }
    },
  }), []);

  if (loading) return <p>Loading training plan adherence data...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (chartData.labels.length === 0 && !loading) return <p>No adherence data to display for the current selection.</p>;

  return (
    <div style={{ border: '1px solid #805ad5', padding: '20px', margin: '10px 0', minHeight: '300px', backgroundColor: '#fff' }}>
      <h4 style={{marginTop:0}}>Training Plan Adherence Chart</h4>
      <div style={{height: '350px'}}>
        <ChartComponentWrapper type="bar" data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default TrainingsplanAdherenceChartComponent;
