import crypto from 'crypto'
import { createProject } from '../db/projects'

type AuditEntry = { action: string; name?: string; user?: string; timestamp: Date }

// In-memory stores
const secretsStore: Record<string, { ciphertext: string; iv: string; salt: string }> = {}
const auditLog: AuditEntry[] = []
let emergencyLocked = false

export const toolFunctions = {
  create_project: async ({ name, description }: { name: string; description: string }) => {
    try {
      const project = await createProject({
        name,
        description,
        environments: ['dev', 'prod'],
        creatorId: process.env.DEFAULT_CREATOR_ID || 'default-creator-id'
      })
      
      auditLog.push({ 
        action: 'create_project', 
        name, 
        timestamp: new Date() 
      })
      
      return JSON.stringify({
        success: true,
        message: `Project "${name}" created successfully`,
        project
      })
    } catch (error) {
      console.error('Error creating project:', error)
      throw new Error(`Failed to create project: ${error.message}`)
    }
  },

  store_secret: ({ name, ciphertext, iv, salt }: { name: string; ciphertext: string; iv: string; salt: string }) => {
    if (emergencyLocked) throw new Error('🔒 Locked by emergency stop')
    secretsStore[name] = { ciphertext, iv, salt }
    auditLog.push({ action: 'store_secret', name, timestamp: new Date() })
    return `🔐 Secret '${name}' stored securely.`
  },

  rotate_secret: ({ name }: { name: string }) => {
    if (emergencyLocked) throw new Error('🔒 Locked by emergency stop')
    const newVal = crypto.randomBytes(16).toString('hex')
    auditLog.push({ action: 'rotate_secret', name, timestamp: new Date() })
    return `🔄 Secret '${name}' rotated to '${newVal.slice(0,6)}…'.`
  },

  detect_anomaly: () => {
    const oneMinAgo = Date.now() - 60_000
    const recent = auditLog.filter((e) => e.timestamp.getTime() > oneMinAgo)
    const anomaly = recent.length > 5
    auditLog.push({ action: 'detect_anomaly', timestamp: new Date() })
    return anomaly ? '⚠️ Anomaly detected' : '✅ No anomalies'
  },

  check_access: ({ user, name }: { user: string; name: string }) => {
    // Example: only admin can access prod_ secrets
    const allowed = !(name.startsWith('prod_') && user !== 'admin')
    auditLog.push({ action: 'check_access', name, user, timestamp: new Date() })
    return allowed ? `✅ ${user} may access '${name}'` : `🚫 ${user} denied access to '${name}'`
  },

  get_audit_log: () => {
    return auditLog.slice(-10).map((e) => `${e.timestamp.toISOString()} • ${e.action}`)
  },

  request_permission: ({ user, action }: { user: string; action: string }) => {
    auditLog.push({ action: `request_permission:${action}`, user, timestamp: new Date() })
    return `🛑 Permission requested from ${user} for '${action}'.`
  },

  call_webhook: ({ url, payload }: { url: string; payload: string }) => {
    auditLog.push({ action: 'call_webhook', timestamp: new Date() })
    return `🔗 Called webhook at ${url} with payload.`
  },

  compliance_check: ({ policy }: { policy: string }) => {
    auditLog.push({ action: 'compliance_check', timestamp: new Date() })
    return `✅ Policy '${policy}' is compliant.`
  },

  trigger_emergency: () => {
    emergencyLocked = true
    auditLog.push({ action: 'trigger_emergency', timestamp: new Date() })
    return '⛔ Emergency stop engaged.'
  },
}
