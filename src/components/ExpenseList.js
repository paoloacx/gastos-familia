import React, { useState } from "react";
import { fFecha } from "../utils/dateUtils";

const ExpenseList = ({
    gastosAgrupados,
    vista,
    setVista,
    handleEdit,
    handleDelete,
    totalesPartidasEspeciales,
    totalPartidasEspeciales
}) => {
    const [semanasAbiertas, setSemanasAbiertas] = useState({});
    const [mesesAbiertos, setMesesAbiertos] = useState({});
    const [partidasEspecialesAbiertas, setPartidasEspecialesAbiertas] = useState(false);

    const toggleSemana = (clave) => {
        setSemanasAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
    };

    const toggleMes = (mes) => {
        setMesesAbiertos((prev) => ({ ...prev, [mes]: !prev[mes] }));
    };

    const togglePartidasEspeciales = () => {
        setPartidasEspecialesAbiertas((prev) => !prev);
    };

    return (
        <>
            {/* Selector Mes / Semana / Total */}
            <div className="text-center mb-4">
                <div className="inline-flex rounded overflow-hidden border dark:border-gray-600">
                    <button
                        onClick={() => setVista("mes")}
                        className={`px-3 py-1 text-sm transition-colors ${vista === "mes"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                            }`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setVista("semana")}
                        className={`px-3 py-1 text-sm transition-colors ${vista === "semana"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                            }`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setVista("total")}
                        className={`px-3 py-1 text-sm transition-colors ${vista === "total"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 dark:text-white"
                            }`}
                    >
                        Total
                    </button>
                </div>
            </div>

            {/* Lista de gastos agrupados */}
            {Object.entries(gastosAgrupados).map(([mes, semanas]) => {
                const mesAbierto = !!mesesAbiertos[mes];
                return (
                    <div key={mes} className="mb-6">
                        <button
                            onClick={() => toggleMes(mes)}
                            className="w-full text-left text-xl font-bold mb-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
                            aria-expanded={mesAbierto}
                        >
                            📅 {mes} {mesAbierto ? "▲" : "▼"}
                        </button>
                        {mesAbierto && (
                            <div className="mt-2">
                                {Object.entries(semanas).map(([semana, lista]) => {
                                    const clave = `${mes}-${semana}`;
                                    const abierta = !!semanasAbiertas[clave];
                                    return (
                                        <div
                                            key={semana}
                                            className="mb-4 border rounded overflow-hidden dark:border-gray-600"
                                        >
                                            <button
                                                onClick={() => toggleSemana(clave)}
                                                className="w-full text-left px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white font-semibold transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
                                                aria-expanded={abierta}
                                            >
                                                {semana} {abierta ? "▲" : "▼"}
                                            </button>
                                            {abierta && (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full border dark:border-gray-600 text-xs">
                                                        <thead>
                                                            <tr className="bg-gray-100 dark:bg-gray-700">
                                                                <th className="p-2 border dark:border-gray-600 w-[70px] text-sm dark:text-white">
                                                                    Fecha
                                                                </th>
                                                                <th className="p-2 border dark:border-gray-600 text-sm dark:text-white">
                                                                    Descripción
                                                                </th>
                                                                <th className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">
                                                                    Cantidad
                                                                </th>
                                                                <th className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">
                                                                    Persona
                                                                </th>
                                                                <th className="p-2 border dark:border-gray-600 text-sm dark:text-white">
                                                                    Acciones
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {lista.map((g) => (
                                                                <tr
                                                                    key={g.id}
                                                                    className={`${g.partidaEspecial
                                                                            ? "bg-purple-50 dark:bg-purple-900/30"
                                                                            : "dark:bg-gray-800"
                                                                        }`}
                                                                >
                                                                    <td className="p-2 border dark:border-gray-600 w-[70px] text-sm dark:text-white">
                                                                        {fFecha(g.fecha)}
                                                                    </td>
                                                                    <td className="p-2 border dark:border-gray-600 text-sm dark:text-white">
                                                                        {g.partidaEspecial && (
                                                                            <span
                                                                                className="inline-block mr-1"
                                                                                title="Partida Especial"
                                                                            >
                                                                                📊
                                                                            </span>
                                                                        )}
                                                                        {g.descripcion}
                                                                    </td>
                                                                    <td className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">
                                                                        {(g.cantidad || 0).toFixed(2)} €
                                                                    </td>
                                                                    <td className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">
                                                                        {g.persona}
                                                                    </td>
                                                                    <td className="p-2 border dark:border-gray-600 text-sm">
                                                                        <div className="flex gap-2 justify-center">
                                                                            <button
                                                                                onClick={() => handleEdit(g)}
                                                                                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                                                                                title="Editar"
                                                                            >
                                                                                ✏️
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDelete(g.id)}
                                                                                className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition-colors"
                                                                                title="Borrar"
                                                                            >
                                                                                🗑️
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Sección de Partidas Especiales (plegable) */}
            {totalPartidasEspeciales > 0 && (
                <div className="mb-6">
                    <button
                        onClick={togglePartidasEspeciales}
                        className="w-full text-left text-xl font-bold mb-2 px-5 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl hover:from-purple-600 hover:to-pink-700 hover:shadow-2xl hover:scale-[1.02] transition-all shadow-lg"
                        aria-expanded={partidasEspecialesAbiertas}
                    >
                        📊 Partidas Especiales {partidasEspecialesAbiertas ? "▲" : "▼"}
                    </button>
                    {partidasEspecialesAbiertas && (
                        <div className="mt-2 border-2 border-purple-500 dark:border-purple-400 rounded-2xl p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 backdrop-blur-sm shadow-lg">
                            <h2 className="font-bold text-center mb-4 text-purple-800 dark:text-purple-300 text-lg">
                                {vista === "mes"
                                    ? "Totales (mes actual)"
                                    : vista === "semana"
                                        ? "Totales (semana actual)"
                                        : "Totales Generales"}
                            </h2>
                            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(totalesPartidasEspeciales).map(
                                    ([persona, total]) => (
                                        <li
                                            key={persona}
                                            className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md border border-purple-200 dark:border-purple-600 hover:shadow-xl hover:scale-105 transition-all"
                                        >
                                            <span className="font-bold block text-gray-700 dark:text-gray-300 text-sm mb-1">
                                                {persona}
                                            </span>
                                            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                                {total.toFixed(2)}€
                                            </span>
                                        </li>
                                    )
                                )}
                            </ul>
                            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-purple-300 dark:border-purple-700">
                                <p className="font-bold text-center text-purple-800 dark:text-purple-300 text-xl">
                                    Total Especial: {totalPartidasEspeciales.toFixed(2)} €
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default ExpenseList;
