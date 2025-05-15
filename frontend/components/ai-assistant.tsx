"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Bot, Send, User, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
      content: "Hello! I'm your SolSecure AI assistant. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ─── handleSendMessage ────────────────────────────────────────────────────
  // Fires when user clicks “Send” or presses Enter
  const handleSendMessage = async () => {
    if (!input.trim() || !BACKEND) return

    // 1. Add the user’s message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      // 2. Call your AI-agent backend
      const res = await fetch(`${BACKEND}/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .concat(userMessage)
            .map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.content })),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error("Agent API error:", res.status, text)
        throw new Error(text)
      }
      const data = await res.json()

      // 3. Add assistant’s reply
      const text = data.output ?? `✅ ${data.tool}: ${data.output}`
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: text,
        sender: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: "⚠️ Error talking to server. Please try again.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // ─── handleTestAction ─────────────────────────────────────────────────────
  // Fires when a “Test: …” button is clicked
  const handleTestAction = async (label: string) => {
    // Reuse handleSendMessage logic: just send the label as the prompt
    setInput("")             // clear input
    setIsTyping(true)
    const testMsg: Message = { id: Date.now().toString(), content: label, sender: "user", timestamp: new Date() }
    setMessages((prev) => [...prev, testMsg])

    try {
      const res = await fetch(`${BACKEND}/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: label }] }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const text = data.output ?? `✅ ${data.tool}: ${data.output}`
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), content: text, sender: "assistant", timestamp: new Date() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), content: "⚠️ Server error", sender: "assistant", timestamp: new Date() },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // ─── handleKeyDown ────────────────────────────────────────────────────────
  // Send on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Card className="h-[calc(100vh-12rem)]">
      <div className="p-4 flex items-center gap-2 border-b">
        <Avatar className="h-8 w-8 bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">SolSecure Assistant</h2>
          <CardDescription>Powered by AI</CardDescription>
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-4 h-[calc(100%-8rem)]">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${m.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className={`h-8 w-8 ${m.sender === "assistant" ? "bg-primary/10" : "bg-secondary"}`}>
                    {m.sender === "assistant" ? <Bot className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
                  </Avatar>
                  <div className={`rounded-lg p-3 ${m.sender === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                    <p className="text-sm">{m.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8 bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </Avatar>
                  <div className="rounded-lg p-3 bg-muted flex items-center">
                    <div className="flex space-x-1">
                      {[0, 0.2, 0.4].map((d, i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-primary"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: d }}
                        />
                      ))}
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
        {/* ── TEST ACTIONS ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            "Keep Secrets Safe on Your Device",
            "Manage Your Secret Keys Securely",
            "Regularly Change Secrets Automatically",
            "Watch for Unusual Activity",
            "Control Who Sees What",
            "Keep a Record of Actions",
          ].map((label) => (
            <Button key={label} variant="secondary" size="sm" className="text-xs" onClick={() => handleTestAction(label)}>
              {label}
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
          <Button onClick={handleSendMessage} size="icon" disabled={!input.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setMessages([
                {
                  id: "welcome",
                  content: "Hello! I'm your SolSecure AI assistant. How can I help you today?",
                  sender: "assistant",
                  timestamp: new Date(),
                },
              ])
            }
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}