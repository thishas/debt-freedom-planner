import { useState, useEffect, useCallback } from 'react';
import { BudgetData, BankAccount, BillItem, ForecastWindow } from '@/types/budget';
import { saveBudgetData, loadBudgetData, generateId } from '@/lib/budgetStorage';

export const useBudget = () => {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    accounts: [],
    bills: [],
    forecastWindow: 'this_month',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load budget data on mount
  useEffect(() => {
    const data = loadBudgetData();
    setBudgetData(data);
    setIsLoading(false);
  }, []);

  // Save whenever budget data changes
  useEffect(() => {
    if (!isLoading) {
      saveBudgetData(budgetData);
    }
  }, [budgetData, isLoading]);

  // Account operations
  const addAccount = useCallback((account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: generateId(),
    };
    setBudgetData(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount],
    }));
    return newAccount;
  }, []);

  const updateAccount = useCallback((id: string, updates: Partial<BankAccount>) => {
    setBudgetData(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => 
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== id),
      // Also remove bills assigned to this account
      bills: prev.bills.filter(b => b.payFromAccountId !== id),
    }));
  }, []);

  // Bill operations
  const addBill = useCallback((bill: Omit<BillItem, 'id'>) => {
    const newBill: BillItem = {
      ...bill,
      id: generateId(),
    };
    setBudgetData(prev => ({
      ...prev,
      bills: [...prev.bills, newBill],
    }));
    return newBill;
  }, []);

  const updateBill = useCallback((id: string, updates: Partial<BillItem>) => {
    setBudgetData(prev => ({
      ...prev,
      bills: prev.bills.map(b => 
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setBudgetData(prev => ({
      ...prev,
      bills: prev.bills.filter(b => b.id !== id),
    }));
  }, []);

  // Set forecast window
  const setForecastWindow = useCallback((window: ForecastWindow) => {
    setBudgetData(prev => ({
      ...prev,
      forecastWindow: window,
    }));
  }, []);

  // Bulk import
  const importAccounts = useCallback((accounts: Partial<BankAccount>[]) => {
    const newAccounts: BankAccount[] = accounts.map(a => ({
      id: generateId(),
      name: a.name || 'Unnamed Account',
      institution: a.institution || null,
      currentBalance: a.currentBalance || 0,
      notes: a.notes || null,
      isPrimary: a.isPrimary || false,
    }));
    
    setBudgetData(prev => ({
      ...prev,
      accounts: [...prev.accounts, ...newAccounts],
    }));
  }, []);

  const importBills = useCallback((bills: Partial<BillItem>[], defaultAccountId: string) => {
    const newBills: BillItem[] = bills.map(b => ({
      id: generateId(),
      label: b.label || 'Unnamed Bill',
      amount: b.amount || 0,
      dueDay: b.dueDay || null,
      dueDate: b.dueDate || null,
      frequency: b.frequency || 'MONTHLY',
      category: b.category || 'Other',
      linkedDebtId: b.linkedDebtId || null,
      payFromAccountId: b.payFromAccountId || defaultAccountId,
      status: b.status || 'PLANNED',
      autopay: b.autopay || false,
      notes: b.notes || null,
    }));
    
    setBudgetData(prev => ({
      ...prev,
      bills: [...prev.bills, ...newBills],
    }));
  }, []);

  return {
    accounts: budgetData.accounts,
    bills: budgetData.bills,
    forecastWindow: budgetData.forecastWindow,
    isLoading,
    // Account operations
    addAccount,
    updateAccount,
    deleteAccount,
    // Bill operations
    addBill,
    updateBill,
    deleteBill,
    // Settings
    setForecastWindow,
    // Import
    importAccounts,
    importBills,
  };
};
