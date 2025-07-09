"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import connectDB from "../../lib/mongodb";
import Project from "../../models/Project";

// Helper to get value from FormData or plain object
function getField(formData, key) {
  if (typeof formData.get === "function") {
    // Try both camelCase and snake_case
    return formData.get(key) ?? formData.get(key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
  }
  return formData[key] ?? formData[key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)];
}

export async function submitProject(formData) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, error: "Authentication required" };
    }

    // Connect to database
    await connectDB();

    // Extract form data
    const title = getField(formData, "title");
    const description = getField(formData, "description");
    const instructions = getField(formData, "instructions") || "";
    const startDate = getField(formData, "startDate");
    const startTime = getField(formData, "startTime");
    const endDate = getField(formData, "endDate");
    const endTime = getField(formData, "endTime");
    const hours = getField(formData, "hours");
    const contactPhone = getField(formData, "contactPhone") || "";
    const urgency = getField(formData, "urgency");
    const imageFile = getField(formData, "image");

    // Validate required fields
    if (!title || !description || !startDate || !startTime || !endDate || !endTime || !urgency) {
      return { success: false, error: "Please fill in all required fields" };
    }

    // Validate title length
    if (title.length > 100) {
      return { success: false, error: "Title must be 100 characters or less" };
    }

    // Validate description length
    if (description.length > 500) {
      return { success: false, error: "Description must be 500 characters or less" };
    }

    // Validate instructions length
    if (instructions.length > 300) {
      return { success: false, error: "Instructions must be 300 characters or less" };
    }

    // Validate date/time (end must be after start)
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    const now = new Date();
    if (start <= now) {
      return { success: false, error: "Start date and time must be in the future" };
    }
    if (end <= start) {
      return { success: false, error: "End date/time must be after start date/time" };
    }

    // Validate totalHours
    if (!hours || isNaN(hours) || Number(hours) <= 0) {
      return { success: false, error: "Total hours must be a positive number" };
    }

    // Handle image upload (basic validation)
    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      // Check file size (5MB limit)
      if (imageFile.size > 5 * 1024 * 1024) {
        return { success: false, error: "Image file size must be less than 5MB" };
      }

      // Check file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!allowedTypes.includes(imageFile.type)) {
        return { success: false, error: "Only JPG, PNG, and GIF images are allowed" };
      }

      // For now, we'll store a placeholder. In a real app, you'd upload to cloud storage
      imageUrl = "placeholder-image-url";
    }

    // Create project
    let userId = session.user.id;
    if (!userId) {
      // Fallback: fetch user from DB by email
      const user = await (await import('../../models/User')).default.findOne({ email: session.user.email });
      userId = user ? user._id.toString() : undefined;
    }
    if (!userId) {
      return { success: false, error: "User ID not found for session user." };
    }
    const project = new Project({
      userId,
      userEmail: session.user.email,
      userName: session.user.name,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      hours: Number(hours),
      startDate: new Date(startDate),
      startTime: startTime,
      endDate: new Date(endDate),
      endTime: endTime,
      totalHours: Number(hours),
      contactPhone: contactPhone.trim(),
      urgency,
      imageUrl,
      status: "pending",
      createdAt: new Date(),
    });

    await project.save();

    return { 
      success: true, 
      message: "Project submitted successfully!",
      projectId: project._id ? project._id.toString() : undefined
    };

  } catch (error) {
    console.error("Error submitting project:", error);
    return { 
      success: false, 
      error: "Failed to submit project. Please try again." 
    };
  }
} 