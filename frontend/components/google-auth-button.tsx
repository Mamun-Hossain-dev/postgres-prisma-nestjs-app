'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { LoaderCircle } from 'lucide-react';

export function GoogleAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('error')) {
      setError('Google sign-in could not be completed. Please try again.');
    }
  }, []);

  async function continueWithGoogle() {
    setIsLoading(true);
    setError(null);
    const requestedUrl = new URLSearchParams(window.location.search).get(
      'callbackUrl',
    );
    const callbackUrl = requestedUrl?.startsWith('/')
      ? requestedUrl
      : '/profile';

    try {
      await signIn('google', { callbackUrl });
    } catch {
      setError('Google sign-in could not be started. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={isLoading}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-full border bg-white/70 px-5 text-sm font-bold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/15 disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? (
          <LoaderCircle className="animate-spin" size={20} />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>
      {error && (
        <p
          className="mt-2 text-center text-xs font-medium text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-4 py-1" aria-hidden="true">
      <span className="h-px flex-1 bg-black/10" />
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/35">
        or use email
      </span>
      <span className="h-px flex-1 bg-black/10" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.05v2.61A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.88A6.02 6.02 0 0 1 6.07 12c0-.65.11-1.29.32-1.88V7.51H3.05a10 10 0 0 0 0 8.98l3.34-2.61Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.99c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.95 5.51l3.34 2.61C7.18 7.75 9.39 6 12 6Z"
      />
    </svg>
  );
}
