import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function useChart(config, deps) {
  const ref = useRef();
  useEffect(() => { const c = new Chart(ref.current, config()); return () => c.destroy(); }, deps);
  return ref;
}

export function Gauge({ score }) {
  const color = score >= 70 ? "#c2410c" : score >= 40 ? "#0fa3b1" : "#0b7a5a";
  const ref = useChart(() => ({ type: "doughnut",
    data: { datasets: [{ data: [score, 100 - score], backgroundColor: [color, "#dde4ec"], borderWidth: 0 }] },
    options: { rotation: -90, circumference: 180, cutout: "78%", plugins: { tooltip: { enabled: false } } } }), [score]);
  return <div className="gauge"><canvas ref={ref} /><b>{score}<small>out of 100, higher is riskier</small></b></div>;
}

export function ThreatRadar({ profiles }) {
  const ref = useChart(() => ({ type: "radar",
    data: { labels: Object.keys(profiles), datasets: [{ data: Object.values(profiles), backgroundColor: "rgba(15,163,177,.25)", borderColor: "#0fa3b1" }] },
    options: { scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 } } }, plugins: { legend: { display: false } } } }), [profiles]);
  return <canvas ref={ref} />;
}

export function History({ rows }) {
  const ref = useChart(() => ({ type: "line",
    data: { labels: rows.map(r => new Date(r.date).toLocaleDateString()), datasets: [{ data: rows.map(r => r.score), borderColor: "#0fa3b1", tension: .3 }] },
    options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } } }), [rows]);
  return <canvas ref={ref} />;
}
