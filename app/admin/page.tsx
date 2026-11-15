'use client';

import { FormEvent, useEffect, useState } from 'react';
import AdminEditor from '@/components/AdminEditor';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

// BASIC FRONTEND GATE ONLY: these values are included in the public JavaScript bundle.
// Do not use this for sensitive data or as real security. Change them before publishing.
const ADMIN_USERNAME = 'vtaadmin';
const ADMIN_PASSWORD = 'ChangeMe-VTA-2026!';
const SESSION_KEY = 'vta-admin-session';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem(SESSION_KEY) === 'authenticated');
    setReady(true);
  }, []);

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'authenticated');
      setAuthenticated(true);
      setError('');
      return;
    }
    setError('Incorrect username or password. Please try again.');
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
    setUsername('');
    setPassword('');
  }

  if (!ready) return <main className="adminLoginPage" aria-label="Loading admin login" />;
  if (authenticated) return <AdminEditor onLogout={handleLogout} />;

  return (
    <main className="adminLoginPage">
      <section className="adminLoginCard">
        <a href="../" className="loginBackLink">← Back to public timetable</a>
        <div className="loginIcon"><LockKeyhole size={25} /></div>
        <p className="eyebrow">VALUE TECH ACADEMY</p>
        <h1>Admin <span>Login</span></h1>
        <p className="loginSubtitle">Sign in to manage the academy timetable.</p>
        <form onSubmit={handleLogin} className="adminLoginForm">
          <label htmlFor="admin-username">Username</label>
          <input id="admin-username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required />
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          {error && <p className="loginError" role="alert">{error}</p>}
          <button className="primaryButton loginSubmit" type="submit"><ShieldCheck size={17} /> Login to Admin Panel</button>
        </form>
        <p className="loginSecurityNote">Basic access screen for the static GitHub Pages version. This is not server-side authentication.</p>
      </section>
    </main>
  );
}
