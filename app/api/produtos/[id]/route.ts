import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await db.updateProduct(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    await db.addAuditLog(
      session.id,
      session.nome,
      'PRODUTO_ATUALIZADO',
      `Produto ${updated.marca} ${updated.modelo} atualizado por ${session.nome}.`
    );

    return NextResponse.json({ product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas administradores podem excluir produtos.' }, { status: 403 });
    }

    const { id } = await params;
    const prod = await db.getProductById(id);
    const success = await db.deleteProduct(id);

    if (!success) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    await db.addAuditLog(
      session.id,
      session.nome,
      'PRODUTO_EXCLUIDO',
      `Produto ${prod?.marca} ${prod?.modelo} excluído por ${session.nome}.`
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao excluir produto' }, { status: 500 });
  }
}
