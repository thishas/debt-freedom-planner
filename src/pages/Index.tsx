import { useState, useMemo, useEffect } from 'react';
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
import { WelcomeDialog } from '@/components/WelcomeDialog';
import { SampleDataBanner } from '@/components/SampleDataBanner';
import { 
  hasSampleData, 
  setSampleDataActive 
} from '@/lib/sampleData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabId>('strategy');
  const [helpOpen, setHelpOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSampleBanner, setShowSampleBanner] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

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
    importPlan,
    loadSamplePlan,
    clearAllData,
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
    loadSampleBudget,
    clearBudgetData,
  } = useBudget();

  // Check if user has any active plan data (state-based, not flag-based)
  // This checks debts, accounts, AND bills per the specification
  const hasActiveUserData = useMemo(() => {
    if (!activePlan) return false;
    const hasDebts = activePlan.debts.length > 0;
    const hasAccounts = accounts.length > 0;
    const hasBills = bills.length > 0;
    return hasDebts || hasAccounts || hasBills;
  }, [activePlan, accounts, bills]);

  // State-based onboarding: show welcome when no data exists
  // This effect responds to actual data presence, ensuring the dialog
  // reappears after clearing without requiring a page refresh
  useEffect(() => {
    if (!isLoading && !budgetLoading) {
      if (!hasActiveUserData) {
        // No data exists - show welcome dialog immediately
        setShowWelcome(true);
        setShowSampleBanner(false);
      } else {
        // Data exists - hide welcome, check if it's sample data
        setShowWelcome(false);
        setShowSampleBanner(hasSampleData());
      }
    }
  }, [isLoading, budgetLoading, hasActiveUserData]);

  // Handle loading sample data
  // GUARDRAIL: Only allow if no active user data exists
  const handleLoadSampleData = () => {
    if (hasActiveUserData) {
      // Block: user has data, cannot overwrite with sample
      return;
    }
    
    const samplePlan = loadSamplePlan();
    
    // Link debts to bills by matching names
    const debtIds = {
      chaseCard: samplePlan.debts.find(d => d.name.includes('Chase'))?.id,
      capitalOneCard: samplePlan.debts.find(d => d.name.includes('Capital One'))?.id,
      autoLoan: samplePlan.debts.find(d => d.name.includes('Auto'))?.id,
      studentLoan: samplePlan.debts.find(d => d.name.includes('Student'))?.id,
    };
    
    loadSampleBudget(debtIds);
    // State will auto-update via hasActiveUserData effect
  };

  // Handle starting with empty plan
  const handleStartEmpty = () => {
    // Just close the dialog - user will add their own data
    setShowWelcome(false);
  };

  // Handle clearing sample data
  const handleClearSampleData = () => {
    setClearConfirmOpen(true);
  };

  const confirmClearSampleData = () => {
    clearAllData();
    clearBudgetData();
    setSampleDataActive(false);
    // State will auto-trigger welcome dialog via hasActiveUserData effect
    setClearConfirmOpen(false);
  };

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

      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* Sample Data Banner */}
        {showSampleBanner && (
          <SampleDataBanner onClearSampleData={handleClearSampleData} />
        )}

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
            onImportPlan={importPlan}
            accounts={accounts}
            bills={bills}
            forecastWindow={forecastWindow}
            showSampleBanner={showSampleBanner}
            hasActiveUserData={hasActiveUserData}
            onLoadSampleData={handleLoadSampleData}
            onClearSampleData={handleClearSampleData}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onHelpClick={() => setHelpOpen(true)}
      />

      <HelpSheet open={helpOpen} onOpenChange={setHelpOpen} />

      {/* Welcome Dialog */}
      <WelcomeDialog
        open={showWelcome}
        onLoadSampleData={handleLoadSampleData}
        onStartEmpty={handleStartEmpty}
      />

      {/* Clear Data Confirmation - works for both sample and user data */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showSampleBanner ? 'Clear Sample Data?' : 'Clear All Data?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showSampleBanner 
                ? 'This will remove all sample debts, accounts, and bills. You\'ll start with a fresh, empty plan. This action cannot be undone.'
                : 'This will remove all your debts, accounts, and bills. You\'ll start with a fresh, empty plan. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmClearSampleData}
            >
              Clear Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
