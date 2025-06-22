import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError('Error al iniciar sesión');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
        <ThemeToggle />
      </div>
      
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src="/images/a90f4370-8522-4e30-afb6-84c1dbeba61f.png" 
              alt="Logo" 
              style={{ width: '130px', height: '130px', objectFit: 'contain' }}
            />
          </div>
          <p style={{ color: 'var(--text-light)' }}>Tu rutina. Tu mente. Tu orden.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            ✨ Iniciar Sesión
          </button>
        </form>
        
        <p style={{ textAlign: 'center' }}>
          ¿No tienes cuenta? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Regístrate aquí</Link>
        </p>
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'var(--gradient)', 
          borderRadius: '0.5rem', 
          color: 'white', 
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          🚀 Bienvenido a la experiencia de productividad más avanzada
        </div>
      </div>
    </div>
  );
}

export default Login;