import React from "react";

const Filters = ({
    busqueda,
    setBusqueda,
    filtroPersona,
    setFiltroPersona,
    filtroPartidaEspecial,
    setFiltroPartidaEspecial,
    miembros
}) => {
    return (
        <div className="mb-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-600 grain-box">
            <div className="flex gap-3 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold mb-1 dark:text-white">
                        🔍 Buscar
                    </label>
                    <input
                        type="text"
                        placeholder="Buscar por descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full border p-2 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1 dark:text-white">
                        Persona
                    </label>
                    <select
                        value={filtroPersona}
                        onChange={(e) => setFiltroPersona(e.target.value)}
                        className="border p-2 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 transition"
                    >
                        <option value="">Todas</option>
                        {miembros.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <input
                            type="checkbox"
                            checked={filtroPartidaEspecial}
                            onChange={(e) => setFiltroPartidaEspecial(e.target.checked)}
                            className="cursor-pointer"
                        />
                        <span className="text-sm font-semibold dark:text-white">
                            Solo especiales
                        </span>
                    </label>
                </div>
                {(busqueda || filtroPersona || filtroPartidaEspecial) && (
                    <button
                        onClick={() => {
                            setBusqueda("");
                            setFiltroPersona("");
                            setFiltroPartidaEspecial(false);
                        }}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-semibold"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>
        </div>
    );
};

export default Filters;
