import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado', user: null }, { status: 401 });
  }

  return NextResponse.json({
    id: session.id,
    nome: session.nome,
    email: session.email,
    role: session.role,
    matricula: session.matricula,
    user: session
  });
}
