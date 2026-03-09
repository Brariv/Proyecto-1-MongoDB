import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
	const { login, error } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();
		login(email, password);
	};

	return (
		<main className="login-page">
			<section className="login-card">
				<img src="/logo.png" alt="Pizza Hut" className="brand-logo" />
				<h1 className="brand-title">Pizza Hut Login</h1>
				<p className="brand-subtitle">Simulación de acceso para usuario y administrador</p>

				<form onSubmit={handleSubmit} className="login-form">
					<label className="input-group">
						<Mail size={18} />
						<input
							type="email"
							placeholder="Correo electrónico"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							required
						/>
					</label>

					<label className="input-group">
						<Lock size={18} />
						<input
							type="password"
							placeholder="Contraseña"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							required
						/>
					</label>

					{error ? <p className="error-text">{error}</p> : null}

					<button className="login-button" type="submit">
						Iniciar sesión
					</button>
				</form>

				<div className="credentials-box">
					<p>Credenciales de prueba:</p>
					<p>
						Admin: <strong>admin@pizzahut.com</strong> / <strong>admin123</strong>
					</p>
					<p>
						Usuario: <strong>user@pizzahut.com</strong> / <strong>user123</strong>
					</p>
				</div>
			</section>
		</main>
	);
}
