import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { login, senha } = await req.json();

    if (!login || !senha) {
      return NextResponse.json({ error: 'Informe o e-mail ou matrícula e a senha.' }, { status: 400 });
    }

    const users = await db.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === login.toLowerCase() || u.matricula.toLowerCase() === login.toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
    }

    if (!user.ativo) {
      return NextResponse.json({ error: 'Acesso desativado pelo administrador.' }, { status: 403 });
    }

    const isValid = await verifyPassword(senha, user.senhaHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
    }

    const sessionData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      matricula: user.matricula,
      role: user.role
    };

    await createSession(sessionData);

    await db.addAuditLog(
      user.id,
      user.nome,
      'LOGIN_USUARIO',
      `Usuário ${user.nome} (${user.role}) efetuou login no sistema.`
    );

    return NextResponse.json({ success: true, user: sessionData });
  } catch (err: any) {
    console.error('Erro na API de Login:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
