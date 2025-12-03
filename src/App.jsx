import { useEffect, useState } from "react";
import "./index.css";

let host = document.location.hostname;
if (host.endsWith(".web.app")) {
  host = "Firebase";
} else if (host.endsWith("cloudtest.dgapps.io")) {
  host = "Cloudflare";
}
document.title += ` (${host})`;

const webSocket = new WebSocket("/ws");

const measureRequest = async (url) => {
  const start = performance.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error("Request failed");
  await res.text();
  return Math.round(performance.now() - start);
};

function Row({ label, url, onRun }) {
  const [times, setTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const showLastN = 7;

  const run = async () => {
    setLoading(true);
    try {
      const result = onRun ? await onRun() : await measureRequest(url);
      const entry = typeof result === "string" ? result : `${result}ms`;
      setTimes((prev) => [entry, ...prev].slice(0, showLastN));
    } catch (error) {
      setTimes((prev) => [`Failed`, ...prev].slice(0, showLastN));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        onClick={run}
        className="sm:w-48 w-full px-4 py-2 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition cursor-pointer"
        disabled={loading}
      >
        {loading ? "..." : label}
      </button>
      <div className="text-sm">
        {times.slice(0, 10).map((entry, idx) => (
          <span key={idx} style={{ opacity: 1 - idx * 0.2 }}>
            {idx > 0 ? ", " : ""}
            {entry}
          </span>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const ensureUserId = () => {
      const existing = localStorage.getItem("userId");
      if (existing) return existing;

      const id = crypto.randomUUID();

      localStorage.setItem("userId", id);
      return id;
    };

    const id = ensureUserId();
    setUserId(id);
  }, []);

  const commonRequests = [{ label: "Ping Server", url: "/api/ping" }];

  const cloudflareRequests = [
    {
      label: "Ping WebSocket",
      onRun: () => {
        const start = performance.now();

        return new Promise((resolve, reject) => {
          const handleMessage = () => {
            webSocket.removeEventListener("message", handleMessage);
            resolve(Math.round(performance.now() - start));
          };

          webSocket.addEventListener("message", handleMessage);
          webSocket.send("ping");
        });
      },
    },
    {
      label: "Durable Object Read",
      url: `/api/do-read?userId=${encodeURIComponent(userId)}`,
    },
    {
      label: "Durable Object Write",
      url: `/api/do-write?userId=${encodeURIComponent(userId)}`,
    },
    {
      label: "D1 Read",
      url: `/api/d1-read?userId=${encodeURIComponent(userId)}`,
    },
    {
      label: "D1 Write",
      url: `/api/d1-write?userId=${encodeURIComponent(userId)}`,
    },
  ];

  const firebaseRequests = [
    {
      label: "Firestore Read",
      url: `/api/db-read?userId=${encodeURIComponent(userId)}`,
    },
    {
      label: "Firestore Write",
      url: `/api/db-write?userId=${encodeURIComponent(userId)}`,
    },
  ];

  const requests =
    host === "Cloudflare"
      ? [...commonRequests, ...cloudflareRequests]
      : host === "Firebase"
      ? [...commonRequests, ...firebaseRequests]
      : [...commonRequests, ...cloudflareRequests, ...firebaseRequests];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-start justify-center px-6 pt-24">
      <div className="space-y-6 w-full max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight text-center">
          Test backend response times
        </h1>
        <p className="text-center text-slate-600">Served from {host}</p>

        <div className="space-y-4">
          {requests.map((req, idx) => (
            <Row key={idx} label={req.label} url={req.url} onRun={req.onRun} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default App;
