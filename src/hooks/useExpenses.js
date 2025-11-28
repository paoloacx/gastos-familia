import { useState, useEffect, useMemo, useCallback } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { mesClave, semanaDelAnio } from "../utils/dateUtils";

export const useExpenses = (usuario, vista) => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nuevoGasto, setNuevoGasto] = useState({
        fecha: new Date().toISOString().split("T")[0],
        descripcion: "",
        cantidad: "",
        persona: "",
        personasSeleccionadas: [],
        partidaEspecial: false,
    });
    const [editandoId, setEditandoId] = useState(null);

    // Filtros
    const [busqueda, setBusqueda] = useState("");
    const [filtroPersona, setFiltroPersona] = useState("");
    const [filtroPartidaEspecial, setFiltroPartidaEspecial] = useState(false);

    // Cargar gastos
    const cargarGastos = useCallback(async () => {
        if (!usuario) return;
        setLoading(true);
        try {
            const qs = await getDocs(collection(db, "gastos"));
            const data = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
            const normalizados = data.map((g) => ({
                ...g,
                cantidad: typeof g.cantidad === "number" ? g.cantidad : parseFloat(g.cantidad || 0),
            }));
            normalizados.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
            setGastos(normalizados);
        } catch (error) {
            console.error("Error cargando gastos:", error);
        } finally {
            setLoading(false);
        }
    }, [usuario]);

    useEffect(() => {
        if (usuario) cargarGastos();
    }, [usuario, cargarGastos]);

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

        if (!fecha || !descripcion || !cantidad) return;
        if (personasSeleccionadas.length === 0) {
            alert("Selecciona al menos una persona");
            return;
        }

        const cantidadNum = parseFloat(cantidad);

        try {
            if (editandoId) {
                await updateDoc(doc(db, "gastos", editandoId), {
                    fecha,
                    descripcion,
                    cantidad: cantidadNum,
                    persona: personasSeleccionadas[0] || "",
                    partidaEspecial: partidaEspecial || false,
                });
                setEditandoId(null);
            } else {
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
        } catch (error) {
            console.error("Error guardando gasto:", error);
            alert("Error al guardar el gasto");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Seguro que quieres borrar este gasto?")) {
            try {
                await deleteDoc(doc(db, "gastos", id));
                cargarGastos();
            } catch (error) {
                console.error("Error borrando gasto:", error);
            }
        }
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

    // Computed
    const gastosFiltrados = useMemo(() => {
        return gastos.filter((g) => {
            const coincideBusqueda = g.descripcion.toLowerCase().includes(busqueda.toLowerCase());
            const coincidePersona = !filtroPersona || g.persona === filtroPersona;
            const coincidePartidaEspecial = !filtroPartidaEspecial || g.partidaEspecial;
            return coincideBusqueda && coincidePersona && coincidePartidaEspecial;
        });
    }, [gastos, busqueda, filtroPersona, filtroPartidaEspecial]);

    const metricasMesActual = useMemo(() => {
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const añoActual = hoy.getFullYear();

        const gastosMes = gastos.filter((g) => {
            const f = new Date(g.fecha);
            return f.getMonth() === mesActual && f.getFullYear() === añoActual && !g.partidaEspecial;
        });

        const totalMes = gastosMes.reduce((sum, g) => sum + (g.cantidad || 0), 0);
        const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
        const diaActual = hoy.getDate();
        const diasRestantes = diasEnMes - diaActual;
        const mediaDiaria = diaActual > 0 ? totalMes / diaActual : 0;
        const topGasto = gastosMes.length > 0
            ? gastosMes.reduce((max, g) => g.cantidad > max.cantidad ? g : max)
            : null;

        return { totalMes, mediaDiaria, diasRestantes, topGasto, diasEnMes, diaActual };
    }, [gastos]);

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

    const totalesPorPersonaVista = useMemo(() => {
        let filtrados = gastos.filter((g) => !g.partidaEspecial);

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

    const totalesPartidasEspeciales = useMemo(() => {
        let filtrados = gastos.filter((g) => g.partidaEspecial);

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

    const mesesDisponibles = useMemo(() => {
        const meses = new Set();
        gastos.forEach((g) => {
            const fecha = new Date(g.fecha);
            const clave = mesClave(fecha);
            meses.add(clave);
        });
        return Array.from(meses).sort((a, b) => {
            const [mesA, añoA] = a.split(" ");
            const [mesB, añoB] = b.split(" ");
            if (añoA !== añoB) return parseInt(añoB) - parseInt(añoA);
            const mesesOrden = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            return mesesOrden.indexOf(mesB.toLowerCase()) - mesesOrden.indexOf(mesA.toLowerCase());
        });
    }, [gastos]);

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

    return {
        gastos,
        loading,
        nuevoGasto,
        setNuevoGasto,
        editandoId,
        setEditandoId,
        busqueda,
        setBusqueda,
        filtroPersona,
        setFiltroPersona,
        filtroPartidaEspecial,
        setFiltroPartidaEspecial,
        cargarGastos,
        handleChange,
        handleCheckboxPersona,
        handlePartidaEspecialChange,
        handleSubmit,
        handleDelete,
        handleEdit,
        gastosFiltrados,
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
    };
};
