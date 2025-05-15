import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { agentRouter } from './routes/agent'
import OpenAI from 'openai'

const app = express()
app.use(cors())
app.use(express.json())

// ✅ Add this test route
app.get('/api/test-openai', async (req, res) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Say hello!' }],
    })
    res.json({ ok: true, message: result.choices[0].message.content })
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error) })
  }
})

// ✅ Mount your AI assistant route
app.use('/api', agentRouter)

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
