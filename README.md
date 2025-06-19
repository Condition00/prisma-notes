# Prisma with PostgreSQL

This repository contains my learning journey with Prisma ORM and PostgreSQL. Below are detailed notes about Prisma concepts, database modeling, and code examples.

## Table of Contents
- [Setup and Configuration](#setup-and-configuration)
- [Prisma Schema](#prisma-schema)
- [Models and Relations](#models-and-relations)
- [CRUD Operations](#crud-operations)
- [Advanced Queries](#advanced-queries)
- [Best Practices](#best-practices)

## Setup and Configuration

### Project Initialization
```bash
# Initialize a new Node.js project
npm init -y

# Install dependencies
npm install prisma typescript ts-node @prisma/client

# Initialize Prisma
npx prisma init
```

### Database Connection
The database connection is configured in the `schema.prisma` file:

```prisma
datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}
```

The actual connection string is stored in the `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/db_name"
```

### Client Generation
Prisma Client is generated with a custom output path:

```prisma
generator client {
    provider = "prisma-client-js"
    output   = "../generated/prisma"
}
```

## Prisma Schema

### Data Types
Prisma supports various data types:
- Scalar types: String, Int, Float, Boolean, DateTime
- ID fields: @id attribute
- Enums: custom enumeration types like Role

### Field Attributes
- `@id`: Primary key
- `@default`: Default value (uuid(), now(), etc.)
- `@unique`: Ensures field values are unique
- `@relation`: Defines relationships between models
- `@updatedAt`: Automatically updates timestamp on record change

### Block Attributes
- `@@unique([field1, field2])`: Composite unique constraint
- `@@index([field])`: Creates database index for optimized queries

## Models and Relations

### User Model
```prisma
model User {
    id              String            @id @default(uuid())
    age             Int
    name            String
    email           String            @unique
    role            Role              @default(USER)
    writtenPost     Post[]            @relation("writtenPosts")
    favouritePost   Post[]            @relation("favouritedPosts")
    UserPreferences UserPreferences[]

    @@unique([age, name]) // Composite unique constraint
    @@index([email])      // Index for faster lookups
}
```

### Relation Types

1. **One-to-One**: User ↔ UserPreferences
   - Each user has exactly one preferences record
   - Implemented with a unique foreign key

2. **One-to-Many**: User ↔ Post (written posts)
   - A user can write many posts
   - Each post has one author
   - Implemented with a foreign key in the "many" side

3. **Many-to-Many**: Post ↔ Category
   - A post can have multiple categories
   - A category can be applied to multiple posts
   - Prisma automatically creates a join table

4. **Self-Relations**: Not shown in this schema, but possible

### Ambiguous Relations
When a model relates to another model in multiple ways (like User and Post with written and favorited relations), we need named relations:

```prisma
// In User model
writtenPost   Post[] @relation("writtenPosts")
favouritePost Post[] @relation("favouritedPosts")

// In Post model
author        User   @relation("writtenPosts", fields: [authorId], references: [id])
favouritedBy  User?  @relation("favouritedPosts", fields: [favouritedById], references: [id])
```

## CRUD Operations

### Creating Records
```typescript
// Create a user with related preferences
const user = await prisma.user.create({
    data: {
        name: "John Doe",
        email: "john@gmail.com",
        age: 30,
        UserPreferences: {
            create: {
                emailNotifications: true,
            },
        },
    },
    include: {
        UserPreferences: true, // Include related data in the response
    },
});
```

### Reading Records
```typescript
// Get all users
const allUsers = await prisma.user.findMany();

// Get user by ID
const user = await prisma.user.findUnique({
    where: { id: "user-id" },
});

// Get users with filter
const adultUsers = await prisma.user.findMany({
    where: { age: { gte: 18 } },
});
```

### Updating Records
```typescript
// Update a user
const updatedUser = await prisma.user.update({
    where: { id: "user-id" },
    data: { name: "Updated Name" },
});

// Update many users
const updateResult = await prisma.user.updateMany({
    where: { age: { lt: 18 } },
    data: { role: "USER" },
});
```

### Deleting Records
```typescript
// Delete a user
const deletedUser = await prisma.user.delete({
    where: { id: "user-id" },
});

// Delete many users
const deleteResult = await prisma.user.deleteMany({
    where: { age: { lt: 13 } },
});
```

## Advanced Queries

### Nested Writes
```typescript
// Create user with posts and categories
const user = await prisma.user.create({
    data: {
        name: "Content Creator",
        email: "creator@example.com",
        age: 25,
        writtenPost: {
            create: {
                title: "My First Post",
                rating: 4.5,
                categories: {
                    connectOrCreate: {
                        where: { name: "Technology" },
                        create: { name: "Technology" },
                    },
                },
            },
        },
    },
});
```

### Transactions
```typescript
// Execute multiple operations in a transaction
const [newUser, newPost] = await prisma.$transaction([
    prisma.user.create({ data: { name: "Transaction User", email: "tx@example.com", age: 40 } }),
    prisma.post.create({ data: { title: "Transaction Post", rating: 5.0, authorId: "existing-user-id" } }),
]);
```

### Raw Database Access
```typescript
// Execute raw SQL
const result = await prisma.$queryRaw`SELECT * FROM "User" WHERE age > ${18}`;
```

## Best Practices

1. **Connection Management**: Always disconnect after operations
   ```typescript
   .finally(async () => {
       await prisma.$disconnect();
   });
   ```

2. **Error Handling**: Wrap Prisma operations in try/catch blocks
   ```typescript
   try {
       // Prisma operations
   } catch (error) {
       console.error("Database error:", error);
   }
   ```

3. **Migrations**: Use Prisma Migrate for schema changes
   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```

4. **Data Validation**: Validate data before passing to Prisma
   - Consider using Zod, Joi, or class-validator

5. **Query Optimization**: Use `select` to only fetch needed fields
   ```typescript
   const userNames = await prisma.user.findMany({
       select: { name: true },
   });
   ```

## Recent Changes: User-UserPreference Relationship

### What Changed

I recently modified the relationship between the User and UserPreference models:

1. **Renamed the Model**:
   - Changed from `UserPreferences` (plural) to `UserPreference` (singular)

2. **Reversed the Relation Direction**:
   - Before: User had a one-to-many relationship with UserPreferences
   - After: User has a one-to-one relationship with UserPreference through a foreign key in the User model

3. **Updated Schema Structure**:

```prisma
model User {
    id               String          @id @default(uuid())
    // ...other fields...
    userPreference   UserPreference? @relation(fields: [userPreferenceId], references: [id])
    userPreferenceId String?         @unique
}

model UserPreference {
    id                 String  @id @default(uuid())
    emailNotifications Boolean
    User               User?   // Back-reference to User
}
```

4. **Updated Code Usage**:

```typescript
// Create a user with preferences (new approach)
const user = await prisma.user.create({
    data: {
        name: "John Doe",
        email: "john@gmail.com",
        age: 30,
        userPreference: {
            create: {
                emailNotifications: true,
            },
        },
    },
    include: {
        userPreference: true,
    },
});
```

### Why I Made These Changes

1. **Resolving Deletion Constraints**:
   - With the previous design, Prisma would throw an error when trying to delete a user with associated preferences
   - The original schema comment noted: "We are referencing the User model in the UserPreferences model so when we try deleting a user, Prisma will throw an error if there are any UserPreferences associated with that user"
   - The new structure addresses this issue by changing the relation direction

2. **More Explicit Relationship**:
   - The new structure better expresses the true one-to-one nature of the relationship
   - A user can have at most one preference record, and a preference record belongs to at most one user

3. **Flexibility**:
   - The relationship is now optional on both sides
   - This allows preferences to exist independently of users if needed

4. **Learning Different Relation Patterns**:
   - This demonstrates an alternative way to model one-to-one relationships in Prisma
   - The foreign key is now in the "parent" entity (User) rather than the "child" entity

5. **Cleaner Data Structure**:
   - The singular name better represents the cardinality of the relationship
   - The optional relationship on both sides allows for more flexible creation and deletion patterns

### Technical Implementation Details

- The `@unique` constraint on `userPreferenceId` ensures the one-to-one relationship
- The optional `?` marker means the relationship isn't required on either side
- The `User` field in the `UserPreference` model is a back-reference that Prisma uses to navigate the relationship in both directions
- This approach allows for querying in either direction: from User to UserPreference or vice versa

This implementation showcases a different approach to modeling relations in Prisma and provides flexibility in how data is created and accessed.

---

This README documents my learning process with Prisma and PostgreSQL. It will be updated as I learn more concepts and implement new features.

## Advanced Prisma Query Operations

### Where Filtering with Relationships

Prisma allows complex filtering across relationships, enabling powerful queries that span multiple tables:

```typescript
// Find all users who have written posts with a rating higher than 4
const usersWithHighRatedPosts = await prisma.user.findMany({
  where: {
    writtenPost: {
      some: {
        rating: { gt: 4 }
      }
    }
  }
});

// Find users who have no preferences set
const usersWithoutPreferences = await prisma.user.findMany({
  where: {
    userPreference: null
  }
});

// Find users who have favorited posts in a specific category
const usersFavoritingTech = await prisma.user.findMany({
  where: {
    favouritePost: {
      some: {
        categories: {
          some: {
            name: "Technology"
          }
        }
      }
    }
  }
});
```

### Complex Filtering Operators

Prisma supports a variety of filtering operators:

```typescript
// Equality
where: { age: 30 }

// Greater than/less than
where: { age: { gt: 18, lt: 65 } }

// Text operations
where: {
  name: { contains: "John" },
  email: { startsWith: "meow" },
  role: { not: "ADMIN" }
}

// Logical operators
where: {
  OR: [
    { age: { lt: 18 } },
    { age: { gt: 65 } }
  ],
  AND: [
    { email: { endsWith: "@gmail.com" } },
    { name: { not: "Admin" } }
  ]
}

// List operations
where: {
  age: { in: [18, 21, 25] }
}
```

### Client Update Operations

Prisma provides multiple ways to update records:

#### Basic Updates

```typescript
// Update a single record
const updatedUser = await prisma.user.update({
  where: { id: "user-id" },
  data: { name: "Updated Name" }
});

// Update multiple records
const updatedUsers = await prisma.user.updateMany({
  where: { age: { lt: 18 } },
  data: { role: "USER" }
});
```

#### Increment/Decrement

```typescript
// Increment a user's age by 1
const olderUser = await prisma.user.update({
  where: { id: "user-id" },
  data: { age: { increment: 1 } }
});

// Decrement a post's rating
const lowerRatedPost = await prisma.post.update({
  where: { id: "post-id" },
  data: { rating: { decrement: 0.5 } }
});
```

#### Updating Relations

```typescript
// Add a post to a user's favorites
const userWithNewFavorite = await prisma.user.update({
  where: { id: "user-id" },
  data: {
    favouritePost: {
      connect: { id: "post-id" }
    }
  }
});

// Remove a post from favorites
const userWithoutFavorite = await prisma.user.update({
  where: { id: "user-id" },
  data: {
    favouritePost: {
      disconnect: { id: "post-id" }
    }
  }
});

// Replace all favorites with a new set
const userWithNewFavorites = await prisma.user.update({
  where: { id: "user-id" },
  data: {
    favouritePost: {
      set: [{ id: "post-1" }, { id: "post-2" }]
    }
  }
});
```

### Connect Existing Records

When creating or updating records, you can connect to existing records rather than creating new ones:

```typescript
// Create a user and connect to an existing preference
const userWithExistingPreference = await prisma.user.create({
  data: {
    name: "Jane Doe",
    email: "jane@example.com",
    age: 28,
    userPreference: {
      connect: { id: "existing-preference-id" }
    }
  }
});

// Add an existing category to a post
const postWithCategory = await prisma.post.update({
  where: { id: "post-id" },
  data: {
    categories: {
      connect: { id: "category-id" }
    }
  }
});

// Connect or create (use existing if found, create if not)
const postWithTechCategory = await prisma.post.update({
  where: { id: "post-id" },
  data: {
    categories: {
      connectOrCreate: {
        where: { name: "Technology" },
        create: { name: "Technology" }
      }
    }
  }
});
```

### Client Delete Operations

Prisma provides several ways to delete records:

```typescript
// Delete a single record by ID or unique field
const deletedUser = await prisma.user.delete({
  where: { id: "user-id" }
});

// Delete multiple records matching criteria
const deletionResult = await prisma.user.deleteMany({
  where: {
    email: { endsWith: "@old-domain.com" },
    lastLogin: { lt: new Date('2023-01-01') }
  }
});

// Cascading deletes
// (requires onDelete: Cascade in the schema)
// Example schema:
// posts Post[] @relation("writtenPosts", onDelete: Cascade)
//
// Then, when you delete a user:
const userAndPostsDeleted = await prisma.user.delete({
  where: { id: "user-id" }
  // This will also delete all the user's posts if relation is set to cascade
});
```

### Handling Database Cleanup and Constraints

As seen in the script.ts file, when dealing with related tables, deletion order matters:

```typescript
// Clean up tables in the correct order to avoid constraint violations
await prisma.user.deleteMany();
await prisma.userPreference.deleteMany();
```

This is important because:

1. Foreign key constraints prevent deleting records that are referenced by other tables
2. The order of deletion operations should generally be from "child" to "parent" records
3. Alternatively, you can use cascading deletes in your schema design

## Pagination and Sorting

Prisma provides built-in support for pagination and sorting:

```typescript
// Basic pagination with take and skip
const page2Users = await prisma.user.findMany({
  take: 10,   // Limit to 10 records
  skip: 10,   // Skip the first 10 records (page 1)
  orderBy: {  // Sort by name ascending
    name: 'asc'
  }
});

// Multiple sort criteria
const sortedPosts = await prisma.post.findMany({
  orderBy: [
    { createdAt: 'desc' },  // Primary sort: newest first
    { rating: 'desc' }      // Secondary sort: highest rated first
  ]
});

// Cursor-based pagination (more efficient for large datasets)
const nextPageUsers = await prisma.user.findMany({
  take: 10,
  skip: 1,  // Skip the cursor
  cursor: { id: "last-id-from-previous-page" },
  orderBy: { id: 'asc' }
});
```

These advanced operations demonstrate Prisma's power and flexibility for working with relational data.
