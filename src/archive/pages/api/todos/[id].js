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

  const { id } = req.query;

  if (req.method === "PUT") {
    try {
      const todo = await Todo.findOneAndUpdate(
        { _id: id, userId: session.user.email },
        { $set: req.body },
        { new: true }
      );
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      return res.status(200).json(todo);
    } catch (error) {
      return res.status(500).json({ error: "Error updating todo" });
    }
  }
  if (req.method === "DELETE") {
    try {
      const todo = await Todo.findOneAndDelete({ _id: id, userId: session.user.email });
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      return res.status(200).json({ message: "Todo deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Error deleting todo" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}