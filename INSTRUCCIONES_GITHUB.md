# Instrucciones para llevar Control de Clases a GitHub Pages

## 1. Crear el repositorio

En GitHub crea un repositorio llamado, por ejemplo, `control-de-clases`.

Puedes mantenerlo privado mientras haces las pruebas. Antes de activar GitHub Pages, revisa qué visibilidad admite tu plan/configuración, porque Pages puede requerir que el sitio publicado sea accesible públicamente según el tipo de cuenta.

## 2. Subir los archivos

Sube a la raíz del repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `sw.js`
- `icon-192.png`
- `icon-512.png`
- `README.md`
- `MAPA_FUNCIONAL.md`

No los metas dentro de otra carpeta.

## 3. Activar GitHub Pages

Dentro del repositorio:

1. Abre **Configuración**.
2. En el menú lateral entra en **Páginas**.
3. En **Origen**, elige **Implementar desde una rama**.
4. Selecciona la rama `main`.
5. Selecciona la carpeta `/ (root)`.
6. Guarda.

GitHub mostrará la dirección web de la aplicación.

## 4. Instalarla en el iPhone de Matías

1. Abre la dirección de GitHub Pages en Safari.
2. Toca **Compartir**.
3. Elige **Añadir a pantalla de inicio**.
4. Confirma **Control de Clases**.

## 5. Primera configuración

1. Abre **Configuración**.
2. Comprueba que el nombre sea `Matías Montoya`.
3. Define la duración habitual (90 minutos por defecto).
4. Añade tarifas habituales si las conoce.
5. Ingresa el saldo inicial que ya le debe el club y su fecha.
6. Guarda. El saldo inicial quedará bloqueado.
7. En **Clases → Alumnos**, registra los alumnos habituales.

## 6. Uso diario

- **Registrar clase:** fecha, hora de inicio, duración, alumno(s), estado y valor.
- **Registrar pago:** fecha, monto y medio de pago.
- **Inicio:** consulta el saldo pendiente.
- **Reportes:** selecciona una semana o mes y genera el reporte.

## 7. PDF en iPhone

Al tocar **Crear PDF**, la app abre un reporte preparado para impresión. Desde la interfaz de impresión/compartir de iOS se puede guardar o enviar como PDF.

No depende de librerías externas de PDF.

## 8. Respaldo

Los datos viven en el navegador del iPhone, no en GitHub.

Usa periódicamente:

**Configuración → Exportar respaldo**

Guarda el archivo JSON en Archivos/iCloud. Si cambia de teléfono o pierde los datos del navegador, puede recuperarlos con **Restaurar respaldo**.
