import type { Metadata } from "next"
import { AIAssistant } from "@/components/ai-assistant"

export const metadata: Metadata = {
  title: "AI Assistant - SolSecure",
  description: "Get help with your subscription and secrets management",
}

export default function AIAssistantPage() {
  return <AIAssistant />
}
