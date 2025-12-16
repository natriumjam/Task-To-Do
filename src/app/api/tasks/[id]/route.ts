import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT( // update a task
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        const body = await request.json();

        const task = await prisma.task.update({
            where: { id },
            data: { 
                ...body,
                ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
                ...(body.dueDate === null && { dueDate: null })
            },
        });

        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
    }
}

export async function DELETE( // soft delete a task
    request: Request,
    { params }: { params: Promise<{ id: string }> }
    ) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);

        const task = await prisma.task.update({
            where: { id },
            data: { 
                deletedAt: new Date() 
            },
        });
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
    }
}