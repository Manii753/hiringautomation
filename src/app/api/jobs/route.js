
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Job from '@/lib/models/Job';

export async function GET(request) {
  await dbConnect();

  try {
    const jobs = await Job.find({});
    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
