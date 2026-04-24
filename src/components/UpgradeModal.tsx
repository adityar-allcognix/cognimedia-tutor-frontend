import { useState } from "react";
import { Zap, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createOrder, verifyPayment } from "@/lib/subscription";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: new (options: object) => { open: () => void };
  }
}

const PRO_FEATURES = [
  "Unlimited topic learning per day",
  "Unlimited AI tool uses",
  "Priority AI generation",
  "All future Pro features",
];

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UpgradeModal({ open, onOpenChange, onSuccess }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const order = await createOrder();

      const rzp = new window.Razorpay({
        key: order.key,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        theme: order.theme,
        prefill: order.prefill,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast({
              title: "You're now Pro!",
              description: "Enjoy 30 days of unlimited learning.",
            });
            onOpenChange(false);
            onSuccess?.();
          } catch {
            toast({
              title: "Verification failed",
              description: "Payment received but verification failed. Contact support.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch {
      toast({
        title: "Could not start checkout",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription>
            Unlock unlimited learning for just{" "}
            <span className="font-semibold text-foreground">₹200/month</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 space-y-2">
          <Button className="w-full" onClick={handleUpgrade} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening checkout…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Upgrade for ₹200/month
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            30 days access. Renew anytime. Powered by Razorpay.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
