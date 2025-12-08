import { NextRequest, NextResponse } from 'next/server';
import { getEM } from '@/src/lib/db';
import { Post } from '@/src/entities/Post';

export async function GET(request: NextRequest) {
  try {
    const em = await getEM();
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get('published');

    const where = published !== null
      ? { published: published === 'true' }
      : {};

    const posts = await em.find(Post, where, {
      orderBy: { createdAt: 'DESC' }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const em = await getEM();
    const body = await request.json();

    const { title, content, author, published } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const post = em.create(Post, {
      title,
      content,
      author,
      published: published || false,
    });

    await em.persistAndFlush(post);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
