// Parses WhatsApp exported .txt chats (Android and iOS formats)
// Android: 12/05/24, 9:41 pm - Name: message
// iOS:     [12/05/24, 9:41:22 PM] Name: message

const LINE_RE =
  /^\u200e?\[?(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap]\.?[Mm]\.?)?)\]?\s(?:-\s)?([^:]+?):\s([\s\S]*)$/;

function parseHour(timeStr) {
  const m = timeStr.match(/(\d{1,2}):\d{2}(?::\d{2})?\s?([APap])?/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const ampm = m[2] ? m[2].toLowerCase() : null;
  if (ampm === "p" && hour < 12) hour += 12;
  if (ampm === "a" && hour === 12) hour = 0;
  return hour;
}

function parseChat(rawText) {
  const messages = [];
  const lines = rawText.replace(/\r/g, "").split("\n");

  for (const line of lines) {
    const match = line.match(LINE_RE);
    if (match) {
      const [, date, time, sender, text] = match;
      messages.push({ date, time, hour: parseHour(time), sender: sender.trim(), text });
    } else if (messages.length && line.trim()) {
      // continuation of a multi-line message
      messages[messages.length - 1].text += "\n" + line;
    }
  }

  return messages.filter(
    (m) => !/<Media omitted>|image omitted|This message was deleted/i.test(m.text)
  );
}

function computeStats(messages) {
  const perSender = {};
  const perHour = Array(24).fill(0);

  for (const m of messages) {
    perSender[m.sender] = (perSender[m.sender] || 0) + 1;
    if (m.hour !== null) perHour[m.hour] += 1;
  }

  const senders = Object.entries(perSender)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalMessages: messages.length,
    mostActive: senders[0]?.name || null,
    busiestHour: perHour.indexOf(Math.max(...perHour)),
    perSender: senders,
    perHour: perHour.map((count, hour) => ({ hour, count })),
  };
}

// Splits messages into text chunks without cutting a message in half
function chunkMessages(messages, maxChars = 30000) {
  const chunks = [];
  let current = "";

  for (const m of messages) {
    const line = `[${m.date} ${m.time}] ${m.sender}: ${m.text}\n`;
    if (current.length + line.length > maxChars && current) {
      chunks.push(current);
      current = "";
    }
    current += line;
  }
  if (current) chunks.push(current);
  return chunks;
}

module.exports = { parseChat, computeStats, chunkMessages };