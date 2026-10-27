/**
 * Devuelve siempre el componente de un icono de @mui/icons-material.
 * Según el bundler (Vite 8 / Rolldown) el import por defecto puede llegar
 * envuelto una o varias veces como { default: { default: Componente } },
 * lo que provoca el error de React #130 ("Element type is invalid").
 */
export default function icon(mod) {
  let current = mod;
  for (let i = 0; i < 5 && current && typeof current === 'object' && 'default' in current; i += 1) {
    current = current.default;
  }
  return current;
}
