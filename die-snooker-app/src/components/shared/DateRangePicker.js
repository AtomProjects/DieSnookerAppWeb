import React from 'react';

// Basic DateRangePicker: Just two date inputs for now.
// A more advanced version would use a library or a calendar popup.
const DateRangePicker = ({ dateRange, onDateChange }) => {
  const handleStartDateChange = (e) => {
    onDateChange({ ...dateRange, startDate: e.target.value });
  };

  const handleEndDateChange = (e) => {
    onDateChange({ ...dateRange, endDate: e.target.value });
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
      <div>
        <label htmlFor="startDate" style={{ marginRight: '5px' }}>From:</label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={dateRange.startDate || ''}
          onChange={handleStartDateChange}
          style={{padding: '5px'}}
        />
      </div>
      <div>
        <label htmlFor="endDate" style={{ marginRight: '5px' }}>To:</label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={dateRange.endDate || ''}
          onChange={handleEndDateChange}
          style={{padding: '5px'}}
        />
      </div>
      {/* <button onClick={() => onDateChange({ startDate: '', endDate: ''})}>Clear</button> */}
    </div>
  );
};

export default DateRangePicker;
