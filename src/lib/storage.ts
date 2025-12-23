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
  };
};

// CSV Import/Export
export const exportDebtsToCSV = (plan: Plan): string => {
  const headers = ['name', 'balance', 'apr', 'minPayment', 'customRank', 'creditLimit', 'type', 'fees'];
  const rows = plan.debts.map(d => [
    `"${d.name}"`,
    d.balance.toString(),
    d.apr.toString(),
    d.minPayment.toString(),
    d.customRank?.toString() || '',
    d.creditLimit?.toString() || '',
    d.type ? `"${d.type}"` : '',
    d.fees?.toString() || '',
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
};

export const parseDebtsFromCSV = (csv: string): Partial<import('@/types/debt').Debt>[] => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  const debts: Partial<import('@/types/debt').Debt>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length >= 4) {
      debts.push({
        name: values[0] || `Debt ${i}`,
        balance: parseFloat(values[1]) || 0,
        apr: parseFloat(values[2]) || 0,
        minPayment: parseFloat(values[3]) || 0,
        customRank: values[4] ? parseInt(values[4]) : undefined,
        creditLimit: values[5] ? parseFloat(values[5]) : null,
        type: values[6] as import('@/types/debt').DebtType || null,
        fees: values[7] ? parseFloat(values[7]) : null,
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
