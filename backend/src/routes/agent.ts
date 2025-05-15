import { Router, Request, Response, NextFunction } from 'express'
import { openai, tools } from '../openai'
import { toolFunctions } from '../tools'
import 'dotenv/config'

const router = Router()

router.post('/agent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const system = { role: 'system', content: 'You are SolSecure AI Agent. Only use tools.' }
    const userMsgs = req.body.messages

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [system, ...userMsgs],
      tools,
      tool_choice: 'auto',
    })

    const choice = chat.choices[0]!
    if (choice.finish_reason === 'tool_calls') {
      const call = choice.message.tool_calls![0]!
      const args = JSON.parse(call.function.arguments || '{}')
      const fn = toolFunctions[call.function.name as keyof typeof toolFunctions]
      if (!fn) {
        throw new Error(`No tool handler for "${call.function.name}"`)
      }
      const output = await fn(args)
      return res.json({ tool: call.function.name, output })
    }

    return res.json({ output: choice.message.content })
  } catch (err) {
    console.error('Error in /api/agent:', err)
    // If it's an Error, use err.message; otherwise, stringify
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return res.status(500).json({ error: message })
  }
})

export const agentRouter = router