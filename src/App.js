// src/App.js
import { useState, useEffect, useMemo } from "react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db, auth, provider } from "./firebase";
import {
  signInWithRedirect,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "firebase/auth";
import * as XLSX from "xlsx";

// Charts
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
function App() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gastos, setGastos] = useState([]);
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    cantidad: "",
    persona: "",
  });
  const [editandoId, setEditandoId] = useState(null);
  const [semanasAbiertas, setSemanasAbiertas] = useState({});
  const [mesesAbiertos, setMesesAbiertos] = useState({});
  const [vista, setVista] = useState("total"); // "mes" | "semana" | "total"
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

  // Escuchar cambios de sesión con lista blanca
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


  // Login y logout
const loginGoogle = () => {
  const isInStandaloneMode =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isInStandaloneMode) {
    signInWithRedirect(auth, provider);
  } else {
    signInWithPopup(auth, provider)
      .catch((e) => console.error("Popup login error:", e));
  }
};

const logout = () => signOut(auth);

  // Cargar gastos
  const cargarGastos = async () => {
    const qs = await getDocs(collection(db, "gastos"));
    const data = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    const normalizados = data.map((g) => ({
      ...g,
      cantidad: typeof g.cantidad === "number" ? g.cantidad : parseFloat(g.cantidad || 0),
    }));
    normalizados.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    setGastos(normalizados);
  };
  useEffect(() => { if (usuario) cargarGastos(); }, [usuario]);

  // Utils
  const fFecha = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(-2)}`; // muestra solo los dos últimos dígitos del año
};
  const semanaDelAnio = (date) => {
    const y = date.getFullYear();
    const start = new Date(y, 0, 1);
    const msPerDay = 24 * 60 * 60 * 1000;
    const offset = Math.floor((date - start) / msPerDay);
    return Math.floor(offset / 7) + 1;
  };
  const mesClave = (date) => {
    const y = date.getFullYear();
    const mesNombre = date.toLocaleString("default", { month: "long" });
    return `${mesNombre} ${y}`;
  };
  const toggleSemana = (clave) => {
    setSemanasAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };
  const toggleMes = (mes) => {
    setMesesAbiertos((prev) => ({ ...prev, [mes]: !prev[mes] }));
  };
  const toggleModoOscuro = () => {
    setModoOscuro((prev) => !prev);
  };
  // Agrupación por mes y semana
  const gastosAgrupados = useMemo(() => {
    return gastos.reduce((acc, g) => {
      const fechaObj = new Date(g.fecha);
      const mes = mesClave(fechaObj);
      const semana = `Semana ${semanaDelAnio(fechaObj)}`;
      if (!acc[mes]) acc[mes] = {};
      if (!acc[mes][semana]) acc[mes][semana] = [];
      acc[mes][semana].push(g);
      return acc;
    }, {});
  }, [gastos]);

  // Totales por persona filtrados según vista
  const totalesPorPersonaVista = useMemo(() => {
    let filtrados = gastos;

    if (vista === "mes") {
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      filtrados = gastos.filter((g) => {
        const f = new Date(g.fecha);
        return f.getMonth() === mesActual && f.getFullYear() === añoActual;
      });
    }

    if (vista === "semana") {
      const semanaActual = semanaDelAnio(new Date());
      const añoActual = new Date().getFullYear();
      filtrados = gastos.filter((g) => {
        const f = new Date(g.fecha);
        return semanaDelAnio(f) === semanaActual && f.getFullYear() === añoActual;
      });
    }

    // "total" → no filtramos

    return filtrados.reduce((acc, g) => {
      const p = g.persona || "Sin asignar";
      acc[p] = (acc[p] || 0) + (isNaN(g.cantidad) ? 0 : g.cantidad);
      return acc;
    }, {});
  }, [gastos, vista]);

  const totalGlobal = useMemo(
    () => Object.values(totalesPorPersonaVista).reduce((a, b) => a + b, 0),
    [totalesPorPersonaVista]
  );

  // Totales por mes (para gráfico de línea)
  const totalesPorMes = useMemo(() => {
    const map = gastos.reduce((acc, g) => {
      const f = new Date(g.fecha);
      const clave = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
      acc[clave] = (acc[clave] || 0) + (isNaN(g.cantidad) ? 0 : g.cantidad);
      return acc;
    }, {});
    const labels = Object.keys(map).sort();
    const data = labels.map((l) => map[l]);
    return { labels, data };
  }, [gastos]);

  // Totales por semana (para gráfico de línea)
  const totalesPorSemana = useMemo(() => {
    const map = gastos.reduce((acc, g) => {
      const f = new Date(g.fecha);
      const clave = `${f.getFullYear()}-W${semanaDelAnio(f)}`;
      acc[clave] = (acc[clave] || 0) + (isNaN(g.cantidad) ? 0 : g.cantidad);
      return acc;
    }, {});
    const labels = Object.keys(map).sort();
    const data = labels.map((l) => map[l]);
    return { labels, data };
  }, [gastos]);

  // Handlers
  const handleChange = (e) => {
    setNuevoGasto({ ...nuevoGasto, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fecha, descripcion, cantidad, persona } = nuevoGasto;
    if (!fecha || !descripcion || !cantidad || !persona) return;

    if (editandoId) {
      await updateDoc(doc(db, "gastos", editandoId), {
        fecha,
        descripcion,
        cantidad: parseFloat(cantidad),
        persona,
      });
      setEditandoId(null);
    } else {
      if (persona === "Todos") {
        const miembros = ["Paolo", "Stfy", "Pan", "León"];
        for (const m of miembros) {
          await addDoc(collection(db, "gastos"), {
            fecha,
            descripcion,
            cantidad: parseFloat(cantidad),
            persona: m,
          });
        }
      } else {
        await addDoc(collection(db, "gastos"), {
          fecha,
          descripcion,
          cantidad: parseFloat(cantidad),
          persona,
        });
      }
    }

    setNuevoGasto({
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      cantidad: "",
      persona: "",
    });

    cargarGastos();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "gastos", id));
    cargarGastos();
  };

  const handleEdit = (g) => {
    setNuevoGasto({
      fecha: g.fecha,
      descripcion: g.descripcion,
      cantidad: String(g.cantidad),
      persona: g.persona,
    });
    setEditandoId(g.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportarExcel = () => {
    const filas = gastos.map((g) => ({
      Fecha: fFecha(g.fecha),
      Descripcion: g.descripcion,
      Cantidad: g.cantidad,
      Persona: g.persona,
    }));
    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Gastos");
    XLSX.writeFile(libro, "gastos-familia.xlsx");
  };

  // Datos para gráficos
  const barData = {
    labels: Object.keys(totalesPorPersonaVista),
    datasets: [
      {
        label:
          vista === "mes"
            ? "Gastos por persona (mes actual)"
            : vista === "semana"
            ? "Gastos por persona (semana actual)"
            : "Gastos por persona (total)",
        data: Object.values(totalesPorPersonaVista),
        backgroundColor: ["#4F46E5", "#16A34A", "#DC2626", "#F59E0B", "#0EA5E9", "#A78BFA"],
      },
    ],
  };

  const lineData = {
    labels:
      vista === "mes"
        ? totalesPorMes.labels
        : vista === "semana"
        ? totalesPorSemana.labels
        : totalesPorMes.labels, // en "total" usamos la serie mensual completa
    datasets: [
      {
        label:
          vista === "mes"
            ? "Total por mes (€)"
            : vista === "semana"
            ? "Total por semana (€)"
            : "Total histórico por mes (€)",
        data:
          vista === "mes"
            ? totalesPorMes.data
            : vista === "semana"
            ? totalesPorSemana.data
            : totalesPorMes.data,
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        tension: 0.2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
  plugins: { legend: { position: "bottom" } },
  responsive: true,
  maintainAspectRatio: false,
};

if (loading) {
  return <p>Cargando sesión...</p>;
}

return (
  <div className="max-w-4xl mx-auto p-4 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors grain-bg">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold text-center flex-1 dark:text-white">💰 Gastos Familia</h1>
      <button
        onClick={toggleModoOscuro}
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title={modoOscuro ? "Modo claro" : "Modo oscuro"}
      >
        {modoOscuro ? "☀️" : "🌙"}
      </button>
    </div>


      {/* Login */}
{!usuario && (
  <div className="text-center mt-6 flex flex-col gap-4 items-center">
    {/* Botón Google */}
    <button
      onClick={loginGoogle}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-60 transition-colors"
    >
      Iniciar sesión con Google
    </button>

    {/* Formulario Email */}
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        signInWithEmailAndPassword(auth, email, password)
          .catch((err) => console.error("Error login email:", err));
      }}
      className="flex flex-col gap-2 w-60"
    >
      <input
        type="email"
        name="email"
        placeholder="Correo"
        className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
      >
        Iniciar sesión con Email
      </button>
    </form>
  </div>
)}

      {/* App autenticada */}
      {usuario && (
        <>
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap items-end">
            <input
              type="date"
              name="fecha"
              value={nuevoGasto.fecha}
              onChange={handleChange}
              className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            <input
              type="text"
              name="descripcion"
              placeholder="Descripción"
              value={nuevoGasto.descripcion}
              onChange={handleChange}
              className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              step="0.01"
              name="cantidad"
              placeholder="Cantidad"
              value={nuevoGasto.cantidad}
              onChange={handleChange}
              className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <select
              name="persona"
              value={nuevoGasto.persona}
              onChange={handleChange}
              className="border p-2 rounded text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecciona persona</option>
              <option value="Paolo">Paolo</option>
              <option value="Stfy">Stfy</option>
              <option value="Pan">Pan</option>
              <option value="León">León</option>
              <option value="Todos">Todos</option>
            </select>
            <button
              type="submit"
              className={`px-3 py-2 rounded text-white transition text-sm ${
                editandoId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {editandoId ? "Actualizar" : "Añadir"}
            </button>
          </form>

          {/* Selector Mes / Semana / Total */}
          <div className="text-center mb-4">
            <div className="inline-flex rounded overflow-hidden border dark:border-gray-600">
              <button
                onClick={() => setVista("mes")}
                className={`px-3 py-1 text-sm transition-colors ${vista === "mes" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
              >
                Mes
              </button>
              <button
                onClick={() => setVista("semana")}
                className={`px-3 py-1 text-sm transition-colors ${vista === "semana" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
              >
                Semana
              </button>
              <button
                onClick={() => setVista("total")}
                className={`px-3 py-1 text-sm transition-colors ${vista === "total" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 dark:text-white"}`}
              >
                Total
              </button>
            </div>
          </div>

          {/* Totales por persona + global (filtrados por vista) */}
          <div className="mt-2 mb-4">
            <h2 className="font-bold text-center mb-2 dark:text-white">
              {vista === "mes"
                ? "Totales por persona (mes actual)"
                : vista === "semana"
                ? "Totales por persona (semana actual)"
                : "Totales por persona (total)"}
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(totalesPorPersonaVista).map(([persona, total]) => (
                <li key={persona} className="border rounded p-2 text-center text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  <span className="font-semibold">{persona}</span>: {total.toFixed(2)} €
                </li>
              ))}
            </ul>
            <p className="mt-3 font-bold text-center dark:text-white">Total global: {totalGlobal.toFixed(2)} €</p>
          </div>

          {/* Agrupación por mes y semana con tablas */}
          {Object.entries(gastosAgrupados).map(([mes, semanas]) => {
            const mesAbierto = !!mesesAbiertos[mes];
            return (
              <div key={mes} className="mb-6">
                <button
                  onClick={() => toggleMes(mes)}
                  className="w-full text-left text-xl font-bold mb-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-md"
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
                        <div key={semana} className="mb-4 border rounded overflow-hidden dark:border-gray-600">
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
                                    <th className="p-2 border dark:border-gray-600 w-[70px] text-sm dark:text-white">Fecha</th>
                                    <th className="p-2 border dark:border-gray-600 text-sm dark:text-white">Descripción</th>
                                    <th className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">Cantidad</th>
                                    <th className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">Persona</th>
                                    <th className="p-2 border dark:border-gray-600 text-sm dark:text-white">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lista.map((g) => (
                                    <tr key={g.id} className="dark:bg-gray-800">
                                      <td className="p-2 border dark:border-gray-600 w-[70px] text-sm dark:text-white">{fFecha(g.fecha)}</td>
                                      <td className="p-2 border dark:border-gray-600 text-sm dark:text-white">{g.descripcion}</td>
                                      <td className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">
                                        {(g.cantidad || 0).toFixed(2)} €
                                      </td>
                                      <td className="p-2 border dark:border-gray-600 w-[80px] text-sm dark:text-white">{g.persona}</td>
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

          {/* Gráficos sincronizados con vista */}
          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 border dark:border-gray-600 rounded p-3 bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-center dark:text-white">Gastos por persona</h3>
              <Bar data={barData} options={chartOptions} />
            </div>
            <div className="h-64 border dark:border-gray-600 rounded p-3 bg-white/60 dark:bg-gray-800/80 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-center dark:text-white">
                {vista === "mes" ? "Total por mes" : vista === "semana" ? "Total por semana" : "Total histórico por mes"}
              </h3>
              <Line data={lineData} options={chartOptions} />
            </div>
          </section>
        </>
      )}
      {/* Footer siempre visible */}
      <footer className="mt-8 border-t dark:border-gray-700 pt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={exportarExcel}
          className="inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          📤 Exportar a Excel
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
  );
}

export default App;
