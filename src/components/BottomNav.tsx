import { CreditCard, Target, Calendar, BarChart3, Download, HelpCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabId = 'debts' | 'strategy' | 'schedule' | 'charts' | 'budget' | 'export';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onHelpClick: () => void;
}

const tabs: { id: TabId; label: string; icon: typeof CreditCard }[] = [
  { id: 'debts', label: 'Debts', icon: CreditCard },
  { id: 'strategy', label: 'Strategy', icon: Target },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'charts', label: 'Charts', icon: BarChart3 },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'export', label: 'Export', icon: Download },
];

export const BottomNav = ({ activeTab, onTabChange, onHelpClick }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border shadow-soft">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200',
                'min-w-[60px] touch-manipulation',
                isActive
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-1', isActive && 'scale-110')} />
              <span className={cn('text-xs font-medium', isActive && 'font-semibold')}>
                {label}
              </span>
            </button>
          );
        })}
        <button
          onClick={onHelpClick}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] touch-manipulation text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <HelpCircle className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Help</span>
        </button>
      </div>
    </nav>
  );
};
