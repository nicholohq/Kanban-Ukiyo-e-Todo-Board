# Next.js Todo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack To Do List app with Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Prisma + SQLite, NextAuth v5 (beta), and guest mode that skips auth.

**Architecture:** Next.js 14 App Router with server components by default, client components for interactive parts. Prisma handles SQLite database access. NextAuth v5 (beta) provides authentication with a credentials provider. Guest mode allows unauthenticated usage with data stored in localStorage, syncing to the database upon login.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Prisma, SQLite, NextAuth v5 (beta), bcryptjs, Zod

## Global Constraints

- Next.js 14 App Router (not Pages Router)
- TypeScript strict mode
- Tailwind CSS for all styling (no CSS modules)
- shadcn/ui components (not custom UI library)
- Prisma with SQLite (file-based, no external DB)
- NextAuth v5 beta (`next-auth@beta`)
- Guest mode: full functionality without auth, data persists in localStorage
- No external services or APIs beyond local SQLite
- All code must pass `npm run lint` and `npm run typecheck`

---

## File Structure

```
todo-app/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main todo page (redirects or shows todos)
│   ├── globals.css             # Tailwind imports + custom styles
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   └── register/
│   │       └── page.tsx        # Register page
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts    # NextAuth route handler
│       └── tasks/
│           ├── route.ts        # GET (list), POST (create)
│           └── [id]/
│               └── route.ts    # PATCH (update), DELETE (remove)
├── components/
│   ├── ui/                     # shadcn/ui components (auto-generated)
│   ├── auth-provider.tsx       # NextAuth session provider
│   ├── todo-board.tsx          # Main kanban/list board
│   ├── todo-card.tsx           # Individual todo card
│   ├── todo-form.tsx           # Create/edit todo form
│   ├── todo-columns.tsx        # Column layout (Todo, In Progress, Done)
│   └── guest-banner.tsx        # Banner prompting login to save data
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client singleton
│   ├── utils.ts                # cn() utility for Tailwind
│   └── validations.ts          # Zod schemas for todo input
├── prisma/
│   └── schema.prisma           # Database schema
├── types/
│   └── next-auth.d.ts          # NextAuth type extensions
├── middleware.ts                # Optional auth middleware
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
├── postcss.config.js           # PostCSS config
└── package.json
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`, `app/layout.tsx`, `lib/utils.ts`

**Interfaces:**
- Consumes: None (first task)
- Produces: Working Next.js 14 dev server with Tailwind CSS

- [ ] **Step 1: Initialize Next.js project**

Since this is an existing directory with SvelteKit files, we'll create a fresh Next.js setup. First, back up existing files and clean the directory.

```bash
# In the todo-app directory, remove SvelteKit files
Remove-Item -Recurse -Force src, .svelte-kit, build, static, vite.config.js, jsconfig.json, svelte.config.js -ErrorActionIgnore
Remove-Item package.json, package-lock.json -ErrorActionIgnore
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "todo-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:push": "npx prisma db push",
    "db:studio": "npx prisma studio",
    "db:seed": "npx tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.4",
    "@prisma/client": "^6.1.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.24.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.468.0",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.2"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.10.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "prisma": "^6.1.0",
    "tsx": "^4.19.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
npm install
```

- [ ] **Step 4: Create TypeScript config**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create Tailwind config**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Create PostCSS config**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 8: Create lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 9: Create app/layout.tsx**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Todo App",
  description: "A full-stack todo application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Create app/page.tsx**

```typescript
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Todo App</h1>
      <p className="mt-4 text-muted-foreground">Coming soon...</p>
    </main>
  );
}
```

- [ ] **Step 11: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
```

- [ ] **Step 12: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000, page loads with "Todo App" heading

- [ ] **Step 13: Run typecheck and lint**

```bash
npm run typecheck
npm run lint
```

Expected: Both pass with no errors

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with Tailwind CSS"
```

---

### Task 2: Prisma Schema and Database Setup

**Files:**
- Create: `prisma/schema.prisma`, `lib/prisma.ts`, `prisma/seed.ts`
- Modify: `package.json` (add prisma scripts)

**Interfaces:**
- Consumes: Task 1 (project setup)
- Produces: Prisma client singleton, database schema with User and Task models

- [ ] **Step 1: Create Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  password      String?
  image         String?
  isGuest       Boolean   @default(false)
  accounts      Account[]
  sessions      Session[]
  tasks         Task[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@id([identifier, token])
  @@map("verification_tokens")
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("todo") // todo, in_progress, done
  priority    String   @default("medium") // low, medium, high
  category    String   @default("personal") // work, personal, study, other
  dueDate     DateTime?
  tags        String   @default("[]") // JSON array of tags
  order       Int      @default(0)
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([status])
  @@map("tasks")
}
```

- [ ] **Step 2: Create Prisma client singleton**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Push schema to database**

```bash
npx prisma db push
```

Expected: Schema pushed to SQLite database, `prisma/dev.db` created

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

Expected: Prisma client generated in `node_modules/.prisma/client`

- [ ] **Step 5: Create seed script**

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create a demo user
  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@example.com",
      password: "$2a$10$hashedpassword", // This is just a placeholder
    },
  });

  // Create sample tasks
  const tasks = [
    {
      title: "Design new landing page",
      description: "Create wireframes and mockups for the new landing page",
      status: "in_progress",
      priority: "high",
      category: "work",
      tags: JSON.stringify(["design", "ui"]),
      order: 0,
      userId: user.id,
    },
    {
      title: "Read TypeScript book",
      description: "Finish chapters 5-8 of the TypeScript handbook",
      status: "todo",
      priority: "medium",
      category: "study",
      tags: JSON.stringify(["typescript", "learning"]),
      order: 1,
      userId: user.id,
    },
    {
      title: "Grocery shopping",
      description: "Buy vegetables, fruits, and milk",
      status: "todo",
      priority: "low",
      category: "personal",
      tags: JSON.stringify(["errands"]),
      order: 2,
      userId: user.id,
    },
    {
      title: "Fix API endpoint bug",
      description: "The /api/tasks endpoint returns 500 on empty body",
      status: "done",
      priority: "high",
      category: "work",
      tags: JSON.stringify(["bug", "api"]),
      order: 0,
      userId: user.id,
    },
    {
      title: "Write documentation",
      description: "Document the API endpoints and setup instructions",
      status: "todo",
      priority: "medium",
      category: "work",
      tags: JSON.stringify(["docs"]),
      order: 3,
      userId: user.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 6: Add seed script to package.json**

Add to scripts:
```json
"db:seed": "npx tsx prisma/seed.ts"
```

- [ ] **Step 7: Run seed script**

```bash
npm run db:seed
```

Expected: "Database seeded successfully!" message

- [ ] **Step 8: Verify data in database**

```bash
npx prisma studio
```

Expected: Browser opens with Prisma Studio showing User and Task records

- [ ] **Step 9: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes with no errors

- [ ] **Step 10: Commit**

```bash
git add prisma/ lib/prisma.ts
git commit -m "feat: add Prisma schema with User and Task models"
```

---

### Task 3: Zod Validation Schemas

**Files:**
- Create: `lib/validations.ts`

**Interfaces:**
- Consumes: Task 2 (Prisma schema)
- Produces: Zod schemas for todo input validation

- [ ] **Step 1: Create validation schemas**

```typescript
import { z } from "zod";

export const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be under 100 characters"),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.enum(["work", "personal", "study", "other"]).default("personal"),
  dueDate: z.string().datetime().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const todoUpdateSchema = todoSchema.partial();

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be under 50 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type TodoInput = z.infer<typeof todoSchema>;
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 3: Commit**

```bash
git add lib/validations.ts
git commit -m "feat: add Zod validation schemas for todo and auth"
```

---

### Task 4: NextAuth v5 Configuration

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`, `components/auth-provider.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: Task 2 (Prisma), Task 3 (Zod schemas)
- Produces: NextAuth handlers, session provider, auth configuration

- [ ] **Step 1: Create NextAuth config**

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 2: Create NextAuth type extensions**

```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
```

- [ ] **Step 3: Create NextAuth route handler**

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create auth provider component**

```typescript
// components/auth-provider.tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 5: Update root layout to include AuthProvider**

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Todo App",
  description: "A full-stack todo application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create register API route**

```typescript
// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validated.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 7: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 8: Commit**

```bash
git add lib/auth.ts types/next-auth.d.ts app/api/ components/auth-provider.tsx app/layout.tsx
git commit -m "feat: add NextAuth v5 configuration with credentials provider"
```

---

### Task 5: shadcn/ui Button Component

**Files:**
- Create: `components/ui/button.tsx`

**Interfaces:**
- Consumes: Task 1 (lib/utils.ts)
- Produces: Reusable Button component

- [ ] **Step 1: Create Button component**

```typescript
// components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 3: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat: add shadcn/ui Button component"
```

---

### Task 6: shadcn/ui Form Components

**Files:**
- Create: `components/ui/input.tsx`, `components/ui/label.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/select.tsx`, `components/ui/tabs.tsx`

**Interfaces:**
- Consumes: Task 1 (lib/utils.ts)
- Produces: Reusable form UI components

- [ ] **Step 1: Create Input component**

```typescript
// components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 2: Create Label component**

```typescript
// components/ui/label.tsx
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 3: Create Card components**

```typescript
// components/ui/card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 4: Create Badge component**

```typescript
// components/ui/badge.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

- [ ] **Step 5: Create Select component**

```typescript
// components/ui/select.tsx
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
```

- [ ] **Step 6: Create Tabs component**

```typescript
// components/ui/tabs.tsx
"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

- [ ] **Step 7: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 8: Commit**

```bash
git add components/ui/
git commit -m "feat: add shadcn/ui form components (Input, Label, Card, Badge, Select, Tabs)"
```

---

### Task 7: Task API Routes

**Files:**
- Create: `app/api/tasks/route.ts`, `app/api/tasks/[id]/route.ts`

**Interfaces:**
- Consumes: Task 2 (Prisma), Task 3 (Zod schemas), Task 4 (auth)
- Produces: RESTful task CRUD endpoints

- [ ] **Step 1: Create tasks list/create route**

```typescript
// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todoSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    let tasks;
    if (session?.user?.id) {
      // Authenticated: get user's tasks
      tasks = await prisma.task.findMany({
        where: { userId: session.user.id },
        orderBy: [{ status: "asc" }, { order: "asc" }],
      });
    } else {
      // Guest: return empty (client handles localStorage)
      tasks = [];
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const validated = todoSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, description, status, priority, category, dueDate, tags } =
      validated.data;

    // Get the highest order in the target status column
    const maxOrderTask = await prisma.task.findFirst({
      where: {
        userId: session?.user?.id || null,
        status,
      },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const newOrder = (maxOrderTask?.order ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        category,
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: JSON.stringify(tags),
        order: newOrder,
        userId: session?.user?.id || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create tasks update/delete route**

```typescript
// app/api/tasks/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todoUpdateSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;
    const body = await req.json();
    const validated = todoUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify task exists and belongs to user (if authenticated)
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (session?.user?.id && existingTask.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { ...validated.data };

    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate as string);
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (session?.user?.id && existingTask.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 4: Test API endpoints manually**

Start dev server and test with curl or browser:
```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/tasks
```

Expected: Returns empty array or seeded tasks

- [ ] **Step 5: Commit**

```bash
git add app/api/tasks/
git commit -m "feat: add task CRUD API routes with auth checks"
```

---

### Task 8: Todo Form Component

**Files:**
- Create: `components/todo-form.tsx`

**Interfaces:**
- Consumes: Task 5 (Button), Task 6 (Input, Label, Select), Task 3 (Zod schemas)
- Produces: Reusable form for creating/editing todos

- [ ] **Step 1: Create TodoForm component**

```typescript
// components/todo-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TodoInput } from "@/lib/validations";

interface TodoFormProps {
  initialData?: Partial<TodoInput>;
  onSubmit: (data: TodoInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function TodoForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TodoFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [priority, setPriority] = useState<TodoInput["priority"]>(
    initialData?.priority || "medium"
  );
  const [category, setCategory] = useState<TodoInput["category"]>(
    initialData?.category || "personal"
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 100) {
      newErrors.title = "Title must be under 100 characters";
    }

    if (description && description.length > 500) {
      newErrors.description = "Description must be under 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      tags: initialData?.tags || [],
      status: initialData?.status || "todo",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details..."
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(value) => setPriority(value as TodoInput["priority"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(value) =>
              setCategory(value as TodoInput["category"])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="study">Study</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date (optional)</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 3: Commit**

```bash
git add components/todo-form.tsx
git commit -m "feat: add TodoForm component with validation"
```

---

### Task 9: Todo Card Component

**Files:**
- Create: `components/todo-card.tsx`

**Interfaces:**
- Consumes: Task 5 (Button), Task 6 (Badge, Card)
- Produces: Display card for individual todo items

- [ ] **Step 1: Create TodoCard component**

```typescript
// components/todo-card.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Trash2, Calendar } from "lucide-react";

export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  category: "work" | "personal" | "study" | "other";
  dueDate?: string | null;
  tags: string[];
  order: number;
}

interface TodoCardProps {
  todo: Todo;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const categoryColors = {
  work: "bg-purple-100 text-purple-800",
  personal: "bg-green-100 text-green-800",
  study: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
};

export function TodoCard({ todo, onEdit, onDelete }: TodoCardProps) {
  const isOverdue =
    todo.dueDate && new Date(todo.dueDate) < new Date() && todo.status !== "done";

  return (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-medium">{todo.title}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(todo)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(todo.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {todo.description && (
          <p className="text-sm text-muted-foreground mb-2">{todo.description}</p>
        )}
        <div className="flex flex-wrap gap-1">
          <Badge className={priorityColors[todo.priority]}>
            {todo.priority}
          </Badge>
          <Badge className={categoryColors[todo.category]}>
            {todo.category}
          </Badge>
          {todo.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      {todo.dueDate && (
        <CardFooter className="pt-0 pb-2">
          <div
            className={`flex items-center gap-1 text-xs ${
              isOverdue ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {new Date(todo.dueDate).toLocaleDateString()}
            {isOverdue && " (overdue)"}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 3: Commit**

```bash
git add components/todo-card.tsx
git commit -m "feat: add TodoCard component with priority and category badges"
```

---

### Task 10: Todo Board Component

**Files:**
- Create: `components/todo-board.tsx`

**Interfaces:**
- Consumes: Task 8 (TodoForm), Task 9 (TodoCard), Task 6 (Tabs, Card)
- Produces: Main board layout with columns for Todo, In Progress, Done

- [ ] **Step 1: Create TodoBoard component**

```typescript
// components/todo-board.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodoCard, Todo } from "@/components/todo-card";
import { TodoForm } from "@/components/todo-form";
import { TodoInput } from "@/lib/validations";
import { Plus, LayoutGrid, List } from "lucide-react";

type ViewMode = "board" | "list";

export function TodoBoard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTodos(
          data.map((t: Todo & { tags: string }) => ({
            ...t,
            tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: TodoInput) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newTodo = await response.json();
        setTodos([
          ...todos,
          { ...newTodo, tags: JSON.parse(newTodo.tags || "[]") },
        ]);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  const handleUpdate = async (data: TodoInput) => {
    if (!editingTodo) return;

    try {
      const response = await fetch(`/api/tasks/${editingTodo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(
          todos.map((t) =>
            t.id === editingTodo.id
              ? { ...updatedTodo, tags: JSON.parse(updatedTodo.tags || "[]") }
              : t
          )
        );
        setEditingTodo(null);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTodos(todos.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: Todo["status"]
  ) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(
          todos.map((t) =>
            t.id === id
              ? { ...updatedTodo, tags: JSON.parse(updatedTodo.tags || "[]") }
              : t
          )
        );
      }
    } catch (error) {
      console.error("Failed to update todo status:", error);
    }
  };

  const todoColumns = {
    todo: todos.filter((t) => t.status === "todo"),
    in_progress: todos.filter((t) => t.status === "in_progress"),
    done: todos.filter((t) => t.status === "done"),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Todos</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}
          >
            {viewMode === "board" ? (
              <List className="h-4 w-4 mr-2" />
            ) : (
              <LayoutGrid className="h-4 w-4 mr-2" />
            )}
            {viewMode === "board" ? "List" : "Board"}
          </Button>
          <Button
            onClick={() => {
              setEditingTodo(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Todo
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTodo ? "Edit Todo" : "New Todo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TodoForm
              initialData={editingTodo || undefined}
              onSubmit={editingTodo ? handleUpdate : handleCreate}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTodo(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">
                  {status.replace("_", " ")}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({todoColumns[status].length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todoColumns[status].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No todos
                  </p>
                ) : (
                  todoColumns[status].map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({todos.length})</TabsTrigger>
            <TabsTrigger value="todo">
              Todo ({todoColumns.todo.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({todoColumns.in_progress.length})
            </TabsTrigger>
            <TabsTrigger value="done">
              Done ({todoColumns.done.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="space-y-2">
              {todos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </TabsContent>
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <TabsContent key={status} value={status}>
              <div className="space-y-2">
                {todoColumns[status].map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 3: Commit**

```bash
git add components/todo-board.tsx
git commit -m "feat: add TodoBoard component with board and list views"
```

---

### Task 11: Guest Mode with localStorage

**Files:**
- Create: `lib/guest-storage.ts`, `components/guest-banner.tsx`
- Modify: `components/todo-board.tsx`

**Interfaces:**
- Consumes: Task 10 (TodoBoard)
- Produces: Guest mode persistence and login prompt

- [ ] **Step 1: Create guest storage utility**

```typescript
// lib/guest-storage.ts
import { TodoInput } from "./validations";

const GUEST_STORAGE_KEY = "todo-app-guest-todos";

export interface GuestTodo extends TodoInput {
  id: string;
  createdAt: string;
}

export function getGuestTodos(): GuestTodo[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveGuestTodos(todos: GuestTodo[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error("Failed to save guest todos:", error);
  }
}

export function addGuestTodo(data: TodoInput): GuestTodo {
  const todo: GuestTodo = {
    ...data,
    id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const todos = getGuestTodos();
  todos.push(todo);
  saveGuestTodos(todos);

  return todo;
}

export function updateGuestTodo(
  id: string,
  data: Partial<TodoInput>
): GuestTodo | null {
  const todos = getGuestTodos();
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) return null;

  todos[index] = { ...todos[index], ...data };
  saveGuestTodos(todos);

  return todos[index];
}

export function deleteGuestTodo(id: string): boolean {
  const todos = getGuestTodos();
  const filtered = todos.filter((t) => t.id !== id);

  if (filtered.length === todos.length) return false;

  saveGuestTodos(filtered);
  return true;
}

export function clearGuestTodos(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_STORAGE_KEY);
}
```

- [ ] **Step 2: Create GuestBanner component**

```typescript
// components/guest-banner.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, X } from "lucide-react";
import Link from "next/link";

interface GuestBannerProps {
  onDismiss: () => void;
}

export function GuestBanner({ onDismiss }: GuestBannerProps) {
  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <LogIn className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              You&apos;re using guest mode
            </p>
            <p className="text-xs text-blue-700">
              Your todos are saved locally. Sign in to sync across devices.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Update TodoBoard to support guest mode**

```typescript
// components/todo-board.tsx - Updated version
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodoCard, Todo } from "@/components/todo-card";
import { TodoForm } from "@/components/todo-form";
import { GuestBanner } from "@/components/guest-banner";
import { TodoInput } from "@/lib/validations";
import {
  getGuestTodos,
  addGuestTodo,
  updateGuestTodo,
  deleteGuestTodo,
} from "@/lib/guest-storage";
import { Plus, LayoutGrid, List } from "lucide-react";

type ViewMode = "board" | "list";

export function TodoBoard() {
  const { data: session } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [showGuestBanner, setShowGuestBanner] = useState(true);

  const isGuest = !session?.user;

  useEffect(() => {
    if (isGuest) {
      // Load from localStorage for guests
      const guestTodos = getGuestTodos();
      setTodos(
        guestTodos.map((t) => ({
          ...t,
          tags: t.tags || [],
        }))
      );
      setIsLoading(false);
    } else {
      fetchTodos();
    }
  }, [isGuest]);

  const fetchTodos = async () => {
    try {
      const response = await fetch("/api/tasks");
      if (response.ok) {
        const data = await response.json();
        setTodos(
          data.map((t: Todo & { tags: string }) => ({
            ...t,
            tags: typeof t.tags === "string" ? JSON.parse(t.tags) : t.tags,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: TodoInput) => {
    if (isGuest) {
      const newTodo = addGuestTodo(data);
      setTodos([...todos, { ...newTodo, tags: newTodo.tags || [] }]);
      setIsFormOpen(false);
      return;
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newTodo = await response.json();
        setTodos([
          ...todos,
          { ...newTodo, tags: JSON.parse(newTodo.tags || "[]") },
        ]);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  };

  const handleUpdate = async (data: TodoInput) => {
    if (!editingTodo) return;

    if (isGuest) {
      const updated = updateGuestTodo(editingTodo.id, data);
      if (updated) {
        setTodos(
          todos.map((t) =>
            t.id === editingTodo.id ? { ...updated, tags: updated.tags || [] } : t
          )
        );
      }
      setEditingTodo(null);
      setIsFormOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${editingTodo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(
          todos.map((t) =>
            t.id === editingTodo.id
              ? { ...updatedTodo, tags: JSON.parse(updatedTodo.tags || "[]") }
              : t
          )
        );
        setEditingTodo(null);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    if (isGuest) {
      deleteGuestTodo(id);
      setTodos(todos.filter((t) => t.id !== id));
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTodos(todos.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setIsFormOpen(true);
  };

  const todoColumns = {
    todo: todos.filter((t) => t.status === "todo"),
    in_progress: todos.filter((t) => t.status === "in_progress"),
    done: todos.filter((t) => t.status === "done"),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading todos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isGuest && showGuestBanner && (
        <GuestBanner onDismiss={() => setShowGuestBanner(false)} />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Todos</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "board" ? "list" : "board")}
          >
            {viewMode === "board" ? (
              <List className="h-4 w-4 mr-2" />
            ) : (
              <LayoutGrid className="h-4 w-4 mr-2" />
            )}
            {viewMode === "board" ? "List" : "Board"}
          </Button>
          <Button
            onClick={() => {
              setEditingTodo(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Todo
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTodo ? "Edit Todo" : "New Todo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TodoForm
              initialData={editingTodo || undefined}
              onSubmit={editingTodo ? handleUpdate : handleCreate}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTodo(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">
                  {status.replace("_", " ")}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({todoColumns[status].length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todoColumns[status].length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No todos
                  </p>
                ) : (
                  todoColumns[status].map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({todos.length})</TabsTrigger>
            <TabsTrigger value="todo">
              Todo ({todoColumns.todo.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({todoColumns.in_progress.length})
            </TabsTrigger>
            <TabsTrigger value="done">
              Done ({todoColumns.done.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="space-y-2">
              {todos.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </TabsContent>
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <TabsContent key={status} value={status}>
              <div className="space-y-2">
                {todoColumns[status].map((todo) => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 5: Commit**

```bash
git add lib/guest-storage.ts components/guest-banner.tsx components/todo-board.tsx
git commit -m "feat: add guest mode with localStorage persistence"
```

---

### Task 12: Auth Pages (Login/Register)

**Files:**
- Create: `app/auth/login/page.tsx`, `app/auth/register/page.tsx`

**Interfaces:**
- Consumes: Task 4 (NextAuth), Task 5 (Button), Task 6 (Input, Label, Card)
- Produces: Login and registration pages

- [ ] **Step 1: Create login page**

```typescript
// app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your todos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Continue as guest
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create register page**

```typescript
// app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign in failed. Please try logging in.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create account</CardTitle>
          <CardDescription>
            Sign up to start managing your todos
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Continue as guest
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 4: Commit**

```bash
git add app/auth/
git commit -m "feat: add login and register pages with form validation"
```

---

### Task 13: Update Main Page

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: Task 10 (TodoBoard), Task 4 (AuthProvider)
- Produces: Working main page with todo board

- [ ] **Step 1: Update main page**

```typescript
// app/page.tsx
import { TodoBoard } from "@/components/todo-board";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks efficiently
          </p>
        </header>
        <TodoBoard />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 3: Test the full application**

```bash
npm run dev
```

Expected:
- Home page loads with todo board
- Can create, edit, delete todos
- Board view shows 3 columns
- List view shows tabs for filtering
- Guest banner appears for unauthenticated users
- Login/Register pages work
- Todos persist in localStorage for guests

- [ ] **Step 4: Run build to verify production readiness**

```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update main page with TodoBoard component"
```

---

### Task 14: Final Verification and Cleanup

**Files:**
- Modify: Various (if needed based on verification)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Production-ready application

- [ ] **Step 1: Run full typecheck**

```bash
npm run typecheck
```

Expected: Passes

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: Passes (or only warnings, no errors)

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Test all features manually**

1. Guest mode:
   - Open app without logging in
   - Create a todo
   - Verify it appears in the board
   - Refresh page - todo persists (localStorage)
   - Click "Sign In" on guest banner - redirects to login

2. Authentication:
   - Register a new account
   - Login with credentials
   - Verify guest banner disappears
   - Create a todo - saved to database
   - Logout - todos still visible (if guest mode) or hidden (if authenticated)

3. CRUD operations:
   - Create todo with all fields
   - Edit todo
   - Delete todo with confirmation
   - Change todo status

4. Views:
   - Toggle between board and list view
   - Filter by status in list view

- [ ] **Step 5: Clean up any unused files**

Remove any SvelteKit artifacts that may have been left behind:
```bash
Remove-Item -Recurse -Force src, .svelte-kit, build, static -ErrorActionIgnore
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Next.js todo app with auth and guest mode"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-29-nextjs-todo-app.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
