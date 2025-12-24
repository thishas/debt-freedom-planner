import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SampleDataBannerProps {
  onClearSampleData: () => void;
}

export const SampleDataBanner = ({ onClearSampleData }: SampleDataBannerProps) => {
  return (
    <div className="bg-accent/20 border border-accent/30 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2 text-sm">
        <Info className="w-4 h-4 text-accent-secondary-DEFAULT shrink-0" />
        <span className="text-muted-foreground">
          <strong className="text-foreground">Sample Data</strong>
          {' '}— You can clear this anytime and start fresh.
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground hover:text-destructive shrink-0"
        onClick={onClearSampleData}
      >
        <X className="w-3 h-3 mr-1" />
        Clear
      </Button>
    </div>
  );
};
