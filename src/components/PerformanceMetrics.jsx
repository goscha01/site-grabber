import React from 'react';

const PerformanceMetrics = ({ data }) => {
  if (Object.keys(data).length === 0) {
    return (
      <section className="performance-metrics">
        <h2>Performance Metrics</h2>
        <p>Performance data will appear here after capturing a screenshot.</p>
      </section>
    );
  }

  const formatTime = (time) => {
    return time > 0 ? `${time.toFixed(2)}ms` : 'N/A';
  };

  const getMethodDisplayName = (method) => {
    const names = {
      puppeteer: 'Puppeteer'
    };
    return names[method] || method;
  };

  return (
    <section className="performance-metrics">
      <h2>Performance Metrics</h2>
      <div className="metrics-table">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Time</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data).map(([method, metrics]) => (
              <tr key={method} className={metrics.success ? 'success' : 'error'}>
                <td>{getMethodDisplayName(method)}</td>
                <td>{formatTime(metrics.time)}</td>
                <td>
                  <span className={`status ${metrics.success ? 'success' : 'error'}`}>
                    {metrics.success ? '✅ Success' : '❌ Failed'}
                  </span>
                </td>
                <td className="error-message">
                  {metrics.error || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="metrics-summary">
        <div className="summary-item">
          <span>Fastest:</span>
          <span>
            {Object.entries(data)
              .filter(([_, metrics]) => metrics.success)
              .sort(([_, a], [__, b]) => a.time - b.time)[0]?.[0] || 'N/A'}
          </span>
        </div>
        <div className="summary-item">
          <span>Success Rate:</span>
          <span>
            {Object.values(data).filter(m => m.success).length} / {Object.keys(data).length}
          </span>
        </div>
      </div>
    </section>
  );
};

export default PerformanceMetrics;
