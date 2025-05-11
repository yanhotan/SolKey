import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, environment } = body

    // TODO: Replace with actual database call
    const project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      description,
      environment,
      createdAt: new Date().toISOString(),
      environmentConfigs: {
        development: {
          configs: 0,
          secrets: []
        },
        staging: {
          configs: 0,
          secrets: []
        },
        production: {
          configs: 0,
          secrets: []
        }
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
