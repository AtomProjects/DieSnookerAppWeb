import React from 'react';
import HistoryListComponent from '../shared/HistoryListComponent';

const QuestionsHistoryListComponent = ({ records }) => {
  const renderSummary = (record) => {
    const date = record.date?.toDate ? new Date(record.date.toDate()).toLocaleDateString() : 'Invalid Date';
    return `${date} - ${record.type || 'Questionnaire'}`;
  };

  const renderDetails = (record) => {
    if (!record.questions || record.questions.length === 0) {
      return <p>No questions recorded for this entry.</p>;
    }
    return (
      <ul>
        {record.questions.map((q, index) => (
          <li key={index}>
            <strong>{q.title}:</strong> {q.answer}
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
      emptyStateMessage="No question records found."
    />
  );
};

export default QuestionsHistoryListComponent;
