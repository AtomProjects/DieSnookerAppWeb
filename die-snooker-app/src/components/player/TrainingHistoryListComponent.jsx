import React from 'react';
import HistoryListComponent from '../shared/HistoryListComponent.jsx';

const TrainingHistoryListComponent = ({ records }) => {
  const renderSummary = (record) => {
    const date = record.date?.toDate ? new Date(record.date.toDate()).toLocaleDateString() : 'Invalid Date';
    return `${date} - ${record.type || 'Training'}`;
  };

  const renderDetails = (record) => {
    if (!record.items || record.items.length === 0) {
      return <p>No items recorded for this training.</p>;
    }
    return (
      <ul>
        {record.items.map((item, index) => (
          <li key={index}>
            {item.title}: {item.score}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <HistoryListComponent
      items={records}
      renderItemSummary={renderSummary}
      renderItemDetails={renderDetails}
      emptyStateMessage="No training records found."
    />
  );
};

export default TrainingHistoryListComponent;
