import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MilestoneData {
  title: string;
  description: string;
  badge?: string;
  completed?: boolean;
  completedAt?: Date | null;
  skills?: string[];
}

interface PathData {
  title: string;
  category: string;
  milestones: MilestoneData[];
}

// GET learning paths for a user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const requestUserId = searchParams.get('userId');

    if (requestUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Return empty array if user doesn't exist yet
      return NextResponse.json([]);
    }

    // Get learning paths with milestones
    const learningPaths = await prisma.learningPath.findMany({
      where: { userId: userId },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to match frontend format
    const transformedPaths = learningPaths.map((path) => ({
      id: path.id,
      title: path.title,
      category: path.category,
      milestones: path.milestones.map((m) => ({
        title: m.title,
        description: m.description || '',
        badge: m.badge || '',
        skills: [] as string[], // Skills are not stored in DB yet
        completed: m.completed,
        completedAt: m.completedAt,
      })),
      progress: path.milestones.length > 0
        ? (path.milestones.filter((m) => m.completed).length / path.milestones.length) * 100
        : 0,
      completed: path.milestones.filter((m) => m.completed).length,
      total: path.milestones.length,
      createdAt: path.createdAt,
    }));

    return NextResponse.json(transformedPaths);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST learning paths for a user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId: requestUserId, paths } = body;

    if (requestUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Create user with a temporary email if needed
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@temp.clerk`,
        },
      });
    }

    // Delete existing learning paths for this user
    await prisma.learningPath.deleteMany({
      where: { userId: userId },
    });

    // Create new learning paths
    const createdPaths = await Promise.all(
      paths.map((path: PathData) =>
        prisma.learningPath.create({
          data: {
            title: path.title,
            category: path.category,
            userId: userId,
            milestones: {
              create: path.milestones.map((milestone, mIndex) => ({
                title: milestone.title,
                description: milestone.description || '',
                order: mIndex,
                completed: milestone.completed || false,
                completedAt: milestone.completedAt || null,
                badge: milestone.badge || null,
              })),
            },
          },
          include: {
            milestones: {
              orderBy: { order: 'asc' },
            },
          },
        })
      )
    );

    return NextResponse.json({ success: true, paths: createdPaths });
  } catch (error) {
    console.error('Error saving learning paths:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

