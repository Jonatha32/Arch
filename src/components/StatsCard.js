import React from 'react';

const StatsCard = ({ title, value, icon, color, trend }) => {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          background: color, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '1.5rem'
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{ 
            color: trend > 0 ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="stat-number">{value}</div>
      <div className="stat-label">{title}</div>
    </div>
  );
};

export default StatsCard;