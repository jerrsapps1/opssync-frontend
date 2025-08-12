
// Example ProjectProfile component with auto-calculated % complete
import React, { useState, useEffect } from 'react';

export default function ProjectProfile({ project }) {
  const [percentComplete, setPercentComplete] = useState(project.percentComplete || 0);
  const [override, setOverride] = useState(false);

  useEffect(() => {
    if (!override && project.startDate && project.endDate) {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      const now = new Date();
      const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.min(totalDays, Math.max(0, (now - start) / (1000 * 60 * 60 * 24)));
      setPercentComplete(Math.round((elapsedDays / totalDays) * 100));
    }
  }, [project.startDate, project.endDate, override]);

  return (
    <div>
      <h1>{project.name}</h1>
      <div>
        <label>Start Date:</label>
        <input type="date" defaultValue={project.startDate} />
      </div>
      <div>
        <label>End Date:</label>
        <input type="date" defaultValue={project.endDate} />
      </div>
      <div>
        <label>% Complete:</label>
        <input
          type="number"
          value={percentComplete}
          onChange={(e) => setPercentComplete(Number(e.target.value))}
          disabled={!override}
        />
        <button onClick={() => setOverride(!override)}>
          {override ? "Disable Override" : "Override %"}
        </button>
      </div>
    </div>
  );
}
