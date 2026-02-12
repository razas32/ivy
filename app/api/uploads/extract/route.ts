import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromUpload } from '@/lib/fileTextExtraction';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }

    const text = await extractTextFromUpload(file);

    if (!text) {
      return NextResponse.json({ error: 'No text could be extracted from file.' }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process file.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
