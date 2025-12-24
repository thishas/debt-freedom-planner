import { Plan } from '@/types/debt';

const STORAGE_KEY = 'debt-reduction-plans';
const ACTIVE_PLAN_KEY = 'debt-reduction-active-plan';

export const savePlans = (plans: Plan[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (error) {
    console.error('Failed to save plans:', error);
  }
};

export const loadPlans = (): Plan[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load plans:', error);
    return [];
  }
};

export const saveActivePlanId = (planId: string): void => {
  try {
    localStorage.setItem(ACTIVE_PLAN_KEY, planId);
  } catch (error) {
    console.error('Failed to save active plan ID:', error);
  }
};

export const loadActivePlanId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_PLAN_KEY);
  } catch (error) {
    console.error('Failed to load active plan ID:', error);
    return null;
  }
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/** Generate a short plan identifier like "TBP-9F3A" */
export const generatePlanIdentifier = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like O, 0, I, 1
  let result = 'TBP-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/** Increment a version string (e.g., "1.0" -> "1.1", "1.9" -> "1.10") */
export const incrementVersion = (currentVersion: string): string => {
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0], 10) || 1;
  const minor = parseInt(parts[1], 10) || 0;
  return `${major}.${minor + 1}`;
};

export const createDefaultPlan = (): Plan => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: 'My Debt Plan',
    balanceDate: new Date().toISOString().split('T')[0],
    monthlyBudget: 500,
    strategy: 'SNOWBALL_LOWEST_BALANCE',
    debts: [],
    createdAt: now,
    updatedAt: now,
    lastUpdatedAt: now,
    version: '1.0',
    planIdentifier: generatePlanIdentifier(),
  };
};

/** Format a date for display */
export const formatLastUpdated = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/** Export a plan to JSON with metadata */
export const exportPlanToJSON = (plan: Plan): string => {
  const exportData = {
    ...plan,
    exportedAt: new Date().toISOString(),
    exportFormat: 'TrueBalance-v1',
  };
  return JSON.stringify(exportData, null, 2);
};

/** Parse a plan from JSON, validating structure */
export const parsePlanFromJSON = (json: string): { plan: Plan | null; error?: string } => {
  try {
    const data = JSON.parse(json);
    
    // Validate required fields
    if (!data.id || !data.name || !Array.isArray(data.debts)) {
      return { plan: null, error: 'Invalid plan format: missing required fields' };
    }
    
    // Ensure new fields exist (for backwards compatibility)
    const plan: Plan = {
      ...data,
      lastUpdatedAt: data.lastUpdatedAt || data.updatedAt || new Date().toISOString(),
      version: data.version || '1.0',
      planIdentifier: data.planIdentifier || generatePlanIdentifier(),
    };
    
    return { plan };
  } catch (e) {
    return { plan: null, error: 'Could not parse plan file' };
  }
};

// CSV Import/Export
export const exportDebtsToCSV = (plan: Plan): string => {
  const headers = ['name', 'balance', 'apr', 'minPayment', 'customRank', 'creditLimit', 'type', 'feeAmount', 'feeFrequency'];
  const rows = plan.debts.map(d => [
    `"${d.name}"`,
    d.balance.toString(),
    d.apr.toString(),
    d.minPayment.toString(),
    d.customRank?.toString() || '',
    d.creditLimit?.toString() || '',
    d.type ? `"${d.type}"` : '',
    d.feeAmount?.toString() || '',
    d.feeFrequency || '',
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
};

/** 
 * Normalize APR value to decimal format (0-1 range)
 * - If value < 1, treat as already decimal (e.g., 0.195 = 19.5%)
 * - If value >= 1, treat as percentage and convert (e.g., 30 = 0.30)
 */
const normalizeApr = (rawApr: number): number => {
  if (rawApr < 1) {
    // Already in decimal format (e.g., 0.195 for 19.5%)
    return rawApr;
  }
  // Convert from percentage to decimal (e.g., 30 -> 0.30)
  return rawApr / 100;
};

export const parseDebtsFromCSV = (csv: string): Partial<import('@/types/debt').Debt>[] => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const debts: Partial<import('@/types/debt').Debt>[] = [];
  
  // Parse header to find column indices (supports flexible column order)
  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Find column indices (creditLimit is optional)
  const creditLimitIndex = headers.findIndex(h => h === 'creditlimit' || h === 'credit_limit');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length >= 4) {
      const feeFrequencyValue = values[8]?.toUpperCase();
      const validFeeFrequency = feeFrequencyValue === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
      
      // Parse and normalize APR
      const rawApr = parseFloat(values[2]) || 0;
      const normalizedApr = normalizeApr(rawApr);
      
      // Parse creditLimit - check by header index first, then fall back to position 5
      let creditLimit: number | null = null;
      if (creditLimitIndex !== -1 && values[creditLimitIndex]) {
        creditLimit = parseFloat(values[creditLimitIndex]) || null;
      } else if (values[5]) {
        creditLimit = parseFloat(values[5]) || null;
      }
      
      debts.push({
        name: values[0] || `Debt ${i}`,
        balance: parseFloat(values[1]) || 0,
        apr: normalizedApr,
        minPayment: parseFloat(values[3]) || 0,
        customRank: values[4] ? parseInt(values[4]) : undefined,
        creditLimit,
        type: values[6] as import('@/types/debt').DebtType || null,
        feeAmount: values[7] ? parseFloat(values[7]) : null,
        feeFrequency: values[7] ? validFeeFrequency : null,
      });
    }
  }
  
  return debts;
};

// Schedule export
export const exportScheduleToCSV = (schedule: import('@/types/debt').MonthlyScheduleRow[]): string => {
  const headers = ['Month', 'Date', 'Total Payment', 'Baseline', 'Extra/Snowball', 'Remaining Balance'];
  
  // Get all unique debt names
  const debtNames = new Set<string>();
  schedule.forEach(row => {
    row.debtDetails.forEach(d => debtNames.add(d.debtName));
  });
  
  const debtHeaders = Array.from(debtNames).flatMap(name => [
    `${name} Interest`,
    `${name} Payment`,
    `${name} Balance`,
  ]);
  
  const allHeaders = [...headers, ...debtHeaders];
  
  const rows = schedule.map(row => {
    const baseValues = [
      row.monthNumber,
      row.date,
      row.totalPayment.toFixed(2),
      row.baselinePayment.toFixed(2),
      row.snowballExtra.toFixed(2),
      row.totalRemainingBalance.toFixed(2),
    ];
    
    const debtValues = Array.from(debtNames).flatMap(name => {
      const detail = row.debtDetails.find(d => d.debtName === name);
      return detail
        ? [detail.interest.toFixed(2), detail.payment.toFixed(2), detail.endingBalance.toFixed(2)]
        : ['', '', ''];
    });
    
    return [...baseValues, ...debtValues].join(',');
  });
  
  return [allHeaders.join(','), ...rows].join('\n');
};
