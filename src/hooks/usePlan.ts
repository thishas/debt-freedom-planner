import { useState, useEffect, useCallback } from 'react';
import { Plan, Debt, Strategy } from '@/types/debt';
import {
  loadPlans,
  savePlans,
  loadActivePlanId,
  saveActivePlanId,
  createDefaultPlan,
  generateId,
  incrementVersion,
  generatePlanIdentifier,
} from '@/lib/storage';
import { generateSamplePlan, setSampleDataActive } from '@/lib/sampleData';

export const usePlan = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load plans from storage on mount
  useEffect(() => {
    const storedPlans = loadPlans();
    const storedActivePlanId = loadActivePlanId();

    if (storedPlans.length === 0) {
      // Create a default plan if none exist
      const defaultPlan = createDefaultPlan();
      setPlans([defaultPlan]);
      setActivePlanId(defaultPlan.id);
      savePlans([defaultPlan]);
      saveActivePlanId(defaultPlan.id);
    } else {
      setPlans(storedPlans);
      // Use stored active plan or first plan
      const activeId = storedActivePlanId && storedPlans.find(p => p.id === storedActivePlanId)
        ? storedActivePlanId
        : storedPlans[0].id;
      setActivePlanId(activeId);
      saveActivePlanId(activeId);
    }
    
    setIsLoading(false);
  }, []);

  // Get the active plan
  const activePlan = plans.find(p => p.id === activePlanId) || null;

  // Update plans in state and storage
  const updatePlans = useCallback((newPlans: Plan[]) => {
    setPlans(newPlans);
    savePlans(newPlans);
  }, []);

  // Switch active plan
  const switchPlan = useCallback((planId: string) => {
    setActivePlanId(planId);
    saveActivePlanId(planId);
  }, []);

  // Create a new plan
  const createPlan = useCallback((name: string = 'New Plan') => {
    const now = new Date().toISOString();
    const newPlan: Plan = {
      id: generateId(),
      name,
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
    
    const newPlans = [...plans, newPlan];
    updatePlans(newPlans);
    switchPlan(newPlan.id);
    return newPlan;
  }, [plans, updatePlans, switchPlan]);

  // Delete a plan
  const deletePlan = useCallback((planId: string) => {
    const newPlans = plans.filter(p => p.id !== planId);
    
    if (newPlans.length === 0) {
      // Create a default plan if deleting the last one
      const defaultPlan = createDefaultPlan();
      updatePlans([defaultPlan]);
      switchPlan(defaultPlan.id);
    } else {
      updatePlans(newPlans);
      if (activePlanId === planId) {
        switchPlan(newPlans[0].id);
      }
    }
  }, [plans, activePlanId, updatePlans, switchPlan]);

  // Update the active plan (with version increment and timestamp)
  const updateActivePlan = useCallback((updates: Partial<Plan>, incrementVer: boolean = true) => {
    if (!activePlanId) return;
    
    const now = new Date().toISOString();
    const newPlans = plans.map(p => {
      if (p.id === activePlanId) {
        return {
          ...p,
          ...updates,
          updatedAt: now,
          lastUpdatedAt: now,
          version: incrementVer ? incrementVersion(p.version || '1.0') : (p.version || '1.0'),
        };
      }
      return p;
    });
    updatePlans(newPlans);
  }, [activePlanId, plans, updatePlans]);

  // Debt CRUD operations
  const addDebt = useCallback((debt: Omit<Debt, 'id' | 'active'>) => {
    if (!activePlan) return;
    
    const newDebt: Debt = {
      ...debt,
      id: generateId(),
      active: debt.balance > 0,
    };
    
    updateActivePlan({ debts: [...activePlan.debts, newDebt] });
  }, [activePlan, updateActivePlan]);

  const updateDebt = useCallback((debtId: string, updates: Partial<Debt>) => {
    if (!activePlan) return;
    
    const newDebts = activePlan.debts.map(d => {
      if (d.id === debtId) {
        const updated = { ...d, ...updates };
        // Auto-update active status based on balance
        if ('balance' in updates) {
          updated.active = updates.balance! > 0;
        }
        return updated;
      }
      return d;
    });
    
    updateActivePlan({ debts: newDebts });
  }, [activePlan, updateActivePlan]);

  const deleteDebt = useCallback((debtId: string) => {
    if (!activePlan) return;
    updateActivePlan({ debts: activePlan.debts.filter(d => d.id !== debtId) });
  }, [activePlan, updateActivePlan]);

  const setStrategy = useCallback((strategy: Strategy) => {
    updateActivePlan({ strategy });
  }, [updateActivePlan]);

  const setMonthlyBudget = useCallback((monthlyBudget: number) => {
    updateActivePlan({ monthlyBudget });
  }, [updateActivePlan]);

  const setBalanceDate = useCallback((balanceDate: string) => {
    updateActivePlan({ balanceDate });
  }, [updateActivePlan]);

  // Import debts (replaces all existing debts)
  const importDebts = useCallback((debts: Partial<Debt>[]) => {
    if (!activePlan) return;
    
    const newDebts: Debt[] = debts.map(d => ({
      id: generateId(),
      name: d.name || 'Imported Debt',
      balance: d.balance || 0,
      apr: d.apr || 0,
      minPayment: d.minPayment || 0,
      customRank: d.customRank,
      active: (d.balance || 0) > 0,
    }));
    
    // Replace all existing debts with imported ones
    updateActivePlan({ debts: newDebts });
  }, [activePlan, updateActivePlan]);

  // Import a full plan (replaces current active plan's data)
  const importPlan = useCallback((importedPlan: Plan) => {
    if (!activePlanId) return;
    
    const now = new Date().toISOString();
    const newPlans = plans.map(p => {
      if (p.id === activePlanId) {
        return {
          ...importedPlan,
          id: activePlanId, // Keep the current plan ID
          lastUpdatedAt: now, // Update timestamp to now
          version: incrementVersion(importedPlan.version || '1.0'),
          planIdentifier: importedPlan.planIdentifier || p.planIdentifier || generatePlanIdentifier(),
        };
      }
      return p;
    });
    updatePlans(newPlans);
  }, [activePlanId, plans, updatePlans]);

  // Load sample plan data
  const loadSamplePlan = useCallback(() => {
    const samplePlan = generateSamplePlan();
    setPlans([samplePlan]);
    setActivePlanId(samplePlan.id);
    savePlans([samplePlan]);
    saveActivePlanId(samplePlan.id);
    setSampleDataActive(true);
    return samplePlan;
  }, []);

  // Clear all data and start fresh
  const clearAllData = useCallback(() => {
    const freshPlan = createDefaultPlan();
    setPlans([freshPlan]);
    setActivePlanId(freshPlan.id);
    savePlans([freshPlan]);
    saveActivePlanId(freshPlan.id);
    setSampleDataActive(false);
  }, []);

  return {
    plans,
    activePlan,
    activePlanId,
    isLoading,
    switchPlan,
    createPlan,
    deletePlan,
    updateActivePlan,
    addDebt,
    updateDebt,
    deleteDebt,
    setStrategy,
    setMonthlyBudget,
    setBalanceDate,
    importDebts,
    importPlan,
    loadSamplePlan,
    clearAllData,
  };
};
