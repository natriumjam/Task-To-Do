import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { error } from "console";

export async function GET() { // get all tasks
    try {
        const tasks = await prisma.task.findMany({
            where: { deletedAt: null, },
            orderBy: { createdAt: "desc", }
        });
        return NextResponse.json(tasks);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
    }
}

export async function POST(request: Request) { // create a new task
    try {
        const body = await request.json();

        // validate the input
        if (!body.title) {
            return NextResponse.json({ error: "Title is required." }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                title: body.title,
                description: body.description || '',
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
            },
        });
        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
    }
}