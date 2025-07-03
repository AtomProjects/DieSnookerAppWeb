import React, { useState } from 'react';

const ExpandableItemComponent = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ border: '1px solid #eee', marginBottom: '10px', borderRadius: '4px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px',
          textAlign: 'left',
          background: '#f9f9f9',
          border: 'none',
          borderBottom: isOpen ? '1px solid #eee' : 'none',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {title} {isOpen ? '▲' : '▼'}
      </button>
      {isOpen && (
        <div style={{ padding: '10px' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ExpandableItemComponent;
