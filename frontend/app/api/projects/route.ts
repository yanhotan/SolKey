import { NextResponse } from 'next/server'

interface ProjectData {
  name: string;
  description?: string;
  environments?: string[];
}

export async function POST(request: Request) {
  try {
    const data: ProjectData = await request.json()
    console.log('Received project data:', data)
    
    // Validate required fields
    if (!data.name) {
      console.error('Project name missing')
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Name length validation
    if (data.name.length > 100) {
      return NextResponse.json({ error: 'Project name must be 100 characters or less' }, { status: 400 })
    }

    // Description length validation
    if (data.description && data.description.length > 500) {
      return NextResponse.json({ error: 'Project description must be 500 characters or less' }, { status: 400 })
    }

    // Get wallet signature from header
    const walletSignature = request.headers.get('x-wallet-signature')
    if (!walletSignature) {
      console.error('Wallet signature missing')
      return NextResponse.json({ error: 'Wallet signature is required' }, { status: 400 })
    }
    console.log('Wallet signature:', walletSignature.slice(0, 10) + '...')

    // Validate environments if provided
    const validEnvTypes = ['development', 'staging', 'production', 'custom']
    if (data.environments) {
      for (const env of data.environments) {
        if (!validEnvTypes.includes(env.toLowerCase())) {
          return NextResponse.json({ 
            error: `Invalid environment type: ${env}. Must be one of: ${validEnvTypes.join(', ')}` 
          }, { status: 400 })
        }
      }
    }

    // Forward the fields to backend for encryption
    const project: ProjectData = {
      name: data.name.trim(),
      description: data.description?.trim() || '',
      environments: (data.environments || ['development']).map(env => env.toLowerCase())
    }

    // Connect to the backend server
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const apiUrl = `${backendUrl}/api/projects`
    console.log('Sending to backend:', {
      url: apiUrl,
      data: project,
      hasSignature: true,
      signaturePrefix: walletSignature.slice(0, 10) + '...'
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-signature': walletSignature
      },
      body: JSON.stringify(project)
    })

    console.log('Backend response status:', response.status)
    let responseData
    try {
      responseData = await response.json()
      console.log('Backend response data:', {
        status: responseData.message,
        projectId: responseData.project?._id,
        error: responseData.error,
        details: responseData.details
      })
    } catch (error) {
      console.error('Failed to parse backend response:', error)
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      )
    }

    if (!response.ok) {
      console.error('Backend error:', {
        status: response.status,
        error: responseData.error,
        details: responseData.details
      })
      return NextResponse.json(
        { 
          error: responseData.error || 'Failed to create project',
          details: responseData.details
        },
        { status: response.status }
      )
    }

    // Validate response data
    if (!responseData.project?._id) {
      console.error('Invalid project response:', responseData)
      return NextResponse.json(
        { error: 'Invalid project data received from server' },
        { status: 500 }
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error creating project:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
