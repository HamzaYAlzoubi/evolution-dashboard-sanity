import { NextResponse } from 'next/server';
import { writeClient } from '@/sanity/lib/write-client';

if (!process.env.SANITY_API_WRITE_TOKEN) {
  console.error('SANITY_API_WRITE_TOKEN is not set. Avatar upload will fail.');
}


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image to Sanity asset store
    const asset = await writeClient.assets.upload('image', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    // The asset object returned by Sanity already contains the final URL
    const imageUrl = asset.url;

    // Update the user document with the new image asset reference
    const updatedUser = await writeClient
      .patch(userId)
      .set({
        image: {
          _type: 'image',
          asset: {
            _ref: asset._id,
            _type: 'reference',
          },
        },
      })
      .commit();

    return NextResponse.json({ message: 'Avatar uploaded successfully', imageUrl, assetRef: asset._id, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('--- [upload-avatar] Error ---', error);
    return NextResponse.json({ message: 'Avatar upload failed' }, { status: 500 });
  }
}
