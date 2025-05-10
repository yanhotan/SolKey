import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  // Delete from your database here
  // For now, we'll just return success
  return new NextResponse(null, { status: 204 });
}
