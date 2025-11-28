import React, { useState } from "react";

const Login = ({ loginGoogle, loginEmail }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleEmailLogin = (e) => {
        e.preventDefault();
        loginEmail(email, password).catch((err) => console.error("Error login email:", err));
    };

    return (
        <div className="text-center mt-6 flex flex-col gap-4 items-center">
            {/* Botón Google */}
            <button
                onClick={loginGoogle}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-60 transition-colors"
            >
                Iniciar sesión con Google
            </button>

            {/* Formulario Email */}
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-2 w-60">
                <input
                    type="email"
                    name="email"
                    placeholder="Correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                    Iniciar sesión con Email
                </button>
            </form>
        </div>
    );
};

export default Login;
