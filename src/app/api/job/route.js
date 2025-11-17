
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Job from '@/lib/models/Job';

export async function POST(request) {
  await dbConnect();

  try {
    const { name, clickupTaskId , mentions , prompt} = await request.json();

    if (!name || !clickupTaskId) {
      return NextResponse.json({ success: false, error: 'Name and ClickUp Task ID are required' }, { status: 400 });
    }

    const existingJob = await Job.findOne({ $or: [{ name }, { clickupTaskId }] });

    if (existingJob) {
      return NextResponse.json({ success: false, error: 'Job with the same Name or ClickUp Task ID already exists' }, { status: 409 });
    }

    const newJob = new Job({ name, clickupTaskId , mentions , prompt});
    await newJob.save();

    return NextResponse.json({ success: true, data: newJob });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
