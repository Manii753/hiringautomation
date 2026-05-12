import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Candidate from '@/lib/models/Candidate';

export async function POST(request, context) {
  const { id } = await context.params;
  const fileId = id;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const authorId = session.user.id || session.user.email;
    if (!authorId) {
      return NextResponse.json({ error: 'Unable to identify author' }, { status: 400 });
    }

    await dbConnect();

    const comment = {
      text: text.trim(),
      authorId: String(authorId),
      authorName: session.user.name || '',
      authorEmail: session.user.email || '',
      authorImage: session.user.image || '',
    };

    const candidate = await Candidate.findOneAndUpdate(
      { fileId },
      {
        $push: { comments: comment },
        $setOnInsert: { fileId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const added = candidate.comments[candidate.comments.length - 1];
    return NextResponse.json({ comment: added });
  } catch (error) {
    console.error(`Error adding comment to candidate ${fileId}:`, error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
