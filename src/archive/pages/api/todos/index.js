import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import connectDB from "@/lib/mongodb";
import Todo from "@/models/Todo";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "You must be logged in." });
  }

  await connectDB();

  if (req.method === "GET") {
    try {
      const todos = await Todo.find({ userId: session.user.email }).sort({ createdAt: -1 });
      return res.status(200).json(todos);
    } catch (error) {
      return res.status(500).json({ error: "Error fetching todos" });
    }
  }
  if (req.method === "POST") {
    try {
      const todo = await Todo.create({
        title: req.body.title,
        userId: session.user.email,
      });
      return res.status(201).json(todo);
    } catch (error) {
      return res.status(500).json({ error: "Error creating todo" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}