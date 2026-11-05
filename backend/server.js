require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", 1); // needed behind Render's proxy

const allowedOrigins = ["http://localhost:5173"];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("GroupCatchUp backend is running");
});

// Max 15 summaries per hour per visitor
app.use(
  "/api/summarize",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    message: { error: "Too many requests. Please try again in an hour." },
  })
);
app.use("/api/summarize", require("./routes/summarize"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));