(() => {
  const button = document.getElementById('settingsBtn');
  if (!button) return;

  function exportBackup(){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `control-clases-respaldo-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function restoreBackup(e){
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (!incoming || typeof incoming !== 'object' || !Array.isArray(incoming.classes) || !Array.isArray(incoming.payments) || !Array.isArray(incoming.students)) {
          throw new Error('Formato inválido');
        }
        if (confirm('Esto reemplazará los datos actuales de la app. ¿Continuar?')) {
          data = incoming;
          localStorage.setItem(KEY, JSON.stringify(data));
          close();
          render();
        }
      } catch (err) {
        alert('El archivo no parece ser un respaldo válido.');
      }
    };
    reader.readAsText(file);
  }

  settings = function(){
    modal(`<div class="modal-head"><h2>Configuración</h2><button class="close-btn" id="x">×</button></div>
      <div class="form">
        <section class="settings-section">
          <h3>Saldo inicial</h3>
          <p>Lo que el club ya debía antes de empezar a usar la app. Puedes corregirlo cuando quieras.</p>
          <div class="inline">
            <label>Monto pendiente<input id="bal" type="number" step="0.01" inputmode="decimal" value="${+data.settings.initial||''}"></label>
            <label>Fecha<input id="bd" type="date" value="${data.settings.initialDate||today()}"></label>
          </div>
          <button class="primary" id="saveBal" type="button" style="width:100%;margin-top:10px">Guardar saldo inicial</button>
        </section>

        <details>
          <summary>Respaldo de datos</summary>
          <div class="form" style="margin-top:12px">
            <div class="banner">Los datos viven en este dispositivo. Exporta un respaldo para poder recuperarlos si cambias de iPhone o se borran los datos de Safari.</div>
            <button class="secondary" id="exportBackup" type="button">Exportar respaldo</button>
            <label class="secondary" style="text-align:center;position:relative">Restaurar respaldo<input id="restoreBackup" type="file" accept="application/json" style="position:absolute;inset:0;opacity:0"></label>
          </div>
        </details>
      </div>`);

    $('#x').onclick = close;
    $('#saveBal').onclick = () => {
      data.settings.initial = Number($('#bal').value || 0);
      data.settings.initialDate = $('#bd').value || today();
      close();
      save();
    };
    $('#exportBackup').onclick = exportBackup;
    $('#restoreBackup').onchange = restoreBackup;
  };

  button.onclick = settings;
})();
