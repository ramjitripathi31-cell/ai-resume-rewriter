const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { OpenAI } = require("openai");
const { connectDB, saveHistory, getHistory } = require("./db");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

connectDB(); // connect to MongoDB

app.post("/upload", upload.single("resume"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const ext = path.extname(file.originalname).toLowerCase();
  let text = "";

  try {
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (ext === ".docx") {
      const data = await mammoth.extractRawText({ path: file.path });
      text = data.value;
    } else if (ext === ".txt") {
      text = fs.readFileSync(file.path, "utf8");
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    fs.unlinkSync(file.path);
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse file" });
  }
});

app.post("/rewrite", async (req, res) => {
  const { text, section } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    const prompt = `Improve this resume ${section || "summary"}:\n\n${text}`;
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
    });

    const rewritten = completion.choices[0].message.content.trim();
    await saveHistory({ text, section, rewritten });

    res.json({ rewritten });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI rewrite failed" });
  }
});

app.get("/history", async (req, res) => {
  try {
    const records = await getHistory();
    res.json(records);
  } catch (err) {
    console.error("History fetch failed:", err);
    res.status(500).json({ error: "Could not fetch history" });
  }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
