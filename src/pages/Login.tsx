import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const Login: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  return (
    <div className="max-w-md mx-auto mt-12 p-6 card">
      <h2 className="text-2xl font-bold mb-4 text-center">{showRegister ? 'Register' : 'Login'}</h2>
      {showRegister ? <RegisterForm /> : <LoginForm />}
      <div className="mt-4 text-center">
        {showRegister ? (
          <button className="text-primary-600 underline" onClick={() => setShowRegister(false)}>
            Already have an account? Login
          </button>
        ) : (
          <button className="text-primary-600 underline" onClick={() => setShowRegister(true)}>
            Don't have an account? Register
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
