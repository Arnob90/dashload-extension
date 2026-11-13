import { useEffect, useState } from 'react';
import './App.css';

interface DownloadEntry {
  url: string;
  filename?: string;
  filesize?: number;
  timestamp: number;
}

function App() {
  const [monitoring, setMonitoring] = useState(true);
  const [recent, setRecent] = useState<DownloadEntry[]>([]);
  const [desktopRunning, setDesktopRunning] = useState<boolean | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    browser.storage.local.get(['dashload_monitoring', 'dashload_recent'], (result: any) => {
      if (result.dashload_monitoring !== undefined) {
        setMonitoring(result.dashload_monitoring);
      }
      if (result.dashload_recent) {
        setRecent(result.dashload_recent);
      }
    });
  }, []);

  // Persist toggle
  const toggleMonitoring = () => {
    const next = !monitoring;
    setMonitoring(next);
    browser.storage.local.set({ dashload_monitoring: next });
  };

  // Listen for forwarded downloads to show a live list
  useEffect(() => {
    const listener = (request: any) => {
      if (request?.type === 'dashload_forwarded') {
        const entry: DownloadEntry = {
          url: request.url,
          filename: request.filename,
          filesize: request.filesize,
          timestamp: Date.now(),
        };
        setRecent((prev) => {
          const updated = [entry, ...prev].slice(0, 5);
          browser.storage.local.set({ dashload_recent: updated });
          return updated;
        });
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  // Probe the desktop app
  useEffect(() => {
    const probe = async () => {
      try {
        const res = await fetch('http://127.0.0.1:3000/health', {
          method: 'GET',
          signal: AbortSignal.timeout(1500),
        });
        setDesktopRunning(res.ok);
      } catch {
        setDesktopRunning(false);
      }
    };
    probe();
    const id = setInterval(probe, 10000);
    return () => clearInterval(id);
  }, []);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const shortUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch {
      return url;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">⚡</span>
          <div>
            <h1>Dashload</h1>
            <p className="subtitle">Forward downloads to your desktop app</p>
          </div>
        </div>
        <div
          className={`status-dot ${desktopRunning ? 'online' : 'offline'}`}
          title={desktopRunning ? 'Dashload desktop is running' : 'Dashload desktop not detected'}
        />
      </header>

      <div className="toggle-card">
        <div className="toggle-info">
          <span className="toggle-label">Monitoring</span>
          <span className="toggle-hint">
            {monitoring ? 'Downloads are being forwarded' : 'Downloads are paused'}
          </span>
        </div>
        <button
          className={`toggle ${monitoring ? 'on' : 'off'}`}
          onClick={toggleMonitoring}
          aria-pressed={monitoring}
        >
          <span className="toggle-track" />
          <span className="toggle-thumb" />
        </button>
      </div>

      <div className="recent-card">
        <div className="recent-head">
          <h2>Recent</h2>
          <button
            className="link-btn"
            onClick={() => {
              browser.storage.local.remove('dashload_recent');
              setRecent([]);
            }}
          >
            Clear
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="empty">No forwarded downloads yet</p>
        ) : (
          <ul className="download-list">
            {recent.map((d, i) => (
              <li key={i} className="download-item">
                <div className="dl-icon">⬇</div>
                <div className="dl-meta">
                  <span className="dl-name" title={d.filename || d.url}>
                    {d.filename || shortUrl(d.url)}
                  </span>
                  <span className="dl-size">{formatSize(d.filesize)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="app-footer">
        <span>Listening on <code>127.0.0.1:3000</code></span>
      </footer>
    </div>
  );
}

export default App;