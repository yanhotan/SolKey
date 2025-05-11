interface LocalProject {
  id: string
  name: string
  description: string
  environments: string[]
  createdAt: string
  updatedAt: string
  status: 'active' | 'inactive'
  encryptionKey?: string
}

export const saveProject = (project: LocalProject) => {
  try {
    // Get existing projects or initialize empty array
    const existingProjects = JSON.parse(localStorage.getItem('solkey_projects') || '[]')
    
    // Add new project
    existingProjects.push(project)
    
    // Save back to localStorage
    localStorage.setItem('solkey_projects', JSON.stringify(existingProjects))
    
    return true
  } catch (error) {
    console.error('Failed to save project to localStorage:', error)
    return false
  }
}

export const getProjects = (): LocalProject[] => {
  try {
    return JSON.parse(localStorage.getItem('solkey_projects') || '[]')
  } catch {
    return []
  }
}

export const getProject = (id: string): LocalProject | null => {
  try {
    const projects = getProjects()
    return projects.find(p => p.id === id) || null
  } catch {
    return null
  }
}
