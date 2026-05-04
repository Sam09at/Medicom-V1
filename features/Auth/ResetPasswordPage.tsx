import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { updatePassword } from '../../lib/api/auth';
import { useMedicomStore } from '../../store';
import { MedicomError } from '../../lib/errors';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const showToast = useMedicomStore((s) => s.showToast);

  // Three UI states: checking session | ready to set password | invalid link
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking');

  useEffect(() => {
    // Supabase embeds the session tokens in the URL hash fragment and
    // processes them automatically when detectSessionInUrl: true (set in lib/supabase.ts).
    // We just need to confirm a valid session exists before showing the form.
    const check = async () => {
      if (!supabase) {
        setStatus('invalid');
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setStatus(session ? 'ready' : 'invalid');
    };
    check();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await updatePassword(data.password);
      showToast({ type: 'success', message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' });
      navigate('/login', { replace: true });
    } catch (err) {
      const msg =
        err instanceof MedicomError
          ? err.userMessage
          : 'Impossible de mettre à jour le mot de passe.';
      showToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm tracking-tight">M</span>
          </div>
          <span className="font-semibold text-slate-900 text-[15px]">Medicom</span>
        </div>

        {status === 'checking' && (
          <div className="flex items-center justify-center py-8">
            <div className="w-7 h-7 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {status === 'invalid' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 mb-2">Lien invalide</h1>
            <p className="text-sm text-slate-500">
              Ce lien de réinitialisation est expiré ou invalide.
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="mt-5 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Demander un nouveau lien
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <h1 className="text-xl font-semibold text-slate-900 mb-1 tracking-tight">
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Choisissez un nouveau mot de passe sécurisé.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nouveau mot de passe
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <input
                  {...register('confirm')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                {errors.confirm && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.confirm.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
