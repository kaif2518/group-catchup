# GroupCatchUp

Upload an exported WhatsApp group chat and catch up in seconds. GroupCatchUp turns hundreds of unread messages into a short summary, decisions, deadlines, action items, and the messages that need your reply, plus charts of who talks the most and when.

**Live demo:** coming soon

## Features
- Parses WhatsApp .txt exports (Android and iOS formats), including multi-line messages
- Summarizes long chats with chunked map-reduce using the Gemini API
- Returns structured JSON: summary, decisions, deadlines, action items, needs-reply
- Chat statistics computed in plain code: messages per person, busiest hour
- Automatic retries with backoff when the API is busy
- Raw chats are processed in memory and never saved to disk or a database

## Tech stack
React (Vite), Recharts, Axios, Node.js, Express, Multer, Gemini API

## How it works
1. The React app uploads the chat file to the Express backend.
2. The parser converts the text into structured messages and computes stats.
3. Long chats are split into chunks, each chunk is summarized (map), and the partial summaries are merged into one result (reduce).
4. The frontend shows the result as cards and charts.

## Run locally
```bash
# backend
cd backend
npm install
cp .env.example .env   # add your Gemini API key
node server.js

# frontend (new terminal)
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 and upload an exported chat (WhatsApp > Export chat > Without media).

## Privacy
Chat text is sent to the Gemini API to generate the summary. Nothing is stored by this app. Use exports you are comfortable sharing, and avoid sensitive chats.

## Roadmap
- WhatsApp bot using the Cloud API
- Hindi and Kannada summaries
- Calendar (.ics) export for deadlines
- Login and saved summaries