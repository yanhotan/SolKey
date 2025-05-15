import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { agentRouter } from './routes/agent'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', agentRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})