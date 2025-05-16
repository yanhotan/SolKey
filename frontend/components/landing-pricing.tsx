"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

export function LandingPricing() {
  const [currency, setCurrency] = useState<"usdc" | "sol">("usdc")

  const plans = [
    {
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
      cta: "Get Started",
      popular: false,
    },
    {
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
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
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
  ]

  return (
    <section className="py-20 md:py-32" id="pricing">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Simple, Transparent Pricing</h2>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Pay with USDC or SOL tokens for faster transactions and lower fees
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <Tabs value={currency} onValueChange={(v) => setCurrency(v as "usdc" | "sol")} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="usdc" className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                  $
                </div>
                USDC
              </TabsTrigger>
              <TabsTrigger value="sol" className="flex items-center gap-2">
                <div className="h-5 w-5 flex items-center justify-center">
                  <Image
                    src="/images/Solana_logo.png"
                    alt="Solana Logo"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </div>
                SOL (15% off)
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * index + 0.3 }}
              whileHover={{ y: -5 }}
              className={`rounded-lg border ${plan.popular ? "border-purple-500 bg-card/60" : "bg-card"} p-8 shadow-sm relative`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-bold text-purple-500">
                    {currency === "usdc" ? plan.usdcPrice : plan.solPrice}
                  </span>
                  {plan.name !== "Enterprise" && <span className="ml-1 text-muted-foreground">/month</span>}
                </div>
                <p className="mt-2 text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${plan.popular ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" : ""}`}
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href="/signup">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/30 px-4 py-2 rounded-full">
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 border-purple-200 dark:border-purple-800">
              Solana Powered
            </Badge>
            <p className="text-sm">Fast, secure payments with minimal transaction fees</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
