import React, { useState, useEffect } from 'react';
import './App.css';

function randomBase() {
  const bases = ['A', 'T', 'C', 'G'];
  return bases[Math.floor(Math.random() * bases.length)];
}

function SignalPlot({ data, windowIndex }) {
  if (!data.length) return <div className="placeholder">Upload a CSV file to see the signal</div>;
  const width = 700;
  const height = 300;
  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const scaleX = width / (data.length - 1);
  const scaleY = height / (maxY - minY || 1);
  const points = data
    .map((d, i) => `${i * scaleX},${height - (d.y - minY) * scaleY}`)
    .join(' ');
  const windowWidth = 10 * scaleX;
  const rectX = Math.max(0, windowIndex * scaleX - windowWidth / 2);

  return (
    <svg width={width} height={height} className="plot">
      <polyline points={points} fill="none" stroke="#61dafb" strokeWidth="2" />
      {windowIndex >= 0 && (
        <rect
          x={rectX}
          y={0}
          width={windowWidth}
          height={height}
          fill="rgba(255, 99, 132, 0.3)"
        />
      )}
    </svg>
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
      const values = lines.map((line, idx) => {
        const val = parseFloat(line.split(',')[0]);
        return { x: idx, y: val };
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
