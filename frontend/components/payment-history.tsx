"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

export function PaymentHistory() {
  // Sample payment history data with Solana transactions
  const payments = [
    {
      id: "INV-001",
      date: "May 1, 2023",
      solAmount: "0.095 SOL",
      usdcAmount: "20 USDC",
      usdEquivalent: "~$20.00",
      status: "paid",
      method: "Solana",
      currency: "SOL",
      plan: "Pro",
      txHash: "5UxV7...dT31",
      txLink: "https://explorer.solana.com/tx/5UxV7dT31",
    },
    {
      id: "INV-002",
      date: "April 1, 2023",
      solAmount: "0.093 SOL",
      usdcAmount: "20 USDC",
      usdEquivalent: "~$20.00",
      status: "paid",
      method: "Solana",
      currency: "SOL",
      plan: "Pro",
      txHash: "7YzP9...kR42",
      txLink: "https://explorer.solana.com/tx/7YzP9kR42",
    },
    {
      id: "INV-003",
      date: "March 1, 2023",
      solAmount: "0.092 SOL",
      usdcAmount: "20 USDC",
      usdEquivalent: "~$20.00",
      status: "paid",
      method: "USDC",
      currency: "USDC",
      plan: "Pro",
      txHash: "3MqL8...jF17",
      txLink: "https://explorer.solana.com/tx/3MqL8jF17",
    },
    {
      id: "INV-004",
      date: "February 1, 2023",
      solAmount: "0.096 SOL",
      usdcAmount: "20 USDC",
      usdEquivalent: "~$20.00",
      status: "paid",
      method: "Credit Card",
      currency: "USD",
      plan: "Pro",
      txHash: null,
      txLink: null,
    },
    {
      id: "INV-005",
      date: "January 1, 2023",
      solAmount: "0 SOL",
      usdcAmount: "0 USDC",
      usdEquivalent: "$0.00",
      status: "free",
      method: "-",
      currency: "-",
      plan: "Free",
      txHash: null,
      txLink: null,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View your past payments and transaction details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium text-muted-foreground">
            <div className="col-span-2">Invoice</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">Transaction</div>
          </div>
          {payments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`grid grid-cols-12 gap-4 p-4 ${index !== payments.length - 1 ? "border-b" : ""}`}
            >
              <div className="col-span-2 font-medium">{payment.id}</div>
              <div className="col-span-2">{payment.date}</div>
              <div className="col-span-2">
                {payment.currency === "SOL" ? (
                  <div className="font-medium text-purple-500 flex items-center gap-1">
                    <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px]">
                      ◎
                    </div>
                    {payment.solAmount}
                  </div>
                ) : payment.currency === "USDC" ? (
                  <div className="font-medium text-blue-500 flex items-center gap-1">
                    <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">
                      $
                    </div>
                    {payment.usdcAmount}
                  </div>
                ) : (
                  <div className="font-medium">{payment.usdEquivalent}</div>
                )}
                <div className="text-xs text-muted-foreground">{payment.usdEquivalent}</div>
              </div>
              <div className="col-span-2">
                <Badge
                  variant="outline"
                  className={
                    payment.status === "paid"
                      ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                      : "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400"
                  }
                >
                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </Badge>
              </div>
              <div className="col-span-2">
                {payment.method === "Solana" ? (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                  >
                    {payment.method}
                  </Badge>
                ) : (
                  payment.method
                )}
                
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {payment.txHash ? (
                  <>
                    <span className="text-xs font-mono truncate max-w-[80px]">{payment.txHash}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                      <a
                        href={`https://explorer.solana.com/tx/${payment.txHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="sr-only">View transaction</span>
                      </a>
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
                {payment.status === "paid" && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                    <Download className="h-3 w-3" />
                    <span className="sr-only">Download invoice</span>
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
