import React from "react";

const ExpenseForm = ({
    nuevoGasto,
    handleChange,
    handleCheckboxPersona,
    handlePartidaEspecialChange,
    handleSubmit,
    miembros,
    editandoId
}) => {
    return (
        <form
            onSubmit={handleSubmit}
            className="mb-6 p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border-2 border-gray-200 dark:border-gray-700 grain-box"
        >
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-2xl">✨</span>
                {editandoId ? "Editar Gasto" : "Nuevo Gasto"}
            </h2>

            {/* Grid de inputs principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="relative min-w-0 w-full">
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        📅 Fecha
                    </label>
                    <input
                        type="date"
                        name="fecha"
                        value={nuevoGasto.fecha}
                        onChange={handleChange}
                        className="w-full appearance-none border-2 border-gray-300 dark:border-gray-600 p-2 rounded-xl text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        📝 Descripción
                    </label>
                    <input
                        type="text"
                        name="descripcion"
                        placeholder="Ej: Supermercado"
                        value={nuevoGasto.descripcion}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-xl text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                        💶 Cantidad
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        name="cantidad"
                        placeholder="0.00"
                        value={nuevoGasto.cantidad}
                        onChange={handleChange}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-xl text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                </div>
            </div>

            {/* Checkboxes de personas */}
            <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">
                    👥 Dividir entre:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {miembros.map((miembro) => (
                        <label
                            key={miembro}
                            className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition-all ${nuevoGasto.personasSeleccionadas.includes(miembro)
                                ? "bg-blue-100 dark:bg-blue-900/40 border-blue-500 dark:border-blue-400 shadow-md"
                                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400"
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={nuevoGasto.personasSeleccionadas.includes(miembro)}
                                onChange={() => handleCheckboxPersona(miembro)}
                                className="w-4 h-4 cursor-pointer accent-blue-600"
                            />
                            <span className="text-sm font-semibold dark:text-white">
                                {miembro}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Checkbox partida especial */}
            <div className="mb-5">
                <label
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${nuevoGasto.partidaEspecial
                        ? "bg-purple-100 dark:bg-purple-900/40 border-purple-500 dark:border-purple-400 shadow-md"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-400"
                        }`}
                >
                    <input
                        type="checkbox"
                        checked={nuevoGasto.partidaEspecial}
                        onChange={handlePartidaEspecialChange}
                        className="w-5 h-5 cursor-pointer accent-purple-600"
                    />
                    <div>
                        <span className="text-sm font-bold dark:text-white flex items-center gap-2">
                            <span className="text-xl">📊</span>
                            Partida Especial
                        </span>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            No se incluye en los totales normales
                        </p>
                    </div>
                </label>

                {/* Selector de Categoría Especial */}
                {nuevoGasto.partidaEspecial && (
                    <div className="mt-3 ml-8 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 animate-fadeIn">
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            Tipo de Partida Especial
                        </label>
                        <div className="flex flex-col gap-3">
                            <select
                                name="categoriaEspecial"
                                value={nuevoGasto.categoriaEspecial}
                                onChange={handleChange}
                                className="w-full border-2 border-purple-300 dark:border-purple-600 p-2 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 transition"
                            >
                                <option value="Cumpleaños">🎂 Cumpleaños</option>
                                <option value="Navidades">🎄 Navidades</option>
                                <option value="Otros">🔹 Otros</option>
                            </select>

                            {nuevoGasto.categoriaEspecial === "Otros" && (
                                <input
                                    type="text"
                                    name="detalleEspecial"
                                    placeholder="Especificar (ej: Viaje, Boda...)"
                                    value={nuevoGasto.detalleEspecial}
                                    onChange={handleChange}
                                    className="w-full border-2 border-purple-300 dark:border-purple-600 p-2 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 transition"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Botón de submit */}
            <button
                type="submit"
                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all ${editandoId
                    ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    }`}
            >
                {editandoId ? "💾 Actualizar Gasto" : "➕ Añadir Gasto"}
            </button>
        </form>
    );
};

export default ExpenseForm;
