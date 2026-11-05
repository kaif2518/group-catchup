import { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api/summarize`;

const formatHour = (h) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

const SAMPLE_CHAT = `12/05/24, 9:41 pm - Kaif: Exam is on Monday at 10 am, Hall B
12/05/24, 9:42 pm - Hamza: Which hall?
12/05/24, 9:43 pm - Kaif: Hall B. Bring your ID card
12/05/24, 9:50 pm - Aisha: Project report submission is on Friday 5 pm
12/05/24, 9:51 pm - Hamza: Who is making the PPT?
12/05/24, 9:55 pm - Aisha: Let's decide tomorrow. Kaif, can you send the notes?
12/05/24, 10:02 pm - Kaif: Sure, I will send them tonight
12/05/24, 10:10 pm - Hamza: Also the lab record needs to be signed before Wednesday
12/05/24, 10:12 pm - Aisha: Right, and the fee deadline is 20th
12/05/24, 10:15 pm - Hamza: Can someone share the timetable?`;

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

  const runSummary = async (chatFile) => {
    if (!chatFile) {
      setError("Please choose a .txt file first");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);

    try {
      const formData = new FormData();
      formData.append("chat", chatFile);
      const res = await axios.post(API_URL, formData);
      setData(res.data);
    } catch (err) {
      const d = err.response?.data;
      setError(
        d
          ? `${d.error} ${d.status ? `(${d.status})` : ""} ${d.details || ""}`
          : "Could not reach the server. It may be waking up, so please try again in a minute."
      );
    } finally {
      setLoading(false);
    }
  };

  const trySample = () => {
    const sample = new File([SAMPLE_CHAT], "sample-chat.txt", {
      type: "text/plain",
    });
    setFile(sample);
    runSummary(sample);
  };

  const summary = data?.summary;
  const stats = data?.stats;

  return (
    <div className="container">
      <div className="card">
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
          <button onClick={() => runSummary(file)} disabled={loading}>
            {loading ? "Summarizing..." : "Summarize"}
          </button>
          <button
            className="secondary"
            onClick={trySample}
            disabled={loading}
          >
            Try a sample chat
          </button>
        </div>
        {loading && (
          <p className="muted">
            Working on it. The first request can take up to a minute while the
            server wakes up.
          </p>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {!data && (
        <div className="card">
          <h3>How to export your chat</h3>
          <p className="muted">
            Android: open the group, tap the three dots, then More, Export chat,
            Without media.
            <br />
            iPhone: open the group, tap the group name, then Export Chat,
            Without Media.
          </p>
          <p className="muted">
            Your chat is processed to create the summary and is not stored by
            this app. Please avoid private or sensitive chats.
          </p>
        </div>
      )}

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

            <footer className="footer">
        <p>Built by Mohammed Kaif</p>
        <div className="links">
          <a
            href="https://github.com/kaif2518"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://instagram.com/kaifahaalll"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
        </div>
      </footer>
    </div>
  );
}