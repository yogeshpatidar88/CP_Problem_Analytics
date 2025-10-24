import React from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import './ChartModal.css';

const ChartModal = ({ chartInfo, onClose }) => {
  if (!chartInfo) {
    return null;
  }

  const { data, options, type, title } = chartInfo;

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={options} />;
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      default:
        return null;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

export default ChartModal;
