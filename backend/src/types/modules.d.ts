declare module "../db/projects" {
  export function getAllProjects(): Promise<any[]>;
  export function getProjectById(id: string): Promise<any>;
  export function createProject(data: any): Promise<any>;
  export function updateProject(id: string, updates: any): Promise<any>;
  export function deleteProject(id: string): Promise<void>;
}

declare module "../lib/crypto" {
  export function createSecret(
    projectId: string,
    environmentId: string,
    name: string,
    value: string,
    type: string,
    creatorSignature: string,
    creatorUserId: string
  ): Promise<any>;
  export function getSecret(secretId: string, userSignature: string): Promise<any>;
  export function shareSecret(
    secretId: string,
    targetUserId: string,
    targetSignature: string,
    creatorSignature: string
  ): Promise<any>;
  export function deriveKeyFromSignature(signature: string): Promise<Buffer>;
}
