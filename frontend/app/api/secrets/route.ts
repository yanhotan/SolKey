import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This would be replaced with your actual database connection
const secrets = new Map();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const environment = searchParams.get('environment');

    if (!projectId || !environment) {
      return new NextResponse('Missing projectId or environment', { status: 400 });
    }

    // Filter secrets by project and environment
    const projectSecrets = Array.from(secrets.values()).filter(secret => 
      secret.projectId === projectId && secret.environment === environment
    );

    return NextResponse.json(projectSecrets);
  } catch (error) {
    console.error('Error in GET /api/secrets:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const secret = await request.json();
    
    // Validate all required fields
    const requiredFields = ['key', 'encryptedData', 'projectId', 'environment', 'id'];
    const missingFields = requiredFields.filter(field => !secret[field]);
    
    if (missingFields.length > 0) {
      return new NextResponse(
        `Missing required fields: ${missingFields.join(', ')}`, 
        { status: 400 }
      );
    }

    // Validate encryptedData structure
    if (!secret.encryptedData.encrypted || !secret.encryptedData.nonce || !secret.encryptedData.authHash) {
      return new NextResponse(
        'Invalid encryptedData structure', 
        { status: 400 }
      );
    }

    // Check for duplicate key in the same project/environment
    const existingSecret = Array.from(secrets.values()).find(s => 
      s.key === secret.key && 
      s.projectId === secret.projectId && 
      s.environment === secret.environment
    );

    if (existingSecret) {
      return new NextResponse(
        'A secret with this key already exists in this project/environment', 
        { status: 409 }
      );
    }

    // Store the secret
    secrets.set(secret.id, secret);

    return NextResponse.json(secret);
  } catch (error) {
    console.error('Error in POST /api/secrets:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing secret id', { status: 400 });
    }

    if (!secrets.has(id)) {
      return new NextResponse('Secret not found', { status: 404 });
    }

    secrets.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/secrets:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
