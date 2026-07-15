import type { Request } from 'express';
import type { SessionMetadata } from '../interfaces/auth.interface';

export function getRequestMetadata(request: Request): SessionMetadata {
  const userAgent = request.get('user-agent') ?? 'unknown';

  return {
    ip: request.ip || request.socket.remoteAddress || 'unknown',
    userAgent,
    device: detectDevice(userAgent),
  };
}

export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex < 0) continue;

    const key = cookie.slice(0, separatorIndex).trim();
    if (key === name) {
      return decodeURIComponent(cookie.slice(separatorIndex + 1).trim());
    }
  }

  return null;
}

function detectDevice(userAgent: string): string {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}
