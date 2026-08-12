import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const users = await db.getUsers();
    const safeUsers = users.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      matricula: u.matricula,
      role: u.role,
      ativo: u.ativo,
      createdAt: u.createdAt
    }));

    return NextResponse.json(safeUsers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
    }

    const body = await req.json();
    const { nome, email, matricula, senha, role, ativo } = body;

    if (!nome || !email || !matricula || !senha) {
      return NextResponse.json({ error: 'Preencha Nome, Email, Matrícula e Senha.' }, { status: 400 });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const newUser = await db.createUser({
      nome,
      email: email.trim().toLowerCase(),
      matricula: matricula.trim().toUpperCase(),
      senhaHash,
      role: role || 'FUNCIONARIO',
      ativo: ativo !== undefined ? ativo : true
    });

    await db.addAuditLog(
      session.id,
      session.nome,
      'USUARIO_CRIADO',
      `Novo colaborador "${nome}" (${email}) cadastrado por ${session.nome}.`
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao criar funcionário' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, nome, email, matricula, senha, role, ativo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const updates: any = {};
    if (nome) updates.nome = nome;
    if (email) updates.email = email.trim().toLowerCase();
    if (matricula) updates.matricula = matricula.trim().toUpperCase();
    if (role) updates.role = role;
    if (ativo !== undefined) updates.ativo = ativo;

    if (senha && senha.trim().length > 0) {
      updates.senhaHash = await bcrypt.hash(senha, 10);
    }

    const updatedUser = await db.updateUser(id, updates);
    if (!updatedUser) {
      return NextResponse.json({ error: 'Funcionário não encontrado.' }, { status: 404 });
    }

    await db.addAuditLog(
      session.id,
      session.nome,
      'USUARIO_EDITADO',
      `Dados do funcionário "${updatedUser.nome}" (${updatedUser.email}) foram atualizados.`
    );

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao atualizar funcionário' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do funcionário é obrigatório.' }, { status: 400 });
    }

    if (id === session.id) {
      return NextResponse.json({ error: 'Você não pode excluir a sua própria conta ativa.' }, { status: 400 });
    }

    const success = await db.deleteUser(id);
    if (!success) {
      return NextResponse.json({ error: 'Funcionário não encontrado para exclusão.' }, { status: 404 });
    }

    await db.addAuditLog(
      session.id,
      session.nome,
      'USUARIO_EXCLUIDO',
      `Funcionário ID "${id}" foi removido do sistema por ${session.nome}.`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao excluir funcionário' }, { status: 500 });
  }
}
