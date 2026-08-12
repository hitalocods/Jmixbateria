import { NextResponse } from 'next/server';
import { db, TipoProduto } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo') as TipoProduto | null;

  const products = await db.getProducts(tipo || undefined);
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const product = await db.saveProduct({
      tipo: body.tipo || 'NOVA',
      marca: body.marca,
      modelo: body.modelo,
      amperagem: Number(body.amperagem) || 60,
      voltagem: body.voltagem || '12V',
      cca: Number(body.cca) || 400,
      polo: body.polo || 'DIREITO',
      aplicacao: body.aplicacao || 'CARRO',
      tecnologia: body.tecnologia || 'SLI',
      saudePct: Number(body.saudePct) || (body.tipo === 'SEMI_NOVA' ? 85 : 100),
      garantiaMeses: Number(body.garantiaMeses) || (body.tipo === 'SEMI_NOVA' ? 3 : 24),
      precoCusto: Number(body.precoCusto) || 0,
      precoVenda: Number(body.precoVenda) || 0,
      estoque: Number(body.estoque) || 0,
      estoqueMinimo: Number(body.estoqueMinimo) || 2,
      imagemUrl: body.imagemUrl || '/logo.png',
      descricao: body.descricao || ''
    });

    await db.addAuditLog(
      session.id,
      session.nome,
      'PRODUTO_CADASTRADO',
      `Produto ${product.marca} ${product.modelo} (${product.tipo}) cadastrado por ${session.nome}.`
    );

    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao cadastrar produto' }, { status: 500 });
  }
}
