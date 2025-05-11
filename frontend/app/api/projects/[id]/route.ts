import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Replace with actual database call
    const project = {
      id: params.id,
      name: 'Sample Project',
      description: 'A sample project',
      environment: 'development',
      createdAt: new Date().toISOString(),
      environmentConfigs: {
        development: {
          configs: 2,
          secrets: [
            { name: 'API_KEY', value: '*****' },
            { name: 'DATABASE_URL', value: '*****' }
          ]
        },
        staging: {
          configs: 1,
          secrets: [
            { name: 'API_KEY', value: '*****' }
          ]
        },
        production: {
          configs: 1,
          secrets: [
            { name: 'API_KEY', value: '*****' }
          ]
        }
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}
