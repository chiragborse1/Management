'use client';

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  Briefcase,
  Utensils,
} from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['student', 'admin', 'mess_owner']),
    studentId: z.string().optional(),
    hostelId: z.string().optional(),
    businessName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.role === 'student') return (data.studentId ?? '').length > 0;
      if (data.role === 'admin') return (data.hostelId ?? '').length > 0;
      if (data.role === 'mess_owner') return (data.businessName ?? '').length > 0;
      return true;
    },
    {
      message: 'This field is required for the selected role',
      path: ['studentId'], // Will show on first conditional field
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

type RoleValue = 'student' | 'admin' | 'mess_owner';

const roleOptions: Array<{
  value: RoleValue;
  label: string;
  icon: typeof User;
  description: string;
}> = [
  {
    value: 'student',
    label: 'Student',
    icon: User,
    description: 'Book rooms, subscribe to mess, raise complaints',
  },
  {
    value: 'admin',
    label: 'Hostel Admin',
    icon: Building2,
    description: 'Manage hostel, rooms, students, payments',
  },
  {
    value: 'mess_owner',
    label: 'Mess Owner',
    icon: Utensils,
    description: 'Manage mess, menu, subscriptions, revenue',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'student' },
  });

  const watchedRole = watch('role');

  const onSubmit = async (_data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // TODO: Call register API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Account created successfully!');
      navigate('/login');
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <svg className="text-primary h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L2 7v10l10 4 10-4V7L12 3zm0 2.18l7.45 2.98v8.66L12 21.82 4.55 18.84V10.18L12 5.18zM4 7.82l7 2.8v8.36l-7-2.8V7.82zm9 10.36v-8.36l7-2.8v8.36l-7 2.8z" />
            </svg>
            <span className="text-foreground text-2xl font-bold">HostelSaas</span>
          </Link>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        {/* Register Form */}
        <div className="bg-card border-border rounded-xl border p-6 shadow-sm sm:p-8">
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises -- RHF handleSubmit accepts async SubmitHandlers */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="text-foreground mb-3 block text-sm font-medium">
                I want to register as
              </label>
              <div
                className="grid grid-cols-3 gap-3"
                role="radiogroup"
                aria-label="Select your role"
              >
                {roleOptions.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => {
                      setValue('role', role.value, { shouldValidate: true });
                    }}
                    className={cn(
                      'relative rounded-lg border-2 p-4 text-left transition-all duration-200',
                      watchedRole === role.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    )}
                    role="radio"
                    aria-checked={watchedRole === role.value}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'rounded-full p-2',
                          watchedRole === role.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <role.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{role.label}</p>
                        <p className="text-muted-foreground text-xs">{role.description}</p>
                      </div>
                    </div>
                    {watchedRole === role.value && (
                      <div className="text-primary absolute top-2 right-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    <input
                      type="radio"
                      value={role.value}
                      checked={watchedRole === role.value}
                      className="sr-only"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="text-destructive mt-1.5 text-sm">{errors.role.message}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="text-foreground mb-1.5 block text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  className={cn(
                    'bg-background w-full rounded-lg border py-2.5 pr-4 pl-10',
                    'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                    'placeholder:text-muted-foreground/50',
                    errors.name && 'border-destructive'
                  )}
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p className="text-destructive mt-1.5 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-foreground mb-1.5 block text-sm font-medium">
                Email Address
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

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="text-foreground mb-1.5 block text-sm font-medium">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  {...register('phone')}
                  id="phone"
                  type="tel"
                  className={cn(
                    'bg-background w-full rounded-lg border py-2.5 pr-4 pl-10',
                    'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                    'placeholder:text-muted-foreground/50',
                    errors.phone && 'border-destructive'
                  )}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className="text-destructive mt-1.5 text-sm">{errors.phone.message}</p>
              )}
            </div>

            {/* Role-specific fields */}
            {watchedRole === 'student' && (
              <div>
                <label
                  htmlFor="studentId"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Student ID
                </label>
                <div className="relative">
                  <User className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <input
                    {...register('studentId')}
                    id="studentId"
                    type="text"
                    className={cn(
                      'bg-background w-full rounded-lg border py-2.5 pr-4 pl-10',
                      'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                      'placeholder:text-muted-foreground/50',
                      errors.studentId && 'border-destructive'
                    )}
                    placeholder="STU2024001"
                    autoComplete="off"
                  />
                </div>
                {errors.studentId && (
                  <p className="text-destructive mt-1.5 text-sm">{errors.studentId.message}</p>
                )}
              </div>
            )}

            {watchedRole === 'admin' && (
              <div>
                <label
                  htmlFor="hostelId"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Hostel ID / Code
                </label>
                <div className="relative">
                  <Building2 className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <input
                    {...register('hostelId')}
                    id="hostelId"
                    type="text"
                    className={cn(
                      'bg-background w-full rounded-lg border py-2.5 pr-4 pl-10',
                      'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                      'placeholder:text-muted-foreground/50',
                      errors.hostelId && 'border-destructive'
                    )}
                    placeholder="HST2024001"
                    autoComplete="off"
                  />
                </div>
                {errors.hostelId && (
                  <p className="text-destructive mt-1.5 text-sm">{errors.hostelId.message}</p>
                )}
              </div>
            )}

            {watchedRole === 'mess_owner' && (
              <div>
                <label
                  htmlFor="businessName"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Business Name
                </label>
                <div className="relative">
                  <Briefcase className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                  <input
                    {...register('businessName')}
                    id="businessName"
                    type="text"
                    className={cn(
                      'bg-background w-full rounded-lg border py-2.5 pr-4 pl-10',
                      'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                      'placeholder:text-muted-foreground/50',
                      errors.businessName && 'border-destructive'
                    )}
                    placeholder="Tasty Bites Mess"
                    autoComplete="off"
                  />
                </div>
                {errors.businessName && (
                  <p className="text-destructive mt-1.5 text-sm">{errors.businessName.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Password
              </label>
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
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="text-foreground mb-1.5 block text-sm font-medium"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className={cn(
                    'bg-background w-full rounded-lg border py-2.5 pr-4 pl-10',
                    'focus:ring-primary focus:border-transparent focus:ring-2 focus:outline-none',
                    'placeholder:text-muted-foreground/50',
                    errors.confirmPassword && 'border-destructive'
                  )}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive mt-1.5 text-sm">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="text-primary focus:ring-primary mt-1 h-4 w-4 rounded border-gray-300 focus:ring-2"
              />
              <label htmlFor="terms" className="text-muted-foreground text-sm">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'text-primary-foreground bg-primary w-full rounded-lg px-4 py-2.5 font-medium',
                'hover:bg-primary/90 focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
                'transition-colors disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
