import { useColorScheme } from "react-native";

export const colors = {
  background: "#14100E",
  card: "#30241D",
  border: "#4A3A31",
  foreground: "#FBF5F0",
  mutedForeground: "#BAA89B",
  secondary: "#3C2E26",
  secondaryForeground: "#F7EFE9",

  primary: "#C8754C",
  onPrimary: "#1F140E",

  income: "#10B981",
  expense: "#EF4444",
  onExpense: "#FFFFFF",
  commitments: "#FFC93C",
  budget: "#2C8DFF",

  catCyan: "#22D3EE",
  catBlue: "#2C8DFF",
  catViolet: "#8B5CF6",
  catTeal: "#10B981",
  catSlate: "#B7BEC7",
  catTaupe: "#9CC5A1",
  catRose: "#FF8FB3",
  catOrange: "#FB923C",
};

export const colorsLight = {
  background: "#FAF7F4",
  card: "#FFFFFF",
  border: "#EADFD8",
  foreground: "#1C1612",
  mutedForeground: "#75685F",
  secondary: "#F3EDE8",
  secondaryForeground: "#1C1612",

  primary: "#A85A34",
  onPrimary: "#FFFFFF",

  income: "#0F9D63",
  expense: "#DC2626",
  onExpense: "#FFFFFF",
  commitments: "#D97706",
  budget: "#2563EB",

  catCyan: "#0891B2",
  catBlue: "#2563EB",
  catViolet: "#7C3AED",
  catTeal: "#0F9D63",
  catSlate: "#5B6472",
  catTaupe: "#5E8A63",
  catRose: "#C2185B",
  catOrange: "#EA580C",
};

export const CATEGORY_COLOR_KEY: Record<string, keyof typeof CAT_CLASSES> = {
  Salary: "blue",
  Business: "violet",
  Investment: "teal",
  Transfer: "taupe",
  Subscription: "taupe",
  Loan: "commitments",
  Utilities: "blue",
  Insurance: "violet",
  Rent: "rose",
  Others: "slate",
  Ongoing: "income",
  Ended: "expense",
  Food: "teal",
  Transport: "cyan",
  Shopping: "violet",
  Entertainment: "orange",
  Health: "rose",
};

export const CAT_CLASSES = {
  cyan: {
    bg: "bg-cat-cyan/15",
    border: "border-cat-cyan/40",
    text: "text-cat-cyan",
  },
  blue: {
    bg: "bg-cat-blue/15",
    border: "border-cat-blue/40",
    text: "text-cat-blue",
  },
  violet: {
    bg: "bg-cat-violet/15",
    border: "border-cat-violet/40",
    text: "text-cat-violet",
  },
  teal: {
    bg: "bg-cat-teal/15",
    border: "border-cat-teal/40",
    text: "text-cat-teal",
  },
  slate: {
    bg: "bg-cat-slate/15",
    border: "border-cat-slate/40",
    text: "text-cat-slate",
  },
  taupe: {
    bg: "bg-cat-taupe/15",
    border: "border-cat-taupe/40",
    text: "text-cat-taupe",
  },
  rose: {
    bg: "bg-cat-rose/15",
    border: "border-cat-rose/40",
    text: "text-cat-rose",
  },
  orange: {
    bg: "bg-cat-orange/15",
    border: "border-cat-orange/40",
    text: "text-cat-orange",
  },
  commitments: {
    bg: "bg-commitments/15",
    border: "border-commitments/40",
    text: "text-commitments",
  },
  income: {
    bg: "bg-income/15",
    border: "border-income/40",
    text: "text-income",
  },
  expense: {
    bg: "bg-expense/15",
    border: "border-expense/40",
    text: "text-expense",
  },
} as const;

export function getCategoryClasses(label: string) {
  const key = CATEGORY_COLOR_KEY[label] ?? "slate";
  return CAT_CLASSES[key];
}

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === "light" ? colorsLight : colors;
}

export function getCategorySolidColor(
  label: string,
  c: typeof colors | typeof colorsLight,
): string {
  const key = CATEGORY_COLOR_KEY[label] ?? "slate";
  const map: Record<string, string> = {
    cyan: c.catCyan,
    blue: c.catBlue,
    violet: c.catViolet,
    teal: c.catTeal,
    slate: c.catSlate,
    taupe: c.catTaupe,
    rose: c.catRose,
    orange: c.catOrange,
    commitments: c.commitments,
    income: c.income,
    expense: c.expense,
  };
  return map[key] ?? c.catSlate;
}
