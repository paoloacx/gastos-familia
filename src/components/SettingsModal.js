import React, { useState } from "react";

const SettingsModal = ({
    miembros,
    añadirMiembro,
    eliminarMiembro,
    editarMiembro,
    onClose
}) => {
    const [nuevoMiembro, setNuevoMiembro] = useState("");
    const [editandoMiembro, setEditandoMiembro] = useState(null);

    const handleAñadir = () => {
        if (añadirMiembro(nuevoMiembro)) {
            setNuevoMiembro("");
        }
    };

    const handleGuardarEdicion = () => {
        if (editandoMiembro && editandoMiembro.nuevo.trim()) {
            if (editarMiembro(editandoMiembro.anterior, editandoMiembro.nuevo)) {
                setEditandoMiembro(null);
            }
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto grain-box"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">⚙️</span>
                        Configuración
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-2xl hover:scale-110 transition-transform"
                        title="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                        👥 Miembros de la Familia
                    </h3>

                    {/* Formulario añadir miembro */}
                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            placeholder="Nombre nuevo miembro..."
                            value={nuevoMiembro}
                            onChange={(e) => setNuevoMiembro(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleAñadir()}
                            className="flex-1 border-2 border-gray-300 dark:border-gray-600 p-2 rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        />
                        <button
                            onClick={handleAñadir}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
                        >
                            ➕
                        </button>
                    </div>

                    {/* Lista de miembros */}
                    <div className="space-y-2">
                        {miembros.map((miembro) => (
                            <div
                                key={miembro}
                                className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600"
                            >
                                {editandoMiembro && editandoMiembro.anterior === miembro ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editandoMiembro.nuevo}
                                            onChange={(e) =>
                                                setEditandoMiembro({
                                                    ...editandoMiembro,
                                                    nuevo: e.target.value,
                                                })
                                            }
                                            onKeyPress={(e) =>
                                                e.key === "Enter" && handleGuardarEdicion()
                                            }
                                            className="flex-1 border-2 border-purple-500 p-2 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 transition"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleGuardarEdicion}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => setEditandoMiembro(null)}
                                            className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm font-semibold"
                                        >
                                            ✕
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 font-semibold dark:text-white">
                                            {miembro}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setEditandoMiembro({ anterior: miembro, nuevo: miembro })
                                            }
                                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => eliminarMiembro(miembro)}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {miembros.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                            No hay miembros. Añade al menos uno.
                        </p>
                    )}

                    <div className="mt-6 pt-4 border-t dark:border-gray-600">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
