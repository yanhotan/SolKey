"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardPreview } from "@/components/dashboard-preview"
import { motion } from "framer-motion"

export function LandingHero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden" id="hero">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center opacity-10"></div>
      <div className="container relative z-10 flex flex-col items-center text-center">
        <motion.div
          className="mx-auto max-w-5xl space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-6xl lg:text-7xl flex flex-col">
            <span className="bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[size:200%_auto] whitespace-nowrap">
              Lock Down Your Env Secrets.
            </span>
            <span className="bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[size:200%_auto] whitespace-nowrap leading-[1.15]">
              Only Your Wallet Holds the Key
            </span>
          </h1>
          <p className="mx-auto max-w-4.05xl text-muted-foreground md:text-xl">
            SolSecure protects your API keys and environment variables with end-to-end encryption tied to your 
            <br />
            Solana wallet — no passwords, no leaks, no compromises. Just pure, wallet-based control.
          </p>
        </motion.div>
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Learn More</Link>
          </Button>
        </motion.div>
        <motion.div
          className="mt-16 relative w-full max-w-5xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="rounded-lg border bg-background/50 shadow-xl backdrop-blur-sm overflow-hidden">
            <DashboardPreview />
          </div>
          <motion.div
            className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 blur-3xl opacity-50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />
          <motion.div
            className="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 blur-3xl opacity-50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              delay: 2,
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}
