# Cheetah Invite

Invitaciones digitales para bodas, cumpleaños, graduaciones, baby showers, aniversarios y otros eventos. Todas utilizan una presentación fotográfica común, personalizada con los datos, las fotos, los colores y las fuentes del organizador.

## Desarrollo

```sh
npm ci
```

Copia `.env.example` a `.env` y configura PostgreSQL, autenticación y los servicios que vayas a utilizar. Aplica las migraciones antes de iniciar:

```sh
npx prisma migrate deploy
npm run dev
```

`predev` y `prebuild` generan el cliente de Prisma. El proyecto no necesita sincronizar recursos de plantillas.

## Verificación

```sh
npm run lint
npm test
npm run build
npm run typecheck
```

Las pruebas unitarias utilizan servicios aislados. Las integraciones `tests/*.postgres.cjs` y `tests/cloudinary-direct.integration.cjs` requieren la configuración indicada en sus archivos y en la documentación del servicio.

## Arquitectura

- `components/dashboard/GuidedInvitationEditor.tsx`: asistente común de creación y edición.
- `components/invitation/CelebrationInvitation.tsx`: presentación compartida por ejemplos, vista previa, vista privada e invitación pública.
- `lib/shared-invitation.ts`: apariencia y paletas del diseño base.
- `lib/invitation-event-presets.ts`: textos iniciales editables por ocasión, sin datos personales ficticios.
- `lib/invitation-editor.ts`: tipos, serialización y recuperación de borradores.
- `lib/invitation-templates.ts`: validación mínima de identificadores anteriores. Al guardar se normalizan al diseño actual.
- `public/demo/`: fotografías de los ejemplos públicos. Las fotografías del organizador se alojan en Cloudinary.

Se retiraron las colecciones temáticas, sus imágenes, los editores y selectores antiguos y el proceso de copia de recursos. El historial de Git conserva las versiones anteriores. Las migraciones de Prisma se mantienen para poder actualizar bases de datos existentes.

## Documentación

- [Administración: acceso, ejemplos, precio, clientes, ventas, estadísticas y cortesías](docs/admin-workspace.md).
- [Presentación común](docs/shared-invitation.md) y [asistente de edición](docs/guided-invitation.md).
- [Guardado y recuperación](docs/editor-protection.md).
- [Fotografías y limpieza de Cloudinary](docs/cloudinary-storage.md).
- [Pagos con Stripe](docs/stripe.md) y [operación de soporte](docs/support-operations.md).
- [Confirmación de asistencia](docs/rsvp.md).
- [Recuperación de contraseña](docs/password-recovery.md) y [operación legal y comercial](docs/legal-commercial.md).

Las fotografías de los seis ejemplos públicos (uno por tipo de evento) se agregan manualmente siguiendo [readme.me](readme.me). Todos utilizan el diseño base compartido.
