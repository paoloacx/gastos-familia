import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [gastos, setGastos] = useState([]);
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    cantidad: "",
    persona: "",
  });
  const [editandoId, setEditandoId] = useState(null);

  // Leer datos de Firestore al arrancar
  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "gastos"));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGastos(data);
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setNuevoGasto({ ...nuevoGasto, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevoGasto.fecha || !nuevoGasto.descripcion || !nuevoGasto.cantidad || !nuevoGasto.persona) return;

    if (editandoId) {
      const gastoRef = doc(db, "gastos", editandoId);
      await updateDoc(gastoRef, {
        fecha: nuevoGasto.fecha,
        descripcion: nuevoGasto.descripcion,
        cantidad: parseFloat(nuevoGasto.cantidad),
        persona: nuevoGasto.persona,
      });
      setEditandoId(null);
    } else {
      await addDoc(collection(db, "gastos"), {
        fecha: nuevoGasto.fecha,
        descripcion: nuevoGasto.descripcion,
        cantidad: parseFloat(nuevoGasto.cantidad),
        persona: nuevoGasto.persona,
      });
    }

    setNuevoGasto({
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      cantidad: "",
      persona: "",
    });

    const querySnapshot = await getDocs(collection(db, "gastos"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGastos(data);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "gastos", id));
    const querySnapshot = await getDocs(collection(db, "gastos"));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setGastos(data);
  };

  const handleEdit = (gasto) => {
    setNuevoGasto({
      fecha: gasto.fecha,
      descripcion: gasto.descripcion,
      cantidad: gasto.cantidad,
      persona: gasto.persona,
    });
    setEditandoId(gasto.id);
  };

  // 👉 Función para mostrar fecha en formato europeo
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    const [year, month, day] = fechaISO.split("-");
    return `${day}/${month}/${year}`;
  };

  const totalesPorPersona = gastos.reduce((acc, gasto) => {
    const persona = gasto.persona || "Sin asignar";
    acc[persona] = (acc[persona] || 0) + gasto.cantidad;
    return acc;
  }, {});

  const totalGlobal = Object.values(totalesPorPersona).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3">Gastos Familia</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4 flex-wrap">
        <input
          type="date"
          name="fecha"
          value={nuevoGasto.fecha}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="descripcion"
          placeholder="Descripción"
          value={nuevoGasto.descripcion}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          step="0.01"
          name="cantidad"
          placeholder="Cantidad"
          value={nuevoGasto.cantidad}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <select
          name="persona"
          value={nuevoGasto.persona}
          onChange={handleChange}
          className="border p-2 rounded"
        >
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

      {/* Tabla de gastos */}
      <table className="w-full border">
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
          {gastos.map((g) => (
            <tr key={g.id}>
              <td className="p-2 border">{formatearFecha(g.fecha)}</td>
              <td className="p-2 border">{g.descripcion}</td>
              <td className="p-2 border">{g.cantidad}</td>
              <td className="p-2 border">{g.persona}</td>
              <td className="p-2 border flex gap-2">
                <button
                  onClick={() => handleEdit(g)}
                  className="bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700 transition"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded font-semibold hover:bg-red-700 transition"
                >
                  🗑️ Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="mt-4">
        <h2 className="font-bold">Totales por persona</h2>
        <ul>
          {Object.entries(totalesPorPersona).map(([persona, total]) => (
            <li key={persona}>
              {persona}: {total.toFixed(2)} €
            </li>
          ))}
        </ul>
        <p className="mt-2 font-bold">Total global: {totalGlobal.toFixed(2)} €</p>
      </div>
    </div>
  );
}

export default App;

