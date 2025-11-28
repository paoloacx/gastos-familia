export const fFecha = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(-2)}`; // muestra solo los dos últimos dígitos del año
};

export const semanaDelAnio = (date) => {
  // Copiamos la fecha para no mutar la original
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Establecemos el día al jueves más cercano: actual + 4 - día actual (domingo es 0)
  // En ISO 8601, la semana empieza en lunes (1) y termina en domingo (7).
  // Ajustamos para que domingo sea 7.
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // Inicio del año
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculamos la semana
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

export const mesClave = (date) => {
  const y = date.getFullYear();
  const mesNombre = date.toLocaleString("default", { month: "long" });
  return `${mesNombre} ${y}`;
};
