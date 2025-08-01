import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['student', 'tutor', 'admin'])
});

type RegisterFormInputs = z.infer<typeof schema>;

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormInputs>({
    resolver: zodResolver(schema)
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: RegisterFormInputs) => {
    setAuthError(null);
    setSuccess(false);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { 
            full_name: data.fullName,
            role: data.role
          }
        }
      });
      
      if (error) {
        setAuthError(error.message);
        toast.error(error.message);
      } else {
        setSuccess(true);
        toast.success('Registration successful! Please check your email to verify your account.');
        // Optionally redirect to login or dashboard after a delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Join TutorHub</h2>
        <p className="text-gray-600 mt-2">Create your account and start learning or teaching today!</p>
      </div>
      
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
      <div>
        <label htmlFor="fullName" className="block mb-1">Full Name</label>
        <input id="fullName" type="text" {...register('fullName')} className="input-field" />
        {errors.fullName && <span className="text-red-500 text-sm">{errors.fullName.message}</span>}
      </div>
      <div>
        <label htmlFor="role" className="block mb-1">I want to join as:</label>
        <select id="role" {...register('role')} className="input-field">
          <option value="">Select your role</option>
          <option value="student">Student - Looking for tutoring</option>
          <option value="tutor">Tutor - I want to teach</option>
          <option value="admin">Admin - Platform management</option>
        </select>
        {errors.role && <span className="text-red-500 text-sm">{errors.role.message}</span>}
      </div>
      {authError && <div className="text-red-500 text-sm">{authError}</div>}
      {success && <div className="text-green-600 text-sm">Registration successful! Check your email to verify your account.</div>}
      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
    
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-sm font-medium text-blue-900 mb-2">Choose Your Role:</h3>
      <div className="space-y-2 text-sm text-blue-800">
        <div>👨‍🎓 <strong>Student:</strong> Book sessions, track progress, manage learning</div>
        <div>👨‍🏫 <strong>Tutor:</strong> Teach students, manage schedule, earn money</div>
        <div>👨‍💼 <strong>Admin:</strong> Manage platform, users, and payments</div>
      </div>
    </div>
  </div>
  );
};

export default RegisterForm;
