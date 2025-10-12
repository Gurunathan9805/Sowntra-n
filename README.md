# Sowntra Backend

Backend server for Sowntra collaborative whiteboard application.

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Firebase Admin SDK
- **Real-time Collaboration:** Yjs + WebSocket
- **Storage:** Firebase Storage

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Firebase project with Admin SDK credentials

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/sowntra_db?schema=public"
FIREBASE_PROJECT_ID=your-project-id
WS_PORT=1234
FRONTEND_URL=http://localhost:3000
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### 3. Set Up Firebase Admin SDK

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccountKey.json` in the backend root directory

### 4. Set Up Database

Create a PostgreSQL database and run Prisma migrations:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on:
- HTTP API: `http://localhost:3001`
- WebSocket: `ws://localhost:3001/collaboration`

### 6. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Boards
- `GET /api/boards` - List all boards for authenticated user
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board metadata
- `DELETE /api/boards/:id` - Delete a board
- `POST /api/boards/:id/members` - Add member to board
- `DELETE /api/boards/:id/members/:memberId` - Remove member from board

### Assets
- `POST /api/assets/:boardId/upload` - Upload asset to board
- `GET /api/assets/:boardId` - Get all assets for a board
- `DELETE /api/assets/:boardId/:assetId` - Delete an asset

All API endpoints (except `/health`) require Firebase authentication token in the `Authorization` header:
```
Authorization: Bearer <firebase-id-token>
```

## WebSocket Protocol

### Client → Server Messages

**Join Board:**
```json
{
  "type": "join",
  "boardId": "board-uuid",
  "userId": "user-id",
  "userName": "User Name"
}
```

**Document Update:**
```json
{
  "type": "update",
  "update": [/* Yjs update bytes */]
}
```

**Cursor Position:**
```json
{
  "type": "cursor",
  "cursor": { "x": 100, "y": 200 }
}
```

**Awareness:**
```json
{
  "type": "awareness",
  "state": { /* custom awareness state */ }
}
```

### Server → Client Messages

**Sync State:**
```json
{
  "type": "sync",
  "state": [/* Yjs document state */]
}
```

**User Joined:**
```json
{
  "type": "user-joined",
  "userId": "user-id",
  "userName": "User Name",
  "color": "#FF6B6B"
}
```

**User Left:**
```json
{
  "type": "user-left",
  "userId": "user-id",
  "userName": "User Name"
}
```

**Active Users:**
```json
{
  "type": "active-users",
  "users": [
    {
      "userId": "user-id",
      "userName": "User Name",
      "color": "#FF6B6B",
      "cursor": { "x": 100, "y": 200 }
    }
  ]
}
```

## Database Schema

### User
- Stores Firebase authenticated users
- Links to owned boards and board memberships

### Board
- Main whiteboard data
- Stores Yjs document state for collaboration
- Tracks ownership and permissions

### BoardMember
- Manages board access (owner, editor, viewer)
- Links users to boards

### Asset
- Uploaded files (images, videos, etc.)
- References Firebase Storage

### Comment
- Board comments and annotations
- Positioned comments on canvas

### BoardVersion
- Version history for boards
- Stores snapshots of Yjs state

## Project Structure

```
src/
├── config/
│   ├── database.ts       # Prisma client setup
│   └── firebase.ts       # Firebase Admin SDK
├── controllers/
│   ├── board.controller.ts    # Board CRUD operations
│   └── asset.controller.ts    # Asset management
├── middleware/
│   └── auth.ts           # Authentication middleware
├── routes/
│   ├── board.routes.ts   # Board API routes
│   └── asset.routes.ts   # Asset API routes
├── websocket/
│   └── collaboration.ts  # WebSocket server for real-time sync
└── index.ts             # Main entry point
```

## Development

- Use `npm run dev` for hot-reload during development
- TypeScript files are compiled on the fly
- Changes trigger automatic server restart

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check database credentials

### Firebase Issues
- Ensure `serviceAccountKey.json` exists
- Verify Firebase project ID
- Check storage bucket name

### WebSocket Connection Issues
- Ensure port 3001 is not blocked
- Check CORS configuration
- Verify frontend URL in `.env`

## License

ISC

