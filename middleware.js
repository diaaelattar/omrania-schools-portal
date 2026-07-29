import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'sdp_session';

async function getRole(token) {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.role || null;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isSchoolArea = pathname.startsWith('/school') && pathname !== '/school/login';

  if (!isAdminArea && !isSchoolArea) return NextResponse.next();

  const role = await getRole(token);

  if (isAdminArea && role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  if (isSchoolArea && role !== 'school') {
    return NextResponse.redirect(new URL('/school/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/school/:path*'],
};
