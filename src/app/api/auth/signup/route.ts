import { prisma } from "@/features/core/lib/prisma";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    // Field required validation
    if (!username || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // Encrypting the password using bcrypt hash function
    const hashedPassword = await hash(password, 10);
    // creating the user user prisma.user.create
    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "STAFF", // Explicitly set role; super admin can change the role afterwards
        isVerified: false, // Default until approved by super admin
      },
    });
    // success response
    return NextResponse.json(
      { message: "Account created successfully! Let's login to get started." },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    // Check if it's a Prisma error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Username or email already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
