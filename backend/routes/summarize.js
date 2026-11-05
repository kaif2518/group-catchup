const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { parseChat, computeStats, chunkMessages } = require("../utils/whatsappParser");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(), // raw chat stays in memory, never saved
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
});

const SCHEMA = `{
  "summary": "5 short lines max",
  "decisions": ["..."],
  "deadlines": [{"what": "...", "when": "date/time as written in chat"}],
  "actionItems": ["..."],
  "needsReply": ["message or question someone is waiting for an answer on"]
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function askJSON(prompt, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, "").trim();
      return JSON.parse(text);
    } catch (err) {
      const retryable = err.status === 503 || err.status === 429;
      if (!retryable || attempt === retries) throw err;
      await sleep(2000 * 2 ** attempt); // waits 2s, 4s, then 8s
    }
  }
}

// MAP step: summarize one chunk
function mapChunk(chunkText, index, total) {
  return askJSON(
    `You are summarizing part ${index + 1} of ${total} of a WhatsApp group chat.
Return ONLY JSON in this exact shape:
${SCHEMA}
Use only information in the chat. If a field has nothing, return an empty list.

CHAT:
${chunkText}`
  );
}

// REDUCE step: merge partial results into one
function reduceParts(parts) {
  return askJSON(
    `Below are partial summaries of one long WhatsApp group chat, in order.
Merge them into ONE final result. Remove duplicates, keep the latest status of any decision.
Return ONLY JSON in this exact shape:
${SCHEMA}

PARTIAL SUMMARIES:
${JSON.stringify(parts)}`
  );
}

router.post("/", upload.single("chat"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a .txt chat export" });

    const messages = parseChat(req.file.buffer.toString("utf-8"));
    if (messages.length === 0) {
      return res.status(400).json({ error: "Could not read messages. Is this a WhatsApp export?" });
    }

    const stats = computeStats(messages);
    const chunks = chunkMessages(messages);

    // Sequential, to stay inside free-tier rate limits
    const parts = [];
    for (let i = 0; i < chunks.length; i++) {
      parts.push(await mapChunk(chunks[i], i, chunks.length));
    }

    const summary = parts.length === 1 ? parts[0] : await reduceParts(parts);
    res.json({ summary, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Summarization failed. Try a smaller chat or retry.",
      details: err.message,
      status: err.status,
    });
  }
});

module.exports = router;