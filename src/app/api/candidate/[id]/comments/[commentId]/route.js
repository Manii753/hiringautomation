import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Candidate from '@/lib/models/Candidate';

function getAuthorId(session) {
  return session?.user?.id || session?.user?.email || null;
}

export async function PATCH(request, context) {
  const { id, commentId } = await context.params;
  const fileId = id;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authorId = getAuthorId(session);
  if (!authorId) {
    return NextResponse.json({ error: 'Unable to identify user' }, { status: 400 });
  }

  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    await dbConnect();

    const candidate = await Candidate.findOne({ fileId });
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const comment = candidate.comments.id(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (String(comment.authorId) !== String(authorId)) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }

    comment.text = text.trim();
    await candidate.save();

    return NextResponse.json({ comment });
  } catch (error) {
    console.error(`Error updating comment ${commentId} on candidate ${fileId}:`, error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { id, commentId } = await context.params;
  const fileId = id;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authorId = getAuthorId(session);
  if (!authorId) {
    return NextResponse.json({ error: 'Unable to identify user' }, { status: 400 });
  }

  try {
    await dbConnect();

    const candidate = await Candidate.findOne({ fileId });
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const comment = candidate.comments.id(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (String(comment.authorId) !== String(authorId)) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    candidate.comments.pull(commentId);
    await candidate.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting comment ${commentId} on candidate ${fileId}:`, error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
