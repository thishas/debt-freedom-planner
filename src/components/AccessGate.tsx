import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, RefreshCw } from "lucide-react";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "truebalance_signup_completed";
const LANDING_PAGE_URL = "https://truebalance.thisha.net";

interface AccessGateProps {
  children: React.ReactNode;
}

/**
 * Soft signup enforcement gate.
 * Checks localStorage for signup flag and blocks app if not present.
 * This is NOT real auth—just a gentle prompt to visit landing page first.
 */
export const AccessGate = ({ children }: AccessGateProps) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const checkAccess = useCallback(() => {
    const flag = localStorage.getItem(STORAGE_KEY);
    return flag === "1";
  }, []);

  // Handle signup handoff from landing page (?signup=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("signup") === "1") {
      // Set the localStorage flag
      localStorage.setItem(STORAGE_KEY, "1");
      track("app_signup_handoff_received");
      
      // Remove only the signup param, keep others
      params.delete("signup");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    const accessGranted = checkAccess();
    setHasAccess(accessGranted);

    if (accessGranted) {
      track("app_gate_passed");
    } else {
      track("app_gate_shown");
    }
  }, [checkAccess]);

  const handleGoToLanding = () => {
    track("app_gate_go_to_landing_clicked");
    window.location.href = LANDING_PAGE_URL;
  };

  const handleRecheck = () => {
    track("app_gate_recheck_clicked");
    const accessGranted = checkAccess();
    setHasAccess(accessGranted);
    if (accessGranted) {
      track("app_gate_passed");
    }
  };

  // Still checking
  if (hasAccess === null) {
    return null;
  }

  // Access granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Gate screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Access TrueBalance Planner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2 text-muted-foreground text-sm">
            <p>Please start from the TrueBalance landing page to sign up for updates.</p>
            <p>No financial data is collected or synced. Your plan stays on your device.</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={handleGoToLanding} className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
              Go to Landing Page
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRecheck}
              className="w-full gap-2 text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              I already signed up
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Need help? Clear your browser storage and try again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
