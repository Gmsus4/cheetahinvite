"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="admin-empty" role="alert"><h2>No pudimos cargar esta sección.</h2><p>Intenta de nuevo en unos momentos. Tus cambios guardados se conservan.</p><button className="admin-button" onClick={reset}>Intentar de nuevo</button></div>;
}
