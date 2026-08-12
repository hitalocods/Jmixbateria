import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const sales = await db.getSales();
    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar vendas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      usuarioId,
      usuarioNome,
      clienteNome,
      clienteContato,
      formaPagamento,
      desconto,
      valorTrocaSucata,
      valorInstalacao,
      observacao,
      itens
    } = body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Adicione pelo menos 1 bateria ao pedido de venda.' }, { status: 400 });
    }

    const newSale = await db.createSale({
      usuarioId: session.id || usuarioId,
      usuarioNome: session.nome || usuarioNome,
      clienteNome,
      clienteContato,
      formaPagamento: formaPagamento || 'PIX',
      desconto: Number(desconto) || 0,
      valorTrocaSucata: Number(valorTrocaSucata) || 0,
      valorInstalacao: Number(valorInstalacao) || 0,
      observacao,
      itens
    });

    return NextResponse.json(newSale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao registrar venda' }, { status: 400 });
  }
}
