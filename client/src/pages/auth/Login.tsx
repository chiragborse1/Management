'use client';

import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/errors';
import { getDashboardPath } from '@/lib/navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: true },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(data.email, data.password, data.rememberMe);
      toast.success('Welcome back!');
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? getDashboardPath(loggedInUser.role), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid credentials'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <svg className="text-primary h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L2 7v10l10 4 10-4V7L12 3zm0 2.18l7.45 2.98v8.66L12 21.82 4.55 18.84V10.18L12 5.18zM4 7.82l7 2.8v8.36l-7-2.8V7.82zm9 10.36v-8.36l7-2.8v8.36l-7 2.8z" />
            </svg>
            <span className="text-foreground text-2xl font-bold">HostelSaas</span>
          </Link>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-card border-border rounded-xl border p-6 shadow-sm sm:p-8">
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises -- RHF handleSubmit accepts async SubmitHandlers */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="text-foreground mb-1.5 block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  className={cn(
                    'bg-background w-full rounded-lg border py-2.5 pr-4 pl-10',
                    'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                    'placeholder:text-muted-foreground/50',
                    errors.email && 'border-destructive'
                  )}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-destructive mt-1.5 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-foreground block text-sm font-medium">
                  Password
                </label>
                <Link to="/forgot-password" className="text-primary text-sm hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    'bg-background w-full rounded-lg border py-2.5 pr-12 pl-10',
                    'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                    'placeholder:text-muted-foreground/50',
                    errors.password && 'border-destructive'
                  )}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive mt-1.5 text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="text-primary focus:ring-primary border-input h-4 w-4 rounded focus:ring-2"
                />
                <span className="text-muted-foreground text-sm">Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'text-primary-foreground bg-primary w-full rounded-lg px-4 py-2.5 font-medium',
                'hover:bg-primary/90 focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
                'transition-colors disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
