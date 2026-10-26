# Recuperación de contraseña

En `/login`, «¿Olvidaste tu contraseña?» lleva a `/recuperar-contrasena`.
La opción principal es la recuperación manual por `cheetahinvite@gmail.com`.
El formulario abre la aplicación de correo con el asunto y el correo de la
cuenta en el cuerpo. El usuario revisa y envía el mensaje: la web no envía
automáticamente esta solicitud ni verifica códigos de soporte.

## Procedimiento manual del equipo

1. Recibir la solicitud e identificar la cuenta mediante su correo registrado.
2. Enviar un código aleatorio de un solo uso al correo que consta en la cuenta,
   aunque la solicitud haya llegado desde otra dirección. No cambiar el correo
   de destino basándose únicamente en lo que diga el solicitante.
3. Pedir que responda al mensaje con el código. El equipo debe comprobar el
   remitente real de la respuesta, el código y su vigencia antes de continuar.
4. Tras verificarlo, invalidar el código y asignar una contraseña nueva aleatoria
   de al menos 12 caracteres. Comunicarla únicamente al correo registrado.
5. La actualización administrativa debe usar `hashPassword`, incrementar
   `sessionVersion` e invalidar `passwordResetHash` y `passwordResetExpiresAt`.
   Nunca guardar contraseñas sin hash ni pedir la contraseña anterior.

La gestión del buzón, los códigos y el cambio administrativo de contraseña son
operaciones manuales del equipo. Esta opción no crea un panel administrativo
ni una herramienta que permita cambiar contraseñas desde el sitio público.

## Recuperación automática alternativa

La sección desplegable «Otra opción: recibir un enlace automático» conserva
el flujo de Resend descrito a continuación.
Las cuentas con contraseña reciben un enlace de un solo uso, válido durante
30 minutos. Pedir otro enlace invalida el anterior. Las cuentas que solo usan
Google deben continuar con Google; este flujo no les crea una contraseña.

## Configuración

1. Crea una API key de envío en Resend y verifica un dominio remitente.
2. Configura las variables exclusivamente en el servidor:

```dotenv
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Cheetah Invite <acceso@tu-dominio-verificado.com>"
APP_URL="http://localhost:3000"
```

En producción, `APP_URL` debe ser el origen HTTPS real. Nunca se usa el Host de
la petición para generar los enlaces. No compartas la API key en el chat ni
uses variables `NEXT_PUBLIC_`. Desactiva el seguimiento de enlaces en Resend
para estos correos de recuperación.

3. Aplica la migración y regenera el cliente:

```powershell
npx prisma migrate deploy
npx prisma generate
```

4. Reinicia la aplicación. En el entorno de prueba de Resend, los destinatarios
permitidos dependen de la verificación del dominio; revisa su panel si no llega
el correo. El servicio responde 503 mientras falta la configuración.

## Comportamiento y comprobaciones

- Máximo 3 solicitudes por correo por hora, con contador persistido en la base
  de datos. Se cuentan también correos desconocidos y los intentos fallidos de envío.
- La respuesta pública es la misma para cuentas existentes, desconocidas y Google.
  El envío se ejecuta con `after`, dentro del ciclo de vida soportado de Next.js.
- Solo se guarda SHA-256 del token aleatorio de 256 bits. El secreto viaja en el
  fragmento del enlace, no en la petición HTTP de la página, y no se imprime.
- El cambio de contraseña consume el token con una actualización atómica e
  incrementa la versión de sesión. Los JWT anteriores se rechazan al usarse
  nuevamente. No se inicia sesión automáticamente tras recuperar la cuenta.
- La contraseña conserva la política del registro: entre 12 y 128 caracteres.
- Si falla Resend, se borra ese token y se registra un error sin correos ni secretos.
  Los errores de entrega se revisan en el panel de Resend y los registros del servidor.

Prueba con una cuenta local: solicita un enlace, úsalo, verifica el acceso con
la nueva contraseña y el rechazo de la anterior. Reutilizar el enlace debe fallar.
Comprueba también enlaces vencidos, dos envíos simultáneos, cuentas desconocidas,
cuentas Google y las sesiones que estaban abiertas antes del cambio.

```powershell
node --test tests/password-recovery.test.cjs
```

Referencias: https://resend.com/docs/api-reference/emails/send-email y
https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
