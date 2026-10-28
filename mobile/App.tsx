import "./global.css";
import "react-native-gesture-handler";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  ReactNode,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  useWindowDimensions,
  useColorScheme,
  Appearance,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import Svg, { Circle as SvgCircle, G } from "react-native-svg";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import {
  createStackNavigator,
  CardStyleInterpolators,
} from "@react-navigation/stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useHeaderHeight } from "@react-navigation/elements";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Landmark,
  CheckCircle2,
  Circle,
  Upload,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  MoreVertical,
  ListChecks,
  Home,
  Plus,
  Calendar as CalendarIcon,
  List as ListIcon,
  Menu,
  CalendarDays,
  Sun,
  Moon,
  TriangleAlert,
  CalendarCheck,
  Wallet,
  Info,
} from "lucide-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  colors,
  colorsLight,
  getCategoryClasses,
  getCategorySolidColor,
  useThemeColors,
} from "./constants/colors";

// Gluestack UI Components
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { Button, ButtonText } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicatorWrapper,
  ActionsheetDragIndicator,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetIcon,
} from "@/components/ui/actionsheet";
import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";

// ---------------------------------------------------------------------------
// Configuration & Constants
// ---------------------------------------------------------------------------
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/parse";
const DESKTOP_BREAKPOINT = 768;

const INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Investment",
  "Transfer",
  "Others",
];

const EXPENSE_CATEGORIES = [
  "Transfer",
  "Food",
  "Transport",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Health",
  "Others",
];

const COMMITMENT_CATEGORIES = [
  "Subscription",
  "Loan",
  "Utilities",
  "Insurance",
  "Rent",
  "Others",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_OPTIONS = [
  { label: "Jan", value: "01" },
  { label: "Feb", value: "02" },
  { label: "Mar", value: "03" },
  { label: "Apr", value: "04" },
  { label: "May", value: "05" },
  { label: "Jun", value: "06" },
  { label: "Jul", value: "07" },
  { label: "Aug", value: "08" },
  { label: "Sep", value: "09" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
];

const CustomDarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.background,
    border: colors.border,
    text: colors.foreground,
  },
};

const CustomLightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colorsLight.background,
    card: colorsLight.background,
    border: colorsLight.border,
    text: colorsLight.foreground,
  },
};

const SCREEN_PADDING_X = "px-6";
const formatPct = (p: number) => (p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface IncomeSource {
  id: string;
  name: string;
  category: string;
  date?: string; // Format: "YYYY-MM-DD"
  isAdvance: boolean;
  amount: number;
  basicSalary?: number;
  allowances?: number;
  bonus?: number;
  epfEmployee?: number;
  socso?: number;
  eis?: number;
  taxPcb?: number;
}

export interface MasterCommitment {
  id: string;
  name: string;
  category: string;
  defaultAmount: number;
  startDate: string;
  endDate?: string;
}

export type EntryFormType = "income" | "expense";

export interface ExpenseItem {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date?: string;
}

export interface MonthData {
  incomeSources: IncomeSource[];
  commitmentsPaid: Record<string, boolean>;
  expenses: ExpenseItem[];
}

export interface ActiveCommitment {
  id: string;
  masterId: string;
  name: string;
  category: string;
  amount: number;
  dueDay: number;
  paid: boolean;
}

export interface CategoryBudget {
  category: string;
  amount: number;
}

const DEFAULT_MONTH_DATA: MonthData = {
  incomeSources: [],
  commitmentsPaid: {},
  expenses: [],
};

const BLANK_INCOME: IncomeSource = {
  id: "",
  name: "",
  category: "Salary",
  date: new Date().toISOString().slice(0, 10),
  isAdvance: false,
  amount: 0,
};

const BLANK_EXPENSE: ExpenseItem = {
  id: "",
  merchant: "",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
  amount: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function getIncomeEffectiveAmount(income: IncomeSource): number {
  if (!income.isAdvance) return income.amount || 0;
  const basic = income.basicSalary || 0;
  const allowances = income.allowances || 0;
  const bonus = income.bonus || 0;
  const epf = income.epfEmployee || 0;
  const socso = income.socso || 0;
  const eis = income.eis || 0;
  const tax = income.taxPcb || 0;
  return basic + allowances + bonus - (epf + socso + eis + tax);
}

function isCommitmentActiveInMonth(
  m: MasterCommitment,
  monthKey: string,
): boolean {
  if (!m.startDate) return false;
  const start = m.startDate.slice(0, 7);
  if (monthKey < start) return false;
  if (m.endDate) {
    const end = m.endDate.slice(0, 7);
    if (monthKey > end) return false;
  }
  return true;
}

function getActiveCommitmentsForMonth(
  masterList: MasterCommitment[],
  monthKey: string,
  paidMap: Record<string, boolean>,
): ActiveCommitment[] {
  return masterList
    .filter((m) => isCommitmentActiveInMonth(m, monthKey))
    .map((m) => {
      const day = Number(m.startDate.slice(8, 10)) || 1;
      return {
        id: m.id,
        masterId: m.id,
        name: m.name,
        category: m.category,
        amount: m.defaultAmount || 0,
        dueDay: day,
        paid: paidMap[m.id] ?? false,
      };
    })
    .sort((a, b) => a.dueDay - b.dueDay);
}

function formatDateReadable(dateStr?: string): string {
  if (!dateStr) return "Never";
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || parts.some((p) => Number.isNaN(p))) return dateStr;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || parts.some((p) => Number.isNaN(p))) return dateStr;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDueDateLabel(monthKey: string, day: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

// values — the comma would break numeric parsing. Matches the "RM 5,100.00"
function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Design System Components
// ---------------------------------------------------------------------------
function GCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const hasCustomPadding = /\bp[xytbr]?-/.test(className);

  return (
    <View
      className={`bg-card border border-border dark:border-0 rounded-2xl w-full ${
        hasCustomPadding ? "" : "p-4"
      } ${className}`}
    >
      {children}
    </View>
  );
}

function GBadge({
  label,
  variant,
}: {
  label: string;
  variant?: "success" | "warning" | "danger" | "info";
}) {
  const variantKeyMap = {
    success: "income",
    warning: "commitments",
    danger: "expense",
    info: "blue",
  } as const;
  const c = variant
    ? {
        blue: getCategoryClasses("Salary"),
        income: getCategoryClasses("Ongoing"),
        commitments: getCategoryClasses("Loan"),
        expense: getCategoryClasses("Ended"),
      }[variantKeyMap[variant]]
    : getCategoryClasses(label);

  return (
    <View
      style={{ alignSelf: "flex-start" }}
      className={`flex-row items-center px-2.5 py-0.5 rounded-full ${c.bg}`}
    >
      <Text style={{ fontSize: 11 }} className={`font-bold ${c.text}`}>
        {label}
      </Text>
    </View>
  );
}

function GButton({
  children,
  onPress,
  variant = "solid",
  size = "md",
  color = "primary",
  className = "",
  disabled = false,
  iconLeft,
  iconRight,
}: {
  children?: ReactNode;
  onPress?: () => void;
  variant?: "solid" | "outline" | "subtle" | "ghost" | "link";
  size?: "xs" | "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}) {
  const c = useThemeColors();

  const btnVariant =
    variant === "link"
      ? "link"
      : variant === "outline"
        ? "outline"
        : variant === "ghost"
          ? "ghost"
          : color === "danger"
            ? "destructive"
            : color === "secondary"
              ? "secondary"
              : "default";

  const btnSize =
    size === "lg" ? "lg" : size === "xs" || size === "sm" ? "sm" : "default";

  const surfaceClasses = (() => {
    if (variant === "link") return "bg-transparent px-0 py-0";
    if (variant === "ghost")
      return "rounded-full bg-card shadow-sm data-[hover=true]:bg-transparent data-[active=true]:bg-transparent dark:data-[hover=true]:bg-transparent dark:data-[active=true]:bg-secondary";
    if (variant === "outline") {
      if (color === "primary")
        return "shadow-sm rounded-full bg-transparent border-2 active:bg-transparent data-[hover=true]:bg-transparent data-[active=true]:bg-transparent dark:data-[active=true]:bg-transparent";
      if (color === "secondary")
        return "bg-transparent border border-border active:bg-secondary/50 data-[hover=true]:bg-transparent data-[active=true]:bg-secondary/50";
      return "bg-transparent border active:bg-expense/10 data-[hover=true]:bg-transparent data-[active=true]:bg-expense/10"; // danger
    }
    if (color === "primary")
      // return "rounded-full bg-foreground active:bg-foreground/90 shadow-md data-[active=true]:bg-foreground";
      return "rounded-full border border-border bg-card dark:bg-secondary active:bg-card/90 shadow-md data-[active=true]:bg-card";

    if (color === "secondary")
      return "bg-secondary active:bg-secondary/80 border border-border";
    // return "bg-card border border-primary/30 shadow-sm";
    return "bg-destructive active:bg-destructive/90";
  })();

  const textClasses = (() => {
    if (variant === "outline" || variant === "ghost") {
      if (color === "primary") return "text-foreground";
      if (color === "secondary") return "text-secondary-foreground";
      return "text-expense"; // danger
    }
    if (color === "primary") return "text-foreground";
    if (color === "secondary") return "text-secondary-foreground";
    return "text-destructive-foreground"; // danger, solid
  })();

  // Button component — className alone wasn't reliably overriding it in dark mode.
  const borderStyle =
    variant === "outline" && color !== "secondary"
      ? { borderColor: color === "danger" ? c.expense : c.foreground }
      : undefined;

  return (
    <Button
      variant={btnVariant}
      size={btnSize}
      disabled={disabled}
      onPress={onPress}
      style={borderStyle}
      className={`rounded-[10px] flex-row items-center justify-center gap-2 ${surfaceClasses} ${className}`}
    >
      {iconLeft}
      {typeof children === "string" ? (
        <ButtonText className={`text-lg font-bold ${textClasses}`}>
          {children}
        </ButtonText>
      ) : (
        children
      )}
      {iconRight}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Gluestack AlertDialog
// ---------------------------------------------------------------------------
function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      useRNModal={Platform.OS !== "web"}
      size="md"
    >
      <AlertDialogBackdrop style={{ backgroundColor: "rgba(0,0,0,0.6)" }} />
      <AlertDialogContent className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <AlertDialogHeader className="border-b-0 pb-1">
          <Text className="text-xl font-bold text-foreground">{title}</Text>
        </AlertDialogHeader>
        <AlertDialogBody className="mb-5">
          <Text className="text-base text-muted-foreground">{message}</Text>
        </AlertDialogBody>
        <AlertDialogFooter className="border-t-0 pt-1 flex-row justify-end gap-3">
          <GButton size="sm" color="secondary" onPress={onClose}>
            Cancel
          </GButton>
          <GButton
            size="sm"
            color="danger"
            onPress={() => {
              onClose();
              onConfirm();
            }}
          >
            Delete
          </GButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Scanning Overlay AlertDialog
function ScanningOverlay() {
  const c = useThemeColors();
  const { scanning } = useFinance();

  return (
    <AlertDialog
      isOpen={scanning}
      onClose={() => {}} // ignore close requests while scanning
      closeOnOverlayClick={false}
      isKeyboardDismissable={false}
      useRNModal={Platform.OS !== "web"}
      size="md"
    >
      <AlertDialogBackdrop style={{ backgroundColor: "rgba(0,0,0,0.6)" }} />
      <AlertDialogContent className="bg-card border border-border rounded-2xl px-8 py-7 items-center w-full max-w-xs shadow-2xl">
        <ActivityIndicator size="large" color={c.primary} />
        <Text className="text-lg font-bold text-foreground mt-4">
          Scanning document...
        </Text>
        <Text className="text-sm text-muted-foreground mt-1 text-center">
          This may take a few seconds
        </Text>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ScanErrorDialog() {
  const c = useThemeColors();
  const { scanError, clearScanError } = useFinance();

  return (
    <AlertDialog
      isOpen={!!scanError}
      onClose={clearScanError}
      useRNModal={Platform.OS !== "web"}
      size="md"
    >
      <AlertDialogBackdrop style={{ backgroundColor: "rgba(0,0,0,0.6)" }} />
      <AlertDialogContent className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <AlertDialogHeader className="border-b-0 pb-1 flex-row items-center gap-2.5">
          <TriangleAlert color={c.expense} size={22} />
          <Text className="text-xl font-bold text-foreground">Scan failed</Text>
        </AlertDialogHeader>
        <AlertDialogBody className="mb-5">
          <Text className="text-base text-muted-foreground">{scanError}</Text>
        </AlertDialogBody>
        <AlertDialogFooter className="border-t-0 pt-1 flex-row justify-end">
          <GButton size="sm" color="secondary" onPress={clearScanError}>
            OK
          </GButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Gluestack Actionsheet
// ---------------------------------------------------------------------------
function ItemActionsSheet({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
}: {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent className="bg-card border-t border-border pb-6">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        <ActionsheetItem
          onPress={() => {
            onClose();
            onEdit();
          }}
          className="py-4 active:bg-foreground/10 data-[active=true]:bg-foreground/10 data-[hover=true]:bg-transparent"
        >
          <ActionsheetIcon as={Pencil} size={22} className="text-foreground" />
          <ActionsheetItemText className="text-foreground font-semibold text-lg ml-1 data-[active=true]:text-foreground">
            {editLabel}
          </ActionsheetItemText>
        </ActionsheetItem>

        <ActionsheetItem
          onPress={() => {
            onClose();
            onDelete();
          }}
          className="py-4 mb-6 active:bg-foreground/10 data-[active=true]:bg-foreground/10 data-[hover=true]:bg-transparent"
        >
          <ActionsheetIcon as={Trash2} size={22} className="text-foreground" />
          <ActionsheetItemText className="text-foreground font-semibold text-lg ml-1 data-[active=true]:text-expense">
            {deleteLabel}
          </ActionsheetItemText>
        </ActionsheetItem>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// More Action Button
function MoreActionsButton({ onPress }: { onPress: () => void }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 0 }}
      className="p-2.5 rounded-lg"
    >
      <MoreVertical color={c.mutedForeground} size={22} />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Navigate to current month button
// --------------------------------------------------------------------------
function TodayButton({ onPress }: { onPress: () => void }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={onPress}
      className="flex-row items-center gap-1.5 mr-5 px-3 py-1.5 rounded-full bg-secondary"
    >
      <CalendarDays color={c.primary} size={17} />
      <Text className="text-base font-semibold text-primary">This Month</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Floating Menu Button
// ---------------------------------------------------------------------------
function FabMenu({
  onScan,
  onAddEntry,
  scanning,
}: {
  onScan: () => void;
  onAddEntry: () => void;
  scanning: boolean;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const setFab = (next: boolean) => {
    setOpen(next);
    progress.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  const closeInstant = () => {
    setOpen(false);
    progress.value = 0; // set directly, nothing to get stuck mid-animation
  };

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }));
  const miniStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 16 },
      { scale: 0.85 + progress.value * 0.15 },
    ],
  }));

  const miniRow = {
    marginBottom: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  };

  return (
    <>
      {open && (
        <Pressable
          onPress={() => setFab(false)}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      <View
        style={{
          position: "absolute",
          right: 24,
          bottom: 60,
          alignItems: "flex-end",
        }}
      >
        {/* <Animated.View
          pointerEvents={open ? "auto" : "none"}
          style={[miniRow, miniStyle]}
        >
          <View className="bg-card px-3.5 py-1.5 rounded-xl border border-border shadow-md">
            <Text className="text-xs font-semibold text-secondary-foreground">
              Scan Receipt
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={1}
            disabled={loadingExpense}
            onPress={() => {
              closeInstant();
              setTimeout(onScanReceipt, 50);
            }}
            className="w-12 h-12 rounded-full bg-card items-center justify-center border border-border shadow-md"
          >
            {loadingExpense ? (
              <ActivityIndicator color={c.primary} size="small" />
            ) : (
              <Upload color={c.foreground} size={20} />
            )}
          </TouchableOpacity>
        </Animated.View> */}

        <Animated.View
          pointerEvents={open ? "auto" : "none"}
          style={[miniRow, miniStyle]}
        >
          <View className="bg-card px-3.5 py-1.5 rounded-xl border border-border shadow-md">
            <Text className="text-xs font-semibold text-secondary-foreground">
              Scan Document
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={1}
            disabled={scanning}
            onPress={() => {
              closeInstant();
              setTimeout(onScan, 50);
            }}
            className="w-12 h-12 rounded-full bg-card items-center justify-center border border-border shadow-md"
          >
            {scanning ? (
              <ActivityIndicator color={c.primary} size="small" />
            ) : (
              <Upload color={c.foreground} size={20} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          pointerEvents={open ? "auto" : "none"}
          style={[miniRow, miniStyle]}
        >
          <View className="bg-card px-3.5 py-1.5 rounded-xl border border-border shadow-md">
            <Text className="text-xs font-semibold text-secondary-foreground">
              Add Entry
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setFab(false);
              onAddEntry();
            }}
            className="w-12 h-12 rounded-full bg-card items-center justify-center border border-border shadow-md"
          >
            <Pencil color={c.foreground} size={20} />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFab(!open)}
          style={{ width: 58, height: 58 }}
          className="rounded-full bg-card dark:bg-secondary shadow-md border border-border items-center justify-center"
        >
          <Animated.View style={iconStyle}>
            <Plus color={c.secondaryForeground} size={28} strokeWidth={3} />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

function FabHost() {
  const navigation = useNavigation<any>();
  const { handleUpload, scanning } = useFinance();
  const [fabKey, setFabKey] = useState(0);
  const runUpload = async () => {
    await handleUpload();
    setFabKey((k) => k + 1);
  };

  useEffect(() => {
    let idleId: number | undefined;

    const unsub = navigation.addListener("focus", () => {
      idleId = requestIdleCallback(() => setFabKey((k) => k + 1), {
        timeout: 500, // make sure it runs even if the thread stays busy
      });
    });

    return () => {
      unsub();
      if (idleId !== undefined) cancelIdleCallback(idleId);
    };
  }, [navigation]);

  return (
    <>
      <FabMenu
        key={fabKey}
        scanning={scanning}
        onScan={runUpload}
        onAddEntry={() => navigation.navigate("IncomeForm", {})}
      />
      <ScanningOverlay />
      <ScanErrorDialog />
    </>
  );
}

// ---------------------------------------------------------------------------
// Wheel / Roller Date Picker Component
// ---------------------------------------------------------------------------
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_COUNT = 3;

interface WheelColumnProps<T> {
  items: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderLabel: (item: T) => string;
}

function WheelColumn<T>({
  items,
  selectedIndex,
  onSelect,
  renderLabel,
}: WheelColumnProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    if (!isUserScrolling.current) {
      scrollRef.current?.scrollTo({
        y: selectedIndex * WHEEL_ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / WHEEL_ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    isUserScrolling.current = false;
    onSelect(clamped);
  };

  return (
    <View style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_COUNT, flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
        }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{
          paddingVertical: WHEEL_ITEM_HEIGHT,
        }}
      >
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <TouchableOpacity
              activeOpacity={1}
              key={idx}
              onPress={() => {
                onSelect(idx);
                scrollRef.current?.scrollTo({
                  y: idx * WHEEL_ITEM_HEIGHT,
                  animated: true,
                });
              }}
              style={{ height: WHEEL_ITEM_HEIGHT }}
              className="items-center justify-center px-1"
            >
              <Text
                className={`text-center text-lg ${
                  isSelected
                    ? "text-foreground text-lg font-bold"
                    : "text-muted-foreground text-base"
                }`}
                numberOfLines={1}
              >
                {renderLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function WheelDatePickerModal({
  isOpen,
  onClose,
  value,
  onConfirm,
  allowClear = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onConfirm: (dateStr: string) => void;
  allowClear?: boolean;
}) {
  const c = useThemeColors();
  const currentYear = new Date().getFullYear();

  const yearOptions = useMemo(
    () => Array.from({ length: 16 }, (_, i) => currentYear - 5 + i),
    [currentYear],
  );

  const [tempYear, setTempYear] = useState(currentYear);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(1);

  useEffect(() => {
    if (isOpen) {
      Keyboard.dismiss();
      if (value) {
        const [y, m, d] = value.split("-").map(Number);
        if (y) setTempYear(y);
        if (m) setTempMonth(m);
        if (d) setTempDay(d);
      } else {
        const now = new Date();
        setTempYear(now.getFullYear());
        setTempMonth(now.getMonth() + 1);
        setTempDay(now.getDate());
      }
    }
  }, [isOpen, value]);

  const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  useEffect(() => {
    if (tempDay > daysInMonth) setTempDay(daysInMonth);
  }, [daysInMonth, tempDay]);

  const handleConfirm = () => {
    onConfirm(
      `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(tempDay).padStart(2, "0")}`,
    );
    onClose();
  };

  const handleClear = () => {
    onConfirm("");
    onClose();
  };

  return (
    <Actionsheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[31]}
      useRNModal={Platform.OS !== "web"}
    >
      <ActionsheetBackdrop />
      <ActionsheetContent className="bg-card border-t border-border px-6 pb-8">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <View className="w-full flex-row items-center justify-between mt-2 mb-4">
          <Text className="text-xl font-bold text-foreground">Select date</Text>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleConfirm}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-xl font-semibold text-primary">Confirm</Text>
          </TouchableOpacity>
        </View>

        <View className="w-full relative flex-row items-center justify-center my-2">
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: WHEEL_ITEM_HEIGHT,
              left: 0,
              right: 0,
              height: WHEEL_ITEM_HEIGHT,
              borderTopWidth: 1.5,
              borderBottomWidth: 1.5,
              borderColor: c.border,
            }}
          />
          <WheelColumn
            items={MONTH_NAMES}
            selectedIndex={tempMonth - 1}
            onSelect={(idx) => setTempMonth(idx + 1)}
            renderLabel={(m) => m}
          />
          <WheelColumn
            items={dayOptions}
            selectedIndex={Math.max(0, tempDay - 1)}
            onSelect={(idx) => setTempDay(dayOptions[idx])}
            renderLabel={(d) => String(d)}
          />
          <WheelColumn
            items={yearOptions}
            selectedIndex={Math.max(
              0,
              yearOptions.findIndex((y) => y === tempYear),
            )}
            onSelect={(idx) => setTempYear(yearOptions[idx])}
            renderLabel={(y) => String(y)}
          />
        </View>

        <View className="w-full flex-row gap-3 mt-1 justify-end">
          {allowClear && (
            <TouchableOpacity activeOpacity={0.6} onPress={handleClear}>
              <Text className="text-xl font-semibold text-expense">
                No End Date
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart
// ---------------------------------------------------------------------------
function DonutChart({
  segments,
  total,
  size = 210,
  stroke = 24,
  children,
}: {
  segments: { amount: number; color: string }[];
  total: number; // value that represents the full ring
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const c = useThemeColors();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const center = size / 2;

  let acc = 0;
  const arcs = segments.map((s, i) => {
    const len = total > 0 ? (s.amount / total) * circ : 0;
    const arc = { key: i, color: s.color, len, offset: acc };
    acc += len;
    return arc;
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size}>
        {/* rotate(angle cx cy) */}
        <G transform={`rotate(-90 ${center} ${center})`}>
          {/* track = unspent part */}
          <SvgCircle
            cx={center}
            cy={center}
            r={r}
            stroke={c.secondary}
            strokeWidth={stroke}
            fill="none"
          />
          {arcs.map((a) => (
            <SvgCircle
              key={a.key}
              cx={center}
              cy={center}
              r={r}
              stroke={a.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${a.len} ${circ - a.len}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </G>
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        {children}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Unified Finance Context Store
// ---------------------------------------------------------------------------
interface FinanceContextType {
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  currentData: MonthData;
  masterList: MasterCommitment[];
  activeCommitments: ActiveCommitment[];
  totalNetIncome: number;
  totalCommitments: number;
  totalCasualExpenses: number;
  finalDisposableIncome: number;
  spentAmount: number;
  spentPct: number;
  scanning: boolean;
  handleUpload: () => Promise<void>;
  updateCurrentMonthData: (newData: Partial<MonthData>) => void;
  saveIncome: (income: IncomeSource) => void;
  deleteIncome: (id: string) => void;
  saveExpense: (expense: ExpenseItem) => void;
  deleteExpense: (id: string) => void;
  toggleCommitmentPaid: (masterId: string) => void;
  toggleAllCommitmentsPaid: () => void;
  allCommitmentsChecked: boolean;
  saveMasterCommitment: (commitment: MasterCommitment) => void;
  deleteMasterCommitment: (id: string) => void;
  isCurrentMonth: boolean;
  goToCurrentMonth: () => void;
  scanError: string | null;
  clearScanError: () => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context)
    throw new Error("useFinance must be used within FinanceProvider");
  return context;
};

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [selectedMonth, setSelectedMonth] =
    useState<string>(getCurrentMonthKey());
  const [allData, setAllData] = useState<Record<string, MonthData>>({});
  const [masterList, setMasterList] = useState<MasterCommitment[]>([]);
  const [scanning, setScanning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isCurrentMonth = selectedMonth === getCurrentMonthKey();
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const savedRecords = await AsyncStorage.getItem(
          "finance_records_universal",
        );
        const savedMaster = await AsyncStorage.getItem(
          "finance_master_universal",
        );
        if (savedRecords) setAllData(JSON.parse(savedRecords));
        if (savedMaster) setMasterList(JSON.parse(savedMaster));
      } catch (e) {
        console.error("Error loading AsyncStorage", e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(
        "finance_records_universal",
        JSON.stringify(allData),
      );
      AsyncStorage.setItem(
        "finance_master_universal",
        JSON.stringify(masterList),
      );
    }
  }, [allData, masterList, isLoaded]);

  const rawMonthData = allData[selectedMonth] || DEFAULT_MONTH_DATA;
  const currentData: MonthData = {
    incomeSources: rawMonthData.incomeSources || [],
    commitmentsPaid: rawMonthData.commitmentsPaid || {},
    expenses: rawMonthData.expenses || [],
  };

  const goToCurrentMonth = useCallback(
    () => setSelectedMonth(getCurrentMonthKey()),
    [],
  );

  const updateCurrentMonthData = (newData: Partial<MonthData>) => {
    setAllData((prev) => ({
      ...prev,
      [selectedMonth]: {
        ...(prev[selectedMonth] || DEFAULT_MONTH_DATA),
        ...newData,
      },
    }));
  };

  const prevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m - 2, 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const nextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const date = new Date(y, m, 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const handleUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to access photo library");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setScanning(true);

    let errorMessage: string | null = null;

    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        const res = await fetch(result.assets[0].uri);
        const blob = await res.blob();
        formData.append("file", blob, "upload.jpg");
      } else {
        formData.append(
          "file",
          new File(result.assets[0].uri) as any,
          "upload.jpg",
        );
      }

      const res =
        Platform.OS === "web"
          ? await fetch(API_URL, { method: "POST", body: formData })
          : await expoFetch(API_URL, { method: "POST", body: formData });

      const json = await res.json();
      if (!res.ok || json.error)
        throw new Error(json.error || "Request failed");

      if (json.type === "payslip" && json.data) {
        const d = json.data;
        const today = new Date().toISOString().slice(0, 10);
        const payDate = /^\d{4}-\d{2}-\d{2}$/.test(d.payDate ?? "")
          ? d.payDate
          : today;
        const targetMonth = monthKeyFromDate(payDate);

        setAllData((prev) => {
          const bucket = prev[targetMonth] || DEFAULT_MONTH_DATA;
          const sources = bucket.incomeSources || [];
          const existing = sources.find(
            (inc) => inc.isAdvance && inc.name === "Payslip",
          );

          const scannedIncome: IncomeSource = {
            id: existing?.id || uid(),
            name: "Payslip",
            category: "Salary",
            date: payDate,
            isAdvance: true,
            amount: 0,
            basicSalary: d.basicSalary || 0,
            allowances: d.allowances || 0,
            bonus: d.bonus || 0,
            epfEmployee: d.epfEmployee || 0,
            socso: d.socso || 0,
            eis: d.eis || 0,
            taxPcb: d.taxPcb || 0,
          };

          return {
            ...prev,
            [targetMonth]: {
              ...bucket,
              incomeSources: existing
                ? sources.map((inc) =>
                    inc.id === existing.id ? scannedIncome : inc,
                  )
                : [...sources, scannedIncome],
            },
          };
        });
        setSelectedMonth(targetMonth);
      } else if (json.type === "receipt" && json.data?.transactions) {
        const today = new Date().toISOString().slice(0, 10);
        const scanned: ExpenseItem[] = json.data.transactions.map((t: any) => ({
          id: uid(),
          merchant: t.merchant || "Unknown",
          amount: Number(t.amount) || 0,
          category: EXPENSE_CATEGORIES.includes(t.category)
            ? t.category
            : "Others",
          date: /^\d{4}-\d{2}-\d{2}$/.test(t.date ?? "") ? t.date : today,
        }));
        addScannedExpenses(scanned);

        // Jump to the month of the first scanned item so the user sees the result
        if (scanned.length > 0)
          setSelectedMonth(monthKeyFromDate(scanned[0].date));
      }
    } catch (e: any) {
      errorMessage = e?.message ?? "Something went wrong. Please try again.";
    } finally {
      setScanning(false);
    }

    if (errorMessage) {
      // wait for the scanning overlay to finish closing
      setTimeout(() => setScanError(errorMessage), 300);
    }
  };

  const monthKeyFromDate = (date?: string) =>
    date && date.length >= 7 ? date.slice(0, 7) : selectedMonth;

  const addScannedExpenses = (items: ExpenseItem[]) => {
    setAllData((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const key = monthKeyFromDate(item.date);
        const bucket = next[key] || DEFAULT_MONTH_DATA;
        next[key] = {
          ...bucket,
          expenses: [...(bucket.expenses || []), item],
        };
      });
      return next;
    });
  };

  const saveIncome = (finalized: IncomeSource) => {
    const targetMonth = monthKeyFromDate(finalized.date);
    setAllData((prev) => {
      const next = { ...prev };
      // remove from wherever it currently lives (handles edits that change month)
      Object.keys(next).forEach((mKey) => {
        const bucket = next[mKey];
        if (bucket?.incomeSources?.some((i) => i.id === finalized.id)) {
          next[mKey] = {
            ...bucket,
            incomeSources: bucket.incomeSources.filter(
              (i) => i.id !== finalized.id,
            ),
          };
        }
      });
      const targetBucket = next[targetMonth] || DEFAULT_MONTH_DATA;
      next[targetMonth] = {
        ...targetBucket,
        incomeSources: [...(targetBucket.incomeSources || []), finalized],
      };
      return next;
    });
    setSelectedMonth(targetMonth);
  };

  const deleteIncome = (id: string) => {
    updateCurrentMonthData({
      incomeSources: currentData.incomeSources.filter((i) => i.id !== id),
    });
  };

  const saveExpense = (finalized: ExpenseItem) => {
    const targetMonth = monthKeyFromDate(finalized.date);
    setAllData((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((mKey) => {
        const bucket = next[mKey];
        if (bucket?.expenses?.some((e) => e.id === finalized.id)) {
          next[mKey] = {
            ...bucket,
            expenses: bucket.expenses.filter((e) => e.id !== finalized.id),
          };
        }
      });
      const targetBucket = next[targetMonth] || DEFAULT_MONTH_DATA;
      next[targetMonth] = {
        ...targetBucket,
        expenses: [...(targetBucket.expenses || []), finalized],
      };
      return next;
    });
    setSelectedMonth(targetMonth);
  };

  const deleteExpense = (id: string) => {
    updateCurrentMonthData({
      expenses: currentData.expenses.filter((e) => e.id !== id),
    });
  };

  const activeCommitments = useMemo(
    () =>
      getActiveCommitmentsForMonth(
        masterList,
        selectedMonth,
        currentData.commitmentsPaid,
      ),
    [masterList, selectedMonth, currentData.commitmentsPaid],
  );

  const toggleCommitmentPaid = (masterId: string) => {
    const current = currentData.commitmentsPaid[masterId] ?? false;
    updateCurrentMonthData({
      commitmentsPaid: {
        ...currentData.commitmentsPaid,
        [masterId]: !current,
      },
    });
  };

  const allCommitmentsChecked =
    activeCommitments.length > 0 && activeCommitments.every((c) => c.paid);

  const toggleAllCommitmentsPaid = () => {
    const nextVal = !allCommitmentsChecked;
    const updated: Record<string, boolean> = { ...currentData.commitmentsPaid };
    activeCommitments.forEach((c) => {
      updated[c.masterId] = nextVal;
    });
    updateCurrentMonthData({ commitmentsPaid: updated });
  };

  const saveMasterCommitment = (item: MasterCommitment) => {
    setMasterList((prev) => {
      const exists = prev.some((m) => m.id === item.id);
      return exists
        ? prev.map((m) => (m.id === item.id ? item : m))
        : [...prev, item];
    });
  };

  const deleteMasterCommitment = (id: string) => {
    setMasterList((prev) => prev.filter((m) => m.id !== id));
  };

  const totalNetIncome = currentData.incomeSources.reduce(
    (acc, inc) => acc + getIncomeEffectiveAmount(inc),
    0,
  );
  const totalCommitments = activeCommitments
    .filter((c) => c.paid)
    .reduce((acc, c) => acc + c.amount, 0);
  const totalCasualExpenses = currentData.expenses.reduce(
    (acc, curr) => acc + (curr.amount || 0),
    0,
  );

  const finalDisposableIncome =
    totalNetIncome - totalCommitments - totalCasualExpenses;
  const spentAmount = totalCommitments + totalCasualExpenses;
  const spentPct =
    totalNetIncome > 0
      ? Math.min(100, (spentAmount / totalNetIncome) * 100)
      : 0;

  if (!isLoaded) return null;

  return (
    <FinanceContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        prevMonth,
        nextMonth,
        currentData,
        masterList,
        activeCommitments,
        totalNetIncome,
        totalCommitments,
        totalCasualExpenses,
        finalDisposableIncome,
        spentAmount,
        spentPct,
        scanning,
        handleUpload,
        updateCurrentMonthData,
        saveIncome,
        deleteIncome,
        saveExpense,
        deleteExpense,
        toggleCommitmentPaid,
        toggleAllCommitmentsPaid,
        allCommitmentsChecked,
        saveMasterCommitment,
        deleteMasterCommitment,
        isCurrentMonth,
        goToCurrentMonth,
        scanError,
        clearScanError: () => setScanError(null),
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Month Navigator Header
// ---------------------------------------------------------------------------
function MonthNavigator() {
  const c = useThemeColors();
  const { selectedMonth, setSelectedMonth, prevMonth, nextMonth } =
    useFinance();
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const [y] = selectedMonth.split("-").map(Number);
    return y;
  });

  const formatTitle = (key: string) => {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <View className="flex-row items-center justify-center gap-4 py-3 mb-3">
        <TouchableOpacity
          activeOpacity={1}
          onPress={prevMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={c.mutedForeground} size={26} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            const [y] = selectedMonth.split("-").map(Number);
            setPickerYear(y);
            setIsMonthPickerOpen(true);
          }}
        >
          <Text
            style={{ fontSize: 20 }}
            className="font-semibold text-foreground"
          >
            {formatTitle(selectedMonth)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={1}
          onPress={nextMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight color={c.mutedForeground} size={26} />
        </TouchableOpacity>
      </View>

      <AlertDialog
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        useRNModal={Platform.OS !== "web"}
        size="md"
      >
        <AlertDialogBackdrop style={{ backgroundColor: "rgba(0,0,0,0.8)" }} />
        <AlertDialogContent className="bg-card border border-border rounded-3xl p-6 w-full max-w-xs shadow-2xl">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setPickerYear((y) => y - 1)}
              className="p-2"
            >
              <ChevronLeft color={c.mutedForeground} size={20} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">
              {pickerYear}
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setPickerYear((y) => y + 1)}
              className="p-2"
            >
              <ChevronRight color={c.mutedForeground} size={20} />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap">
            {MONTH_OPTIONS.map((mo) => {
              const isSelected = selectedMonth === `${pickerYear}-${mo.value}`;
              return (
                <View
                  key={mo.value}
                  style={{ width: "33.33%" }}
                  className="p-1"
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      setSelectedMonth(`${pickerYear}-${mo.value}`);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`rounded-xl items-center justify-center py-3 ${
                      isSelected ? "bg-secondary-foreground" : "bg-background"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected
                          ? "text-background font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {mo.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <GButton
            className="mt-5"
            color="secondary"
            onPress={() => setIsMonthPickerOpen(false)}
          >
            Close
          </GButton>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Screen 1: Dashboard
// ---------------------------------------------------------------------------
function DashboardScreen({ navigation }: { navigation: any }) {
  const c = useThemeColors();
  const {
    currentData,
    finalDisposableIncome,
    spentAmount,
    spentPct,
    totalNetIncome,
    totalCommitments,
    totalCasualExpenses,
    isCurrentMonth,
    goToCurrentMonth,
  } = useFinance();

  const [showSpentInfo, setShowSpentInfo] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isCurrentMonth ? null : <TodayButton onPress={goToCurrentMonth} />,
    });
  }, [navigation, isCurrentMonth, goToCurrentMonth]);

  return (
    <View style={{ flex: 1 }} className={`${SCREEN_PADDING_X} bg-background`}>
      <View className="w-full max-w-lg flex-1 self-center">
        {/* 1. Month Navigator */}
        <MonthNavigator />

        {showSpentInfo && (
          <Pressable
            onPress={() => setShowSpentInfo(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 5,
            }}
          />
        )}

        {/* 2. Hero Cards*/}
        <View style={{ zIndex: 10 }} className="mt-2 mb-6">
          <Text className="text-base text-muted-foreground mb-1.5">
            Left to spend this month
          </Text>
          <Text
            style={{ fontSize: 40 }}
            className={`font-extrabold tracking-tight mb-4 ${
              finalDisposableIncome < 0 ? "text-expense" : "text-foreground"
            }`}
          >
            RM {formatMoney(finalDisposableIncome)}
          </Text>
          <View className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, spentPct))}%` }}
            />
          </View>

          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-base font-medium text-primary">
                RM {formatMoney(spentAmount)} spent
              </Text>
              <TouchableOpacity
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setShowSpentInfo((v) => !v)}
              >
                <Info
                  color={showSpentInfo ? c.primary : c.mutedForeground}
                  size={18}
                />
              </TouchableOpacity>
            </View>
            <Text className="text-base text-muted-foreground">
              of RM {formatMoney(totalNetIncome)}
            </Text>
          </View>

          {showSpentInfo && (
            <View
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 8,
                width: 280,
                elevation: 8,
                zIndex: 20,
              }}
              className="bg-card border border-border rounded-2xl p-4 shadow-lg"
            >
              <Text className="text-base font-bold text-foreground mb-1">
                Total spent
              </Text>
              <Text className="text-sm text-muted-foreground mb-3">
                Paid financial commitments plus your expenses this month.
              </Text>
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-muted-foreground">
                  Commitments
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  RM {formatMoney(totalCommitments)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted-foreground">Expenses</Text>
                <Text className="text-sm font-semibold text-foreground">
                  RM {formatMoney(totalCasualExpenses)}
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-border pt-2">
                <Text className="text-sm font-bold text-foreground">Total</Text>
                <Text className="text-sm font-bold text-primary">
                  RM {formatMoney(spentAmount)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="flex-row gap-3 mb-5">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Commitments")}
            className="flex-1 flex-row items-center bg-card rounded-2xl p-3 shadow-md"
          >
            <View className="flex-1 flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-xl bg-commitments/15 items-center justify-center">
                <CalendarCheck color={c.commitments} size={22} />
              </View>
              <Text
                className="flex-1 text-lg font-semibold text-foreground uppercase"
                numberOfLines={3}
              >
                Financial Commitments
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("MonthlyBudget")}
            className="flex-1 flex-row items-center bg-card rounded-2xl p-3 shadow-md"
          >
            <View className="flex-1 flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-xl bg-budget/15 items-center justify-center">
                <Wallet color={c.budget} size={22} />
              </View>
              <Text
                className="flex-1 text-lg font-semibold text-foreground uppercase"
                numberOfLines={3}
              >
                Overview Spending
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. Top Tab Container*/}
        <View className="flex-1 mb-4">
          <TopTab.Navigator
            screenOptions={{
              tabBarStyle: {
                backgroundColor: c.background,
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                height: 54,
              },
              tabBarGap: 24,
              tabBarItemStyle: {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                width: "auto",
                paddingHorizontal: 0,
                marginHorizontal: 0,
                paddingRight: 25,
              },
              tabBarContentContainerStyle: {
                justifyContent: "flex-start",
                // paddingHorizontal: 24,
              },
              tabBarScrollEnabled: true,
              tabBarLabelStyle: {
                fontSize: 17,
                fontWeight: "700",
                textTransform: "none",
              },
              tabBarActiveTintColor: c.foreground,
              tabBarInactiveTintColor: c.mutedForeground,
              tabBarIndicatorStyle: {
                backgroundColor: c.primary,
                height: 3,
                borderRadius: 2,
              },
              tabBarPressColor: "transparent",
              tabBarPressOpacity: 1,
              swipeEnabled: true,
            }}
          >
            {/* Tab 1: Income */}
            <TopTab.Screen
              name="IncomeSourcesTab"
              component={IncomeTab}
              options={{
                tabBarLabel: "Income Sources",
                tabBarBadge: () => (
                  <View
                    style={{ marginTop: 16 }}
                    className="bg-primary px-2 py-0.5 rounded-full"
                  >
                    <Text className="text-sm font-bold text-primary-foreground">
                      {currentData.incomeSources.length}
                    </Text>
                  </View>
                ),
              }}
            />

            {/* Tab 2: Expenses */}
            <TopTab.Screen
              name="ExpensesTab"
              component={ExpensesTab}
              options={{
                tabBarLabel: "Expenses",
                tabBarBadge: () => (
                  <View
                    style={{ marginTop: 16 }}
                    className="bg-primary px-2 py-0.5 rounded-full"
                  >
                    <Text className="text-sm font-bold text-primary-foreground">
                      {currentData.expenses.length}
                    </Text>
                  </View>
                ),
              }}
            />
          </TopTab.Navigator>
        </View>
      </View>

      {/* Floating Action Button */}
      <FabHost />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen 2: Commitments Screen
// ---------------------------------------------------------------------------
function CommitmentsScreen({ navigation }: { navigation: any }) {
  const c = useThemeColors();
  const {
    activeCommitments,
    toggleCommitmentPaid,
    toggleAllCommitmentsPaid,
    allCommitmentsChecked,
    selectedMonth,
    totalCommitments,
    isCurrentMonth,
    goToCurrentMonth,
  } = useFinance();

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  // Defaults to today's date when viewing the current month
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return todayKey === selectedMonth ? now.getDate() : null;
  });

  const commitmentsByDay = useMemo(() => {
    const map: Record<number, ActiveCommitment[]> = {};
    activeCommitments.forEach((c) => {
      if (!map[c.dueDay]) map[c.dueDay] = [];
      map[c.dueDay].push(c);
    });
    return map;
  }, [activeCommitments]);

  const [year, month] = selectedMonth.split("-").map(Number);
  const firstDayWeekday = new Date(year, month - 1, 1).getDay();
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  const calendarCells: (number | null)[] = useMemo(() => {
    const cells: (number | null)[] = [
      ...Array(firstDayWeekday).fill(null),
      ...Array.from({ length: totalDaysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstDayWeekday, totalDaysInMonth]);

  const selectedDayItems = selectedDay
    ? commitmentsByDay[selectedDay] || []
    : [];

  const paidCount = activeCommitments.filter((c) => c.paid).length;
  const totalCount = activeCommitments.length;

  const todayDate = new Date().getDate();
  const goToToday = () => {
    goToCurrentMonth();
    setSelectedDay(todayDate); // calendar view lands on today's date
  };

  const showToday =
    !isCurrentMonth || (viewMode === "calendar" && selectedDay !== todayDate);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        showToday ? <TodayButton onPress={goToToday} /> : null,
    });
  }, [navigation, showToday, goToCurrentMonth, todayDate]);

  const controls = (
    <>
      <MonthNavigator />

      <View className="flex-row items-center justify-between mb-4">
        <GButton
          size="md"
          color="primary"
          onPress={() => navigation.navigate("ManageCommitments")}
          className="mr-5 gap-1"
          iconLeft={
            <ListChecks color={c.foreground} size={20} strokeWidth={3} />
          }
        >
          Manage Commitments
        </GButton>

        <View className="flex-row bg-secondary rounded-xl p-1">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 ${
              viewMode === "list" ? "bg-foreground" : ""
            }`}
          >
            <ListIcon
              color={viewMode === "list" ? c.background : c.mutedForeground}
              size={18}
            />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 ${
              viewMode === "calendar" ? "bg-foreground" : ""
            }`}
          >
            <CalendarIcon
              color={viewMode === "calendar" ? c.background : c.mutedForeground}
              size={18}
            />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // Commitment row shared by calendar-day list and list view
  const renderRow = (item: ActiveCommitment, amountClass: string) => (
    <TouchableOpacity
      activeOpacity={0.6}
      key={item.id}
      onPress={() => toggleCommitmentPaid(item.masterId)}
    >
      <GCard className="flex-row items-center gap-3 bg-background border border-border rounded-xl p-3.5 mb-3">
        {item.paid ? (
          <CheckCircle2 color={c.primary} size={20} />
        ) : (
          <Circle color={c.mutedForeground} size={20} />
        )}
        <View className="flex-1">
          <Text
            className={`text-lg font-semibold ${
              item.paid
                ? "text-foreground"
                : "text-muted-foreground line-through"
            }`}
          >
            {item.name}
          </Text>
          {!!item.category && (
            <View className="mt-2">
              <GBadge label={item.category} />
            </View>
          )}
        </View>
        <Text
          className={`${amountClass} font-bold ${
            item.paid ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          RM {formatMoney(item.amount)}
        </Text>
      </GCard>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }} className="bg-background">
      {viewMode === "calendar" ? (
        // CALENDAR: fixed top section, only the due-day list scrolls
        <View style={{ flex: 1 }} className="px-6 items-center">
          <View className="w-full max-w-lg flex-1">
            {controls}

            <View className="flex-row mt-3 mb-1 pb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((w, idx) => (
                <View
                  key={idx}
                  style={{ width: `${100 / 7}%` }}
                  className="items-center"
                >
                  <Text className="text-xs font-bold text-muted-foreground">
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {calendarCells.map((day, idx) => {
                const hasCommitments = day && commitmentsByDay[day]?.length > 0;
                const isSelected = day !== null && day === selectedDay;

                return (
                  <View
                    key={idx}
                    style={{ width: `${100 / 7}%` }}
                    className="p-1"
                  >
                    <TouchableOpacity
                      activeOpacity={0.6}
                      disabled={!day}
                      onPress={() => day && setSelectedDay(day)}
                      className={`h-12 rounded-xl items-center justify-center ${
                        isSelected
                          ? "bg-secondary-foreground border-1 border-secondary-foreground"
                          : day
                            ? "bg-card border border-border dark:bg-border"
                            : "bg-calendar"
                      }`}
                    >
                      {day && (
                        <>
                          <Text
                            className={`text-sm font-bold ${
                              isSelected ? "text-background" : "text-foreground"
                            }`}
                          >
                            {day}
                          </Text>
                          {hasCommitments && (
                            <View className="w-1.5 h-1.5 rounded-full mt-0.5 bg-primary" />
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {selectedDay && (
              <View className="flex-1 mt-4">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  {formatDueDateLabel(selectedMonth, selectedDay)}
                </Text>

                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 120 }}
                  showsVerticalScrollIndicator={false}
                >
                  {selectedDayItems.length === 0 ? (
                    <Text className="text-base text-muted-foreground py-2">
                      No commitments due on this day
                    </Text>
                  ) : (
                    selectedDayItems.map((item) => renderRow(item, "text-lg"))
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      ) : (
        // LIST: controls stay fixed, only the grouped list scrolls
        <View style={{ flex: 1 }} className="px-6 items-center">
          <View className="w-full max-w-lg flex-1">
            {controls}

            {activeCommitments.length > 0 && (
              <View className="flex-row items-center justify-end my-2">
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={toggleAllCommitmentsPaid}
                >
                  <Text className="text-base font-bold text-primary">
                    {allCommitmentsChecked ? "Uncheck all" : "Check all"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeCommitments.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-sm font-medium text-muted-foreground">
                  No commitments due this month
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
              >
                {Object.keys(commitmentsByDay)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((day) => (
                    <View key={day} className="mt-1 mb-3">
                      <Text className="text-base font-medium text-muted-foreground mb-2">
                        {formatDueDateLabel(selectedMonth, day)}
                      </Text>
                      {commitmentsByDay[day].map((item) =>
                        renderRow(item, "text-xl"),
                      )}
                    </View>
                  ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/95 px-6 pt-4 pb-8 flex-row justify-between items-center shadow-sm">
        <View className="flex-col">
          <Text className="text-lg font-semibold text-foreground">
            Total commitments
          </Text>
          <Text className="text-sm text-muted-foreground mt-0.5">
            {paidCount} commitments checked
          </Text>
        </View>
        <Text className="text-2xl font-bold text-commitments">
          RM {formatMoney(totalCommitments)}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen 3 : Overview Spending Screen
// ---------------------------------------------------------------------------
function MonthlyBudgetScreen() {
  const c = useThemeColors();
  const {
    currentData,
    selectedMonth,
    totalCommitments,
    totalNetIncome,
    spentAmount,
  } = useFinance();

  const breakdown = useMemo(() => {
    const byCategory: Record<string, number> = {};
    currentData.expenses.forEach((e) => {
      const cat = e.category || "Others";
      byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
    });

    const rows = Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
      color: getCategorySolidColor(category, c),
    }));

    if (totalCommitments > 0) {
      rows.push({
        category: "Commitments",
        amount: totalCommitments,
        color: c.commitments,
      });
    }

    return rows.filter((r) => r.amount > 0).sort((a, b) => b.amount - a.amount);
  }, [currentData.expenses, totalCommitments, c]);

  const hasIncome = totalNetIncome > 0;
  const incomePct = hasIncome ? (spentAmount / totalNetIncome) * 100 : 0;
  const isOverIncome = hasIncome && spentAmount > totalNetIncome;
  // Ring represents income; if overspent, it represents total spending
  const ringTotal = hasIncome
    ? Math.max(totalNetIncome, spentAmount)
    : spentAmount;

  return (
    <View style={{ flex: 1 }} className="bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 40,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg">
          {/* Overall */}
          <GCard className="p-5 mb-5 items-center">
            <Text className="text-lg font-semibold text-budget mb-4">
              {formatMonth(selectedMonth)}
            </Text>

            <DonutChart segments={breakdown} total={ringTotal}>
              {hasIncome ? (
                <>
                  <Text
                    style={{ fontSize: 40 }}
                    className={`font-extrabold ${
                      isOverIncome ? "text-expense" : "text-foreground"
                    }`}
                  >
                    {Math.round(incomePct)}%
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    of income spent
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-xl font-extrabold text-foreground">
                    RM {formatMoney(spentAmount)}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    No income yet
                  </Text>
                </>
              )}
            </DonutChart>

            {hasIncome && (
              <Text className="text-base text-muted-foreground text-center mt-4">
                RM {formatMoney(spentAmount)} of RM{" "}
                {formatMoney(totalNetIncome)}
              </Text>
            )}

            {isOverIncome && (
              <Text className="text-base font-semibold text-expense text-center mt-3">
                ⚠️ You've spent RM {formatMoney(spentAmount - totalNetIncome)}{" "}
                more than your income
              </Text>
            )}
          </GCard>

          {/* Breakdown */}
          {breakdown.length === 0 ? (
            <GCard>
              <View className="py-10 items-center">
                <Text className="text-sm text-muted-foreground text-center">
                  No spending recorded this month
                </Text>
              </View>
            </GCard>
          ) : (
            <>
              <Text className="text-base font-semibold text-muted-foreground mb-3">
                Spending breakdown
              </Text>
              {breakdown.map((row) => {
                const share =
                  spentAmount > 0 ? (row.amount / spentAmount) * 100 : 0;
                return (
                  <View
                    key={row.category}
                    className="rounded-2xl p-4 mb-3 border bg-card border-border"
                  >
                    <View className="flex-row items-center justify-between mb-2.5">
                      <View className="flex-row items-center gap-2.5">
                        <View
                          style={{ backgroundColor: row.color }}
                          className="w-3 h-3 rounded-full"
                        />
                        <Text className="text-lg font-semibold text-foreground">
                          {row.category}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-lg font-bold text-foreground">
                          {formatPct(share)}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          RM {formatMoney(row.amount)}
                        </Text>
                      </View>
                    </View>
                    <View className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <View
                        style={{
                          width: `${Math.min(100, Math.max(0, share))}%`,
                          backgroundColor: row.color,
                        }}
                        className="h-full rounded-full"
                      />
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen 4: Manage Commitments Screen
// ---------------------------------------------------------------------------
function ManageCommitmentsScreen({ navigation }: { navigation: any }) {
  const c = useThemeColors();
  const { masterList, deleteMasterCommitment } = useFinance();
  const todayISO = new Date().toISOString().slice(0, 10);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionSheetCommitment, setActionSheetCommitment] =
    useState<MasterCommitment | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <GButton
          size="md"
          color="primary"
          onPress={() =>
            navigation.navigate("CommitmentForm", { commitment: null })
          }
          iconLeft={<Plus color={c.foreground} size={20} strokeWidth={3} />}
          className="mr-5 gap-1 sha"
        ></GButton>
      ),
    });
  }, [navigation, c]);

  return (
    <View
      style={{ flex: 1 }}
      className={`${SCREEN_PADDING_X} py-4 bg-background`}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-lg">
          {masterList.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="text-sm text-muted-foreground">
                No master commitments defined. Tap Add new to create one.
              </Text>
            </View>
          ) : (
            masterList.map((m) => {
              const isOngoing = !m.endDate || m.endDate >= todayISO;
              return (
                <GCard key={m.id} className="mb-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-2">
                      <Text className="text-lg font-bold text-foreground">
                        {m.name}
                      </Text>
                      <Text className="text-2xl font-bold text-commitments mt-1">
                        RM {formatMoney(m.defaultAmount || 0)}
                      </Text>
                      <Text className="text-base text-muted-foreground mt-2">
                        {formatDateReadable(m.startDate)} –{" "}
                        {m.endDate ? formatDateReadable(m.endDate) : "Never"}
                      </Text>
                      <View className="flex-row gap-2 mt-2">
                        {!!m.category && <GBadge label={m.category} />}
                        <GBadge
                          label={isOngoing ? "Ongoing" : "Ended"}
                          variant={isOngoing ? "success" : "danger"}
                        />
                      </View>
                    </View>
                    <MoreActionsButton
                      onPress={() => setActionSheetCommitment(m)}
                    />
                  </View>
                </GCard>
              );
            })
          )}
        </View>
      </ScrollView>

      <ItemActionsSheet
        isOpen={!!actionSheetCommitment}
        onClose={() => setActionSheetCommitment(null)}
        onEdit={() => {
          if (actionSheetCommitment) {
            navigation.navigate("CommitmentForm", {
              commitment: actionSheetCommitment,
            });
          }
        }}
        onDelete={() => {
          if (actionSheetCommitment)
            setDeleteTargetId(actionSheetCommitment.id);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteMasterCommitment(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Commitment Template"
        message="Are you sure you want to delete this recurring commitment? It will no longer recur in any month."
      />
    </View>
  );
}

function FormScroll({ children }: { children: ReactNode }) {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Screen 5: Entry Form Screen
// ---------------------------------------------------------------------------
function EntryTypeToggle({
  value,
  onChange,
}: {
  value: EntryFormType;
  onChange: (t: EntryFormType) => void;
}) {
  return (
    <View className="flex-row bg-background border border-border rounded-full p-1 mb-4">
      {(["income", "expense"] as EntryFormType[]).map((t) => {
        const active = value === t;
        return (
          <TouchableOpacity
            key={t}
            activeOpacity={1}
            onPress={() => onChange(t)}
            className={`flex-1 py-2.5 rounded-full items-center ${
              active ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                active ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "income" ? "Income" : "Expense"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function IncomeFormScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const c = useThemeColors();
  const { saveIncome, saveExpense } = useFinance();

  const paramIncome: IncomeSource | undefined = route.params?.income;
  const paramExpense: ExpenseItem | undefined = route.params?.expense;
  const isEditing = !!paramIncome || !!paramExpense;

  const [entryType, setEntryType] = useState<EntryFormType>(
    paramExpense ? "expense" : "income",
  );

  const [incomeForm, setIncomeForm] = useState<IncomeSource>({
    ...(paramIncome || BLANK_INCOME),
    date:
      (paramIncome || BLANK_INCOME).date ||
      new Date().toISOString().slice(0, 10),
  });

  const [expenseForm, setExpenseForm] = useState<ExpenseItem>({
    ...(paramExpense || BLANK_EXPENSE),
    date:
      (paramExpense || BLANK_EXPENSE).date ||
      new Date().toISOString().slice(0, 10),
  });

  const [isDateWheelOpen, setIsDateWheelOpen] = useState(false);

  const handleSave = () => {
    if (entryType === "income") {
      if (!incomeForm.name.trim()) return;
      saveIncome({
        ...incomeForm,
        id: incomeForm.id || uid(),
        amount: incomeForm.isAdvance ? 0 : incomeForm.amount,
      });
    } else {
      if (!expenseForm.merchant.trim()) return;
      saveExpense({
        ...expenseForm,
        id: expenseForm.id || uid(),
      });
    }
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing
        ? entryType === "income"
          ? "Edit Income"
          : "Edit Expense"
        : "Add Entry",
      headerRight: () => (
        <GButton
          size="md"
          color="primary"
          onPress={handleSave}
          className="mr-5"
        >
          Save
        </GButton>
      ),
    });
  }, [navigation, incomeForm, expenseForm, entryType, isEditing, c]);

  return (
    <View
      style={{ flex: 1 }}
      className={`${SCREEN_PADDING_X} py-4 bg-background`}
    >
      <FormScroll>
        <View className="w-full max-w-lg">
          <GCard>
            {!isEditing && (
              <EntryTypeToggle value={entryType} onChange={setEntryType} />
            )}

            {entryType === "income" ? (
              <>
                <Text className="text-sm font-semibold text-muted-foreground mb-1">
                  Source Name
                </Text>
                <TextInput
                  value={incomeForm.name}
                  onChangeText={(t) =>
                    setIncomeForm({ ...incomeForm, name: t })
                  }
                  placeholder="e.g. Monthly Salary, Freelance"
                  placeholderTextColor={c.mutedForeground}
                  style={{ color: c.foreground }}
                  className="bg-background border border-border text-base p-3.5 rounded-xl mb-3.5"
                />

                <Text className="text-sm font-semibold text-muted-foreground mb-1">
                  Date
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setIsDateWheelOpen(true)}
                  className="flex-row items-center justify-between bg-background border border-border p-3.5 rounded-xl mb-3.5 active:border-primary"
                >
                  <Text className="text-base font-medium text-foreground">
                    {formatDateReadable(incomeForm.date)}
                  </Text>
                  <CalendarDays color={c.primary} size={18} />
                </TouchableOpacity>

                <Text className="text-sm font-semibold text-muted-foreground mb-2">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3.5">
                  {INCOME_CATEGORIES.map((cat) => {
                    const active = incomeForm.category === cat;
                    const catC = getCategoryClasses(cat);
                    return (
                      <TouchableOpacity
                        activeOpacity={1}
                        key={cat}
                        onPress={() =>
                          setIncomeForm({
                            ...incomeForm,
                            category: cat,
                            isAdvance:
                              cat === "Salary" ? incomeForm.isAdvance : false,
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl border ${catC.border} ${
                          active ? catC.bg : "bg-background"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            active ? catC.text : "text-muted-foreground"
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text className="text-sm font-semibold text-muted-foreground mb-1">
                  Net Amount (RM)
                </Text>
                <TextInput
                  value={
                    incomeForm.isAdvance
                      ? formatMoney(getIncomeEffectiveAmount(incomeForm))
                      : incomeForm.amount.toString()
                  }
                  editable={!incomeForm.isAdvance}
                  onChangeText={(t) =>
                    setIncomeForm({ ...incomeForm, amount: parseFloat(t) || 0 })
                  }
                  keyboardType="numeric"
                  style={{
                    color: incomeForm.isAdvance
                      ? c.mutedForeground
                      : c.foreground,
                  }}
                  className="bg-background border border-border text-base p-3.5 rounded-xl mb-3.5"
                />

                {incomeForm.category === "Salary" && (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() =>
                      setIncomeForm({
                        ...incomeForm,
                        isAdvance: !incomeForm.isAdvance,
                      })
                    }
                    className="flex-row items-center gap-2.5 py-2 mb-3"
                  >
                    {incomeForm.isAdvance ? (
                      <CheckCircle2 color={c.primary} size={20} />
                    ) : (
                      <Circle color={c.mutedForeground} size={20} />
                    )}
                    <Text className="text-sm font-semibold text-foreground">
                      Itemized payslip breakdown (EPF / SOCSO / EIS / PCB)
                    </Text>
                  </TouchableOpacity>
                )}

                {incomeForm.isAdvance && (
                  <View className="gap-2.5 pt-3 border-t border-border">
                    {(
                      [
                        ["Basic Income", "basicSalary"],
                        ["Allowances", "allowances"],
                        ["Bonus", "bonus"],
                        ["EPF Employee", "epfEmployee"],
                        ["SOCSO", "socso"],
                        ["EIS", "eis"],
                        ["Tax PCB", "taxPcb"],
                      ] as const
                    ).map(([label, field]) => (
                      <View key={field}>
                        <Text className="text-sm font-medium text-muted-foreground mb-1">
                          {label} (RM)
                        </Text>
                        <TextInput
                          value={(incomeForm[field] || 0).toString()}
                          onChangeText={(t) =>
                            setIncomeForm({
                              ...incomeForm,
                              [field]: parseFloat(t) || 0,
                            })
                          }
                          keyboardType="numeric"
                          style={{ color: c.foreground }}
                          className="bg-background border border-border text-sm p-3 rounded-lg"
                        />
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <>
                <Text className="text-sm font-semibold text-muted-foreground mb-1">
                  Source Name
                </Text>
                <TextInput
                  value={expenseForm.merchant}
                  onChangeText={(t) =>
                    setExpenseForm({ ...expenseForm, merchant: t })
                  }
                  placeholder="e.g. Grocery, Grab, Netflix"
                  placeholderTextColor={c.mutedForeground}
                  style={{ color: c.foreground }}
                  className="bg-background border border-border text-base p-3.5 rounded-xl mb-3.5"
                />

                <Text className="text-sm font-semibold text-muted-foreground mb-1">
                  Date
                </Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setIsDateWheelOpen(true)}
                  className="flex-row items-center justify-between bg-background border border-border p-3.5 rounded-xl mb-3.5 active:border-primary"
                >
                  <Text className="text-base font-medium text-foreground">
                    {formatDateReadable(expenseForm.date)}
                  </Text>
                  <CalendarDays color={c.primary} size={18} />
                </TouchableOpacity>

                <Text className="text-sm font-semibold text-muted-foreground mb-2">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-3.5">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const active = expenseForm.category === cat;
                    const catC = getCategoryClasses(cat);
                    return (
                      <TouchableOpacity
                        activeOpacity={1}
                        key={cat}
                        onPress={() =>
                          setExpenseForm({ ...expenseForm, category: cat })
                        }
                        className={`px-3.5 py-2 rounded-xl border ${catC.border} ${
                          active ? catC.bg : "bg-background"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${
                            active ? catC.text : "text-muted-foreground"
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text className="text-sm font-semibold text-muted-foreground mb-1">
                  Amount (RM)
                </Text>
                <TextInput
                  value={expenseForm.amount.toString()}
                  onChangeText={(t) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: parseFloat(t) || 0,
                    })
                  }
                  keyboardType="numeric"
                  style={{ color: c.foreground }}
                  className="bg-background border border-border text-base p-3.5 rounded-xl"
                />
              </>
            )}
          </GCard>
        </View>
      </FormScroll>

      <WheelDatePickerModal
        isOpen={isDateWheelOpen}
        onClose={() => setIsDateWheelOpen(false)}
        value={
          entryType === "income"
            ? incomeForm.date || new Date().toISOString().slice(0, 10)
            : expenseForm.date || new Date().toISOString().slice(0, 10)
        }
        onConfirm={(d) =>
          entryType === "income"
            ? setIncomeForm({ ...incomeForm, date: d })
            : setExpenseForm({ ...expenseForm, date: d })
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen 6: Commitment Form Screen
// ---------------------------------------------------------------------------
function CommitmentFormScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const c = useThemeColors();
  const { saveMasterCommitment, selectedMonth } = useFinance();
  const existing: MasterCommitment | null = route.params?.commitment || null;

  const [name, setName] = useState(existing?.name || "");
  const [category, setCategory] = useState(existing?.category || "Loan");
  const [amount, setAmount] = useState(
    existing?.defaultAmount?.toString() || "",
  );
  const [startDate, setStartDate] = useState(
    existing?.startDate || `${selectedMonth}-01`,
  );
  const [endDate, setEndDate] = useState(existing?.endDate || "");

  const [isStartDateWheelOpen, setIsStartDateWheelOpen] = useState(false);
  const [isEndDateWheelOpen, setIsEndDateWheelOpen] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    saveMasterCommitment({
      id: existing?.id || uid(),
      name,
      category,
      defaultAmount: parseFloat(amount) || 0,
      startDate,
      endDate: endDate || undefined,
    });
    navigation.goBack();
  };

  const handleOpenStartPicker = () => {
    Keyboard.dismiss();
    setIsStartDateWheelOpen(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: existing ? "Edit Commitment" : "New Commitment",
      headerRight: () => (
        <GButton
          size="md"
          color="primary"
          onPress={handleSave}
          className="mr-5"
        >
          Save
        </GButton>
      ),
    });
  }, [navigation, name, category, amount, startDate, endDate, c]);

  return (
    <View
      style={{ flex: 1 }}
      className={`${SCREEN_PADDING_X} py-4 bg-background`}
    >
      <FormScroll>
        <View className="w-full max-w-lg">
          <GCard>
            <Text className="text-sm font-semibold text-muted-foreground mb-1">
              Commitment Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Car Loan, PTPTN"
              placeholderTextColor={c.mutedForeground}
              style={{ color: c.foreground }}
              className="bg-background border border-border text-base p-3.5 rounded-xl mb-3.5"
            />

            <Text className="text-sm font-semibold text-muted-foreground mb-2">
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-3.5">
              {COMMITMENT_CATEGORIES.map((cat) => {
                const active = category === cat;
                const c = getCategoryClasses(cat);
                return (
                  <TouchableOpacity
                    activeOpacity={1}
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl border ${c.border} ${
                      active ? c.bg : "bg-background"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        active ? c.text : "text-muted-foreground"
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-sm font-semibold text-muted-foreground mb-1">
              Amount (RM)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={c.mutedForeground}
              style={{ color: c.foreground }}
              className="bg-background border border-border text-base p-3.5 rounded-xl mb-3.5"
            />

            <Text className="text-sm font-semibold text-muted-foreground mb-1">
              Start Date
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsStartDateWheelOpen(true)}
              className="flex-row items-center justify-between bg-background border border-border p-3.5 rounded-xl mb-3.5 active:border-primary"
            >
              <Text className="text-base font-medium text-foreground">
                {formatDateReadable(startDate)}
              </Text>
              <CalendarDays color={c.primary} size={18} />
            </TouchableOpacity>

            <Text className="text-sm font-semibold text-muted-foreground mb-1">
              End Date (Optional)
            </Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsEndDateWheelOpen(true)}
              className="flex-row items-center justify-between bg-background border border-border p-3.5 rounded-xl mb-3.5 active:border-primary"
            >
              <Text className="text-base font-medium text-foreground">
                {endDate ? formatDateReadable(endDate) : "Never (Ongoing)"}
              </Text>
              <CalendarDays color={c.primary} size={18} />
            </TouchableOpacity>
          </GCard>
        </View>
      </FormScroll>

      <WheelDatePickerModal
        isOpen={isStartDateWheelOpen}
        onClose={() => setIsStartDateWheelOpen(false)}
        value={startDate}
        onConfirm={setStartDate}
      />

      <WheelDatePickerModal
        isOpen={isEndDateWheelOpen}
        onClose={() => setIsEndDateWheelOpen(false)}
        value={endDate}
        onConfirm={setEndDate}
        allowClear
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Drawer Menu Header Component
// ---------------------------------------------------------------------------
function StaticDrawerMenuButton({ navigation }: { navigation: any }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => navigation.toggleDrawer()}
      className="p-2 ml-2"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Menu color={c.foreground} size={22} />
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props: any) {
  const colorScheme = useColorScheme();
  const toggleColorScheme = () => {
    Appearance.setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };
  const c = useThemeColors();
  return (
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: c.background }}
    >
      <View className="flex-row items-center justify-between px-4 py-6 border-b border-border mb-2">
        <View className="flex-row items-center gap-2.5">
          <Landmark color={c.foreground} size={24} />
          <Text className="text-lg font-bold text-foreground">Finances</Text>
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => toggleColorScheme()}
          className="w-9 h-9 rounded-full bg-card items-center justify-center border border-border"
        >
          {colorScheme === "light" ? (
            <Moon color={c.foreground} size={17} />
          ) : (
            <Sun color={c.foreground} size={17} />
          )}
        </TouchableOpacity>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

// ---------------------------------------------------------------------------
// Drawer Navigator
// ---------------------------------------------------------------------------
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function DrawerNavigator() {
  const c = useThemeColors();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerType: isDesktop ? "permanent" : "slide",
        headerStyle: {
          backgroundColor: c.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleContainerStyle: { paddingLeft: 12 },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        headerTintColor: c.foreground,
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
        sceneContainerStyle: { backgroundColor: c.background },
        drawerStyle: {
          backgroundColor: c.background,
          width: 240,
          borderRightColor: c.border,
        },

        swipeEnabled: false,
        drawerActiveBackgroundColor: c.secondary,
        drawerActiveTintColor: c.foreground,
        drawerInactiveTintColor: c.mutedForeground,
        headerLeft: isDesktop
          ? () => null
          : () => <StaticDrawerMenuButton navigation={navigation} />,
      })}
    >
      <Drawer.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          drawerIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="ManageCommitmentsDrawer"
        component={ManageCommitmentsScreen}
        options={{
          title: "Manage Commitments",
          drawerLabel: "Manage Commitments",
          drawerIcon: ({ color, size }) => (
            <ListChecks color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const TopTab = createMaterialTopTabNavigator();

// ---------------------------------------------------------------------------
// Material Top Tab 1: Income Sources
// ---------------------------------------------------------------------------
function IncomeTab({ navigation }: { navigation: any }) {
  const c = useThemeColors();
  const { currentData, deleteIncome } = useFinance();
  const [expandedIncomes, setExpandedIncomes] = useState<string[]>([]);
  const [actionSheetIncome, setActionSheetIncome] =
    useState<IncomeSource | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (currentData.incomeSources.length === 0) {
    return (
      <View className="flex-1 bg-background py-10 items-center justify-center">
        <Text className="text-sm font-medium text-muted-foreground">
          No income sources recorded this month
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <Accordion
        type="multiple"
        value={expandedIncomes}
        onValueChange={setExpandedIncomes}
        className="w-full"
      >
        {currentData.incomeSources.map((income, index) => {
          const amt = getIncomeEffectiveAmount(income);
          const isLast = index === currentData.incomeSources.length - 1;
          const isExpanded = expandedIncomes.includes(income.id);

          return (
            <AccordionItem
              value={income.id}
              key={income.id}
              className={`bg-transparent rounded-none ${
                !isLast ? "border-b border-border/60" : "border-b-0"
              }`}
            >
              <AccordionHeader className="p-0 m-0">
                <AccordionTrigger className="w-full">
                  <View className="pl-4 py-4.25 pr-0 flex-row items-center justify-between w-full">
                    <View className="flex-1 pr-3">
                      <Text className="text-lg font-semibold text-foreground">
                        {income.name}
                      </Text>
                      <View className="mt-1.5">
                        <GBadge label={income.category} />
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      <View className="items-end">
                        <Text className="text-lg font-bold text-income">
                          +RM {formatMoney(amt)}
                        </Text>
                        {!!income.date && (
                          <Text className="text-sm text-muted-foreground mt-0.5">
                            {formatShortDate(income.date)}
                          </Text>
                        )}
                      </View>
                      {income.isAdvance ? (
                        <View
                          style={{
                            transform: [
                              { rotate: isExpanded ? "180deg" : "0deg" },
                            ],
                          }}
                          className="p-3.5 items-center justify-center"
                        >
                          <ChevronDown color={c.mutedForeground} size={16} />
                        </View>
                      ) : (
                        <MoreActionsButton
                          onPress={() => setActionSheetIncome(income)}
                        />
                      )}
                    </View>
                  </View>
                </AccordionTrigger>
              </AccordionHeader>

              {income.isAdvance && (
                <AccordionContent className="px-5 pb-4 pt-2 bg-background/40">
                  <View className="gap-2 pt-1">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">
                        Basic Salary
                      </Text>
                      <Text className="text-sm font-medium text-foreground">
                        RM {formatMoney(income.basicSalary || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">
                        Allowances
                      </Text>
                      <Text className="text-sm font-medium text-foreground">
                        RM {formatMoney(income.allowances || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">
                        Bonus
                      </Text>
                      <Text className="text-sm font-medium text-foreground">
                        RM {formatMoney(income.bonus || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">
                        EPF Employee
                      </Text>
                      <Text className="text-sm font-medium text-expense">
                        - RM {formatMoney(income.epfEmployee || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">
                        SOCSO
                      </Text>
                      <Text className="text-sm font-medium text-expense">
                        - RM {formatMoney(income.socso || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">EIS</Text>
                      <Text className="text-sm font-medium text-expense">
                        - RM {formatMoney(income.eis || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">
                        Tax PCB
                      </Text>
                      <Text className="text-sm font-medium text-expense">
                        - RM {formatMoney(income.taxPcb || 0)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between border-t border-border pt-2 mt-1">
                      <Text className="text-sm font-bold text-foreground">
                        Net Take-Home
                      </Text>
                      <Text className="text-sm font-bold text-income">
                        RM {formatMoney(amt)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => setActionSheetIncome(income)}
                      className="mt-3 py-3 rounded-xl bg-card dark:bg-secondary active:bg-card/90 border border-border items-center flex-row justify-center gap-2"
                    >
                      {/* <MoreVertical color={c.mutedForeground} size={18} /> */}
                      <Text className="text-sm font-semibold text-muted-foreground">
                        More Actions
                      </Text>
                    </TouchableOpacity>
                  </View>
                </AccordionContent>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>

      <ItemActionsSheet
        isOpen={!!actionSheetIncome}
        onClose={() => setActionSheetIncome(null)}
        onEdit={() => {
          if (actionSheetIncome) {
            navigation.navigate("IncomeForm", { income: actionSheetIncome });
          }
        }}
        onDelete={() => {
          if (actionSheetIncome) setDeleteTargetId(actionSheetIncome.id);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteIncome(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Income Source"
        message="Are you sure you want to delete this income entry?"
      />
    </ScrollView>
  );
}
// ---------------------------------------------------------------------------
// Material Top Tab 2: Expenses
// ---------------------------------------------------------------------------
function ExpensesTab({ navigation }: { navigation: any }) {
  const c = useThemeColors();
  const { currentData, deleteExpense } = useFinance();
  const [actionSheetExpense, setActionSheetExpense] =
    useState<ExpenseItem | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (currentData.expenses.length === 0) {
    return (
      <View className="flex-1 bg-background py-10 items-center justify-center">
        <Text className="text-sm font-medium text-muted-foreground">
          No expenses recorded this month
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {currentData.expenses.map((item, idx) => {
        const isLast = idx === currentData.expenses.length - 1;
        return (
          <View
            key={item.id}
            className={`pl-4 py-4.25 pr-0 flex-row items-center justify-between ${
              !isLast ? "border-b border-border/60" : ""
            }`}
          >
            <View className="flex-1 pr-3">
              <Text className="text-lg font-semibold text-foreground">
                {item.merchant}
              </Text>
              <View className="mt-1.5">
                <GBadge label={item.category || "Others"} />
              </View>
            </View>
            <View className="items-end mr-1">
              <Text className="text-lg font-semibold text-expense">
                -RM {formatMoney(item.amount || 0)}
              </Text>
              {!!item.date && (
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {formatShortDate(item.date)}
                </Text>
              )}
            </View>
            <MoreActionsButton onPress={() => setActionSheetExpense(item)} />
          </View>
        );
      })}

      <ItemActionsSheet
        isOpen={!!actionSheetExpense}
        onClose={() => setActionSheetExpense(null)}
        onEdit={() => {
          if (actionSheetExpense) {
            navigation.navigate("IncomeForm", { expense: actionSheetExpense });
          }
        }}
        onDelete={() => {
          if (actionSheetExpense) setDeleteTargetId(actionSheetExpense.id);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            deleteExpense(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Expense"
        message="Are you sure you want to delete this expense entry?"
      />
    </ScrollView>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const c = useThemeColors();
  return (
    <GluestackUIProvider mode={colorScheme === "light" ? "light" : "dark"}>
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <SafeAreaProvider style={{ backgroundColor: c.background }}>
          <FinanceProvider>
            <NavigationContainer
              theme={
                colorScheme === "light"
                  ? CustomLightNavTheme
                  : CustomDarkNavTheme
              }
            >
              <Stack.Navigator
                screenOptions={{
                  headerStyle: {
                    backgroundColor: c.background,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 0,
                  },
                  headerTitleAlign: "left",
                  headerTintColor: c.foreground,
                  headerTitleStyle: { fontWeight: "700", fontSize: 18 },
                  headerShadowVisible: false,
                  cardStyle: { backgroundColor: c.background },
                  cardStyleInterpolator:
                    CardStyleInterpolators.forHorizontalIOS,
                  gestureEnabled: true,
                  detachPreviousScreen: false,
                }}
              >
                <Stack.Screen
                  name="MainDrawer"
                  component={DrawerNavigator}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Commitments"
                  component={CommitmentsScreen}
                  options={{ title: "Recurring Commitments" }}
                />
                <Stack.Screen
                  name="MonthlyBudget"
                  component={MonthlyBudgetScreen}
                  options={{ title: "Overview Spending" }}
                />
                <Stack.Screen
                  name="ManageCommitments"
                  component={ManageCommitmentsScreen}
                  options={{ title: "Manage Commitments" }}
                />
                <Stack.Screen
                  name="IncomeForm"
                  component={IncomeFormScreen}
                  options={{ title: "Entry Form" }}
                />
                <Stack.Screen
                  name="CommitmentForm"
                  component={CommitmentFormScreen}
                  options={{ title: "Commitment Template" }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </FinanceProvider>
        </SafeAreaProvider>
      </View>
    </GluestackUIProvider>
  );
}
