import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from './security';

describe('Security Middleware Engine', () => {
  it('should inject mandatory security headers (CSP, HSTS, X-Frame-Options)', () => {
    const res = NextResponse.next();
    applySecurityHeaders(res);

    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=63072000');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });
});
