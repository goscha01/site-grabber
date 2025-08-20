import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ currentStage, stages, isVisible }) => {
  if (!isVisible) return null;

  const currentStageIndex = stages.findIndex(stage => stage.key === currentStage);
  const progress = ((currentStageIndex + 1) / stages.length) * 100;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3>🔄 Analysis in Progress</h3>
        <p>Processing your website screenshot and analyzing design elements...</p>
      </div>
      
      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-percentage">{Math.round(progress)}%</div>
      </div>
      
      <div className="stages-container">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isPending = index > currentStageIndex;
          
          return (
            <div 
              key={stage.key} 
              className={`stage-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}
            >
              <div className="stage-icon">
                {isCompleted && '✅'}
                {isCurrent && '🔄'}
                {isPending && '⏳'}
              </div>
              <div className="stage-content">
                <div className="stage-title">{stage.title}</div>
                <div className="stage-description">{stage.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
