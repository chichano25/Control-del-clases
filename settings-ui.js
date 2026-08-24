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
        <div class="settings-help">Sirven únicamente para sugerir el valor al registrar una clase. Puedes dejarlas vacías.</div>
        <div class="inline">
          <label>60 minutos<input id="r60" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 12.00" value="${cleanAmount(data.settings.durationRates["60"])}"></label>
          <label>90 minutos<input id="r90" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 18.00" value="${cleanAmount(data.settings.durationRates["90"])}"></label>
        </div>
        <label>120 minutos<input id="r120" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Ej. 24.00" value="${cleanAmount(data.settings.durationRates["120"])}"></label>

        <button class="secondary" type="button" id="savePreferences">Guardar preferencias</button>

        <div class="settings-section-title">Saldo inicial</div>
        <div class="settings-help">Monto que el club ya debía antes de empezar a registrar clases en esta app. Este valor se puede corregir cuando sea necesario.</div>
        <div class="inline">
          <label>Monto pendiente<input id="sInitial" type="number" step="0.01" inputmode="decimal" placeholder="Ej. 150.00" value="${cleanAmount(data.settings.initialBalance)}"></label>
          <label>Fecha del saldo<input id="sInitialDate" type="date" value="${data.settings.initialBalanceDate||today()}"></label>
        </div>
        <button class="primary" type="button" id="saveInitialBalance">Guardar saldo inicial</button>
      </div>`);

    $("#savePreferences").onclick=()=>{
      data.settings.ownerName=$("#sOwner").value.trim()||"Matías Montoya";
      data.settings.defaultDuration=Number($("#sDuration").value);
      data.settings.durationRates={
        "60":$("#r60").value||"0",
        "90":$("#r90").value||"0",
        "120":$("#r120").value||"0"
      };
      audit("editó","configuración","settings","Preferencias actualizadas");
      closeModal();
      saveData();
    };

    $("#saveInitialBalance").onclick=()=>{
      const previousBalance=Number(data.settings.initialBalance||0);
      const previousDate=data.settings.initialBalanceDate||today();
      const newBalance=Number($("#sInitial").value||0);
      const newDate=$("#sInitialDate").value||today();

      data.settings.initialBalance=newBalance;
      data.settings.initialBalanceDate=newDate;
      data.settings.initialBalanceLocked=true;

      if(previousBalance!==newBalance || previousDate!==newDate){
        audit("editó","saldo inicial","initial",`${fmtDate(previousDate)} · ${money(previousBalance)} → ${fmtDate(newDate)} · ${money(newBalance)}`);
      }

      closeModal();
      saveData();
      alert(`Saldo inicial actualizado a ${money(newBalance)}.`);
    };
  }

  settingsButton.addEventListener("click", openClearSettings);
})();
