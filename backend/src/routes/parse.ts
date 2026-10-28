import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isOverloaded(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('"code":503') ||
    msg.includes("UNAVAILABLE") ||
    msg.includes('"code":429')
  );
}

async function generateWithRetry(
  params: Parameters<typeof ai.models.generateContent>[0],
) {
  const models = [MODEL, MODEL, FALLBACK_MODEL]; // 2 tries on main, then fallback
  let lastErr: unknown;

  for (let i = 0; i < models.length; i++) {
    try {
      return await ai.models.generateContent({ ...params, model: models[i] });
    } catch (err) {
      lastErr = err;
      if (!isOverloaded(err)) throw err; // real errors fail immediately
      console.warn(`Attempt ${i + 1} on ${models[i]} overloaded, retrying...`);
      await sleep(1000 * (i + 1));
    }
  }
  throw lastErr;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image uploads are allowed"));
  },
});

const CATEGORIES = [
  "Transfer",
  "Food",
  "Transport",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Health",
  "Others",
];

const DOC_TYPES = ["payslip", "receipt", "other"];
const documentTypeField = {
  type: Type.STRING,
  format: "enum",
  enum: DOC_TYPES,
};

const CLASSIFY_RULES = `First set documentType to what the image actually is:
- "payslip": a salary slip showing earnings (basic salary/wages, allowance, bonus) and deductions (EPF, SOCSO, EIS, PCB).
- "receipt": a shop receipt, invoice, bill, or bank/e-wallet statement listing purchases or transactions.
- "other": anything else.`;

const CATEGORY_RULES = `Categorize each transaction by the merchant or item, using exactly one category:
- Food: restaurants, cafes, coffee, bubble tea, fast food, dining, food delivery (GrabFood, foodpanda, ShopeeFood), groceries, supermarkets, convenience stores for food and drinks.
- Transport: e-hailing (Grab rides, GrabCar, Bolt, inDrive), taxi, petrol, parking, tolls, Touch 'n Go reload, LRT/MRT/bus, car-related charges.
- Utilities: electricity, water, internet, phone bills and top-ups (TNB, Syabas, Unifi, Maxis, Celcom, Digi).
- Shopping: retail and e-commerce purchases (Shopee, Lazada, clothing, electronics, household items, department stores).
- Entertainment: movies, cinemas, games (Steam), in-app purchases (Google Play, App Store), streaming and subscriptions (Netflix, Spotify).
- Health: pharmacies, clinics, hospitals, dental, medical supplies.
- Transfer: transfers (anything containing "transfer"), and anything that fits none of the above.
If a merchant is unclear, choose from the items purchased. Use 'Others' only as a last resort.`;

const SCAN_PROMPT = `${CLASSIFY_RULES}
- If documentType is "payslip": fill the payslip object for a Malaysian employee: Basic Salary, Allowances, Bonus, Employee EPF (KWSP), SOCSO (PERKESO), EIS, Income Tax (PCB), and calculate Net Salary (Basic + Allowances + Bonus - Deductions). If not found, return 0. Also extract the pay date as payDate in YYYY-MM-DD format. Malaysian dates are usually DD/MM/YYYY, and always use a 4-digit year. If the payslip only shows a pay period or month (e.g. "JULY 2026"), use the last day of that month. Omit payDate if no date or period is visible. Omit transactions.
- If documentType is "receipt": fill transactions with every individual transaction. For bank or e-wallet statements, include only money spent (debits) and skip incoming credits. Dates are usually DD/MM/YYYY or DD/MM/YY; return YYYY-MM-DD with a 4-digit year (omit if not visible). ${CATEGORY_RULES} Omit payslip.
- If documentType is "other": omit both.`;

// const payslipSchema = {
//   type: Type.OBJECT,
//   properties: {
//     documentType: documentTypeField,
//     basicSalary: { type: Type.NUMBER },
//     allowances: { type: Type.NUMBER },
//     bonus: { type: Type.NUMBER },
//     epfEmployee: { type: Type.NUMBER },
//     socso: { type: Type.NUMBER },
//     eis: { type: Type.NUMBER },
//     taxPcb: { type: Type.NUMBER },
//     netSalary: { type: Type.NUMBER },
//     payDate: { type: Type.STRING },
//   },
//   propertyOrdering: [
//     "documentType",
//     "basicSalary",
//     "allowances",
//     "bonus",
//     "epfEmployee",
//     "socso",
//     "eis",
//     "taxPcb",
//     "netSalary",
//     "payDate",
//   ],
//   required: ["documentType", "basicSalary", "netSalary"],
// };

// const expenseSchema = {
//   type: Type.OBJECT,
//   properties: {
//     documentType: documentTypeField,
//     transactions: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.OBJECT,
//         properties: {
//           merchant: { type: Type.STRING },
//           amount: { type: Type.NUMBER },
//           category: { type: Type.STRING, format: "enum", enum: CATEGORIES },
//           date: { type: Type.STRING },
//         },
//         required: ["merchant", "amount", "category"],
//       },
//     },
//   },
//   propertyOrdering: ["documentType", "transactions"],
//   required: ["documentType", "transactions"],
// };

const scanSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: documentTypeField,
    payslip: {
      type: Type.OBJECT,
      properties: {
        basicSalary: { type: Type.NUMBER },
        allowances: { type: Type.NUMBER },
        bonus: { type: Type.NUMBER },
        epfEmployee: { type: Type.NUMBER },
        socso: { type: Type.NUMBER },
        eis: { type: Type.NUMBER },
        taxPcb: { type: Type.NUMBER },
        netSalary: { type: Type.NUMBER },
        payDate: { type: Type.STRING },
      },
    },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          merchant: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING, format: "enum", enum: CATEGORIES },
          date: { type: Type.STRING },
        },
        required: ["merchant", "amount", "category"],
      },
    },
  },
  propertyOrdering: ["documentType", "payslip", "transactions"],
  required: ["documentType"],
};

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const response = await generateWithRetry({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: file.mimetype || "image/jpeg",
                data: file.buffer.toString("base64"),
              },
            },
            { text: SCAN_PROMPT },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: scanSchema,
      },
    });

    const data = JSON.parse(response.text || "{}");
    if (data.documentType === "payslip" && data.payslip) {
      return res.json({ type: "payslip", data: data.payslip });
    }
    if (data.documentType === "receipt" && data.transactions?.length) {
      return res.json({
        type: "receipt",
        data: { transactions: data.transactions },
      });
    }
    return res.status(422).json({
      error:
        "This doesn't look like a payslip or receipt. Please try a clearer image.",
    });
  } catch (err) {
    console.error("Parse error:", err instanceof Error ? err.message : err);
    if (isOverloaded(err)) {
      return res
        .status(503)
        .json({ error: "AI service is busy. Please try again in a moment." });
    }
    return res.status(500).json({ error: "Failed to analyze image" });
  }
});

// Turns multer errors (file too large, wrong type) into clean JSON
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Upload error:", err.message);
  res.status(400).json({ error: err.message });
});

export default router;
