import { Calculator, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Plan } from '@/types/debt';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface HeaderProps {
  plans: Plan[];
  activePlan: Plan | null;
  onSwitchPlan: (planId: string) => void;
  onCreatePlan: () => void;
  onDeletePlan: (planId: string) => void;
}

export const Header = ({
  plans,
  activePlan,
  onSwitchPlan,
  onCreatePlan,
  onDeletePlan,
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 glass border-b border-border shadow-soft">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
            <Calculator className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              Debt Reduction
            </h1>
            <p className="text-xs text-muted-foreground">Calculator</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 max-w-[140px]">
              <span className="truncate">{activePlan?.name || 'Select Plan'}</span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {plans.map((plan) => (
              <DropdownMenuItem
                key={plan.id}
                className="flex items-center justify-between group"
              >
                <span
                  className="flex-1 truncate cursor-pointer"
                  onClick={() => onSwitchPlan(plan.id)}
                >
                  {plan.name}
                </span>
                {plans.length > 1 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{plan.name}" and all its data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => onDeletePlan(plan.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreatePlan} className="text-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
