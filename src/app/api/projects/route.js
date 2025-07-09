import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ projects: [], error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectDB();
    const { projectId, userId } = await req.json();
    if (!projectId || !userId) {
      return NextResponse.json({ error: 'Missing projectId or userId' }, { status: 400 });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    // Ensure joinedVolunteers is always an array
    if (!Array.isArray(project.joinedVolunteers)) {
      project.joinedVolunteers = [];
    }
    if (!project.joinedVolunteers.includes(userId)) {
      project.joinedVolunteers.push(userId);
      await project.save();
    }
    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error joining project:', error);
    return NextResponse.json({ error: 'Failed to join project' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const projectId = params?.projectId || req.url.split('/').pop();
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }
    const deleted = await Project.findByIdAndDelete(projectId);
    if (!deleted) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 