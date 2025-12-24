import { useState } from 'react';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomeDialogProps {
  open: boolean;
  onLoadSampleData: () => void;
  onStartEmpty: () => void;
}

export const WelcomeDialog = ({
  open,
  onLoadSampleData,
  onStartEmpty,
}: WelcomeDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadSample = async () => {
    setIsLoading(true);
    // Small delay for feedback
    await new Promise(r => setTimeout(r, 300));
    onLoadSampleData();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center shadow-hero">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Welcome to TrueBalance Planner
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your privacy-first debt payoff companion. Choose how you'd like to get started:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Load Sample Data Button */}
          <Button
            variant="default"
            className="w-full h-auto py-4 flex flex-col items-start gap-1"
            onClick={handleLoadSample}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Loading...' : 'Load Sample Plan'}
            </div>
            <span className="text-xs font-normal text-primary-foreground/80">
              Explore with realistic sample debts, accounts & bills
            </span>
          </Button>

          {/* Start Empty Button */}
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-start gap-1"
            onClick={onStartEmpty}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 font-semibold">
              <FileText className="w-4 h-4" />
              Start with Empty Plan
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              Jump right in and enter your own data
            </span>
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground pt-2 border-t">
          <p>
            Your data stays on your device. No accounts, no cloud, no tracking.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
