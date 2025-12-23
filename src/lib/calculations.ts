import { Debt, Strategy, CalculationResult, MonthlyScheduleRow, MonthlyDebtDetail } from '@/types/debt';
import { addMonths, format } from 'date-fns';

// Round to 2 decimal places
const round2 = (num: number): number => Math.round(num * 100) / 100;

// Calculate monthly interest for a debt
export const calculateMonthlyInterest = (balance: number, apr: number): number => {
  return round2(balance * apr / 12);
};

// Get payoff order based on strategy
export const getPayoffOrder = (debts: Debt[], strategy: Strategy): Debt[] => {
  const activeDebts = debts.filter(d => d.active && d.balance > 0);
  
  switch (strategy) {
    case 'SNOWBALL_LOWEST_BALANCE':
      return [...activeDebts].sort((a, b) => a.balance - b.balance);
    
    case 'AVALANCHE_HIGHEST_APR':
      return [...activeDebts].sort((a, b) => b.apr - a.apr);
    
    case 'ORDER_ENTERED':
      return activeDebts;
    
    case 'NO_SNOWBALL':
      return activeDebts;
    
    case 'CUSTOM_HIGHEST_FIRST':
      return [...activeDebts].sort((a, b) => {
        const rankA = a.customRank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.customRank ?? Number.MAX_SAFE_INTEGER;
        return rankB - rankA; // Higher rank first
      });
    
    case 'CUSTOM_LOWEST_FIRST':
      return [...activeDebts].sort((a, b) => {
        const rankA = a.customRank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.customRank ?? Number.MAX_SAFE_INTEGER;
        return rankA - rankB; // Lower rank first
      });
    
    default:
      return activeDebts;
  }
};

// Calculate initial snowball amount
export const calculateInitialSnowball = (monthlyBudget: number, debts: Debt[]): number => {
  const sumMinPayments = debts
    .filter(d => d.active && d.balance > 0)
    .reduce((sum, d) => sum + d.minPayment, 0);
  return round2(monthlyBudget - sumMinPayments);
};

// Main calculation engine
export const calculatePayoffSchedule = (
  debts: Debt[],
  strategy: Strategy,
  monthlyBudget: number,
  balanceDate: Date
): CalculationResult => {
  const MAX_MONTHS = 480;
  const schedule: MonthlyScheduleRow[] = [];
  const payoffDatePerDebt: Record<string, string> = {};
  
  // Clone debts with current balances for simulation
  let currentBalances: Record<string, number> = {};
  const activeDebts = debts.filter(d => d.active && d.balance > 0);
  
  activeDebts.forEach(d => {
    currentBalances[d.id] = d.balance;
  });
  
  // Get payoff order
  const payoffOrder = getPayoffOrder(debts, strategy);
  let payoffOrderIds = payoffOrder.map(d => d.id);
  
  let totalInterestPaid = 0;
  let monthNumber = 0;
  
  while (monthNumber < MAX_MONTHS) {
    const activeIds = Object.keys(currentBalances).filter(id => currentBalances[id] > 0);
    
    if (activeIds.length === 0) break;
    
    monthNumber++;
    const currentDate = addMonths(balanceDate, monthNumber);
    const debtDetails: MonthlyDebtDetail[] = [];
    
    // Step 1: Calculate and add interest for each active debt
    const interestThisMonth: Record<string, number> = {};
    activeIds.forEach(id => {
      const debt = debts.find(d => d.id === id)!;
      const interest = calculateMonthlyInterest(currentBalances[id], debt.apr);
      interestThisMonth[id] = interest;
      currentBalances[id] = round2(currentBalances[id] + interest);
      totalInterestPaid = round2(totalInterestPaid + interest);
    });
    
    // Step 2: Calculate baseline payments (minimum or remaining balance)
    const baselinePayments: Record<string, number> = {};
    let totalBaseline = 0;
    
    activeIds.forEach(id => {
      const debt = debts.find(d => d.id === id)!;
      const payment = Math.min(debt.minPayment, currentBalances[id]);
      baselinePayments[id] = round2(payment);
      totalBaseline = round2(totalBaseline + payment);
    });
    
    // Step 3: Calculate extra pool
    let extraPool = strategy === 'NO_SNOWBALL' 
      ? 0 
      : round2(monthlyBudget - totalBaseline);
    
    // Step 4: Allocate extra to debts in payoff order
    const extraPayments: Record<string, number> = {};
    activeIds.forEach(id => { extraPayments[id] = 0; });
    
    if (extraPool > 0 && strategy !== 'NO_SNOWBALL') {
      // Filter payoff order to only include active debts
      const orderedActiveIds = payoffOrderIds.filter(id => currentBalances[id] > 0);
      
      for (const targetId of orderedActiveIds) {
        if (extraPool <= 0) break;
        
        const balanceAfterInterest = currentBalances[targetId];
        const baselineForTarget = baselinePayments[targetId];
        const maxExtra = round2(balanceAfterInterest - baselineForTarget);
        
        if (maxExtra > 0) {
          const extraForTarget = round2(Math.min(extraPool, maxExtra));
          extraPayments[targetId] = extraForTarget;
          extraPool = round2(extraPool - extraForTarget);
        }
      }
    }
    
    // Step 5: Apply all payments
    let totalPaymentThisMonth = 0;
    let totalSnowballThisMonth = 0;
    let totalRemainingBalance = 0;
    
    activeIds.forEach(id => {
      const debt = debts.find(d => d.id === id)!;
      const startingBalance = round2(currentBalances[id] - interestThisMonth[id]);
      const totalPayment = round2(baselinePayments[id] + extraPayments[id]);
      
      currentBalances[id] = round2(Math.max(0, currentBalances[id] - totalPayment));
      totalPaymentThisMonth = round2(totalPaymentThisMonth + totalPayment);
      totalSnowballThisMonth = round2(totalSnowballThisMonth + extraPayments[id]);
      
      // Record payoff date
      if (currentBalances[id] === 0 && !payoffDatePerDebt[id]) {
        payoffDatePerDebt[id] = format(currentDate, 'yyyy-MM-dd');
      }
      
      debtDetails.push({
        debtId: id,
        debtName: debt.name,
        startingBalance: startingBalance,
        interest: interestThisMonth[id],
        payment: totalPayment,
        endingBalance: currentBalances[id],
      });
      
      totalRemainingBalance = round2(totalRemainingBalance + currentBalances[id]);
    });
    
    schedule.push({
      monthNumber,
      date: format(currentDate, 'yyyy-MM-dd'),
      totalPayment: totalPaymentThisMonth,
      baselinePayment: totalBaseline,
      snowballExtra: totalSnowballThisMonth,
      debtDetails,
      totalRemainingBalance,
    });
  }
  
  const lastMonth = schedule[schedule.length - 1];
  
  return {
    schedule,
    totalInterestPaid,
    monthsToPayoff: monthNumber,
    payoffDate: lastMonth?.date || format(balanceDate, 'yyyy-MM-dd'),
    payoffDatePerDebt,
    payoffOrder: payoffOrderIds,
  };
};

// Validate monthly budget
export const validateMonthlyBudget = (
  monthlyBudget: number,
  debts: Debt[]
): { valid: boolean; message?: string; initialSnowball: number } => {
  const sumMinPayments = debts
    .filter(d => d.active && d.balance > 0)
    .reduce((sum, d) => sum + d.minPayment, 0);
  
  const initialSnowball = round2(monthlyBudget - sumMinPayments);
  
  if (initialSnowball < 0) {
    return {
      valid: false,
      message: `Need to increase monthly payment by $${Math.abs(initialSnowball).toFixed(2)} to cover minimum payments.`,
      initialSnowball,
    };
  }
  
  return { valid: true, initialSnowball };
};

// Check if minimum payment covers interest
export const checkInterestOnlyRisk = (debt: Debt): boolean => {
  const monthlyInterest = calculateMonthlyInterest(debt.balance, debt.apr);
  return debt.minPayment < monthlyInterest;
};
