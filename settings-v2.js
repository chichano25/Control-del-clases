(() => {
  const oldBtn = document.getElementById("settingsBtn");
  if (!oldBtn) return;

  const newBtn = oldBtn.cloneNode(true);
  oldBtn.replaceWith(newBtn);
  newBtn.addEventListener("click", openSettingsEditable);

  function blankIfZero(v){
    const n = Number(v || 0);
    return n === 0 ? "" : String(v);
  }

  function openSettingsEditable(){
    const initialValue = data.settings.initialBalanceLocked || Number(data.settings.initialBalance) !== 0
      ? String(Number(data.settings.initialBalance || 0))
      : "";

    openModal(`
      <div class="modal-head">
        <h2>Configuración</h2>
        <button class="close-btn" value="cancel">×</button>
      </div>
      <div class="form">
        <label>Nombre para reportes
          <input id="sOwner" value="${escapeAttr(data.settings.ownerName)}">
        </label>

        <label>Duración habitual
          <select id="sDuration">
            ${[60,90,120].map(v=>`<option value="${v}" ${Number(data.settings.defaultDuration)===v?"selected":""}>${v} minutos</option>`).join("")}
          </select>
        </label>

        <div class="banner">Tarifas habituales · opcional. Solo sirven como sugerencia al registrar una clase.</div>
        <div class="inline">
          <label>60 min
            <input id="r60" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 12.00" value="${blankIfZero(data.settings.durationRates["60"])}">
          </label>
          <label>90 min
            <input id="r90" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 18.00" value="${blankIfZero(data.settings.durationRates["90"])}">
          </label>
        </div>
        <label>120 min
          <input id="r120" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 24.00" value="${blankIfZero(data.settings.durationRates["120"])}">
        </label>

        <div class="banner">Saldo inicial · es lo que el club ya debía antes de empezar a usar la app. Puedes modificarlo después si necesitas corregirlo; todo el saldo e historial se recalculan automáticamente.</div>
        <div class="inline">
          <label>Saldo inicial (USD)
            <input id="sInitial" type="number" step="0.01" inputmode="decimal" placeholder="Ej. 150.00" value="${initialValue}">
          </label>
          <label>Fecha del saldo inicial
            <input id="sInitialDate" type="date" value="${data.settings.initialBalanceDate || today()}">
          </label>
        </div>

        <button class="primary" type="button" id="saveSettings">Guardar configuración</button>
        <button class="secondary" type="button" id="addAdjustment">Registrar ajuste</button>
        <button class="secondary" type="button" id="auditBtn">Historial de cambios</button>
        <button class="secondary" type="button" id="backupBtn">Exportar respaldo</button>
        <label class="secondary file-button">Restaurar respaldo
          <input id="restoreInput" type="file" accept="application/json">
        </label>
      </div>
    `);

    document.getElementById("saveSettings").onclick = () => {
      const previousBalance = Number(data.settings.initialBalance || 0);
      const previousDate = data.settings.initialBalanceDate || today();
      const wasConfigured = Boolean(data.settings.initialBalanceLocked);

      data.settings.ownerName = document.getElementById("sOwner").value.trim() || "Matías Montoya";
      data.settings.defaultDuration = Number(document.getElementById("sDuration").value);
      data.settings.durationRates = {
        "60": document.getElementById("r60").value || "0",
        "90": document.getElementById("r90").value || "0",
        "120": document.getElementById("r120").value || "0"
      };

      const newBalance = Number(document.getElementById("sInitial").value || 0);
      const newDate = document.getElementById("sInitialDate").value || today();
      data.settings.initialBalance = newBalance;
      data.settings.initialBalanceDate = newDate;
      data.settings.initialBalanceLocked = true;

      if (!wasConfigured) {
        audit("configuró", "saldo inicial", "initial", `${fmtDate(newDate)} · ${money(newBalance)}`);
      } else if (previousBalance !== newBalance || previousDate !== newDate) {
        audit("editó", "saldo inicial", "initial", `${fmtDate(previousDate)} · ${money(previousBalance)} → ${fmtDate(newDate)} · ${money(newBalance)}`);
      }

      closeModal();
      saveData();
    };

    document.getElementById("addAdjustment").onclick = openAdjustment;
    document.getElementById("auditBtn").onclick = openAuditLog;
    document.getElementById("backupBtn").onclick = exportBackup;
    document.getElementById("restoreInput").onchange = restoreBackup;
  }
})();
