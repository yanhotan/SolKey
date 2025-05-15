import crypto from 'crypto'
import 'dotenv/config' // <- MUST be at the top!

/**
 * Load your teammates' JS helpers directly.
 * Because tsconfig now includes db/ and lib/, these require() calls resolve.
 */
const DEFAULT_CREATOR_ID = process.env.DEFAULT_CREATOR_ID!

const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require('../db/projects.js')

const {
  createSecret,
  getSecret,
  shareSecret,
  deriveKeyFromSignature,
} = require('../lib/crypto.js')

type AuditEntry = { action: string; name?: string; user?: string; timestamp: Date }

// In-memory stores for demo
const secretsStore: Record<string, { ciphertext: string; iv: string; salt: string }> = {}
const auditLog: AuditEntry[] = []
let emergencyLocked = false

export const toolFunctions = {
  // ─── Project Tools ───────────────────────────────────────────────────────
  list_projects: async (): Promise<string> => {
    const projs = await getAllProjects()
    return JSON.stringify(projs, null, 2)
  },

  get_project: async ({ id }: { id: string }): Promise<string> => {
    const proj = await getProjectById(id)
    return JSON.stringify(proj, null, 2)
  },

  create_project: async ({
    name,
    description
  }: {
    name: string
    description: string
  }): Promise<string> => {
    // Call your teammate’s helper, plus creatorId
    const project = await createProject({
      name,
      description,
      environments: ['dev', 'prod'],
      creatorId: DEFAULT_CREATOR_ID,      // <<— new
    })
    return JSON.stringify(project, null, 2)
  },

  update_project: async ({
    id,
    updates
  }: {
    id: string
    updates: Record<string, any>
  }): Promise<string> => {
    const proj = await updateProject(id, updates)
    return JSON.stringify(proj, null, 2)
  },

  delete_project: async ({ id }: { id: string }): Promise<string> => {
    await deleteProject(id)
    return `Project ${id} deleted.`
  },

  // ─── Secret Tools ────────────────────────────────────────────────────────
  create_secret: async (params: {
    projectId: string
    environmentId: string
    name: string
    value: string
    type: string
    signature: string
    userId: string
  }): Promise<string> => {
    const secret = await createSecret(
      params.projectId,
      params.environmentId,
      params.name,
      params.value,
      params.type,
      params.signature,
      params.userId
    )
    return JSON.stringify(secret, null, 2)
  },

  get_secret: async ({ secretId, signature }: { secretId: string; signature: string }): Promise<string> => {
    const secret = await getSecret(secretId, signature)
    return JSON.stringify(secret, null, 2)
  },

  share_secret: async (params: {
    secretId: string
    targetUserId: string
    targetSignature: string
    creatorSignature: string
  }): Promise<string> => {
    const result = await shareSecret(
      params.secretId,
      params.targetUserId,
      params.targetSignature,
      params.creatorSignature
    )
    return JSON.stringify(result, null, 2)
  },

  derive_key: async ({ signature }: { signature: string }): Promise<string> => {
    const key = await deriveKeyFromSignature(signature)
    return key.toString('hex')
  },
}