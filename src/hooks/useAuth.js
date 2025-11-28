import { useState, useEffect } from "react";
import {
    signInWithRedirect,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, provider } from "../firebase";

export const useAuth = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Verificar si el email está en la colección usuariosPermitidos
                const q = query(
                    collection(db, "usuariosPermitidos"),
                    where("email", "==", user.email)
                );
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    console.log("✅ Usuario autorizado:", user.email);
                    setUsuario(user);
                } else {
                    console.warn("⛔ Usuario NO autorizado:", user.email);
                    await signOut(auth);
                    setUsuario(null);
                    alert("Tu cuenta no está autorizada para usar esta app.");
                }
            } else {
                setUsuario(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loginGoogle = () => {
        const isInStandaloneMode =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true;

        if (isInStandaloneMode) {
            signInWithRedirect(auth, provider);
        } else {
            signInWithPopup(auth, provider).catch((e) =>
                console.error("Popup login error:", e)
            );
        }
    };

    const loginEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => signOut(auth);

    return { usuario, loading, loginGoogle, loginEmail, logout };
};
