# Límites de registro y acceso con contraseña

Los contadores de `AuthAttemptBudget` se comparten en PostgreSQL entre instancias
y sobreviven a reinicios. Se consumen antes del hash de registro, la consulta de
la cuenta y la verificación de contraseña; no dependen del navegador.

| Operación | Por IP | Por correo normalizado | Ventana fija |
| --- | --- | --- | --- |
| Registro | 5 intentos | 3 intentos | 1 hora |
| Acceso con contraseña | 30 intentos | 10 intentos | 15 minutos |

Se cuentan también registros duplicados, cuentas desconocidas, cuentas Google
y accesos correctos. Los cuerpos inválidos consumen el presupuesto de IP.
Los presupuestos por correo se consumen después de validar los datos básicos.
Cambiar mayúsculas, espacios o IP no reinicia el presupuesto del correo.
El acceso con Google conserva su flujo de OAuth.

El registro bloqueado devuelve HTTP 429 con `Retry-After` en segundos y
`Cache-Control: no-store`. Auth.js comunica `CredentialsSignin` con código
`too_many_attempts`; el formulario muestra que debe esperar hasta 15 minutos.
La respuesta no indica si la cuenta existe. Los intentos nuevos no extienden la
ventana. Por ser ventanas fijas, puede admitirse otro cupo al cruzar el límite
de una ventana. Los contadores vencidos se eliminan al consumir presupuestos.

La IP procede exclusivamente de `CF-Connecting-IP`, sobrescrito por Cloudflare
en el despliegue Workers. No se confía en `X-Forwarded-For` ni `X-Real-IP`.
En local, las peticiones sin una IP válida comparten el presupuesto `unknown`.
Si se sirve Node directamente, el proxy de confianza debe reemplazar ese
encabezado y bloquear el acceso directo al origen para impedir su falsificación.

Las claves guardan HMAC-SHA256 con `AUTH_SECRET` (o `NEXTAUTH_SECRET`) y separan
operación y ventana: no guardan IP, correo ni contraseña. Cambiar el secreto
reinicia de forma efectiva los cupos activos. Si falta el secreto o falla el
almacenamiento de contadores, se rechaza la operación: registro devuelve 503
y el acceso muestra indisponibilidad temporal.

Antes de desplegar esta versión, aplica la migración y genera el cliente:

```powershell
npx prisma migrate deploy
npx prisma generate
```

Verificación:

```powershell
node --test tests/auth-attempts.test.cjs tests/password-recovery.test.cjs tests/auth-destination.test.cjs
npm run test:postgres
```
