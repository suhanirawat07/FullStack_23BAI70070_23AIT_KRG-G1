import React, { useState } from "react";
import GoalReached from "./GoalReached";

function WaterTracker() {
  const [count, setCount] = useState(7);
  const goal = 8;

  if (count >= goal) {
    return <GoalReached count={count} goal={goal} setCount={setCount} />;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <div style={{ border: "1px solid gray", padding: "20px", width: "400px", margin: "auto" }}>
        
        <div style={{ marginBottom: "20px" }}>
          Dashboard &nbsp;&nbsp; Water Tracker &nbsp;&nbsp; Logout
        </div>

        <h2>Water Tracker</h2>

        <h3>{count} / {goal} glasses completed</h3>

        <button onClick={() => setCount(count + 1)}>+</button>
        <button onClick={() => setCount(count - 1)}>-</button>
        <button onClick={() => setCount(0)}>Reset</button>

        <div style={{ marginTop: "20px" }}>
          Set Daily Goal: <input defaultValue="8" />
        </div>

        <h4 style={{ marginTop: "20px" }}>Today's Health Tip:</h4>
        <p>
          To improve productivity, always have a shittier task to put off.
        </p>

        <button>Get New Tip</button>

      </div>
    </div>
  );
}

export default WaterTracker;