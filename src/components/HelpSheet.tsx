import { HelpCircle, TrendingDown, Zap, ListOrdered, Ban, Star } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const strategies = [
  {
    icon: TrendingDown,
    name: 'Snowball (Lowest Balance)',
    description:
      'Pay off your smallest debt first. When that\'s paid off, roll that payment into the next smallest debt. This method provides psychological wins to keep you motivated.',
    pros: ['Quick wins boost motivation', 'Simple to understand', 'Good for behavioral change'],
    cons: ['May pay more interest overall'],
  },
  {
    icon: Zap,
    name: 'Avalanche (Highest APR)',
    description:
      'Pay off your highest interest rate debt first. This mathematically minimizes the total interest you pay over time.',
    pros: ['Saves the most money', 'Mathematically optimal'],
    cons: ['May take longer to see progress', 'Requires more discipline'],
  },
  {
    icon: ListOrdered,
    name: 'Order Entered',
    description:
      'Pay off debts in the order you added them to the list. Useful when you have a specific priority in mind.',
    pros: ['Full control over order', 'Flexible'],
    cons: ['May not be optimal financially'],
  },
  {
    icon: Ban,
    name: 'No Snowball',
    description:
      'Pay only the minimum payment on each debt with no redistribution of freed-up payments. This is the slowest and most expensive method.',
    pros: ['Lowest monthly commitment'],
    cons: ['Slowest payoff', 'Pays most interest'],
  },
  {
    icon: Star,
    name: 'Custom Order',
    description:
      'Set your own priority using custom rank values. Debts with ranks are paid first, either highest or lowest rank first depending on your choice.',
    pros: ['Complete flexibility', 'Personal priority weighting'],
    cons: ['Requires manual setup'],
  },
];

const definitions = [
  {
    term: 'APR (Annual Percentage Rate)',
    definition: 'The yearly interest rate charged on your debt. Divide by 12 to get the monthly rate.',
  },
  {
    term: 'Minimum Payment',
    definition: 'The smallest payment required each month to keep your account in good standing.',
  },
  {
    term: 'Snowball Amount',
    definition: 'Extra money beyond minimum payments that gets "snowballed" onto the target debt.',
  },
  {
    term: 'Monthly Budget',
    definition: 'The total amount you can put toward all debt payments each month.',
  },
  {
    term: 'Interest-Only Payment',
    definition: 'When your minimum payment only covers the monthly interest, so your balance never decreases.',
  },
];

export const HelpSheet = ({ open, onOpenChange }: HelpSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Help & Strategies
          </SheetTitle>
          <SheetDescription>
            Learn about different debt payoff strategies and key terms.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-5rem)] mt-4 -mx-6 px-6">
          <div className="space-y-6 pb-8">
            {/* Strategies */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3">Payoff Strategies</h3>
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.name}
                    className="bg-secondary/30 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <strategy.icon className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-sm">{strategy.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {strategy.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-medium text-success mb-1">Pros</p>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {strategy.pros.map((pro) => (
                            <li key={pro}>• {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-warning mb-1">Cons</p>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {strategy.cons.map((con) => (
                            <li key={con}>• {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Definitions */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3">Key Terms</h3>
              <div className="space-y-3">
                {definitions.map((item) => (
                  <div
                    key={item.term}
                    className="border-b border-border pb-3 last:border-0"
                  >
                    <p className="font-medium text-sm mb-1">{item.term}</p>
                    <p className="text-xs text-muted-foreground">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Tips */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3">Tips</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Always pay at least the minimum on all debts to avoid penalties.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  If a debt's minimum payment doesn't cover interest, your balance will grow.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  The snowball method is great for motivation; avalanche saves the most money.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Review and update your plan monthly as balances change.
                </li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
