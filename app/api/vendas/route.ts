import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const sales = await db.getSales();
  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'É necessário estar autenticado para registrar uma venda.' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.itens || !Array.isArray(body.itens) || body.itens.length === 0) {
      return NextResponse.json({ error: 'Selecione pelo menos uma bateria para vender.' }, { status: 400 });
    }

    const sale = await db.createSale({
      usuarioId: session.id,
      usuarioNome: session.nome,
      clienteNome: body.clienteNome,
      clienteContato: body.clienteContato,
      formaPagamento: body.formaPagamento || 'PIX',
      desconto: Number(body.desconto) || 0,
      valorTrocaSucata: Number(body.valorTrocaSucata) || 0,
      observacao: body.observacao,
      itens: body.itens
    });

    return NextResponse.json({ sale }, { status: 201 });
  } catch (err: any) {
    console.error('Erro ao processar venda:', err);
    return NextResponse.json({ error: err.message || 'Erro ao registrar venda' }, { status: 400 });
  }
}
