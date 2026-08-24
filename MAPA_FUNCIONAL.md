# Mapa funcional definitivo — Control de Clases

## Objetivo

Dar a Matías Montoya un control simple y verificable de sus clases de pádel, el dinero generado, los pagos parciales que recibe del club y el saldo que sigue pendiente.

## Regla contable

**Saldo pendiente = saldo inicial + clases cobrables + ajustes positivos - pagos recibidos - ajustes negativos.**

El saldo es el dato rector. Los reportes semanales y mensuales muestran cortes del mismo historial, no cuentas independientes.

## Inicio

- Saldo pendiente actual.
- Horas trabajadas en la semana.
- Dinero generado en la semana.
- Dinero recibido en la semana.
- Accesos rápidos a Registrar clase y Registrar pago.
- Últimos movimientos.

## Clases

Cada registro incluye:

- fecha automática y editable;
- hora de inicio;
- duración;
- hora de fin calculada;
- uno o varios alumnos;
- estado: impartida, cancelada o ausencia;
- modalidad de valor: total o por alumno;
- valor base y total final editable.

Reglas:

- Una clase impartida debe tener valor mayor a $0.
- Canceladas y ausencias parten de $0, pero pueden tener valor si corresponde.
- Una clase grupal es un solo registro con varios alumnos.
- Si se usa valor por alumno, la app calcula el total, pero Matías puede sobrescribirlo.

## Pagos

- fecha;
- monto;
- efectivo, transferencia u otro;
- semana relacionada opcional.

La app muestra el efecto del pago sobre el saldo antes de guardarlo.

## Alumnos

- alta y edición;
- búsqueda al registrar clase;
- activos/inactivos;
- un alumno inactivo conserva todo su historial.

## Historial

Movimientos combinados:

- saldo inicial;
- clases;
- pagos;
- ajustes.

Cada línea muestra el saldo acumulado resultante. Puede filtrarse por tipo y rango de fechas y ordenarse en ambos sentidos.

## Reportes

### Semanal

- horas trabajadas;
- dinero generado;
- dinero recibido;
- saldo al cierre;
- clases impartidas;
- canceladas;
- ausencias;
- pagos.

### Mensual

Los mismos datos consolidados por mes.

Los reportes pueden consultarse para períodos anteriores. Si se modifica un dato histórico, los cortes se recalculan automáticamente.

## PDF

Encabezado:

**Matías Montoya**

No incluye nombre del club.

El documento separa clases impartidas, canceladas y ausencias e incluye fecha, inicio, fin, duración, alumnos y valor.

## Configuración

- nombre para reportes;
- duración habitual;
- tarifas habituales por duración;
- saldo inicial y fecha;
- ajustes;
- historial de cambios;
- exportar respaldo;
- restaurar respaldo.

## Diseño

- PWA para iPhone;
- navegación inferior: Inicio, Clases, Pagos y Reportes;
- modo claro/oscuro automático;
- estética deportiva de pádel;
- gris/negro con verde lima como acento;
- pocos campos visibles y botones grandes.

## Persistencia

Los datos se almacenan únicamente en el iPhone. El respaldo manual en JSON es la protección ante pérdida, cambio de teléfono o borrado del almacenamiento del navegador.
