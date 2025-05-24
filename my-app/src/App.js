import React, { useState, useEffect } from 'react';
import './App.css';

function randomBase() {
  const bases = ['A', 'T', 'C', 'G'];
  return bases[Math.floor(Math.random() * bases.length)];
}

function SignalPlot({ data, windowIndex }) {
  if (!data.length)
    return <div className="placeholder">Upload a CSV file to see the signal</div>;

  const margin = { top: 10, right: 20, bottom: 40, left: 50 };
  const svgHeight = 320;
  const svgWidth = Math.max(data.length * 2 + margin.left + margin.right, 700);
  const height = svgHeight - margin.top - margin.bottom;
  const width = svgWidth - margin.left - margin.right;

  const maxY = Math.max(...data.map((d) => d.y));
  const minY = Math.min(...data.map((d) => d.y));
  const scaleX = width / (data.length - 1);
  const scaleY = height / (maxY - minY || 1);

  const points = data
    .map(
      (d, i) =>
        `${margin.left + i * scaleX},${
          margin.top + height - (d.y - minY) * scaleY
        }`
    )
    .join(" ");

  const windowWidth = 10 * scaleX;
  const rectX = margin.left + Math.max(0, windowIndex * scaleX - windowWidth / 2);

  const ticksY = 5;
  const ticksX = 5;

  const yTicks = Array.from({ length: ticksY + 1 }, (_, i) => {
    const value = minY + (i * (maxY - minY)) / ticksY;
    const y = margin.top + height - (value - minY) * scaleY;
    return { value, y };
  });

  const xTicks = Array.from({ length: ticksX + 1 }, (_, i) => {
    const index = (i * (data.length - 1)) / ticksX;
    const x = margin.left + index * scaleX;
    return { value: Math.round(index), x };
  });

  return (
    <div className="plot-wrapper">
      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="plot"
      >
        {/* axes */}
        <line
          x1={margin.left}
          y1={margin.top + height}
          x2={margin.left + width}
          y2={margin.top + height}
          stroke="#fff"
        />
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + height}
          stroke="#fff"
        />

        {yTicks.map((t, idx) => (
          <g key={`ytick-${idx}`}>
            <line
              x1={margin.left - 5}
              x2={margin.left}
              y1={t.y}
              y2={t.y}
              stroke="#fff"
            />
            <text
              x={margin.left - 7}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#fff"
            >
              {t.value.toFixed(2)}
            </text>
          </g>
        ))}

        {xTicks.map((t, idx) => (
          <g key={`xtick-${idx}`}>
            <line
              y1={margin.top + height}
              y2={margin.top + height + 5}
              x1={t.x}
              x2={t.x}
              stroke="#fff"
            />
            <text
              x={t.x}
              y={margin.top + height + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#fff"
            >
              {t.value}
            </text>
          </g>
        ))}

        {/* axis labels */}
        <text
          x={margin.left + width / 2}
          y={svgHeight - 5}
          textAnchor="middle"
          fontSize="12"
          fill="#fff"
        >
          Time (ms)
        </text>
        <text
          x={15}
          y={margin.top + height / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#fff"
          transform={`rotate(-90 15 ${margin.top + height / 2})`}
        >
          Current (nA)
        </text>

        <polyline
          points={points}
          fill="none"
          stroke="#61dafb"
          strokeWidth="2"
        />
        {windowIndex >= 0 && (
          <rect
            x={rectX}
            y={margin.top}
            width={windowWidth}
            height={height}
            fill="rgba(255, 99, 132, 0.3)"
          />
        )}
      </svg>
    </div>
  );
}

function App() {
  const [data, setData] = useState([]);
  const [sequence, setSequence] = useState('');
  const [calling, setCalling] = useState(false);
  const [windowIndex, setWindowIndex] = useState(-1);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result.trim();
      const lines = text.split(/\r?\n/);
      const values = [];
      lines.forEach((line) => {
        const val = parseFloat(line.split(',')[0]);
        if (!isNaN(val)) {
          values.push({ x: values.length, y: val });
        }
      });
      setData(values);
    };
    reader.readAsText(file);
  };

  const startBaseCalling = () => {
    if (!data.length || calling) return;
    setCalling(true);
    setSequence('');
    setWindowIndex(0);
    let i = 0;
    const timer = setInterval(() => {
      setSequence((seq) => seq + randomBase());
      setWindowIndex(i);
      i += 1;
      if (i >= data.length) {
        clearInterval(timer);
        setCalling(false);
        setWindowIndex(-1);
      }
    }, 100);
  };

  return (
    <div className="App">
      <h1>Nanopore Signal Viewer</h1>
      <div className="controls">
        <input type="file" accept=".csv" onChange={handleFile} />
        <button onClick={startBaseCalling} disabled={calling || !data.length}>
          {calling ? 'Base calling...' : 'Start Base Calling'}
        </button>
      </div>
      <SignalPlot data={data} windowIndex={windowIndex} />
      {sequence && (
        <div className="sequence">
          <strong>Basecall:</strong> {sequence}
        </div>
      )}
    </div>
  );
}

export default App;
