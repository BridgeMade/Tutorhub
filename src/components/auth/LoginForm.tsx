import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginFormInputs = z.infer<typeof schema>;

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(schema)
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormInputs) => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      
      if (error) {
        setAuthError(error.message);
        toast.error(error.message);
      } else {
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block mb-1">Email</label>
        <input id="email" type="email" {...register('email')} className="input-field" />
        {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
      </div>
      <div>
        <label htmlFor="password" className="block mb-1">Password</label>
        <input id="password" type="password" {...register('password')} className="input-field" />
        {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
      </div>
      {authError && <div className="text-red-500 text-sm">{authError}</div>}
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
