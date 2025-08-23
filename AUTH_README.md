# Authentication & Sanity Integration

This document explains how NextAuth is integrated with Sanity to provide a complete backend solution for the Evolution Dashboard application.

## Overview

The application uses NextAuth.js with Sanity as the database backend. This setup provides:

- User authentication and session management
- Role-based access control (User/Admin)
- Secure user data storage in Sanity
- Protected API routes
- Middleware for route protection

## Architecture

### Authentication Flow

1. **User Registration**: Users register via `/api/users` endpoint
2. **User Login**: NextAuth handles authentication via `/api/auth/[...nextauth]`
3. **Session Management**: JWT tokens store user session data
4. **Route Protection**: Middleware protects authenticated routes

### Database Schema

#### User Schema

```typescript
{
  name: "user",
  fields: [
    { name: "name", title: "Full Name", type: "string", required: true },
    { name: "email", title: "Email", type: "string", required: true, unique: true },
    { name: "password", title: "Password", type: "string", hidden: true, required: true },
    { name: "image", title: "Profile Image", type: "image" },
    { name: "dailyTarget", title: "Daily Target (hours)", type: "number", default: 4 },
    { name: "role", title: "Role", type: "string", options: ["user", "admin"], default: "user" },
    { name: "isActive", title: "Is Active", type: "boolean", default: true },
    { name: "lastLogin", title: "Last Login", type: "datetime" },
    { name: "createdAt", title: "Created At", type: "datetime" },
  ]
}
```

#### Project Schema

```typescript
{
  name: "project",
  fields: [
    { name: "name", title: "Name", type: "string", required: true },
    { name: "status", title: "Status", type: "string", options: ["نشط", "مكتمل", "مؤجل"] },
    { name: "user", title: "User", type: "reference", to: [{ type: "user" }], required: true },
    { name: "subProjects", title: "Sub Projects", type: "array", of: [{ type: "reference", to: [{ type: "subProject" }] }] },
  ]
}
```

#### Session Schema

```typescript
{
  name: "session",
  fields: [
    { name: "date", title: "Date", type: "date", required: true },
    { name: "hours", title: "Hours", type: "number", required: true },
    { name: "minutes", title: "Minutes", type: "number", required: true },
    { name: "notes", title: "Notes", type: "text" },
    { name: "user", title: "User", type: "reference", to: [{ type: "user" }], required: true },
    { name: "project", title: "Project", type: "reference", to: [{ type: "project" }, { type: "subProject" }], required: true },
  ]
}
```

## API Endpoints

### Authentication

- `POST /api/users` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/[id]` - Get user by ID
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (Admin only)

### Projects

- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project by ID
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Sessions

- `GET /api/sessions` - Get user's sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/[id]` - Get session by ID
- `PATCH /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session

## Security Features

### Route Protection

- **Middleware**: Protects all routes except auth pages
- **API Authentication**: All API routes check for valid sessions
- **Role-based Access**: Admin routes require admin privileges
- **Resource Ownership**: Users can only access their own data

### Data Validation

- Email format validation
- Password strength requirements (6+ characters)
- Required field validation
- Input sanitization

### Session Security

- JWT tokens with expiration
- Secure cookie settings
- Session invalidation on logout

## Environment Variables

Required environment variables:

```bash
# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2025-08-19"
SANITY_WRITE_TOKEN="your-write-token"
```

## Usage Examples

### Client-side Authentication

```typescript
import { signIn, signOut, useSession } from "next-auth/react"

function LoginButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.name}!</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    )
  }

  return (
    <button onClick={() => signIn()}>Sign in</button>
  )
}
```

### API Usage

```typescript
// Create a project
const response = await fetch("/api/projects", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "My Project",
    status: "نشط",
  }),
})

// Get user's projects
const response = await fetch("/api/projects")
const { data: projects } = await response.json()
```

### Server-side Authentication

```typescript
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <div>Please sign in</div>
  }

  return <div>Welcome, {session.user.name}!</div>
}
```

## Role-based Access Control

### User Role

- Can view/edit their own profile
- Can create/manage their own projects
- Can create/manage their own sessions
- Cannot access admin features

### Admin Role

- Can view all users, projects, and sessions
- Can manage any user's data
- Can delete users (except themselves)
- Has access to admin dashboard features

## Error Handling

All API endpoints return standardized error responses:

```typescript
// Success response
{
  success: true,
  data: { ... },
  message: "Operation completed successfully"
}

// Error response
{
  success: false,
  error: "Error message in Arabic"
}
```

## Development

### Running the Application

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run Sanity: `npm run dev`
4. Start Next.js: `npm run dev`

### Database Setup

1. Create Sanity project
2. Configure environment variables
3. Deploy schemas to Sanity
4. Set up write token with appropriate permissions

### Testing Authentication

1. Register a new user at `/register`
2. Login at `/login`
3. Access protected routes like `/projects`
4. Test admin features with admin user

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check NEXTAUTH_SECRET and NEXTAUTH_URL
2. **Database connection failed**: Verify Sanity credentials and write token
3. **Access denied**: Check user role and session validity
4. **CORS errors**: Ensure proper API route configuration

### Debug Mode

Enable debug logging by setting `debug: true` in authOptions for development.

## Security Best Practices

- Always validate user input
- Use HTTPS in production
- Regularly rotate secrets
- Implement rate limiting
- Monitor for suspicious activity
- Keep dependencies updated

## Support

For issues related to authentication or database integration:

1. Check the browser console for errors
2. Verify environment variables
3. Test API endpoints directly
4. Check Sanity Studio for data consistency

