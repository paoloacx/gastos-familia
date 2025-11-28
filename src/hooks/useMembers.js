import { useState, useEffect } from "react";

export const useMembers = () => {
    const [miembros, setMiembros] = useState(() => {
        const guardados = localStorage.getItem("miembrosFamilia");
        return guardados ? JSON.parse(guardados) : ["Paolo", "Stfy", "Pan", "León"];
    });

    useEffect(() => {
        localStorage.setItem("miembrosFamilia", JSON.stringify(miembros));
    }, [miembros]);

    const añadirMiembro = (nuevoMiembro) => {
        if (nuevoMiembro.trim() && !miembros.includes(nuevoMiembro.trim())) {
            setMiembros([...miembros, nuevoMiembro.trim()]);
            return true;
        }
        return false;
    };

    const eliminarMiembro = (miembro) => {
        if (window.confirm(`¿Seguro que quieres eliminar a ${miembro}?`)) {
            setMiembros(miembros.filter((m) => m !== miembro));
            return true;
        }
        return false;
    };

    const editarMiembro = (anterior, nuevo) => {
        const nombreNuevo = nuevo.trim();
        if (nombreNuevo && nombreNuevo !== anterior) {
            if (miembros.includes(nombreNuevo)) {
                alert("Ya existe un miembro con ese nombre");
                return false;
            }
            setMiembros(miembros.map((m) => (m === anterior ? nombreNuevo : m)));
            return true;
        }
        return false;
    };

    return { miembros, setMiembros, añadirMiembro, eliminarMiembro, editarMiembro };
};
