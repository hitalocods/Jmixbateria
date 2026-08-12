import { put } from '@vercel/blob';

export async function uploadImage(file: File): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    try {
      const blob = await put(`baterias/${Date.now()}-${file.name}`, file, {
        access: 'public',
        token
      });
      return blob.url;
    } catch (err) {
      console.error('Erro ao enviar imagem para Vercel Blob:', err);
    }
  }

  // Fallback para desenvolvimento local: Retornar data URL base64 ou imagem padrão
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/png';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    return '/logo.png';
  }
}
