import OpenAI from 'openai'
import 'dotenv/config'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Define function‐calling tools schema
export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'store_secret',
      description: 'Store a secret encrypted',
      parameters: {
        type: 'object',
        properties: {
          name:     { type: 'string' },
          ciphertext:{ type: 'string' },
          iv:       { type: 'string' },
          salt:     { type: 'string' }
        },
        required: ['name','ciphertext','iv','salt'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'rotate_secret',
      description: 'Rotate a secret and generate new random value',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'detect_anomaly',
      description: 'Detect unusual activity in the audit log',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_access',
      description: 'Check if a user can access a given secret',
      parameters: {
        type: 'object',
        properties: {
          user: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['user','name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_audit_log',
      description: 'Retrieve recent audit log entries',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'request_permission',
      description: 'Ask the user for permission before an action',
      parameters: {
        type: 'object',
        properties: {
          user:   { type: 'string' },
          action: { type: 'string' },
        },
        required: ['user','action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'call_webhook',
      description: 'Call an external webhook with signed payload',
      parameters: {
        type: 'object',
        properties: {
          url:     { type: 'string' },
          payload: { type: 'string' },
        },
        required: ['url','payload'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'compliance_check',
      description: 'Validate operations against a compliance policy',
      parameters: {
        type: 'object',
        properties: { policy: { type: 'string' } },
        required: ['policy'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'trigger_emergency',
      description: 'Emergency stop: lock all operations',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },{
    type: 'function' as const,
    function: {
      name: 'create_project',
      description: 'Create a new project and automatically provision dev and prod environments',
      parameters: {
        type: 'object',
        properties: {
          name:        { type: 'string', description: 'The project name' },
          description: { type: 'string', description: 'A short project description' }
        },
        required: ['name','description']
      }
    }
  },
]
