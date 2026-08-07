'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthSignUpRequestSchema } from '@tracen/contracts';
import type { AuthSignUpRequest } from '@/types/auth';
import { signUpAction } from '@/server/actions/auth';
import { useZodForm } from '@/lib/use-zod-form';

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '0.5px solid var(--mf-line)',
  background: 'var(--mf-surface)',
  padding: '10px 14px',
  fontSize: 14,
  color: 'var(--mf-ink)',
  fontFamily: 'var(--mf-font-sans)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--mf-text-sub)',
};

const SignUpForm = () => {
  const t = useTranslations('signUp');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm(AuthSignUpRequestSchema);

  const onValid = (data: AuthSignUpRequest) => {
    if (isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await signUpAction(data);

      if (!result.success) {
        const firstFieldError = Object.values(result.errors)[0]?.[0];
        setError(firstFieldError ?? t('errorGeneric'));
        return;
      }
      if (!result.data.success) {
        setError(result.data.message ?? t('errorGeneric'));
        return;
      }

      router.push('/');
    });
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '48px auto',
        padding: '0 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--mf-brand)', margin: 0 }}>
        {t('title')}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label htmlFor="sign-up-name" style={labelStyle}>
          {t('name')}
        </label>
        <input
          id="sign-up-name"
          type="text"
          {...register('name', { setValueAs: (v: string) => v.trim() })}
          placeholder={t('namePlaceholder')}
          style={inputStyle}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'sign-up-name-error' : undefined}
        />
        {errors.name && (
          <p
            id="sign-up-name-error"
            role="alert"
            style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}
          >
            {errors.name?.message}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label htmlFor="sign-up-email" style={labelStyle}>
          {t('email')}
        </label>
        <input
          id="sign-up-email"
          type="email"
          {...register('email', { setValueAs: (v: string) => v.trim() })}
          placeholder={t('emailPlaceholder')}
          style={inputStyle}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'sign-up-email-error' : undefined}
        />
        {errors.email && (
          <p
            id="sign-up-email-error"
            role="alert"
            style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}
          >
            {errors.email?.message}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <label htmlFor="sign-up-password" style={labelStyle}>
          {t('password')}
        </label>
        <input
          id="sign-up-password"
          type="password"
          {...register('password')}
          placeholder={t('passwordPlaceholder')}
          style={inputStyle}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'sign-up-password-error' : undefined}
        />
        {errors.password && (
          <p
            id="sign-up-password-error"
            role="alert"
            style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}
          >
            {errors.password?.message}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit(onValid)}
        disabled={isPending}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          border: 'none',
          cursor: isPending ? 'not-allowed' : 'pointer',
          background: isPending ? 'var(--mf-surface-tint)' : 'var(--mf-accent)',
          color: isPending ? 'var(--mf-text-faint)' : '#fff',
          boxShadow: isPending ? 'none' : '0 2px 10px rgba(212,146,42,0.25)',
          transition: 'background 0.15s',
        }}
      >
        {isPending ? t('submitting') : t('submit')}
      </button>

      <p style={{ fontSize: 12, color: 'var(--mf-text-muted)', textAlign: 'center', margin: 0 }}>
        {t('switchToSignInPrompt')}{' '}
        <Link href="/sign-in" style={{ color: 'var(--mf-brand)', fontWeight: 600 }}>
          {t('switchToSignInLink')}
        </Link>
      </p>
    </div>
  );
};

export default SignUpForm;
