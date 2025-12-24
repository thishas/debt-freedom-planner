import { CreditCard, Target, Calendar, BarChart3, RefreshCw, HelpCircle, Wallet, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'strategy' | 'debts' | 'payoff-order' | 'schedule' | 'charts' | 'budget' | 'export';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onHelpClick: () => void;
}

const tabs: { id: TabId; label: string; icon: typeof CreditCard }[] = [
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'debts', label: 'Debts', icon: CreditCard },
  { id: 'payoff-order', label: 'Order', icon: ListOrdered },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'charts', label: 'Charts', icon: BarChart3 },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'export', label: 'Export', icon: RefreshCw },
];

export const BottomNav = ({ activeTab, onTabChange, onHelpClick }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-card">
      <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200',
                'min-w-[48px] touch-manipulation',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5 transition-transform', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn('text-[10px] font-medium leading-tight', isActive && 'font-semibold text-primary')}>
                {label}
              </span>
            </button>
          );
        })}
        <button
          onClick={onHelpClick}
          className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 min-w-[48px] touch-manipulation text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <HelpCircle className="w-5 h-5 mb-0.5" strokeWidth={2} />
          <span className="text-[10px] font-medium leading-tight">About</span>
        </button>
      </div>
    </nav>
  );
};
