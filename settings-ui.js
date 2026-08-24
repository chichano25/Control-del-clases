(() => {
  const oldButton = document.querySelector("#settingsBtn");
  if (!oldButton) return;

  const settingsButton = oldButton.cloneNode(true);
  oldButton.replaceWith(settingsButton);

  const cleanAmount = (value) => Number(value || 0) === 0 ? "" : String(value);

  function openClearSettings(){
    openModal(`
      <div class="modal-head"><h2>Configuración</h2><button class="close-btn" value="cancel">×</button></div>
      <div class="form">
        <div class="settings-section-title">Datos básicos</div>
        <label>Nombre para reportes<input id="sOwner" value="${escapeAttr(data.settings.ownerName)}"></label>
        <label>Duración habitual<select id="sDuration">${[60,90,120].map(v=>`<option value="${v}" ${Number(data.settings.defaultDuration)===v?"selected":""}>${v} minutos</option>`).join("")}</select></label>

        <div class="settings-section-title">Tarifas habituales <span>Opcional</span></div>
        <div class="settings-help">Solo sirven para sugerir automáticamente el valor de una clase. Si no quieres usarlas, déjalas vacías.</div>
        <div class="inline">
          <label>60 minutos<input id="r60" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 12.00" value="${cleanAmount(data.settings.durationRates["60"])}"></label>
          <label>90 minutos<input id="r90" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 18.00" value="${cleanAmount(data.settings.durationRates["90"])}"></label>
        </div>
        <label>120 minutos<input id="r120" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 24.00" value="${cleanAmount(data.settings.durationRates["120"])}"></label>

        <div class="settings-section-title">Saldo inicial</div>
        <div class="settings-help">Ingresa únicamente lo que el club ya le debía a Matías antes de empezar a usar esta app.</div>
        <div class="inline">
          <label>Monto pendiente<input id="sInitial" type="number" step="0.01" inputmode="decimal" placeholder="Ej. 150.00" value="${cleanAmount(data.settings.initialBalance)}" ${data.settings.initialBalanceLocked?"disabled":""}></label>
          <label>Fecha del saldo<input id="sInitialDate" type="date" value="${data.settings.initialBalanceDate||today()}" ${data.settings.initialBalanceLocked?"disabled":""}></label>
        </div>
        ${data.settings.initialBalanceLocked?`<div class="banner">El saldo inicial ya fue guardado y está bloqueado. Si necesitas corregirlo, usa “Registrar ajuste”.</div>`:""}

        <button class="primary" type="button" id="saveSettings">Guardar configuración</button>
        <button class="secondary" type="button" id="addAdjustment">Registrar ajuste</button>
        <button class="secondary" type="button" id="auditBtn">Historial de cambios</button>
        <button class="secondary" type="button" id="backupBtn">Exportar respaldo</button>
        <label class="secondary file-button">Restaurar respaldo<input id="restoreInput" type="file" accept="application/json"></label>
      </div>`);

    $("#saveSettings").onclick=()=>{
      data.settings.ownerName=$("#sOwner").value.trim()||"Matías Montoya";
      data.settings.defaultDuration=Number($("#sDuration").value);
      data.settings.durationRates={"60":$("#r60").value,"90":$("#r90").value,"120":$("#r120").value};
      if(!data.settings.initialBalanceLocked){
        data.settings.initialBalance=Number($("#sInitial").value||0);
        data.settings.initialBalanceDate=$("#sInitialDate").value||today();
        data.settings.initialBalanceLocked=true;
        audit("configuró","saldo inicial","initial",`${fmtDate(data.settings.initialBalanceDate)} · ${money(data.settings.initialBalance)}`);
      }
      closeModal();
      saveData();
    };

    $("#addAdjustment").onclick=openAdjustment;
    $("#auditBtn").onclick=openAuditLog;
    $("#backupBtn").onclick=exportBackup;
    $("#restoreInput").onchange=restoreBackup;
  }

  settingsButton.addEventListener("click", openClearSettings);
})();
