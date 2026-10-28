import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import parseRouter from "./routes/parse";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());

// Protects your Gemini quota: 30 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok haha" });
});

app.use("/api/parse", parseRouter);

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});

console.log("Key loaded:", !!process.env.GEMINI_API_KEY);
