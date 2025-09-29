import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/write-client';

export async function POST(request: Request) {
  try {
    const { userId, name, image } = await request.json();
    console.log('API received - userId:', userId, 'name:', name, 'image:', image);

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const patchOperations: { name?: string; image?: any } = {};
    if (name !== undefined) {
      patchOperations.name = name;
    }
    if (image && image._ref) {
      patchOperations.image = {
        _type: 'image',
        asset: {
          _ref: image._ref,
          _type: 'reference',
        },
      };
    }

    if (Object.keys(patchOperations).length === 0) {
      console.log('No fields to update, returning 400.');
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    console.log('Patching Sanity user with userId:', userId, 'patchOperations:', patchOperations);
    const updatedUser = await writeClient
      .patch(userId)
      .set(patchOperations)
      .commit();
    console.log('Sanity commit result:', updatedUser);

    return NextResponse.json({ message: 'Profile updated successfully', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Profile update failed' }, { status: 500 });
  }
}
