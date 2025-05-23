"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Send, User, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

// Sample FAQ data for answering questions
const faqs = [
  {
    question: "How does the team pricing work?",
    answer:
      "Our pricing is based on the number of team members. The free plan includes up to 3 team members. For the Pro plan, you'll be charged $20/month for each additional user beyond the first 3. For example, a team of 5 would pay $40/month (2 additional users × $20).",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept payments in both USDC and SOL. When paying with SOL, you'll receive a 15% discount on your subscription. All transactions are processed on the Solana blockchain.",
  },
  {
    question: "How do I upgrade my subscription?",
    answer:
      "You can upgrade your subscription from the Billing page. Connect your Solana wallet, select your desired plan, and complete the payment. The changes will take effect immediately.",
  },
  {
    question: "Can I downgrade my subscription?",
    answer:
      "Yes, you can downgrade your subscription at any time. The changes will take effect at the end of your current billing cycle.",
  },
  {
    question: "What happens if I exceed my plan limits?",
    answer:
      "If you exceed your plan limits (such as the number of secrets or projects), you'll be notified and prompted to upgrade to a higher tier. We provide a 7-day grace period before enforcing the limits.",
  },
  {
    question: "How secure is my data?",
    answer:
      "Your data is encrypted end-to-end using your wallet-derived encryption key. This means only you can access your unencrypted secrets. We never have access to your unencrypted data.",
  },
  {
    question: "What is the difference between environments?",
    answer:
      "Environments allow you to manage different sets of secrets for different stages of your development process (e.g., development, staging, production). Each environment has its own set of secrets.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel your subscription at any time from the Billing page. Your subscription will remain active until the end of your current billing cycle.",
  },
]

// Sample suggested questions
const suggestedQuestions = [
  "How does the team pricing work?",
  "What payment methods do you accept?",
  "How do I upgrade my subscription?",
  "What happens if I exceed my plan limits?",
  "How secure is my data?",
]

type Message = {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your SolSecure AI assistant. How can I help you with your subscription or secrets management today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI thinking
    setTimeout(() => {
      // Find a matching FAQ or provide a default response
      const matchingFaq = faqs.find(
        (faq) =>
          faq.question.toLowerCase().includes(input.toLowerCase()) ||
          input.toLowerCase().includes(faq.question.toLowerCase().split(" ").slice(0, 3).join(" ")),
      )

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: matchingFaq
          ? matchingFaq.answer
          : "I don't have specific information about that. Please try asking about our subscription plans, payment methods, or security features.",
        sender: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    // Focus the input
    document.getElementById("message-input")?.focus()
  }

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <div className="p-4 flex items-center gap-2 border-b">
        <Avatar className="h-8 w-8 bg-primary/10 flex items-center justify-center">
          <Image 
            src="/images/solsecure_logo.png" 
            alt="SolSecure AI" 
            width={20} 
            height={20}
            className="text-primary object-contain"
          />
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">SolSecure Assistant</h2>
          <CardDescription>Powered by AI</CardDescription>
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-4 h-[calc(100%-8rem)]">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className={`h-8 w-8 ${message.sender === "assistant" ? "bg-primary/10" : "bg-secondary"} flex items-center justify-center`}>
                    {message.sender === "assistant" ? (
                      <Image 
                        src="/images/solsecure_logo.png" 
                        alt="SolSecure AI" 
                        width={20} 
                        height={20}
                        className="text-primary object-contain"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </Avatar>
                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 bg-primary/10 flex items-center justify-center">
                    <Image 
                      src="/images/solsecure_logo.png" 
                      alt="SolSecure AI" 
                      width={20} 
                      height={20}
                      className="text-primary object-contain"
                    />
                  </Avatar>
                  <div className="rounded-lg p-3 bg-muted flex items-center">
                    <div className="flex space-x-1">
                      <motion.div
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0 }}
                      />
                      <motion.div
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0.2 }}
                      />
                      <motion.div
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleSuggestedQuestion(question)}
              className="text-xs"
            >
              {question}
            </Button>
          ))}
        </div>
      </div>

      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center gap-2">
          <Input
            id="message-input"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon" disabled={!input.trim() || isTyping} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setMessages([
                {
                  id: "welcome",
                  content:
                    "Hello! I'm your SolSecure AI assistant. How can I help you with your subscription or secrets management today?",
                  sender: "assistant",
                  timestamp: new Date(),
                },
              ])
            }}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
