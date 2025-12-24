export type Strategy =
  | 'SNOWBALL_LOWEST_BALANCE'
  | 'AVALANCHE_HIGHEST_APR'
  | 'ORDER_ENTERED'
  | 'NO_SNOWBALL'
  | 'CUSTOM_HIGHEST_FIRST'
  | 'CUSTOM_LOWEST_FIRST';

export type DebtType = 
  | 'Credit Card'
  | 'Auto Loan'
  | 'Student Loan'
  | 'Personal Loan'
  | 'Mortgage'
  | 'Other';

export const DEBT_TYPES: DebtType[] = [
  'Credit Card',
  'Auto Loan',
  'Student Loan',
  'Personal Loan',
  'Mortgage',
  'Other',
];

export type FeeFrequency = 'MONTHLY' | 'ANNUAL';

export const FEE_FREQUENCY_LABELS: Record<FeeFrequency, string> = {
  MONTHLY: 'Monthly',
  ANNUAL: 'Annual',
};

export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number; // 0-1 decimal (e.g., 0.135 for 13.5%)
  minPayment: number;
  customRank?: number;
  active: boolean;
  // Metadata fields (not used in calculations)
  creditLimit?: number | null;
  type?: DebtType | null;
  feeAmount?: number | null; // Fee amount (informational only)
  feeFrequency?: FeeFrequency | null; // Fee frequency: MONTHLY or ANNUAL
}

// Helper functions for calculated metadata fields
export const calculateUtilizationRate = (balance: number, creditLimit: number | null | undefined): number | null => {
  if (!creditLimit || creditLimit <= 0) return null;
  return Math.min(Math.round((balance / creditLimit) * 1000) / 10, 100); // Round to 1 decimal, cap at 100%
};

export const calculateAvailableBalance = (balance: number, creditLimit: number | null | undefined): number | null => {
  if (!creditLimit || creditLimit <= 0) return null;
  return Math.max(creditLimit - balance, 0);
};

export const getUtilizationColor = (rate: number | null): 'green' | 'yellow' | 'red' | null => {
  if (rate === null) return null;
  if (rate < 30) return 'green';
  if (rate <= 70) return 'yellow';
  return 'red';
};

export interface Plan {
  id: string;
  name: string;
  balanceDate: string; // ISO date string
  monthlyBudget: number;
  strategy: Strategy;
  debts: Debt[];
  createdAt: string;
  updatedAt: string;
  /** Last time the plan was modified on this device (ISO timestamp) */
  lastUpdatedAt: string;
  /** Simple version number for tracking changes (e.g., "1.0", "1.1") */
  version: string;
  /** Short plan identifier for easy reference (e.g., "TBP-9F3A") */
  planIdentifier: string;
}

export interface MonthlyDebtDetail {
  debtId: string;
  debtName: string;
  startingBalance: number;
  interest: number;
  payment: number;
  endingBalance: number;
}

export interface MonthlyScheduleRow {
  monthNumber: number;
  date: string;
  totalPayment: number;
  baselinePayment: number;
  snowballExtra: number;
  debtDetails: MonthlyDebtDetail[];
  totalRemainingBalance: number;
}

export interface CalculationResult {
  schedule: MonthlyScheduleRow[];
  totalInterestPaid: number;
  monthsToPayoff: number;
  payoffDate: string;
  payoffDatePerDebt: Record<string, string>;
  payoffOrder: string[];
}

export const STRATEGY_LABELS: Record<Strategy, string> = {
  SNOWBALL_LOWEST_BALANCE: 'Snowball (Lowest Balance First)',
  AVALANCHE_HIGHEST_APR: 'Avalanche (Highest APR First)',
  ORDER_ENTERED: 'Order Entered',
  NO_SNOWBALL: 'No Snowball (Minimums Only)',
  CUSTOM_HIGHEST_FIRST: 'Custom Order (Highest Rank First)',
  CUSTOM_LOWEST_FIRST: 'Custom Order (Lowest Rank First)',
};

export const STRATEGY_DESCRIPTIONS: Record<Strategy, string> = {
  SNOWBALL_LOWEST_BALANCE: 'Pay off smallest debts first for quick wins and motivation.',
  AVALANCHE_HIGHEST_APR: 'Pay off highest interest rate debts first to minimize total interest.',
  ORDER_ENTERED: 'Pay off debts in the order you entered them.',
  NO_SNOWBALL: 'Pay only minimum payments with no extra redistribution.',
  CUSTOM_HIGHEST_FIRST: 'Pay off debts with highest custom rank first.',
  CUSTOM_LOWEST_FIRST: 'Pay off debts with lowest custom rank first.',
};
