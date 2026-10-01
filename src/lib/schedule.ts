// Shared (client + server) helpers for repayment schedules.
// Dates here are calendar dates with no time-of-day: they are passed around as
// "YYYY-MM-DD" strings and stored as UTC midnight so they never shift by timezone.

export interface ScheduleInput {
  totalAmount: number;
  dayOfMonth: number; // 1-31, clamped to the last day of shorter months
  firstDueMonth: string; // "YYYY-MM"
  installmentCount?: number; // split evenly over this many months, or...
  installmentAmount?: number; // ...pay this much each month until cleared
}

export interface ScheduleRow {
  installmentNumber: number;
  dueDate: string; // "YYYY-MM-DD"
  amount: number;
}

export const MAX_INSTALLMENTS = 120;

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(n).padStart(2, "0");

export function generateSchedule(input: ScheduleInput): ScheduleRow[] {
  const { totalAmount, dayOfMonth, firstDueMonth } = input;
  const match = /^(\d{4})-(\d{2})$/.exec(firstDueMonth);

  if (!match || !(totalAmount > 0) || !(dayOfMonth >= 1 && dayOfMonth <= 31)) return [];

  let count: number;
  let perInstallment: number;

  if (input.installmentAmount && input.installmentAmount > 0) {
    perInstallment = Math.min(round2(input.installmentAmount), totalAmount);
    count = Math.ceil(round2(totalAmount / perInstallment));
  } else if (input.installmentCount && input.installmentCount >= 1) {
    count = Math.floor(input.installmentCount);
    // Whole-taka installments; the last one absorbs the remainder
    perInstallment = Math.floor(totalAmount / count) || round2(totalAmount / count);
  } else {
    return [];
  }

  if (count > MAX_INSTALLMENTS) return [];

  const startYear = Number(match[1]);
  const startMonth = Number(match[2]) - 1;
  const rows: ScheduleRow[] = [];

  for (let i = 0; i < count; i++) {
    const monthIndex = startMonth + i;
    const year = startYear + Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = Math.min(dayOfMonth, lastDay);
    const isLast = i === count - 1;

    rows.push({
      installmentNumber: i + 1,
      dueDate: `${year}-${pad(month + 1)}-${pad(day)}`,
      amount: isLast ? round2(totalAmount - perInstallment * (count - 1)) : perInstallment,
    });
  }

  return rows;
}

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateOnly(value: Date | string): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

// Today's calendar date in Bangladesh, regardless of where the server runs
export function todayDateOnly(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Built by hand rather than with toLocaleDateString: server and browser disagree on
// month abbreviations ("Sep" vs "Sept"), which breaks hydration in client components.
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = toDateOnly(value).split("-");
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export type InstallmentStatus = "PAID" | "PARTIAL" | "OVERDUE" | "UPCOMING";

export function installmentStatus(
  inst: { amount: number; paidAmount: number; dueDate: Date | string },
  today: string = todayDateOnly()
): InstallmentStatus {
  if (inst.paidAmount >= inst.amount) return "PAID";
  if (toDateOnly(inst.dueDate) < today) return "OVERDUE";
  if (inst.paidAmount > 0) return "PARTIAL";
  return "UPCOMING";
}

export const DISBURSEMENT_TYPES: Record<string, string> = {
  QARD_HASANA: "Qard Hasana",
  SADAQAH: "Sadaqah",
};

// What a donor's money is for. Each type is its own fund and they are never mixed.
export const DONATION_TYPES: Record<string, string> = {
  QARD_HASANA: "Qard Hasana",
  SADAQAH: "Sadaqah",
  OPERATIONAL: "Operational Support",
};

export const PAYMENT_METHODS: Record<string, string> = {
  cash: "Cash",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank_transfer: "Bank Transfer",
};
