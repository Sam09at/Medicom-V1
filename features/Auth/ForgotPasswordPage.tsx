import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../lib/api/auth';
import { MedicomError } from '../../lib/errors';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
});

type FormData = z.infer<typeof schema>;

export const ForgotPasswordPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await requestPasswordReset({ email: data.email });
      // Always show success — never confirm whether an account exists (security)
      setSubmitted(true);
    } catch (err) {
      const msg =
        err instanceof MedicomError
          ? err.userMessage
          : 'Impossible d\'envoyer l\'email. Vérifiez votre connexion.';
      setServerError(msg);
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

        {submitted ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 mb-2 tracking-tight">
              Email envoyé
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Si un compte existe pour cet email, vous recevrez un lien de
              réinitialisation dans quelques minutes.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-slate-900 mb-1 tracking-tight">
              Mot de passe oublié
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>

            {serverError && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="docteur@cabinet.ma"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link
                to="/login"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
