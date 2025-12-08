# Next.js Blog Application with Amazon Aurora DSQL

A simple CRUD blog application built with Next.js, MikroORM, and Amazon Aurora DSQL.

## Features

- Create, Read, Update, and Delete blog posts
- Amazon Aurora DSQL database integration
- AWS IAM authentication for database access
- UUID v7 primary keys
- MikroORM for database operations
- TypeScript support
- Tailwind CSS for styling
- Responsive UI design

## Prerequisites

- Node.js 20 or higher
- AWS account with Aurora DSQL cluster
- AWS credentials configured (via AWS CLI, environment variables, or IAM role)
- Amazon Aurora DSQL cluster endpoint

## Aurora DSQL Limitations and Workarounds

Amazon Aurora DSQL has several PostgreSQL compatibility limitations. This application implements specific workarounds:

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **No SERIAL type** | Auto-increment IDs don't work | Use UUID v7 for primary keys with `uuidv7()` library |
| **No ENUM types** | Enum columns not supported | Use VARCHAR or BOOLEAN types instead |
| **No JSONB type** | JSON columns not supported | Use TEXT type for storing JSON data |
| **CREATE INDEX requires ASYNC** | Standard index creation fails | Use `CREATE INDEX ASYNC` syntax for all indexes |
| **No sort order in indexes** | Can't specify ASC/DESC in indexes | Omit sort order; optimizer handles it automatically |
| **Limited transaction support** | Transaction errors during migrations | Set `transactional: false` and `allOrNothing: false` in MikroORM config |
| **No ALTER TABLE ADD CONSTRAINT** | Can't add unique constraints post-creation | Define all constraints in CREATE TABLE statement |
| **MikroORM migration table uses SERIAL** | Default migration tracking table incompatible | Manually create migration table with UUID primary key |

### Key Implementation Details

1. **UUID v7 Primary Keys**: All entities use UUID v7 instead of auto-increment integers
2. **Authentication**: Uses `@aws-sdk/dsql-signer` with IAM authentication (username is always `admin`)
3. **Migration Strategy**: Custom migration scripts that bypass MikroORM's transaction handling
4. **Index Creation**: All indexes use `CREATE INDEX ASYNC` without sort order specifications

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd nextjs-apprunner-dsql-lab
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Aurora DSQL configuration:

```env
DSQL_HOSTNAME=your-dsql-cluster-endpoint.dsql.us-east-1.on.aws
DSQL_REGION=us-east-1
DSQL_DATABASE=postgres
```

**Note**: You don't need to specify a username. Aurora DSQL always uses `admin` with IAM authentication.

### 4. Configure AWS credentials

Ensure your AWS credentials are configured. The application uses AWS SDK to generate authentication tokens for Aurora DSQL.

**Option 1: AWS CLI**
```bash
aws configure
```

**Option 2: Environment variables**
```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

**Option 3: IAM Role** (recommended for AWS App Runner, EC2, ECS)
- The application will automatically use the IAM role attached to the service

### 5. Initialize the database

First, create the migration tracking table:

```bash
npm run db:init
```

This creates the `mikro_orm_migrations` table with UUID primary key (Aurora DSQL doesn't support SERIAL).

### 6. Run database migrations

```bash
npm run migrate
```

This will create the `post` table and indexes.

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Post Entity

```typescript
{
  id: string (UUID v7, primary key)
  title: string (max 255 characters)
  content: text
  author: string (optional, max 100 characters)
  published: boolean (default: false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

## API Routes

### GET /api/posts
Get all posts

**Query Parameters:**
- `published` (optional): Filter by published status (true/false)

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Post Title",
    "content": "Post content...",
    "author": "Author Name",
    "published": true,
    "createdAt": "2025-12-08T00:00:00.000Z",
    "updatedAt": "2025-12-08T00:00:00.000Z"
  }
]
```

### POST /api/posts
Create a new post

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "author": "Author Name",
  "published": false
}
```

### GET /api/posts/[id]
Get a single post by ID

### PUT /api/posts/[id]
Update a post

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "author": "Updated Author",
  "published": true
}
```

### DELETE /api/posts/[id]
Delete a post

## Available Commands

### Database Commands

Initialize database (create migration table):
```bash
npm run db:init
```

Run pending migrations:
```bash
npm run migrate
```

Rollback last migration:
```bash
npm run migrate:down
```

Check migration status:
```bash
npm run migrate:status
```

### Development Commands

Start development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm run start
```

## Project Structure

```
nextjs-apprunner-dsql-lab/
├── app/
│   ├── api/
│   │   └── posts/
│   │       ├── route.ts                    # GET all, POST new
│   │       └── [id]/
│   │           └── route.ts                # GET, PUT, DELETE by ID
│   └── page.tsx                            # Main UI page
├── scripts/
│   ├── init-db.ts                          # Initialize migration table
│   ├── migrate.ts                          # Run migrations
│   ├── migrate-down.ts                     # Rollback migrations
│   └── migrate-status.ts                   # Check migration status
├── src/
│   ├── entities/
│   │   ├── Post.ts                         # Post entity (UUID v7 PKs)
│   │   └── index.ts
│   ├── lib/
│   │   ├── aws-auth.ts                     # DSQL IAM authentication
│   │   └── db.ts                           # Database initialization
│   ├── migrations/
│   │   ├── Migration*_CreateMigrationsTable.ts
│   │   └── Migration*_CreatePostsTable.ts  # Aurora DSQL compatible
│   └── mikro-orm.config.ts                 # Non-transactional config
├── .env.example                            # Environment variables template
├── tsconfig.json                           # Decorator support enabled
└── package.json
```

## Authentication

The application uses AWS IAM authentication to connect to Aurora DSQL:

1. **Token Generation**: Uses `@aws-sdk/dsql-signer` (DsqlSigner) to generate temporary authentication tokens
2. **Token Lifetime**: Tokens are valid for up to 1 hour (3600 seconds)
3. **Username**: Always uses `admin` (fixed by Aurora DSQL)
4. **Auto-Refresh**: MikroORM connection configuration automatically refreshes tokens as needed

The `getDbConnectAdminAuthToken()` method from `DsqlSigner` handles the IAM authentication flow specifically designed for Aurora DSQL.

## Usage Tips

### Creating Posts

1. Open the application at [http://localhost:3000](http://localhost:3000)
2. Fill in the form on the left side:
   - **Title**: Post title (required)
   - **Content**: Post content (required)
   - **Author**: Author name (optional)
   - **Published**: Check to publish immediately
3. Click "Create Post"

### Managing Posts

- **Edit**: Click the "Edit" button on any post to modify it
- **Delete**: Click the "Delete" button to remove a post (requires confirmation)
- **Filter**: Use the API query parameter `?published=true` to fetch only published posts

### Querying via API

Get all posts:
```bash
curl http://localhost:3000/api/posts
```

Get only published posts:
```bash
curl http://localhost:3000/api/posts?published=true
```

Create a new post:
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"Hello World","published":true}'
```

## Deploy to AWS App Runner

1. Ensure your App Runner service has an IAM role with the following permissions:
   - `dsql:DbConnect` on your Aurora DSQL cluster
   - `dsql:DbConnectAdmin` for admin access
2. Set environment variables in App Runner configuration:
   - `DSQL_HOSTNAME`
   - `DSQL_REGION`
   - `DSQL_DATABASE`
3. Run initialization during deployment:
   ```bash
   npm run db:init && npm run migrate
   ```
4. Deploy the application

## Troubleshooting

### Common Issues

**Error: "type 'serial' does not exist"**
- Solution: Make sure to run `npm run db:init` before running migrations. This creates the migration table with UUID instead of SERIAL.

**Error: "Transaction query already complete"**
- Solution: Already fixed in the config with `transactional: false` and `allOrNothing: false`.

**Error: "specifying sort order not supported for index keys"**
- Solution: Don't use `ASC` or `DESC` in index definitions. Aurora DSQL doesn't support sort order specifications.

**Authentication errors**
- Verify your AWS credentials are configured correctly
- Check that your IAM user/role has `dsql:DbConnect` and `dsql:DbConnectAdmin` permissions
- Ensure the DSQL_HOSTNAME and DSQL_REGION are correct in your `.env` file

**Connection timeout**
- Aurora DSQL tokens expire after 1 hour. The app auto-refreshes them, but if you see timeout errors, restart the dev server.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MikroORM Documentation](https://mikro-orm.io/)
- [Amazon Aurora DSQL Documentation](https://docs.aws.amazon.com/aurora-dsql/)
- [Aurora DSQL Authentication](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/SECTION_authentication-token.html)
- [Aurora DSQL Limitations](https://docs.aws.amazon.com/aurora-dsql/latest/userguide/SECTION_postgres-compatibility.html)

## Contributing

When adding new features that interact with the database, remember Aurora DSQL's limitations:
- Always use UUID for primary keys
- Avoid ENUM, SERIAL, and JSONB types
- Use `CREATE INDEX ASYNC` without sort order
- Set `transactional: false` for migrations
- Test thoroughly with the actual Aurora DSQL cluster

## License

MIT
