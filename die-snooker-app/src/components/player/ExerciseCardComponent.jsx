import React, { useState, useMemo } from 'react';
import ChartComponentWrapper from '../shared/ChartComponentWrapper.jsx';
import cardStyles from '../../styles/Card.module.css'; // Import card styles

const ExerciseCardComponent = ({ definition, records }) => {
  const [timeframe, setTimeframe] = useState('all');

  const filteredRecords = useMemo(() => {
    if (timeframe === 'all') return records;
    const now = new Date();
    const daysToSubtract = timeframe === 'last7days' ? 7 : (timeframe === 'last30days' ? 30 : 0);
    if (daysToSubtract === 0) return records; // Should not happen if timeframe is correct

    // Create a new date for cutoff to avoid mutating 'now' if 'now' is used elsewhere in same tick
    const cutoffDate = new Date(new Date().setDate(now.getDate() - daysToSubtract));

    return records.filter(record => {
      const recordDate = record.timestamp?.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
      return recordDate >= cutoffDate;
    });
  }, [records, timeframe]);

  const chartData = useMemo(() => {
    const data = {
      labels: [],
      datasets: [
        {
          label: 'Score Over Time',
          data: [],
          fill: false,
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1,
        },
      ],
    };
    const sortedRecords = [...filteredRecords].sort((a,b) => (a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) - (b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp)));
    sortedRecords.forEach(record => {
      const date = record.timestamp?.toDate ? new Date(record.timestamp.toDate()) : new Date(record.timestamp);
      data.labels.push(date.toLocaleDateString());
      data.datasets[0].data.push(record.score || 0);
    });
    return data;
  }, [filteredRecords]);

  const chartOptions = useMemo(() => ({ // Added useMemo for chartOptions
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Scores (${timeframe.replace('last','Last ').replace('days',' Days')})`, // Nicer formatting
        font: { size: 14 }
      },
    },
    scales: {
      y: { beginAtZero: true },
      x: { ticks: { maxTicksLimit: 6 } }
    },
  }), [timeframe]);

  return (
    <div className={cardStyles.card}>
      <h4 className={cardStyles.cardHeader}>{definition.name}</h4>
      <p style={{fontSize: '0.85em', color: 'var(--text-muted-color)', marginBottom: '1rem'}}>
        Category: {definition.category || 'N/A'} - Type: {definition.exerciseType || 'N/A'}
      </p>

      <div className={cardStyles.exerciseCardTimeframeSelect}>
        <label htmlFor={`timeframe-${definition.id}`}>Timeframe: </label>
        <select
            id={`timeframe-${definition.id}`}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="last7days">Last 7 Days</option>
          <option value="last30days">Last 30 Days</option>
        </select>
      </div>

      <div className={cardStyles.exerciseCardChartArea}>
        {filteredRecords.length > 0 ? (
          <ChartComponentWrapper type="line" data={chartData} options={chartOptions} />
        ) : (
          <p style={{textAlign: 'center', color: 'var(--text-muted-color)', fontSize: '0.9em', paddingTop: '50px'}}>
            No records in selected timeframe.
          </p>
        )}
      </div>

      <div className={cardStyles.cardBody}> {/* Using cardBody to allow this part to fill space if needed */}
        <h5 className={cardStyles.cardSubHeader}>Recent Times (minutes):</h5>
        {records.length > 0 ? (
            <ul className={cardStyles.exerciseCardTimesList}>
            {records.slice(0, 5).map(record => (
                <li key={record.id}>
                {record.timestamp?.toDate ? new Date(record.timestamp.toDate()).toLocaleDateString() : 'N/A'}: {record.timeInMinutes !== undefined ? `${record.timeInMinutes} min` : 'N/A'}
                </li>
            ))}
            </ul>
        ) : (
            <p style={{fontSize: '0.85em', color: 'var(--text-muted-color)'}}>No time records yet.</p>
        )}
      </div>
    </div>
  );
};

export default ExerciseCardComponent;
