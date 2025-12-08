import { NextRequest, NextResponse } from 'next/server';
import { getEM } from '@/src/lib/db';
import { Post } from '@/src/entities/Post';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const em = await getEM();
    const { id } = await params;

    const post = await em.findOne(Post, { id });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const em = await getEM();
    const { id } = await params;
    const body = await request.json();

    const post = await em.findOne(Post, { id });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const { title, content, author, published } = body;

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (author !== undefined) post.author = author;
    if (published !== undefined) post.published = published;

    post.updatedAt = new Date();

    await em.flush();

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const em = await getEM();
    const { id } = await params;

    const post = await em.findOne(Post, { id });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    await em.removeAndFlush(post);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
