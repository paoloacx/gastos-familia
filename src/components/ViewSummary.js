import React from "react";

const ViewSummary = ({ vista, totalesPorPersonaVista, totalGlobal }) => {
    return (
        <div className="mt-2 mb-6 p-5 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-2 border-green-200 dark:border-green-800 shadow-lg grain-box">
            <h2 className="font-bold text-center mb-4 text-green-800 dark:text-green-300 text-lg">
                💰{" "}
                {vista === "mes"
                    ? "Gastos Normales (mes actual)"
                    : vista === "semana"
                        ? "Gastos Normales (semana actual)"
                        : "Gastos Normales (total)"}
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(totalesPorPersonaVista).map(([persona, total]) => (
                    <li
                        key={persona}
                        className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <span className="font-bold block text-gray-700 dark:text-gray-300 text-sm mb-1">
                            {persona}
                        </span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                            {total.toFixed(2)}€
                        </span>
                    </li>
                ))}
            </ul>
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-300 dark:border-green-700">
                <p className="font-bold text-center text-green-800 dark:text-green-300 text-xl">
                    Total: {totalGlobal.toFixed(2)} €
                </p>
            </div>
        </div>
    );
};

export default ViewSummary;
