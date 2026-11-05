import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:5000/api/summarize";

const formatHour = (h) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

function Card({ title, items }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {items && items.length > 0 ? (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nothing found</p>
      )}
    </div>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const handleSubmit = async () => {
    if (!file) {
      setError("Please choose a .txt file first");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);

    try {
      const formData = new FormData();
      formData.append("chat", file);
      const res = await axios.post(API_URL, formData);
      setData(res.data);
    } catch (err) {
      const d = err.response?.data;
      setError(
        d
          ? `${d.error} ${d.status ? `(${d.status})` : ""} ${d.details || ""}`
          : "Could not reach the server. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary;
  const stats = data?.stats;

  return (
    <div className="container">
      <h1>GroupCatchUp</h1>
      <p className="muted">
        Upload an exported WhatsApp chat (.txt) and catch up in seconds.
      </p>

      <div className="upload">
        <input
          type="file"
          accept=".txt"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Summarizing..." : "Summarize"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {summary && (
        <>
          <div className="card">
            <h3>Summary</h3>
            <p className="pre">{summary.summary}</p>
          </div>

          <div className="grid">
            <Card title="Decisions" items={summary.decisions} />
            <Card
              title="Deadlines"
              items={summary.deadlines?.map((d) => `${d.what} - ${d.when}`)}
            />
            <Card title="Action items" items={summary.actionItems} />
            <Card title="Needs a reply" items={summary.needsReply} />
          </div>
        </>
      )}

      {stats && (
        <>
          <div className="card">
            <h3>Chat stats</h3>
            <p>
              {stats.totalMessages} messages. Most active: {stats.mostActive}.
              Busiest hour: {formatHour(stats.busiestHour)}.
            </p>
          </div>

          <div className="grid">
            <div className="card">
              <h3>Messages per person</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.perSender}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3>Messages by hour</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={stats.perHour.map((h) => ({
                    ...h,
                    label: formatHour(h.hour),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" interval={2} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}