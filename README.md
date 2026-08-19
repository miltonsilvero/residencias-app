# Casa al día

Web para gestionar el pago de servicios (luz, gas, internet, etc.) entre los
habitantes de residencias estudiantiles. Cada casa entra con un usuario y
contraseña compartidos, carga las facturas que van llegando, y la casa
decide mes a mes si se reparte con un aporte fijo o con reparto exacto.

Stack: **Next.js (App Router) + Supabase (Postgres + Storage) + Tailwind**,
pensado para desplegar en **Vercel**.

## 1. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com), creá un proyecto nuevo (gratis).
2. Entrá a **SQL Editor** → pegá todo el contenido de `supabase/schema.sql` → **Run**.
   Esto crea las tablas, las políticas de acceso, el bucket de Storage
   `facturas` para las fotos/archivos, y las 3 cuentas pedidas:
   - `rayuela` / `dorrego3362`
   - `macondo` / `dorrego3262`
   - `admin` / `admin3011` (rol administrador)
3. Andá a **Project Settings → API** y copiá:
   - `Project URL`
   - `anon public` key

## 2. Configurar variables de entorno

Copiá `.env.example` a `.env.local` y completá con los valores de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## 3. Correr en local

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`, iniciá sesión con cualquiera de las cuentas.

## 4. Desplegar en Vercel

1. Subí este proyecto a un repositorio de GitHub (o similar).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. En **Environment Variables** cargá las mismas dos variables de `.env.local`.
4. Deploy. Listo.

## Cómo funciona

- **Login**: es solo una verificación de usuario/contraseña contra la tabla
  `accounts`, guardada en el navegador (localStorage). **No hay
  autenticación real** (no hay hash de contraseñas, no hay sesiones del
  lado del servidor, no hay Row Level Security por usuario) — así se pidió
  explícitamente, para que sea lo más simple posible de usar. Cualquiera
  con la URL y el usuario/contraseña de una casa puede operar esa casa.
  Si en algún momento se quiere subir el nivel de seguridad, lo primero a
  migrar es Supabase Auth + políticas RLS por usuario.

- **Mes / periodo**: cada casa tiene un "periodo" por mes. Al entrar a un
  mes nuevo, la app copia automáticamente los integrantes del mes anterior
  (para no tener que cargarlos de nuevo), pero cada uno arranca sin marcar
  como pagado.

- **Facturas**: cualquier integrante de la casa puede cargar una factura
  (servicio, mensual/bimestral, período que cubre, vencimiento, monto, y
  opcionalmente una foto o PDF) y marcarla como pagada cuando corresponda.

- **División del gasto**: por mes, la casa elige:
  - **Aporte fijo**: todos ponen un monto fijo definido por la casa (ej.
    $20.000 c/u). Prorrateado si alguien vivió solo una parte del mes.
  - **Reparto exacto**: el total facturado ese mes se divide en proporción
    a cuánto vivió cada uno.
  - En cualquiera de los dos modos, se puede pisar el monto de una persona
    a mano (por ejemplo, para casos especiales) tocando el monto en su fila.

- **Fondo común**: se calcula solo, como lo que se cobró (aportes marcados
  como pagados) menos lo que ya se pagó de facturas. No hace falta llevarlo
  a mano.

- **Checklist de pagos**: hay dos niveles independientes — quién ya aportó
  su parte del mes (checkbox por persona), y qué facturas puntuales ya
  están pagadas (checkbox por factura).

- **Historial**: cada casa puede navegar meses anteriores desde
  "Historial", con la misma vista (se puede seguir editando si hace falta
  corregir algo viejo).

- **Panel admin** (`/admin`, cuenta `admin`): crear cuentas de casa nuevas,
  eliminar una cuenta (borra todo su historial), o resetear los registros
  de una casa (borra meses/facturas pero mantiene el usuario y contraseña).

## Estructura

```
src/
  app/
    login/                 → pantalla de acceso
    dashboard/              → vista de la casa (mes actual)
    dashboard/historial/    → lista + detalle de meses anteriores
    admin/                  → panel de administración
  components/                → UI reutilizable
  lib/                       → cliente de Supabase, tipos, cálculo de repartos
supabase/schema.sql        → esquema completo para pegar en Supabase
```
