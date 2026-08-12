import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/blob';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('Erro na rota de upload:', err);
    return NextResponse.json({ error: 'Falha ao processar upload da imagem.' }, { status: 500 });
  }
}
