const MB = 1024 * 1024;
const MAX_UPLOAD_BYTES = 10 * MB;
const MAX_PDF_PAGES = 15;

interface UploadFileLike {
  name: string;
  type: string;
  size: number;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export function assertUploadSize(file: UploadFileLike) {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File exceeds 10MB limit.');
  }
}

export async function extractTextFromUpload(file: UploadFileLike): Promise<string> {
  assertUploadSize(file);

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (type === 'text/plain' || name.endsWith('.txt')) {
    return (await file.text()).trim();
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: buffer,
      isEvalSupported: false,
      useWorkerFetch: false,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;

    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error('PDF exceeds 15 page limit.');
    }

    const chunks: string[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item?.str || '')
        .filter(Boolean)
        .join(' ')
        .trim();

      if (pageText) {
        chunks.push(pageText);
      }
    }

    return chunks.join('\n\n').trim();
  }

  throw new Error('Unsupported file type. Use PDF or TXT.');
}
