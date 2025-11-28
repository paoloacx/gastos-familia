import React from "react";
import {
    Chart as ChartJS,
    BarElement,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
    BarElement,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
);

const ChartsSection = ({ barData, lineData, chartOptions, vista }) => {
    return (
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 border dark:border-gray-600 rounded p-3 bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <h3 className="font-semibold mb-2 text-center dark:text-white">
                    Gastos por persona
                </h3>
                <Bar data={barData} options={chartOptions} />
            </div>
            <div className="h-64 border dark:border-gray-600 rounded p-3 bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <h3 className="font-semibold mb-2 text-center dark:text-white">
                    {vista === "mes"
                        ? "Total por mes"
                        : vista === "semana"
                            ? "Total por semana"
                            : "Total histórico por mes"}
                </h3>
                <Line data={lineData} options={chartOptions} />
            </div>
        </section>
    );
};

export default ChartsSection;
