import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { login } from '../lib/auth';
import { useToast } from '../ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Email requerido', variant: 'destructive' });
      return;
    }
    if (!password) {
      toast({ title: 'Contraseña requerida', variant: 'destructive' });
      return;
    }
    login(email, password).then(user => {
      toast({ title: 'Sesión iniciada', description: `Has entrado como ${user.role}` });
      navigate(user.role === 'admin' ? '/admin' : '/coordinator');
    }).catch(err => {
      toast({ title: 'Error', description: err.message || 'Credenciales inválidas', variant: 'destructive' });
    });
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
        <label className="block mb-2 text-sm font-medium">Matrícula</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          placeholder="Matrícula (numérica)"
        />

        <label className="block mb-2 text-sm font-medium">CURP</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          placeholder="Contraseña"
        />

        <p className="text-sm text-gray-600 mb-4">Inicia sesión con tu cuenta. Por defecto sólo el administrador podrá acceder hasta que cree coordinadores.</p>

        <div className="flex gap-2">
          <Button type="submit">Entrar</Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
