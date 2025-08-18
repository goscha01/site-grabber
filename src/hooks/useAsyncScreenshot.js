import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' // Same domain in production
  : 'http://localhost:5000'; // Dev server

export const useAsyncScreenshot = () => {
  const [jobs, setJobs] = useState({});
  const [polling, setPolling] = useState(new Set());

  const captureScreenshot = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}/api/screenshot-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const jobId = data.jobId;
        
        setJobs(prev => ({
          ...prev,
          [jobId]: data
        }));
        
        setPolling(prev => new Set(prev).add(jobId));
        return jobId;
      }
      
      throw new Error(data.error || 'Failed to start capture');
    } catch (error) {
      console.error('Failed to start screenshot:', error);
      throw error;
    }
  }, []);

  const batchCapture = useCallback(async (urls, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}/api/batch-screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, options })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        data.jobs.forEach(job => {
          setJobs(prev => ({
            ...prev,
            [job.jobId]: job
          }));
          setPolling(prev => new Set(prev).add(job.jobId));
        });
        
        return data.jobs.map(job => job.jobId);
      }
      
      throw new Error(data.error || 'Failed to start batch capture');
    } catch (error) {
      console.error('Failed to start batch capture:', error);
      throw error;
    }
  }, []);

  // Polling effect
  useEffect(() => {
    if (polling.size === 0) return;

    const interval = setInterval(async () => {
      const activeJobs = Array.from(polling);
      
      for (const jobId of activeJobs) {
        try {
          const response = await fetch(`${API_BASE}/api/job/${jobId}`);
          
          if (response.ok) {
            const jobData = await response.json();
            
            setJobs(prev => ({
              ...prev,
              [jobId]: jobData
            }));
            
            if (['completed', 'failed'].includes(jobData.status)) {
              setPolling(prev => {
                const newSet = new Set(prev);
                newSet.delete(jobId);
                return newSet;
              });
            }
          }
        } catch (error) {
          console.error(`Failed to poll job ${jobId}:`, error);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling]);

  const getJob = useCallback((jobId) => jobs[jobId], [jobs]);
  
  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => {
      const filtered = {};
      Object.entries(prev).forEach(([jobId, job]) => {
        if (!['completed', 'failed'].includes(job.status)) {
          filtered[jobId] = job;
        }
      });
      return filtered;
    });
  }, []);

  return {
    jobs,
    isPolling: polling.size > 0,
    captureScreenshot,
    batchCapture,
    getJob,
    clearCompletedJobs,
    activeJobs: Object.values(jobs).filter(job => job.status === 'active').length,
    completedJobs: Object.values(jobs).filter(job => job.status === 'completed').length,
  };
};

