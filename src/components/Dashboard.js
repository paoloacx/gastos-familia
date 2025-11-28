import React from "react";

const Dashboard = ({ metricas }) => {
    const { totalMes, mediaDiaria, diasRestantes, topGasto, diasEnMes, diaActual } = metricas;

    return (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800 shadow-lg grain-box">
            <h2 className="text-lg font-bold mb-4 text-center text-blue-800 dark:text-blue-300">
                📈 Resumen Mes Actual
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gastado</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {totalMes.toFixed(0)}€
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Media diaria</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {mediaDiaria.toFixed(0)}€
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quedan</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {diasRestantes} días
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Top gasto</p>
                    <p
                        className="text-sm font-bold text-purple-600 dark:text-purple-400 truncate"
                        title={topGasto?.descripcion}
                    >
                        {topGasto ? topGasto.descripcion : "-"}
                    </p>
                </div>
            </div>
            <div className="mt-3 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Día {diaActual} de {diasEnMes}
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
