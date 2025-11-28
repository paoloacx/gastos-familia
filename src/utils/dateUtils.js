export const fFecha = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(-2)}`; // muestra solo los dos últimos dígitos del año
};

export const semanaDelAnio = (date) => {
  const y = date.getFullYear();
  const start = new Date(y, 0, 1);
  const msPerDay = 24 * 60 * 60 * 1000;
  const offset = Math.floor((date - start) / msPerDay);
  return Math.floor(offset / 7) + 1;
};

export const mesClave = (date) => {
  const y = date.getFullYear();
  const mesNombre = date.toLocaleString("default", { month: "long" });
  return `${mesNombre} ${y}`;
};
