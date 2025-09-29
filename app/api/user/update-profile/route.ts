import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/write-client';

export async function POST(request: Request) {
  try {
    const { userId, name, image } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const patchOperations: { name?: string; image?: any } = {};
    if (name !== undefined) {
      patchOperations.name = name;
    }
    if (image && image._ref) {
      // Sanity image field stores an asset reference, not a direct URL
      patchOperations.image = {
        _type: 'image',
        asset: {
          _ref: image._ref, // Assuming image object contains _ref
          _type: 'reference',
        },
      };
    }

    if (Object.keys(patchOperations).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await writeClient
      .patch(userId)
      .set(patchOperations)
      .commit();

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser }, { status: 200 });
  } catch (error) {
    // Log the error on the server for debugging, but don't expose it to the client
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Profile update failed' }, { status: 500 });
  }
}
