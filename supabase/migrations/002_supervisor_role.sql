-- =========================================================
-- Migración: agrega el rol "supervisor" (solo lectura) y crea
-- la cuenta de Irene. Corré esto en el SQL Editor de Supabase
-- si tu proyecto ya estaba creado con el schema.sql anterior.
-- Si estás armando el proyecto desde cero, no hace falta este
-- archivo: alcanza con correr supabase/schema.sql (ya actualizado).
-- =========================================================

alter table accounts drop constraint if exists accounts_role_check;
alter table accounts add constraint accounts_role_check
  check (role in ('admin', 'house', 'supervisor'));

insert into accounts (username, password, role, display_name) values
  ('irene', 'toscana2026', 'supervisor', 'Irene')
on conflict (username) do nothing;
