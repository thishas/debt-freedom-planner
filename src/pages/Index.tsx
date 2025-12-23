import { useState, useMemo } from 'react';
import { usePlan } from '@/hooks/usePlan';
import { useBudget } from '@/hooks/useBudget';
import { calculatePayoffSchedule, validateMonthlyBudget } from '@/lib/calculations';
import { parseISO } from 'date-fns';
import { Header } from '@/components/Header';
import { BottomNav, TabId } from '@/components/BottomNav';
import { DebtsTab } from '@/components/tabs/DebtsTab';
import { StrategyTab } from '@/components/tabs/StrategyTab';
import { PayoffOrderTab } from '@/components/tabs/PayoffOrderTab';
import { ScheduleTab } from '@/components/tabs/ScheduleTab';
import { ChartsTab } from '@/components/tabs/ChartsTab';
import { BudgetTab } from '@/components/tabs/BudgetTab';
import { ExportTab } from '@/components/tabs/ExportTab';
import { HelpSheet } from '@/components/HelpSheet';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('strategy');
  const [helpOpen, setHelpOpen] = useState(false);

  const {
    plans,
    activePlan,
    isLoading,
    switchPlan,
    createPlan,
    deletePlan,
    addDebt,
    updateDebt,
    deleteDebt,
    setStrategy,
    setMonthlyBudget,
    setBalanceDate,
    importDebts,
  } = usePlan();

  const {
    accounts,
    bills,
    forecastWindow,
    isLoading: budgetLoading,
    addAccount,
    updateAccount,
    deleteAccount,
    addBill,
    updateBill,
    deleteBill,
    setForecastWindow,
  } = useBudget();

  // Calculate payoff schedule whenever plan changes
  const calculationResult = useMemo(() => {
    if (!activePlan || activePlan.debts.length === 0) return null;

    const validation = validateMonthlyBudget(activePlan.monthlyBudget, activePlan.debts);
    if (!validation.valid) return null;

    const activeDebts = activePlan.debts.filter(d => d.active && d.balance > 0);
    if (activeDebts.length === 0) return null;

    return calculatePayoffSchedule(
      activePlan.debts,
      activePlan.strategy,
      activePlan.monthlyBudget,
      parseISO(activePlan.balanceDate)
    );
  }, [activePlan]);

  if (isLoading || budgetLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        plans={plans}
        activePlan={activePlan}
        onSwitchPlan={switchPlan}
        onCreatePlan={() => createPlan()}
        onDeletePlan={deletePlan}
      />

      <main className="px-4 py-4 max-w-lg mx-auto">
        {activeTab === 'debts' && activePlan && (
          <DebtsTab
            debts={activePlan.debts}
            onAddDebt={addDebt}
            onUpdateDebt={updateDebt}
            onDeleteDebt={deleteDebt}
          />
        )}

        {activeTab === 'strategy' && activePlan && (
          <StrategyTab
            debts={activePlan.debts}
            strategy={activePlan.strategy}
            monthlyBudget={activePlan.monthlyBudget}
            balanceDate={activePlan.balanceDate}
            onStrategyChange={setStrategy}
            onMonthlyBudgetChange={setMonthlyBudget}
            onBalanceDateChange={setBalanceDate}
          />
        )}

        {activeTab === 'payoff-order' && activePlan && (
          <PayoffOrderTab
            debts={activePlan.debts}
            strategy={activePlan.strategy}
          />
        )}

        {activeTab === 'schedule' && activePlan && (
          <ScheduleTab
            calculationResult={calculationResult}
            debts={activePlan.debts}
          />
        )}

        {activeTab === 'charts' && activePlan && (
          <ChartsTab
            calculationResult={calculationResult}
            debts={activePlan.debts}
          />
        )}

        {activeTab === 'budget' && activePlan && (
          <BudgetTab
            accounts={accounts}
            bills={bills}
            debts={activePlan.debts}
            forecastWindow={forecastWindow}
            onAddAccount={addAccount}
            onUpdateAccount={updateAccount}
            onDeleteAccount={deleteAccount}
            onAddBill={addBill}
            onUpdateBill={updateBill}
            onDeleteBill={deleteBill}
            onSetForecastWindow={setForecastWindow}
          />
        )}

        {activeTab === 'export' && activePlan && (
          <ExportTab
            plan={activePlan}
            calculationResult={calculationResult}
            onImportDebts={importDebts}
            accounts={accounts}
            bills={bills}
            forecastWindow={forecastWindow}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHelpClick={() => setHelpOpen(true)}
      />

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default Index;
