"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ConnectWalletButton } from "./connect-wallet-wallet-button";
import { useWallet } from "@solana/wallet-adapter-react";
import { BillingPayment } from "./billing-payment";
import { toast } from "sonner";

export function BillingPlans() {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isConnectWalletOpen, setIsConnectWalletOpen] = useState(false);
  const [currency, setCurrency] = useState<"usdc" | "sol">("usdc");

  const plans = [
    {
      id: "free",
      name: "Free",
      usdcPrice: "$0",
      solPrice: "0 SOL",
      description: "Perfect for solo developers and small projects",
      features: [
        "Up to 3 team members",
        "5 projects",
        "2 environments per project",
        "10 secrets",
        "7-day version history",
        "Basic support",
      ],
      cta: "Current Plan",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      basePrice: 20,
      usdcPrice: "$20",
      solPrice: "0.095 SOL",
      description: "For growing teams with advanced needs",
      features: [
        "First 3 users included",
        "Additional users: $20/user/month",
        "10 projects",
        "Unlimited environments",
        "10,000 secrets",
        "30-day version history",
        "Priority support",
        "Environment cloning",
        "Change-requests",
        "AI assistant",
      ],
      cta: "Upgrade",
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      usdcPrice: "Custom",
      solPrice: "Custom",
      description: "For organizations requiring maximum security and scale",
      features: [
        "Custom team size",
        "Unlimited projects",
        "Unlimited environments",
        "Unlimited secrets",
        "Unlimited version history",
        "24/7 dedicated support",
        "SAML SSO",
        "Audit logs",
        "Custom integrations",
        "SLA guarantees",
      ],
      cta: "Schedule Call",
      popular: false,
    },
  ];

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan) return;
    setIsConnectWalletOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Subscription Plans
        </h2>
        <p className="text-muted-foreground">
          Choose the plan that works best for your team
        </p>
      </div>

      <div className="rounded-md border bg-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200 dark:border-purple-800 w-fit">
            15% Discount with SOL
          </Badge>
          <p className="text-sm">
            Pay with SOL on Solana Chain for faster transactions and a 15%
            discount. Connect your Solana wallet to get started.
          </p>
        </div>
      </div>

      <Tabs
        value={currency}
        onValueChange={(v) => setCurrency(v as "usdc" | "sol")}
        className="w-[400px] mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="usdc" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
              $
            </div>
            USDC
          </TabsTrigger>
          <TabsTrigger value="sol" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full flex items-center justify-center">
              <Image
                src="/images/Solana_logo.png"
                alt="Wallet Logo"
                width={20}
                height={20}
              />
            </div>
            SOL (15% off)
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card
              className={`overflow-hidden h-full ${
                plan.popular ? "border-purple-500" : ""
              } ${currentPlan === plan.id ? "ring-2 ring-purple-500" : ""}`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 py-1 text-center text-sm font-medium text-white">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-purple-500">
                    {currency === "usdc" ? plan.usdcPrice : plan.solPrice}
                  </span>
                  {plan.id !== "enterprise" && (
                    <span className="ml-1 text-muted-foreground">/month</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${
                    plan.id === currentPlan
                      ? "bg-muted text-muted-foreground hover:bg-muted"
                      : plan.popular
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                      : ""
                  }`}
                  variant={
                    plan.id === currentPlan
                      ? "outline"
                      : plan.popular
                      ? "default"
                      : "outline"
                  }
                  disabled={plan.id === currentPlan}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.id === "enterprise"
                    ? "Schedule Call"
                    : plan.id === currentPlan
                    ? "Current Plan"
                    : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      {isConnectWalletOpen && (
        <SolanaWalletConnect
          onClose={() => setIsConnectWalletOpen(false)}
          currency={currency}
        />
      )}
    </div>
  );
}

function SolanaWalletConnect({
  onClose,
  currency,
}: {
  onClose: () => void;
  currency: "usdc" | "sol";
}) {
  const { publicKey, connected } = useWallet();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showPayment, setShowPayment] = useState(false);

  // Update wallet address when connection status changes
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toString();
      // Format address to show first 4 and last 4 characters
      const formattedAddress = `${address.substring(
        0,
        4
      )}...${address.substring(address.length - 4)}`;
      setWalletAddress(formattedAddress);
    } else {
      setWalletAddress("");
    }
  }, [connected, publicKey]);

  const handleContinue = () => {
    setShowPayment(true);
  };

  return (
    <>
      {!showPayment ? (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div
            className="bg-background border rounded-lg shadow-lg max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            {/* Existing connect wallet content */}
            <h3 className="text-xl font-bold mb-4">
              Connect Your Solana Wallet
            </h3>
            <p className="text-muted-foreground mb-6">
              Connect your Solana wallet to make a payment in{" "}
              {currency === "usdc" ? "USDC" : "SOL"}.
              {currency === "sol" &&
                " Enjoy a 15% discount when paying with SOL!"}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 border rounded-md hover:bg-accent/50 cursor-pointer">
                <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-white">
                  <svg viewBox="0 0 32 32" className="h-3 w-3">
                    <path
                      d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0z"
                      fill="#AB9FF2"
                    />
                    <path
                      d="M17.2 19.84l-4.48 4.48c-.32.32-.8.32-1.12 0l-1.12-1.12c-.32-.32-.32-.8 0-1.12l4.48-4.48-4.48-4.48c-.32-.32-.32-.8 0-1.12l1.12-1.12c.32-.32.8-.32 1.12 0l4.48 4.48 4.48-4.48c.32-.32.8-.32 1.12 0l1.12 1.12c.32.32.32.8 0 1.12l-4.48 4.48 4.48 4.48c.32.32.32.8 0 1.12l-1.12 1.12c-.32.32-.8.32-1.12 0l-4.48-4.48z"
                      fill="#fff"
                    />
                  </svg>
                </div>
                <div className="flex flex-1 items-center w-full justify-between">
                  <span>Phantom</span>
                  <span>
                    {connected && walletAddress ? (
                      <Button variant="ghost" size="sm" className="gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        {walletAddress}
                      </Button>
                    ) : (
                      <ConnectWalletButton />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-md hover:bg-accent/50 cursor-pointer">
                <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  <svg viewBox="0 0 32 32" className="h-3 w-3">
                    <path
                      d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0z"
                      fill="#FE8F2D"
                    />
                    <path
                      d="M20.8 10.4h-9.6c-1.76 0-3.2 1.44-3.2 3.2v4.8c0 1.76 1.44 3.2 3.2 3.2h9.6c1.76 0 3.2-1.44 3.2-3.2v-4.8c0-1.76-1.44-3.2-3.2-3.2z"
                      fill="#fff"
                    />
                  </svg>
                </div>
                <div className="flex flex-1 items-center w-full justify-between">
                  <span>Solflare</span>
                  <span>
                    {connected && walletAddress ? (
                      <Button variant="ghost" size="sm" className="gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        {walletAddress}
                      </Button>
                    ) : (
                      <ConnectWalletButton />
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              {connected && (
                <Button variant="default" onClick={handleContinue}>
                  Continue to Payment
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      ) : (
        <BillingPayment
          onClose={onClose}
          onSuccess={() => {
            setTimeout(() => {
              toast.success("Subscription upgraded successfully!");
              onClose();
            }, 3000);
          }}
          onError={(error) => {
            console.error("Payment error:", error);
            toast.error("Payment failed. Please try again.");
            setShowPayment(false); // Go back to wallet connection
          }}
          amount={currency === "sol" ? 0.095 : 20}
          currency={currency}
        />
      )}
    </>
  );
}
