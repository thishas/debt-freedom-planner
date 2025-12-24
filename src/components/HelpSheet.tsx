import { Info, Shield, Mail, Copyright } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface HelpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpSheet = ({ open, onOpenChange }: HelpSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            About TrueBalance Planner
          </SheetTitle>
          <SheetDescription>
            Version 1.0 • Last Updated: 2025
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-5rem)] mt-4 -mx-6 px-6">
          <div className="space-y-6 pb-8">
            {/* About Section */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3">About</h3>
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  TrueBalance Planner is a private, offline-first planning tool designed to help users understand their debt, plan payoff strategies, and manage cashflow across accounts.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  The app does not connect to financial institutions, does not move money, and does not require accounts or logins.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  All data is stored locally on your device unless you choose to export it.
                </p>
              </div>
            </section>

            <Separator />

            {/* Privacy & Data Use Section */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy & Data Use
              </h3>
              <div className="bg-secondary/30 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    No accounts or sign-ups required
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    No cloud storage or background syncing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    No tracking or analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Data stays on your device unless you export it
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Clearing your browser or app storage will remove your saved plans.
                </p>
              </div>
            </section>

            <Separator />

            {/* Disclaimer Section */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3">Disclaimer</h3>
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  TrueBalance Planner is provided for educational and planning purposes only.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  It does not provide financial, legal, or tax advice. Calculations are estimates based on the information you enter and standard formulas. Actual results may vary.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  Always verify details with your financial institutions or a qualified professional.
                </p>
              </div>
            </section>

            <Separator />

            {/* Contact & Feedback Section */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact & Feedback
              </h3>
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We welcome feedback, questions, and bug reports.
                </p>
                <p className="text-sm text-foreground font-medium mt-3">
                  Email: cognitpath@gmail.com
                </p>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Please do not include sensitive personal or banking information in your message.
                </p>
              </div>
            </section>

            <Separator />

            {/* Copyright Section */}
            <section>
              <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                <Copyright className="w-4 h-4" />
                Copyright
              </h3>
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  © 2025 TrueBalance Planner. All rights reserved.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  TrueBalance Planner, its design, content, and calculation logic are protected by copyright. Unauthorized reproduction or distribution is prohibited.
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};