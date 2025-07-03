import React from 'react';
import HistoryListComponent from '../shared/HistoryListComponent.jsx';

const TrainingsplanListComponent = ({ records }) => {
  const renderSummary = (record) => {
    const startDate = record.weekStartDate?.toDate ? new Date(record.weekStartDate.toDate()).toLocaleDateString() : (record.weekStartDate || 'N/A');
    return `Plan for week starting: ${startDate}`;
  };

  const renderDetails = (record) => {
    if (!record.items || record.items.length === 0) {
      return <p>No items in this training plan.</p>;
    }
    return (
      <div>
        <p><strong>Plan Items:</strong></p>
        <ul>
          {record.items.map((item, index) => (
            <li key={index}>
              <strong>{item.day || `Day ${index + 1}`}:</strong> {item.activity || 'No activity specified'}
              {item.details && ` - ${item.details}`}
              {item.completed !== undefined && ` (Completed: ${item.completed ? 'Yes' : 'No'})`}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <HistoryListComponent
      items={records}
      renderItemSummary={renderSummary}
      renderItemDetails={renderDetails}
      emptyStateMessage="No training plan history found."
    />
  );
};

export default TrainingsplanListComponent;
