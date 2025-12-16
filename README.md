# Task To-Do

A full-stack To-Do application built with Next.js App Router, TypeScript, and Prisma.

## Features
- Task CRUD operations
- Soft delete
- RESTful API

## Tech Stack
- Next.js
- Prisma
- SQLite

## Running Locally
1. Create a git repository using in the terminal:
   ```sh
   git clone https://github.com/natriumjam/Task-To-Do.git
   ```
2. Create a .env file, then edit that file and fill it with
    ```sh
        DATABASE_URL="file:./dev.db"
    ```
3. Run database migration in the terminal:
    ```sh
        npx prisma migrate dev
    ```
4. Start the Development Server in the terminal
    ```sh
           npm run dev
    ```