import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas administradores podem ver os usuários.' }, { status: 403 });
  }

  const users = await db.getUsers();
  // Remover hash da resposta por segurança
  const safeUsers = users.map(({ senhaHash, ...u }) => u);
  return NextResponse.json({ users: safeUsers });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas administradores podem cadastrar funcionários.' }, { status: 403 });
    }

    const body = await req.json();

    if (!body.nome || !body.email || !body.senha) {
      return NextResponse.json({ error: 'Nome, E-mail e Senha são obrigatórios.' }, { status: 400 });
    }

    const existing = await db.getUserByEmail(body.email);
    if (existing) {
      return NextResponse.json({ error: 'Já existe um usuário cadastrado com este e-mail.' }, { status: 400 });
    }

    const senhaHash = await hashPassword(body.senha);

    const newUser = await db.createUser({
      nome: body.nome,
      email: body.email,
      matricula: body.matricula || `FUN${Math.floor(100 + Math.random() * 900)}`,
      senhaHash,
      role: body.role || 'FUNCIONARIO',
      ativo: body.ativo !== false
    });

    await db.addAuditLog(
      session.id,
      session.nome,
      'USUARIO_CADASTRADO',
      `Novo funcionário ${newUser.nome} (${newUser.role}) cadastrado por ${session.nome}.`
    );

    const { senhaHash: _, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao cadastrar funcionário' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas administradores podem alterar usuários.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, senha, ...userData } = body;

    const updateData: any = { ...userData };
    if (senha && senha.trim()) {
      updateData.senhaHash = await hashPassword(senha.trim());
    }

    const updated = await db.updateUser(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    await db.addAuditLog(
      session.id,
      session.nome,
      'USUARIO_ATUALIZADO',
      `Usuário ${updated.nome} atualizado por ${session.nome}.`
    );

    const { senhaHash: _, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
