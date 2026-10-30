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

function payslipIsConsistent(p: any) {
  const calc =
    (p.basicSalary || 0) +
    (p.allowances || 0) +
    (p.bonus || 0) -
    ((p.epfEmployee || 0) + (p.socso || 0) + (p.eis || 0) + (p.taxPcb || 0));
  return !p.printedNetSalary || Math.abs(calc - p.printedNetSalary) < 1;
}

async function scanImage(file: Express.Multer.File, extraHint = "") {
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
          { text: SCAN_PROMPT + extraHint },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: scanSchema,
      temperature: 0,
    },
  });
  return JSON.parse(response.text || "{}");
}

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

const PAYSLIP_RULES = `If documentType is "payslip", extract the following for a Malaysian employee.

Work in two steps:
1. First fill "lineItems" with EVERY earning and deduction row you can see (label exactly as printed, amount, section = "earning" | "deduction" | "employer_contribution" | "ytd" | "summary"). Read the whole page, including small print, footers and side columns.
2. Then map the line items into the payslip fields.

Field mapping (use the CURRENT MONTH column only, never YTD / "Year to Date" / "Terkumpul"):
- basicSalary: Basic Salary, Basic Pay, Gaji Pokok, Gaji Asas, Wages.
- allowances: SUM of all fixed/other earnings that are not basic or bonus: Allowance, Elaun, Transport, Meal, Phone, Housing, Overtime (OT), Commission, Incentive, Claims, Reimbursement, any other earning row.
- bonus: Bonus, Incentive Bonus, Ex-gratia, Annual/Performance Bonus, Arrears if labelled bonus.
- epfEmployee: EPF / KWSP deducted from the EMPLOYEE (Employee's contribution, Caruman Pekerja, "EPF (EE)"). Ignore the Employer's share.
- socso: SOCSO / PERKESO employee deduction only.
- eis: EIS / SIP (Sistem Insurans Pekerjaan) employee deduction only.
- taxPcb: PCB / MTD / Monthly Tax Deduction / Potongan Cukai / Income Tax. Include "PCB 2" or additional tax if shown.
- printedNetSalary: the net pay / take-home / "Gaji Bersih" / "Net Pay" exactly as printed on the slip. Read it, do not calculate it.
- netSalary: basicSalary + allowances + bonus - (epfEmployee + socso + eis + taxPcb).

Rules:
- Employer contributions are usually in a separate box or column. Do not use them for deductions.
- Only return 0 when you have checked every row and the item truly does not appear. A deduction that is printed must never be returned as 0.
- Amounts are plain numbers: remove "RM", commas and spaces ("1,234.50" -> 1234.5).
- payDate (YYYY-MM-DD): use the printed pay/payment date if shown. If only a month/period is shown (e.g. "June 2026"), use the LAST day of that month ("2026-06-30"). Malaysian dates are DD/MM/YYYY. Always 4-digit year.`;

const SCAN_PROMPT = `${CLASSIFY_RULES}
- ${PAYSLIP_RULES} Omit transactions.
- If documentType is "receipt": fill transactions with every individual transaction. For bank or e-wallet statements, include only money spent (debits) and skip incoming credits. Dates are usually DD/MM/YYYY or DD/MM/YY; return YYYY-MM-DD with a 4-digit year (omit if not visible). ${CATEGORY_RULES} Omit payslip.
- If documentType is "other": omit both.`;

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

const payslipSchema = {
  type: Type.OBJECT,
  properties: {
    lineItems: {
      type: Type.ARRAY,
      description: "Every earning/deduction row visible on the payslip",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          section: {
            type: Type.STRING,
            format: "enum",
            enum: [
              "earning",
              "deduction",
              "employer_contribution",
              "ytd",
              "summary",
            ],
          },
        },
        required: ["label", "amount", "section"],
      },
    },
    basicSalary: { type: Type.NUMBER, description: "Monthly basic salary" },
    allowances: {
      type: Type.NUMBER,
      description: "Sum of all non-basic, non-bonus earnings",
    },
    bonus: { type: Type.NUMBER },
    epfEmployee: {
      type: Type.NUMBER,
      description: "Employee EPF/KWSP deduction, not employer",
    },
    socso: {
      type: Type.NUMBER,
      description: "Employee SOCSO/PERKESO deduction",
    },
    eis: { type: Type.NUMBER, description: "Employee EIS/SIP deduction" },
    taxPcb: { type: Type.NUMBER, description: "PCB/MTD income tax deduction" },
    printedNetSalary: { type: Type.NUMBER, description: "Net pay as printed" },
    netSalary: { type: Type.NUMBER },
    payDate: { type: Type.STRING },
  },
  propertyOrdering: [
    "lineItems",
    "basicSalary",
    "allowances",
    "bonus",
    "epfEmployee",
    "socso",
    "eis",
    "taxPcb",
    "printedNetSalary",
    "netSalary",
    "payDate",
  ],
  required: [
    "lineItems",
    "basicSalary",
    "allowances",
    "bonus",
    "epfEmployee",
    "socso",
    "eis",
    "taxPcb",
    "printedNetSalary",
  ],
};

const scanSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: documentTypeField,
    payslip: payslipSchema,
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

    // const response = await generateWithRetry({
    //   model: MODEL,
    //   contents: [
    //     {
    //       role: "user",
    //       parts: [
    //         {
    //           inlineData: {
    //             mimeType: file.mimetype || "image/jpeg",
    //             data: file.buffer.toString("base64"),
    //           },
    //         },
    //         { text: SCAN_PROMPT },
    //       ],
    //     },
    //   ],
    //   config: {
    //     responseMimeType: "application/json",
    //     responseSchema: scanSchema,
    //   },
    // });

    // const data = JSON.parse(response.text || "{}");

    // if (data.documentType === "payslip" && data.payslip) {
    //   return res.json({ type: "payslip", data: data.payslip });
    // }

    let data = await scanImage(file);

    if (
      data.documentType === "payslip" &&
      data.payslip &&
      !payslipIsConsistent(data.payslip)
    ) {
      const hint = `\n\nYour previous extraction did not match the printed net pay of ${data.payslip.printedNetSalary}. Re-check every deduction and allowance row, and make sure you use the employee column, not the employer or YTD column.`;
      const retry = await scanImage(file, hint);
      if (retry.documentType === "payslip" && retry.payslip) data = retry;
    }

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
