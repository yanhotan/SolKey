import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: Replace with actual database call
    const projects = [
      {
        id: '1',
        name: 'Sample Project',
        description: 'A sample project',
        environment: 'development',
        createdAt: new Date().toISOString(),
        environmentConfigs: {
          development: {
            configs: 2,            secrets: [
              { name: 'API_KEY', value: '*****', locked: true },
              { name: 'DATABASE_URL', value: '*****', locked: false }
            ]
          },          staging: {
            configs: 1,
            secrets: [
              { name: 'API_KEY', value: '*****', locked: true }
            ]
          },
          production: {
            configs: 1,
            secrets: [
              { name: 'API_KEY', value: '*****', locked: true }
            ]
          }
        }
      }
    ]

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
