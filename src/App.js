import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import * as XLSX from "xlsx";
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

ChartJS.register(BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);
function App() {
  const [gastos, setGastos] = useState([]);
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    cantidad: "",
    persona: "",
  });
  const [editandoId, setEditandoId] = useState(null);
  const [semanasAbiertas, setSemanasAbiertas] = useState({}); // control de plegado por semana

  // Filtros
  const [filtroPersona, setFiltroPersona] = useState("todos");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  // Cargar datos
  const cargarGastos = async () => {
    const qs = await getDocs(collection(db, "gastos"));
    const data = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    const normalizados = data.map((g) => ({
      ...g,
      cantidad: typeof g.cantidad === "number" ? g.cantidad : parseFloat(g.cantidad || 0),
    }));
    // Orden por fecha descendente
    normalizados.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    setGastos(normalizados);
  };

  useEffect(() => {
    cargarGastos();
  }, []);

  // Utils
  const fFecha = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
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

  // Aplicar filtros
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const personaOk = filtroPersona === "todos" || g.persona === filtroPersona;
      const fechaObj = new Date(g.fecha);
      const desdeOk = filtroDesde ? fechaObj >= new Date(filtroDesde) : true;
      const hastaOk = filtroHasta ? fechaObj <= new Date(filtroHasta) : true;
      return personaOk && desdeOk && hastaOk;
    });
  }, [gastos, filtroPersona, filtroDesde, filtroHasta]);

  // Agrupar filtrados por mes y semana
  const gastosAgrupados = useMemo(() => {
    return gastosFiltrados.reduce((acc, g) => {
      const fechaObj = new Date(g.fecha);
      const mes = mesClave(fechaObj);
      const semana = `Semana ${semanaDelAnio(fechaObj)}`;
      if (!acc[mes]) acc[mes] = {};
      if (!acc[mes][semana]) acc[mes][semana] = [];
      acc[mes][semana].push(g);
      return acc;
    }, {});
  }, [gastosFiltrados]);

  // Totales por persona (en el set filtrado)
  const totalesPorPersona = useMemo(() => {
    return gastosFiltrados.reduce((acc, g) => {
      const p = g.persona || "Sin asignar";
      acc[p] = (acc[p] || 0) + (isNaN(g.cantidad) ? 0 : g.cantidad);
      return acc;
    }, {});
  }, [gastosFiltrados]);

  const totalGlobal = useMemo(
    () => Object.values(totalesPorPersona).reduce((a, b) => a + b, 0),
    [totalesPorPersona]
  );

  // Serie mensual para dashboard (total por mes)
  const totalesPorMes = useMemo(() => {
    const map = gastosFiltrados.reduce((acc, g) => {
      const fechaObj = new Date(g.fecha);
      const clave = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, "0")}`;
      acc[clave] = (acc[clave] || 0) + (isNaN(g.cantidad) ? 0 : g.cantidad);
      return acc;
    }, {});
    const labels = Object.keys(map).sort(); // YYYY-MM ordenados
    const data = labels.map((l) => map[l]);
    return { labels, data };
  }, [gastosFiltrados]);
  // Handlers del formulario
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
      await addDoc(collection(db, "gastos"), {
        fecha,
        descripcion,
        cantidad: parseFloat(cantidad),
        persona,
      });
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
  };

  // Exportar Excel (respeta filtros aplicados)
  const exportarExcel = () => {
    const filas = gastosFiltrados.map((g) => ({
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

  // Datos de charts
  const barData = {
    labels: Object.keys(totalesPorPersona),
    datasets: [
      {
        label: "Gastos por persona (€)",
        data: Object.values(totalesPorPersona),
        backgroundColor: ["#4F46E5", "#16A34A", "#DC2626", "#F59E0B", "#0EA5E9", "#A78BFA"],
      },
    ],
  };
  const lineData = {
    labels: totalesPorMes.labels,
    datasets: [
      {
        label: "Total por mes (€)",
        data: totalesPorMes.data,
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        tension: 0.2,
        fill: true,
      },
    ],
  };
  const chartOptions = { plugins: { legend: { position: "bottom" } }, responsive: true, maintainAspectRatio: false };

  // JSX principal
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">💰 Gastos Familia</h1>

      {/* Filtros */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <select value={filtroPersona} onChange={(e) => setFiltroPersona(e.target.value)} className="border p-2 rounded">
          <option value="todos">Todas las personas</option>
          <option value="Paolo">Paolo</option>
          <option value="Stfy">Stfy</option>
          <option value="Pan">Pan</option>
          <option value="León">León</option>
        </select>
        <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="border p-2 rounded" />
        <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="border p-2 rounded" />
        <button
          onClick={() => {
            setFiltroPersona("todos");
            setFiltroDesde("");
            setFiltroHasta("");
          }}
          className="border p-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap">
        <input type="date" name="fecha" value={nuevoGasto.fecha} onChange={handleChange} className="border p-2 rounded" />
        <input type="text" name="descripcion" placeholder="Descripción" value={nuevoGasto.descripcion} onChange={handleChange} className="border p-2 rounded" />
        <input type="number" step="0.01" name="cantidad" placeholder="Cantidad" value={nuevoGasto.cantidad} onChange={handleChange} className="border p-2 rounded" />
        <select name="persona" value={nuevoGasto.persona} onChange={handleChange} className="border p-2 rounded">
          <option value="">Selecciona persona</option>
          <option value="Paolo">Paolo</option>
          <option value="Stfy">Stfy</option>
          <option value="Pan">Pan</option>
          <option value="León">León</option>
        </select>
        <button
          type="submit"
          className={`px-3 py-2 rounded text-white transition ${
            editandoId ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {editandoId ? "Actualizar" : "Añadir"}
        </button>
      </form>

      {/* Totales por persona */}
      <div className="mt-2 mb-4">
        <h2 className="font-bold text-center mb-2">Totales por persona (filtrados)</h2>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(totalesPorPersona).map(([persona, total]) => (
            <li key={persona} className="border rounded p-2 text-center">
              <span className="font-semibold">{persona}</span>: {total.toFixed(2)} €
            </li>
          ))}
        </ul>
        <p className="mt-3 font-bold text-center">Total global: {totalGlobal.toFixed(2)} €</p>
      </div>

      {/* Agrupación por mes y semana con plegables */}
      {Object.entries(gastosAgrupados).map(([mes, semanas]) => (
        <div key={mes} className="mb-6">
          <h2 className="text-xl font-bold mb-2">📅 {mes}</h2>
          {Object.entries(semanas).map(([semana, lista]) => {
            const clave = `${mes}-${semana}`;
            const abierta = !!semanasAbiertas[clave];
            return (
              <div key={semana} className="mb-4 border rounded">
                <button
                  onClick={() => toggleSemana(clave)}
                  className="w-full text-left px-4 py-2 bg-gray-200 font-semibold"
                  aria-expanded={abierta}
                >
                  {semana} {abierta ? "▲" : "▼"}
                </button>
                {abierta && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 border">Fecha</th>
                          <th className="p-2 border">Descripción</th>
                          <th className="p-2 border">Cantidad</th>
                          <th className="p-2 border">Persona</th>
                          <th className="p-2 border">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lista.map((g) => (
                          <tr key={g.id}>
                            <td className="p-2 border">{fFecha(g.fecha)}</td>
                            <td className="p-2 border">{g.descripcion}</td>
                            <td className="p-2 border">{(g.cantidad || 0).toFixed(2)} €</td>
                            <td className="p-2 border">{g.persona}</td>
                            <td className="p-2 border">
                              <div className="flex gap-2">
                                <button onClick={() => handleEdit(g)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                                  ✏️ Editar
                                </button>
                                <button onClick={() => handleDelete(g.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                                  🗑️ Borrar
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
      ))}
      {/* Dashboard visual */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 border rounded p-3">
          <h3 className="font-semibold mb-2 text-center">Gastos por persona</h3>
          <Bar data={barData} options={chartOptions} />
        </div>
        <div className="h-64 border rounded p-3">
          <h3 className="font-semibold mb-2 text-center">Total por mes</h3>
          <Line data={lineData} options={chartOptions} />
        </div>
      </section>

      {/* Footer discreto con exportar */}
      <footer className="mt-8 border-t pt-4 text-center text-sm text-gray-500">
        <button onClick={exportarExcel} className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300">
          📤 Exportar a Excel
        </button>
        <p className="mt-2">© 2025 Gastos Familia</p>
      </footer>
    </div>
  );
}

export default App;
