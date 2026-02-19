import { NextRequest, NextResponse } from 'next/server';
import { CRM_PASSWORD_HASH, SESSION_COOKIE, SESSION_TOKEN, sha256 } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    // Hash the provided password and compare
    const hash = await sha256(password);

    if (hash !== CRM_PASSWORD_HASH) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    // Set session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
