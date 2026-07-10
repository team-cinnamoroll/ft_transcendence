'use client';

import { useState, useTransition } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthSignUpRequestSchema } from '@tracen/contracts';
import type { AuthSignUpRequest } from '@/types/auth';
import { signUpAction } from '@/server/actions/auth';

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

  const { register, handleSubmit } = useForm<AuthSignUpRequest>({
    resolver: zodResolver(AuthSignUpRequestSchema),
  });

  const fieldErrorMessage = (field: keyof AuthSignUpRequest): string => {
    switch (field) {
      case 'name':
        return t('errorName');
      case 'email':
        return t('errorEmail');
      case 'password':
        return t('errorPassword');
    }
  };

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

  const onInvalid = (formErrors: FieldErrors<AuthSignUpRequest>) => {
    const firstField = Object.keys(formErrors)[0] as keyof AuthSignUpRequest | undefined;
    setError(firstField ? fieldErrorMessage(firstField) : t('errorGeneric'));
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
        />
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
        />
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
        />
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--mf-accent)' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit(onValid, onInvalid)}
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
