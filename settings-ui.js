(() => {
  const oldButton = document.querySelector("#settingsBtn");
  if (!oldButton) return;

  const settingsButton = oldButton.cloneNode(true);
  oldButton.replaceWith(settingsButton);

  const cleanAmount = (value) => Number(value || 0) === 0 ? "" : String(value);

  function openClearSettings(){
    const initialWasConfigured = Boolean(data.settings.initialBalanceLocked);

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
        <div class="settings-help">Es lo que el club ya le debía a Matías antes de empezar a usar la app. Puedes modificarlo después si necesitas corregirlo; el saldo y los reportes se recalculan automáticamente.</div>
        <div class="inline">
          <label>Monto pendiente<input id="sInitial" type="number" step="0.01" inputmode="decimal" placeholder="Ej. 150.00" value="${cleanAmount(data.settings.initialBalance)}"></label>
          <label>Fecha del saldo<input id="sInitialDate" type="date" value="${data.settings.initialBalanceDate||today()}"></label>
        </div>

        <button class="primary" type="button" id="saveSettings">Guardar configuración</button>
        <button class="secondary" type="button" id="addAdjustment">Registrar ajuste</button>
        <button class="secondary" type="button" id="auditBtn">Historial de cambios</button>
        <button class="secondary" type="button" id="backupBtn">Exportar respaldo</button>
        <label class="secondary file-button">Restaurar respaldo<input id="restoreInput" type="file" accept="application/json"></label>
      </div>`);

    $("#saveSettings").onclick=()=>{
      const previousBalance=Number(data.settings.initialBalance||0);
      const previousDate=data.settings.initialBalanceDate||today();

      data.settings.ownerName=$("#sOwner").value.trim()||"Matías Montoya";
      data.settings.defaultDuration=Number($("#sDuration").value);
      data.settings.durationRates={
        "60":$("#r60").value||"0",
        "90":$("#r90").value||"0",
        "120":$("#r120").value||"0"
      };

      const newBalance=Number($("#sInitial").value||0);
      const newDate=$("#sInitialDate").value||today();
      data.settings.initialBalance=newBalance;
      data.settings.initialBalanceDate=newDate;
      data.settings.initialBalanceLocked=true;

      if(!initialWasConfigured){
        audit("configuró","saldo inicial","initial",`${fmtDate(newDate)} · ${money(newBalance)}`);
      }else if(previousBalance!==newBalance || previousDate!==newDate){
        audit("editó","saldo inicial","initial",`${fmtDate(previousDate)} · ${money(previousBalance)} → ${fmtDate(newDate)} · ${money(newBalance)}`);
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
