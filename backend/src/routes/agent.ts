import { Router, Request, Response } from 'express'
import { openai, tools } from '../openai'
import { toolFunctions } from '../tools'
import { ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/chat/completions'

const router = Router()

// Define the message type
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequestBody {
  messages: ChatMessage[]
}

interface ProjectRequestBody {
  message: string
}

router.post('/agent', async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  try {
    const messages = req.body.messages

    const systemMessage: ChatCompletionSystemMessageParam = {
      role: 'system',
      content: `You are SolSecure AI Agent. You can help users create and manage projects. When a user wants to create a project, use the create_project tool. Always use tools when needed.`
    }

    // Convert user messages to the correct type
    const userMessages: ChatCompletionUserMessageParam[] = messages
      .filter(msg => msg.role === 'user')
      .map(msg => ({
        role: 'user' as const,
        content: msg.content
      }))

    console.log('Processing request with messages:', messages)

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemMessage, ...userMessages],
      tools,
      tool_choice: 'auto'
    })

    const choice = chat.choices[0]
    if (!choice) {
      throw new Error('No response from OpenAI')
    }

    // If tool call is triggered
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
      const toolCall = choice.message.tool_calls[0]
      console.log('Tool call detected:', toolCall.function.name)
      
      const args = JSON.parse(toolCall.function.arguments || '{}')
      const tool = toolFunctions[toolCall.function.name as keyof typeof toolFunctions]

      if (!tool) {
        console.error("No tool handler found for:", toolCall.function.name)
        return res.status(500).json({ error: `No handler for tool: ${toolCall.function.name}` })
      }

      try {
        const result = await tool(args)
        console.log('Tool execution result:', result)
        return res.json({ tool: toolCall.function.name, output: result })
      } catch (error) {
        console.error('Tool execution error:', error)
        return res.status(500).json({ 
          error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          tool: toolCall.function.name
        })
      }
    }

    // Otherwise, respond with LLM output directly
    return res.json({ output: choice.message.content })
  } catch (error: unknown) {
    console.error('Error in agent endpoint:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    })
  }
})

router.post('/chat', async (req: Request<{}, {}, ProjectRequestBody>, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Extract project details from the message
    const projectDetails = await extractProjectDetails(message);
    
    // Create a simple project object
    const project = {
      id: Date.now().toString(), // Simple ID generation
      name: projectDetails.name,
      description: projectDetails.description,
      environments: 1,
      members: 1,
      status: "active",
      updatedAt: new Date().toISOString()
    };

    // Return the created project
    return res.json(project);
  } catch (error: unknown) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
});

// Helper function to extract project details from the message
async function extractProjectDetails(message: string) {
  // Use OpenAI to extract project details from the message
  const systemMessage: ChatCompletionSystemMessageParam = {
    role: "system",
    content: "Extract project name and description from the user's message. Return a JSON object with 'name' and 'description' fields."
  };

  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: message
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [systemMessage, userMessage],
    response_format: { type: "json_object" }
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('Failed to extract project details');
  }

  try {
    const details = JSON.parse(response);
    return {
      name: details.name || 'Untitled Project',
      description: details.description || 'No description provided'
    };
  } catch (error) {
    throw new Error('Failed to parse project details');
  }
}

export const agentRouter = router;
