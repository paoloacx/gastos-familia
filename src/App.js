import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useExpenses } from "./hooks/useExpenses";
import { useMembers } from "./hooks/useMembers";
import { exportarExcel } from "./utils/exportUtils";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import ChartsSection from "./components/ChartsSection";
import SettingsModal from "./components/SettingsModal";
import ViewSummary from "./components/ViewSummary";
import Filters from "./components/Filters";

function App() {
  const { usuario, loading: authLoading, loginGoogle, loginEmail, logout } = useAuth();
  const [vista, setVista] = useState("total"); // "mes" | "semana" | "total"

  const {
    gastos,
    loading: expensesLoading,
    nuevoGasto,
    editandoId,
    busqueda, setBusqueda,
    filtroPersona, setFiltroPersona,
    filtroPartidaEspecial, setFiltroPartidaEspecial,
    handleChange,
    handleCheckboxPersona,
    handlePartidaEspecialChange,
    handleSubmit,
    handleDelete,
    handleEdit,
    metricasMesActual,
    gastosAgrupados,
    totalesPorPersonaVista,
    totalesPartidasEspeciales,
    totalGlobal,
    totalPartidasEspeciales,
    totalesPorMes,
    totalesPorSemana,
    mesesDisponibles,
    barData,
    lineData
  } = useExpenses(usuario, vista);

  const { miembros, añadirMiembro, eliminarMiembro, editarMiembro } = useMembers();

  const [modalSettings, setModalSettings] = useState(false);
  const [menuExportAbierto, setMenuExportAbierto] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(() => {
    const guardado = localStorage.getItem("modoOscuro");
    return guardado === "true";
  });

  // Guardar preferencia de modo oscuro
  useEffect(() => {
    localStorage.setItem("modoOscuro", modoOscuro);
    if (modoOscuro) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [modoOscuro]);

  const toggleModoOscuro = () => {
    setModoOscuro((prev) => !prev);
  };

  const chartOptions = {
    plugins: { legend: { position: "bottom" } },
    responsive: true,
    maintainAspectRatio: false,
  };

  if (authLoading) {
    return <p>Cargando sesión...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors grain-bg">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 py-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-lg">
                <span className="text-xl">💰</span>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white drop-shadow-lg">
                Gastos Familia
              </h1>
            </div>
            <button
              onClick={toggleModoOscuro}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110 shadow-lg"
              title={modoOscuro ? "Modo claro" : "Modo oscuro"}
            >
              <span className="text-lg">{modoOscuro ? "☀️" : "🌙"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 pb-8">
        {!usuario ? (
          <Login loginGoogle={loginGoogle} loginEmail={loginEmail} />
        ) : (
          <>
            <ExpenseForm
              nuevoGasto={nuevoGasto}
              handleChange={handleChange}
              handleCheckboxPersona={handleCheckboxPersona}
              handlePartidaEspecialChange={handlePartidaEspecialChange}
              handleSubmit={handleSubmit}
              miembros={miembros}
              editandoId={editandoId}
            />

            <Dashboard metricas={metricasMesActual} />

            <ViewSummary
              vista={vista}
              totalesPorPersonaVista={totalesPorPersonaVista}
              totalGlobal={totalGlobal}
            />

            <Filters
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              filtroPersona={filtroPersona}
              setFiltroPersona={setFiltroPersona}
              filtroPartidaEspecial={filtroPartidaEspecial}
              setFiltroPartidaEspecial={setFiltroPartidaEspecial}
              miembros={miembros}
            />

            <ExpenseList
              gastosAgrupados={gastosAgrupados}
              vista={vista}
              setVista={setVista}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              totalesPartidasEspeciales={totalesPartidasEspeciales}
              totalPartidasEspeciales={totalPartidasEspeciales}
            />

            <ChartsSection
              barData={barData}
              lineData={lineData}
              chartOptions={chartOptions}
              vista={vista}
            />
          </>
        )}

        {/* Footer siempre visible */}
        <footer className="mt-8 border-t dark:border-gray-700 pt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {/* Menú de exportación */}
          <div className="relative inline-block">
            <button
              onClick={() => setMenuExportAbierto(!menuExportAbierto)}
              className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              📤 Exportar a Excel {menuExportAbierto ? "▲" : "▼"}
            </button>

            {menuExportAbierto && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 min-w-[200px] max-h-[300px] overflow-y-auto z-10">
                <button
                  onClick={() => {
                    exportarExcel(gastos);
                    setMenuExportAbierto(false);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white transition-colors"
                >
                  📊 Todo (completo)
                </button>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                {mesesDisponibles.map((mes) => (
                  <button
                    key={mes}
                    onClick={() => {
                      exportarExcel(gastos, mes);
                      setMenuExportAbierto(false);
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white transition-colors"
                  >
                    📅 {mes}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón de Settings */}
          <button
            onClick={() => setModalSettings(true)}
            className="ml-3 inline-flex items-center gap-2 bg-purple-500 dark:bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors"
          >
            ⚙️ Configuración
          </button>

          {usuario ? (
            <div className="mt-3">
              <p className="mb-1 dark:text-gray-300">
                Conectado como{" "}
                <span className="font-semibold">
                  {usuario.displayName || usuario.email}
                </span>
              </p>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <button
                onClick={loginGoogle}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
              >
                Iniciar sesión con Google
              </button>
            </div>
          )}

          <p className="mt-2 dark:text-gray-400">© 2025 Gastos Familia</p>
        </footer>
      </div>

      {/* Modal de Configuración */}
      {modalSettings && (
        <SettingsModal
          miembros={miembros}
          añadirMiembro={añadirMiembro}
          eliminarMiembro={eliminarMiembro}
          editarMiembro={editarMiembro}
          onClose={() => setModalSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
