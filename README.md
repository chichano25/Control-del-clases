# Control de Clases

PWA móvil para que Matías Montoya lleve control de sus clases de pádel, pagos del club y saldo pendiente.

## Lógica principal

**Saldo pendiente = saldo inicial + clases cobrables + ajustes positivos - pagos recibidos - ajustes negativos**

Los cortes semanales y mensuales son dinámicos: si se corrige una clase o un pago anterior, el saldo y los reportes se recalculan automáticamente.

## Funciones

- Registro de clases con fecha, hora de inicio, hora de fin calculada, duración, alumno(s), estado y valor.
- Clases individuales o grupales.
- En grupos: valor total o valor por alumno, siempre editable.
- Clases canceladas y ausencias en $0 por defecto, con opción de cambiar el valor.
- Registro de pagos con fecha, monto, medio y referencia semanal opcional.
- Saldo inicial bloqueable y ajustes posteriores.
- Historial cronológico con saldo acumulado después de cada movimiento.
- Filtros de clases por alumno, estado y rango de fechas.
- Filtros del historial por tipo y rango de fechas.
- Reportes semanales y mensuales de cualquier período.
- Reportes con clases impartidas, canceladas y ausencias separadas.
- Creación de PDF mediante la función nativa de impresión/compartir del iPhone, sin librerías externas.
- Alumnos activos/inactivos sin perder historial.
- Historial básico de cambios (creaciones, ediciones y eliminaciones).
- Respaldo y restauración manual en JSON.
- PWA instalable en la pantalla de inicio del iPhone.
- Modo claro/oscuro automático.
- Datos guardados únicamente en el dispositivo mediante localStorage.

## Publicación

Consulta `INSTRUCCIONES_GITHUB.md`.

## Respaldo

Los datos no se guardan en GitHub. Conviene exportar periódicamente un respaldo desde **Configuración → Exportar respaldo** y conservarlo en Archivos/iCloud.
