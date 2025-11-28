import * as XLSX from "xlsx";
import { fFecha, mesClave } from "./dateUtils";

export const exportarExcel = (gastos, mesSeleccionado = null) => {
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
};
