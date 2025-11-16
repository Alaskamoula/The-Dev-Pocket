# Personalized Learning Paths Feature

## Overview
The Personalized Learning Paths feature allows users to create custom learning roadmaps by selecting from predefined interest categories (Web Development, AI & Machine Learning, Cybersecurity, Mobile Development). Users can track their progress, earn badges for completing milestones, and have their progress saved either in local storage or in the database via Clerk authentication.

## Features Implemented

### 1. Interest Selection
- Users can choose from 4 predefined learning path categories:
  - **Web Development** 🌐
  - **AI & Machine Learning** 🤖
  - **Cybersecurity** 🔒
  - **Mobile Development** 📱

### 2. Progress Tracking
- Visual progress bars showing completion percentage for each path
- Overall progress indicator across all learning paths
- Milestone completion tracking with date stamps
- Automatic progress calculation based on completed milestones

### 3. Badge System
- Each milestone has a unique badge (e.g., "🏗️ Foundation Builder", "⚡ JavaScript Ninja")
- Badges are awarded automatically upon milestone completion
- Badge display with award icon for completed milestones

### 4. Data Persistence
- **Authenticated Users**: Progress is saved to PostgreSQL database via Clerk authentication
- **Non-authenticated Users**: Progress is saved in localStorage as a fallback
- Automatic synchronization when users log in
- Real-time updates when milestones are completed

### 5. User Interface
- Modern, responsive design with color-coded paths
- Interactive milestone cards with click-to-complete functionality
- Progress visualization with animated bars
- Clean, intuitive layout

## Technical Implementation

### Database Schema

#### LearningPath Model
```prisma
model LearningPath {
  id         String      @id @default(uuid())
  title      String
  category   String
  userId     String?
  user       User?       @relation(fields: [userId], references: [id])
  milestones Milestone[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}
```

#### Milestone Model
```prisma
model Milestone {
  id             String       @id @default(uuid())
  title          String
  description    String?
  order          Int
  completed      Boolean      @default(false)
  completedAt    DateTime?
  learningPathId String
  learningPath   LearningPath @relation(fields: [learningPathId], references: [id], onDelete: Cascade)
  badge          String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
}
```

### Files Created/Modified

#### New Files
1. `app/dashboard/learning-paths/page.tsx` - Main learning paths component
2. `app/dashboard/learning-paths/learning-paths.css` - Styling for the component
3. `app/data/learningPaths.json` - Predefined learning paths data
4. `app/api/learning-paths/route.ts` - API endpoints for CRUD operations

#### Modified Files
1. `prisma/schema.prisma` - Added LearningPath and Milestone models
2. `app/dashboard/layout.tsx` - Added Learning Paths navigation link
3. `middleware.ts` - Added create-roadmap as public route

### API Endpoints

#### GET `/api/learning-paths?userId={userId}`
- Fetches all learning paths for an authenticated user
- Returns empty array if user doesn't exist
- Includes milestones with completion status

#### POST `/api/learning-paths`
- Creates or updates learning paths for a user
- Deletes existing paths and creates new ones
- Body: `{ userId: string, paths: PathData[] }`

### Usage

1. **Access the Feature**: Navigate to Dashboard → Learning Paths
2. **Add Learning Path**: Click "Add Learning Path" and select a category
3. **Complete Milestones**: Click on milestone cards to mark as complete
4. **Track Progress**: View progress bars and badges
5. **Remove Paths**: Click the × button to remove a learning path

## Future Enhancements

1. Add skill recommendations based on completion
2. Implement difficulty levels for milestones
3. Add time estimates for each milestone
4. Create social sharing for completed paths
5. Add advanced filtering and search
6. Implement milestone notes and resources
7. Add streak tracking for daily activity
8. Create custom learning paths

## Dependencies

- **Clerk**: Authentication and user management
- **Prisma**: Database ORM
- **PostgreSQL**: Database storage
- **Lucide React**: Icons
- **Next.js**: Framework

## Environment Setup

Ensure the following environment variables are set:
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk authentication key

## Migration Required

After deploying, run:
```bash
npx prisma migrate dev --name add_learning_paths
```

This will create the necessary database tables for LearningPath and Milestone models.

