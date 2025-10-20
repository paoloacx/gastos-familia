// src/LoginButton.js
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, provider } from "./firebase";
import { useEffect } from "react";

function LoginButton() {
  // Cuando vuelves del login, Firebase devuelve el usuario
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Usuario logueado:", result.user);
          // Aquí puedes guardar el usuario en tu estado global/contexto
        }
      })
      .catch((error) => {
        console.error("Error en login con redirect:", error);
      });
  }, []);

  const handleLogin = () => {
    signInWithRedirect(auth, provider);
  };

  return <button onClick={handleLogin}>Login con Google</button>;
}

export default LoginButton;
