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
    persona: "", // Para compatibilidad con gastos antiguos
    personasSeleccionadas: [], // Para nuevos gastos con división
    partidaEspecial: false,
  });
  const [editandoId, setEditandoId] = useState(null);
  const [miembros, setMiembros] = useState(() => {
    const guardados = localStorage.getItem("miembrosFamilia");
    return guardados ? JSON.parse(guardados) : ["Paolo", "Stfy", "Pan", "León"];
  });
  const [modalSettings, setModalSettings] = useState(false);
  const [nuevoMiembro, setNuevoMiembro] = useState("");
  const [editandoMiembro, setEditandoMiembro] = useState(null);
  const [semanasAbiertas, setSemanasAbiertas] = useState({});
  const [mesesAbiertos, setMesesAbiertos] = useState({});
  const [partidasEspecialesAbiertas, setPartidasEspecialesAbiertas] = useState(false);
  const [menuExportAbierto, setMenuExportAbierto] = useState(false);
  const [vista, setVista] = useState("total"); // "mes" | "semana" | "total"
  const [busqueda, setBusqueda] = useState("");
  const [filtroPersona, setFiltroPersona] = useState("");
  const [filtroPartidaEspecial, setFiltroPartidaEspecial] = useState(false);
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

  // Guardar miembros en localStorage
  useEffect(() => {
    localStorage.setItem("miembrosFamilia", JSON.stringify(miembros));
  }, [miembros]);

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
  const togglePartidasEspeciales = () => {
    setPartidasEspecialesAbiertas((prev) => !prev);
  };
  const toggleModoOscuro = () => {
    setModoOscuro((prev) => !prev);
  };

  // Gestión de miembros
  const añadirMiembro = () => {
    if (nuevoMiembro.trim() && !miembros.includes(nuevoMiembro.trim())) {
      setMiembros([...miembros, nuevoMiembro.trim()]);
      setNuevoMiembro("");
    }
  };

  const eliminarMiembro = (miembro) => {
    if (window.confirm(`¿Seguro que quieres eliminar a ${miembro}?`)) {
      setMiembros(miembros.filter((m) => m !== miembro));
      // Limpiar selecciones en el formulario si el miembro estaba seleccionado
      setNuevoGasto((prev) => ({
        ...prev,
        personasSeleccionadas: prev.personasSeleccionadas.filter((p) => p !== miembro),
      }));
    }
  };

  const iniciarEdicionMiembro = (miembro) => {
    setEditandoMiembro({ anterior: miembro, nuevo: miembro });
  };

  const guardarEdicionMiembro = () => {
    if (editandoMiembro && editandoMiembro.nuevo.trim()) {
      const nombreNuevo = editandoMiembro.nuevo.trim();
      if (nombreNuevo !== editandoMiembro.anterior && miembros.includes(nombreNuevo)) {
        alert("Ya existe un miembro con ese nombre");
        return;
      }
      setMiembros(miembros.map((m) => (m === editandoMiembro.anterior ? nombreNuevo : m)));
      // Actualizar también en el formulario si estaba seleccionado
      setNuevoGasto((prev) => ({
        ...prev,
        personasSeleccionadas: prev.personasSeleccionadas.map((p) =>
          p === editandoMiembro.anterior ? nombreNuevo : p
        ),
      }));
      setEditandoMiembro(null);
    }
  };

  const cancelarEdicionMiembro = () => {
    setEditandoMiembro(null);
  };

  // Aplicar filtros de búsqueda y filtros
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const coincideBusqueda = g.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      const coincidePersona = !filtroPersona || g.persona === filtroPersona;
      const coincidePartidaEspecial = !filtroPartidaEspecial || g.partidaEspecial;
      return coincideBusqueda && coincidePersona && coincidePartidaEspecial;
    });
  }, [gastos, busqueda, filtroPersona, filtroPartidaEspecial]);

  // Métricas para dashboard (mes actual)
  const metricasMesActual = useMemo(() => {
    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const añoActual = hoy.getFullYear();

    const gastosMes = gastos.filter((g) => {
      const f = new Date(g.fecha);
      return f.getMonth() === mesActual && f.getFullYear() === añoActual && !g.partidaEspecial;
    });

    const totalMes = gastosMes.reduce((sum, g) => sum + (g.cantidad || 0), 0);

    // Días del mes
    const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
    const diaActual = hoy.getDate();
    const diasRestantes = diasEnMes - diaActual;

    // Media diaria
    const mediaDiaria = diaActual > 0 ? totalMes / diaActual : 0;

    // Top gasto
    const topGasto = gastosMes.length > 0
      ? gastosMes.reduce((max, g) => g.cantidad > max.cantidad ? g : max)
      : null;

    return {
      totalMes,
      mediaDiaria,
      diasRestantes,
      topGasto,
      diasEnMes,
      diaActual
    };
  }, [gastos]);

  // Agrupación por mes y semana (usar gastos filtrados)
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

  // Totales por persona filtrados según vista (solo gastos normales)
  const totalesPorPersonaVista = useMemo(() => {
    let filtrados = gastos.filter((g) => !g.partidaEspecial); // Excluir partidas especiales

    if (vista === "mes") {
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      filtrados = filtrados.filter((g) => {
        const f = new Date(g.fecha);
        return f.getMonth() === mesActual && f.getFullYear() === añoActual;
      });
    }

    if (vista === "semana") {
      const semanaActual = semanaDelAnio(new Date());
      const añoActual = new Date().getFullYear();
      filtrados = filtrados.filter((g) => {
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

  // Totales de partidas especiales por persona
  const totalesPartidasEspeciales = useMemo(() => {
    let filtrados = gastos.filter((g) => g.partidaEspecial); // Solo partidas especiales

    if (vista === "mes") {
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      filtrados = filtrados.filter((g) => {
        const f = new Date(g.fecha);
        return f.getMonth() === mesActual && f.getFullYear() === añoActual;
      });
    }

    if (vista === "semana") {
      const semanaActual = semanaDelAnio(new Date());
      const añoActual = new Date().getFullYear();
      filtrados = filtrados.filter((g) => {
        const f = new Date(g.fecha);
        return semanaDelAnio(f) === semanaActual && f.getFullYear() === añoActual;
      });
    }

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

  const totalPartidasEspeciales = useMemo(
    () => Object.values(totalesPartidasEspeciales).reduce((a, b) => a + b, 0),
    [totalesPartidasEspeciales]
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

  const handleCheckboxPersona = (persona) => {
    const { personasSeleccionadas } = nuevoGasto;
    if (personasSeleccionadas.includes(persona)) {
      setNuevoGasto({
        ...nuevoGasto,
        personasSeleccionadas: personasSeleccionadas.filter((p) => p !== persona),
      });
    } else {
      setNuevoGasto({
        ...nuevoGasto,
        personasSeleccionadas: [...personasSeleccionadas, persona],
      });
    }
  };

  const handlePartidaEspecialChange = (e) => {
    setNuevoGasto({ ...nuevoGasto, partidaEspecial: e.target.checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fecha, descripcion, cantidad, personasSeleccionadas, partidaEspecial } = nuevoGasto;

    // Validaciones
    if (!fecha || !descripcion || !cantidad) return;
    if (personasSeleccionadas.length === 0) {
      alert("Selecciona al menos una persona");
      return;
    }

    const cantidadNum = parseFloat(cantidad);

    if (editandoId) {
      // Al editar, mantener la lógica simple por ahora
      await updateDoc(doc(db, "gastos", editandoId), {
        fecha,
        descripcion,
        cantidad: cantidadNum,
        persona: personasSeleccionadas[0] || "",
        partidaEspecial: partidaEspecial || false,
      });
      setEditandoId(null);
    } else {
      // Dividir el gasto entre las personas seleccionadas
      const cantidadPorPersona = cantidadNum / personasSeleccionadas.length;

      for (const persona of personasSeleccionadas) {
        await addDoc(collection(db, "gastos"), {
          fecha,
          descripcion: personasSeleccionadas.length > 1
            ? `${descripcion} (dividido entre ${personasSeleccionadas.length})`
            : descripcion,
          cantidad: cantidadPorPersona,
          persona,
          partidaEspecial: partidaEspecial || false,
        });
      }
    }

    setNuevoGasto({
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      cantidad: "",
      persona: "",
      personasSeleccionadas: [],
      partidaEspecial: false,
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
      personasSeleccionadas: g.persona ? [g.persona] : [],
      partidaEspecial: g.partidaEspecial || false,
    });
    setEditandoId(g.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Obtener lista de meses únicos de los gastos
  const mesesDisponibles = useMemo(() => {
    const meses = new Set();
    gastos.forEach((g) => {
      const fecha = new Date(g.fecha);
      const clave = mesClave(fecha);
      meses.add(clave);
    });
    return Array.from(meses).sort((a, b) => {
      // Ordenar por fecha más reciente primero
      const [mesA, añoA] = a.split(" ");
      const [mesB, añoB] = b.split(" ");
      if (añoA !== añoB) return parseInt(añoB) - parseInt(añoA);
      const mesesOrden = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      return mesesOrden.indexOf(mesB.toLowerCase()) - mesesOrden.indexOf(mesA.toLowerCase());
    });
  }, [gastos]);

  const exportarExcel = (mesSeleccionado = null) => {
    let gastosFiltrados = gastos;

    // Filtrar por mes si se especificó uno
    if (mesSeleccionado) {
      gastosFiltrados = gastos.filter((g) => {
        const fecha = new Date(g.fecha);
        return mesClave(fecha) === mesSeleccionado;
      });
    }

    const filas = gastosFiltrados.map((g) => ({
      Fecha: fFecha(g.fecha),
      Descripcion: g.descripcion,
      Cantidad: g.cantidad,
      Persona: g.persona,
      PartidaEspecial: g.partidaEspecial ? "Sí" : "No",
    }));

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Gastos");

    const nombreArchivo = mesSeleccionado
      ? `gastos-${mesSeleccionado.replace(" ", "-")}.xlsx`
      : "gastos-familia-completo.xlsx";

    XLSX.writeFile(libro, nombreArchivo);
    setMenuExportAbierto(false);
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
  <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors grain-bg">
    {/* Header Premium */}
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 py-1">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-lg">
              <span className="text-xl">💰</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-white drop-shadow-lg">Gastos Familia</h1>
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
          {/* Formulario Premium */}
          <form onSubmit={handleSubmit} className="mb-6 p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border-2 border-gray-200 dark:border-gray-700 grain-box">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <span className="text-2xl">✨</span>
              {editandoId ? "Editar Gasto" : "Nuevo Gasto"}
            </h2>

            {/* Grid de inputs principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">📅 Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={nuevoGasto.fecha}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 p-3 rounded-xl text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">📝 Descripción</label>
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
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">💶 Cantidad</label>
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

            {/* Checkboxes de personas con mejor diseño */}
            <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-gray-200 dark:border-gray-600">
              <label className="block text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">👥 Dividir entre:</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {miembros.map((miembro) => (
                  <label
                    key={miembro}
                    className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                      nuevoGasto.personasSeleccionadas.includes(miembro)
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
                    <span className="text-sm font-semibold dark:text-white">{miembro}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checkbox partida especial con mejor diseño */}
            <div className="mb-5">
              <label
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                  nuevoGasto.partidaEspecial
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
            </div>

            {/* Botón de submit mejorado */}
            <button
              type="submit"
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all ${
                editandoId
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              }`}
            >
              {editandoId ? "💾 Actualizar Gasto" : "➕ Añadir Gasto"}
            </button>
          </form>

          {/* Dashboard de Métricas Rápidas */}
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800 shadow-lg grain-box">
            <h2 className="text-lg font-bold mb-4 text-center text-blue-800 dark:text-blue-300">📈 Resumen Mes Actual</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gastado</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metricasMesActual.totalMes.toFixed(0)}€</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Media diaria</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metricasMesActual.mediaDiaria.toFixed(0)}€</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quedan</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{metricasMesActual.diasRestantes} días</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-shadow">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Top gasto</p>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400 truncate" title={metricasMesActual.topGasto?.descripcion}>
                  {metricasMesActual.topGasto ? metricasMesActual.topGasto.descripcion : "-"}
                </p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Día {metricasMesActual.diaActual} de {metricasMesActual.diasEnMes}
              </p>
            </div>
          </div>

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
          <div className="mt-2 mb-6 p-5 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 border-2 border-green-200 dark:border-green-800 shadow-lg grain-box">
            <h2 className="font-bold text-center mb-4 text-green-800 dark:text-green-300 text-lg">
              💰 {vista === "mes"
                ? "Gastos Normales (mes actual)"
                : vista === "semana"
                ? "Gastos Normales (semana actual)"
                : "Gastos Normales (total)"}
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(totalesPorPersonaVista).map(([persona, total]) => (
                <li key={persona} className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md border border-gray-200 dark:border-gray-600 hover:shadow-xl hover:scale-105 transition-all">
                  <span className="font-bold block text-gray-700 dark:text-gray-300 text-sm mb-1">{persona}</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{total.toFixed(2)}€</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-300 dark:border-green-700">
              <p className="font-bold text-center text-green-800 dark:text-green-300 text-xl">Total: {totalGlobal.toFixed(2)} €</p>
            </div>
          </div>

          {/* Búsqueda y Filtros */}
          <div className="mb-4 p-4 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-600 grain-box">
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-semibold mb-1 dark:text-white">🔍 Buscar</label>
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full border p-2 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 dark:text-white">Persona</label>
                <select
                  value={filtroPersona}
                  onChange={(e) => setFiltroPersona(e.target.value)}
                  className="border p-2 rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">Todas</option>
                  {miembros.map((m) => (
                    <option key={m} value={m}>{m}</option>
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
                  <span className="text-sm font-semibold dark:text-white">Solo especiales</span>
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

          {/* Agrupación por mes y semana con tablas */}
          {Object.entries(gastosAgrupados).map(([mes, semanas]) => {
            const mesAbierto = !!mesesAbiertos[mes];
            return (
              <div key={mes} className="mb-6">
                <button
                  onClick={() => toggleMes(mes)}
                  className="w-full text-left text-xl font-bold mb-2 px-5 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 hover:shadow-2xl hover:scale-[1.02] transition-all shadow-lg"
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
                                    <tr
                                      key={g.id}
                                      className={`${
                                        g.partidaEspecial
                                          ? "bg-purple-50 dark:bg-purple-900/30"
                                          : "dark:bg-gray-800"
                                      }`}
                                    >
                                      <td className="p-2 border dark:border-gray-600 w-[70px] text-sm dark:text-white">{fFecha(g.fecha)}</td>
                                      <td className="p-2 border dark:border-gray-600 text-sm dark:text-white">
                                        {g.partidaEspecial && <span className="inline-block mr-1" title="Partida Especial">📊</span>}
                                        {g.descripcion}
                                      </td>
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
                    {Object.entries(totalesPartidasEspeciales).map(([persona, total]) => (
                      <li key={persona} className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-md border border-purple-200 dark:border-purple-600 hover:shadow-xl hover:scale-105 transition-all">
                        <span className="font-bold block text-gray-700 dark:text-gray-300 text-sm mb-1">{persona}</span>
                        <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{total.toFixed(2)}€</span>
                      </li>
                    ))}
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

          {/* Gráficos sincronizados con vista */}
          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 border dark:border-gray-600 rounded p-3 bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <h3 className="font-semibold mb-2 text-center dark:text-white">Gastos por persona</h3>
              <Bar data={barData} options={chartOptions} />
            </div>
            <div className="h-64 border dark:border-gray-600 rounded p-3 bg-gray-100/60 dark:bg-gray-800/60 backdrop-blur-sm">
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
                onClick={() => exportarExcel()}
                className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-900 dark:text-white transition-colors"
              >
                📊 Todo (completo)
              </button>
              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
              {mesesDisponibles.map((mes) => (
                <button
                  key={mes}
                  onClick={() => exportarExcel(mes)}
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
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalSettings(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto grain-box" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              Configuración
            </h2>
            <button
              onClick={() => setModalSettings(false)}
              className="text-2xl hover:scale-110 transition-transform"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">👥 Miembros de la Familia</h3>

            {/* Formulario añadir miembro */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Nombre nuevo miembro..."
                value={nuevoMiembro}
                onChange={(e) => setNuevoMiembro(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && añadirMiembro()}
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 p-2 rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
              <button
                onClick={añadirMiembro}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
              >
                ➕
              </button>
            </div>

            {/* Lista de miembros */}
            <div className="space-y-2">
              {miembros.map((miembro) => (
                <div key={miembro} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  {editandoMiembro && editandoMiembro.anterior === miembro ? (
                    <>
                      <input
                        type="text"
                        value={editandoMiembro.nuevo}
                        onChange={(e) => setEditandoMiembro({ ...editandoMiembro, nuevo: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && guardarEdicionMiembro()}
                        className="flex-1 border-2 border-purple-500 p-2 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 transition"
                        autoFocus
                      />
                      <button
                        onClick={guardarEdicionMiembro}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-semibold"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelarEdicionMiembro}
                        className="px-3 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm font-semibold"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-semibold dark:text-white">{miembro}</span>
                      <button
                        onClick={() => iniciarEdicionMiembro(miembro)}
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
                onClick={() => setModalSettings(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default App;
