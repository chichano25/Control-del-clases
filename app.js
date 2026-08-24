const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = "controlClases_v2";

const defaultData = {
  version: 2,
  settings: {
    ownerName: "Matías Montoya",
    defaultDuration: 90,
    durationRates: {"60":"0","90":"0","120":"0"},
    initialBalance: 0,
    initialBalanceDate: "",
    initialBalanceLocked: false
  },
  students: [],
  classes: [],
  payments: [],
  adjustments: [],
  auditLog: [],
  createdAt: new Date().toISOString()
};

let data = loadData();
let route = "home";
let classFilters = {status:"all", student:"all", from:"", to:""};
let historyFilters = {type:"all", from:"", to:""};
let historySort = "desc";

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function uid(prefix){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function normalizeData(saved){
  const d = {...clone(defaultData), ...(saved||{})};
  d.settings = {...clone(defaultData.settings), ...((saved||{}).settings||{})};
  for(const key of ["students","classes","payments","adjustments","auditLog"]) if(!Array.isArray(d[key])) d[key]=[];
  if(!d.settings.initialBalanceDate) d.settings.initialBalanceDate = (d.createdAt||new Date().toISOString()).slice(0,10);
  d.version = 2;
  return d;
}
function loadData(){
  try{
    const current = localStorage.getItem(STORAGE_KEY);
    if(current) return normalizeData(JSON.parse(current));
    const old = localStorage.getItem("controlClases_v1");
    if(old){
      const migrated=normalizeData(JSON.parse(old));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  }catch(e){ console.error("No se pudieron cargar los datos",e); }
  return normalizeData(null);
}
function saveData(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch(e){ alert("No se pudieron guardar los datos en este iPhone. Exporta un respaldo y revisa el almacenamiento disponible."); console.error(e); }
  render();
}
function audit(action, entity, id, summary){
  data.auditLog.push({id:uid("log"), at:new Date().toISOString(), action, entity, entityId:id, summary});
  if(data.auditLog.length>500) data.auditLog=data.auditLog.slice(-500);
}
function money(n){ return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n||0)); }
function isoDate(d=new Date()){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function today(){ return isoDate(new Date()); }
function safeDate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s||"") ? new Date(`${s}T12:00:00`) : null; }
function fmtDate(s){ const d=safeDate(s); return d ? d.toLocaleDateString("es-EC",{day:"2-digit",month:"short",year:"numeric"}) : "—"; }
function mondayOf(dateStr){ const d=safeDate(dateStr)||new Date(); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return isoDate(d); }
function sundayOf(dateStr){ const d=safeDate(mondayOf(dateStr)); d.setDate(d.getDate()+6); return isoDate(d); }
function monthBounds(month){
  const m=/^\d{4}-\d{2}$/.test(month||"")?month:today().slice(0,7);
  const start=`${m}-01`, d=safeDate(start); d.setMonth(d.getMonth()+1); d.setDate(0); return {start,end:isoDate(d)};
}
function capitalize(s=""){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : ""; }
function escapeHtml(s=""){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function escapeAttr(s=""){ return escapeHtml(s).replace(/`/g,"&#096;"); }
function classValue(c){ return Number(c.totalValue||0); }
function studentNames(ids=[]){
  const names=ids.map(id=>data.students.find(s=>s.id===id)?.name).filter(Boolean);
  return names.join(", ") || "Sin alumno";
}
function minutesLabel(min){ const n=Number(min||0), h=Math.floor(n/60), m=n%60; return m?`${h} h ${m} min`:`${h} h`; }
function classEndTime(start,duration){
  if(!/^\d{2}:\d{2}$/.test(start||"")) return "";
  const [h,m]=start.split(":").map(Number), total=h*60+m+Number(duration||0);
  return `${String(Math.floor((total%1440)/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}

function movementList(){
  const arr=[];
  if(data.settings.initialBalanceLocked || Number(data.settings.initialBalance)!==0){
    arr.push({id:"initial",date:data.settings.initialBalanceDate||data.createdAt.slice(0,10),time:"00:00",type:"initial",label:"Saldo inicial",amount:Number(data.settings.initialBalance||0)});
  }
  data.classes.forEach(c=>arr.push({id:c.id,date:c.date,time:c.startTime||"12:00",type:"class",label:`Clase · ${studentNames(c.studentIds)}`,amount:classValue(c)}));
  data.payments.forEach(p=>arr.push({id:p.id,date:p.date,time:"23:00",type:"payment",label:`Pago · ${p.method}`,amount:-Number(p.amount||0)}));
  data.adjustments.forEach(a=>arr.push({id:a.id,date:a.date,time:"23:30",type:"adjustment",label:"Ajuste",amount:Number(a.amount||0)}));
  arr.sort((a,b)=>(a.date+a.time+a.id).localeCompare(b.date+b.time+b.id));
  let running=0; arr.forEach(m=>{running+=m.amount;m.running=running;});
  return arr;
}
function currentBalance(){ const m=movementList(); return m.length?m.at(-1).running:0; }
function periodStats(start,end){
  const classes=data.classes.filter(c=>c.date>=start&&c.date<=end);
  const payments=data.payments.filter(p=>p.date>=start&&p.date<=end);
  const taught=classes.filter(c=>c.status==="impartida");
  const generated=classes.reduce((s,c)=>s+classValue(c),0);
  const received=payments.reduce((s,p)=>s+Number(p.amount||0),0);
  const minutes=taught.reduce((s,c)=>s+Number(c.duration||0),0);
  const movements=movementList().filter(m=>m.date<=end);
  const closing=movements.length?movements.at(-1).running:0;
  return {classes,payments,taught,generated,received,minutes,closing};
}

function setRoute(r){ route=r; $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.route===r)); render(); }
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>setRoute(b.dataset.route)));
$("#settingsBtn").addEventListener("click",openSettings);

function render(){
  $("#pageTitle").textContent=route==="home"?"Control de Clases":({classes:"Clases",payments:"Pagos",reports:"Reportes"}[route]||"Control de Clases");
  if(route==="home") renderHome();
  else if(route==="classes") renderClasses();
  else if(route==="payments") renderPayments();
  else renderReports();
}
function renderHome(){
  const wStart=mondayOf(today()), wEnd=sundayOf(today()), s=periodStats(wStart,wEnd), recent=movementList().slice().reverse().slice(0,5);
  $("#view").innerHTML=`
    <section class="hero"><div class="hero-label">Saldo pendiente</div><div class="balance">${money(currentBalance())}</div></section>
    <section class="grid">
      <div class="metric"><small>Horas esta semana</small><strong>${minutesLabel(s.minutes)}</strong></div>
      <div class="metric"><small>Generado</small><strong>${money(s.generated)}</strong></div>
      <div class="metric"><small>Recibido</small><strong>${money(s.received)}</strong></div>
    </section>
    <section class="actions"><button class="primary" id="quickClass">Registrar clase</button><button class="secondary" id="quickPayment">Registrar pago</button></section>
    <div class="section-title"><h2>Últimos movimientos</h2><button id="historyBtn">Ver historial</button></div>
    <section>${recent.length?recent.map(movementCard).join(""):`<div class="empty">Todavía no hay movimientos.</div>`}</section>`;
  $("#quickClass").onclick=()=>openClassForm(); $("#quickPayment").onclick=()=>openPaymentForm(); $("#historyBtn").onclick=openHistory;
}
function movementCard(m){
  const cls=m.amount>=0?"plus":"minus", sign=m.amount>=0?"+":"−";
  return `<div class="card"><div class="row"><div><strong>${escapeHtml(m.label)}</strong><div class="muted">${fmtDate(m.date)}</div></div><div style="text-align:right"><strong class="money ${cls}">${sign}${money(Math.abs(m.amount))}</strong><div class="muted">Saldo ${money(m.running)}</div></div></div></div>`;
}

function renderClasses(){
  let list=data.classes.slice().sort((a,b)=>(b.date+b.startTime).localeCompare(a.date+a.startTime));
  list=list.filter(c=>classFilters.status==="all"||c.status===classFilters.status)
           .filter(c=>classFilters.student==="all"||c.studentIds.includes(classFilters.student))
           .filter(c=>!classFilters.from||c.date>=classFilters.from)
           .filter(c=>!classFilters.to||c.date<=classFilters.to);
  const students=data.students.slice().sort((a,b)=>a.name.localeCompare(b.name));
  $("#view").innerHTML=`
    <div class="actions"><button class="primary" id="addClass">+ Registrar clase</button><button class="secondary" id="studentsBtn">Alumnos</button></div>
    <div class="card filter-card"><div class="form compact">
      <label>Estado<select id="classStatusFilter"><option value="all">Todos</option>${["impartida","cancelada","ausencia"].map(v=>`<option value="${v}" ${classFilters.status===v?"selected":""}>${capitalize(v)}</option>`).join("")}</select></label>
      <label>Alumno<select id="classStudentFilter"><option value="all">Todos</option>${students.map(s=>`<option value="${s.id}" ${classFilters.student===s.id?"selected":""}>${escapeHtml(s.name)}</option>`).join("")}</select></label>
      <div class="inline"><label>Desde<input id="classFrom" type="date" value="${classFilters.from}"></label><label>Hasta<input id="classTo" type="date" value="${classFilters.to}"></label></div>
      <button class="secondary" type="button" id="clearClassFilters">Limpiar filtros</button>
    </div></div>
    <div class="section-title"><h2>Historial de clases</h2><span class="muted">${list.length} registro(s)</span></div>
    <section>${list.length?list.map(classCard).join(""):`<div class="empty">No hay clases con estos filtros.</div>`}</section>`;
  $("#addClass").onclick=()=>openClassForm(); $("#studentsBtn").onclick=openStudents;
  $("#classStatusFilter").onchange=e=>{classFilters.status=e.target.value;renderClasses();};
  $("#classStudentFilter").onchange=e=>{classFilters.student=e.target.value;renderClasses();};
  $("#classFrom").onchange=e=>{classFilters.from=e.target.value;renderClasses();}; $("#classTo").onchange=e=>{classFilters.to=e.target.value;renderClasses();};
  $("#clearClassFilters").onclick=()=>{classFilters={status:"all",student:"all",from:"",to:""};renderClasses();};
  $$('[data-edit-class]').forEach(b=>b.onclick=()=>openClassForm(b.dataset.editClass)); $$('[data-del-class]').forEach(b=>b.onclick=()=>deleteClass(b.dataset.delClass));
}
function classCard(c){
  const end=classEndTime(c.startTime,c.duration);
  return `<div class="card"><div class="row"><div><strong>${escapeHtml(studentNames(c.studentIds))}</strong><div class="muted">${fmtDate(c.date)} · ${c.startTime}${end?`–${end}`:""} · ${c.duration} min</div></div><strong>${money(c.totalValue)}</strong></div><div class="row"><div><span class="pill">${capitalize(c.status)}</span>${c.studentIds.length>1?` <span class="pill">${c.studentIds.length} alumnos</span>`:""}</div><div class="list-actions"><button class="mini" data-edit-class="${c.id}">Editar</button><button class="mini" data-del-class="${c.id}">Eliminar</button></div></div></div>`;
}
function openClassForm(id){
  const c=id?data.classes.find(x=>x.id===id):null;
  const selectedInactive=new Set(c?.studentIds||[]);
  const visibleStudents=data.students.filter(s=>s.active!==false||selectedInactive.has(s.id)).sort((a,b)=>a.name.localeCompare(b.name));
  const defaultDur=Number(data.settings.defaultDuration||90), currentDur=Number(c?.duration||defaultDur);
  openModal(`
    <div class="modal-head"><h2>${c?"Editar":"Registrar"} clase</h2><button class="close-btn" value="cancel">×</button></div>
    <div class="form">
      <div class="inline"><label>Fecha<input id="cDate" type="date" value="${c?.date||today()}"></label><label>Hora de inicio<input id="cTime" type="time" value="${c?.startTime||""}" required></label></div>
      <label>Duración<select id="cDuration">${[60,90,120].map(v=>`<option value="${v}" ${currentDur===v?"selected":""}>${v} minutos</option>`).join("")}<option value="custom" ${![60,90,120].includes(currentDur)?"selected":""}>Otra duración</option></select></label>
      <label id="customDurationWrap" style="display:none">Minutos<input id="cDurationCustom" type="number" min="1" max="600" value="${![60,90,120].includes(currentDur)?currentDur:""}"></label>
      <label>Alumno(s)</label><input id="studentSearch" placeholder="Buscar alumno" autocomplete="off">
      <div class="multi-list" id="studentList">${visibleStudents.length?visibleStudents.map(s=>`<label class="check-row" data-name="${escapeAttr(s.name.toLowerCase())}"><input type="checkbox" value="${s.id}" ${c?.studentIds?.includes(s.id)?"checked":""}> ${escapeHtml(s.name)}${s.active===false?' <span class="muted">(inactivo)</span>':""}</label>`).join(""):`<div class="empty">Primero agrega alumnos.</div>`}</div>
      <label>Estado<select id="cStatus">${["impartida","cancelada","ausencia"].map(v=>`<option value="${v}" ${(c?.status||"impartida")===v?"selected":""}>${capitalize(v)}</option>`).join("")}</select></label>
      <label>Tipo de valor<select id="cBilling"><option value="total" ${c?.billingMode!=="perStudent"?"selected":""}>Valor total de la clase</option><option value="perStudent" ${c?.billingMode==="perStudent"?"selected":""}>Valor por alumno</option></select></label>
      <label>Valor base (USD)<input id="cBaseValue" type="number" min="0" step="0.01" inputmode="decimal" value="${c?.baseValue ?? suggestedRate(currentDur)}"></label>
      <label>Total de la clase (USD)<input id="cTotalValue" type="number" min="0" step="0.01" inputmode="decimal" value="${c?.totalValue ?? suggestedRate(currentDur)}"></label>
      <div class="banner" id="classHint"></div><button class="primary" type="button" id="saveClass">${c?"Guardar cambios":"Guardar clase"}</button>
    </div>`);
  const durationSel=$("#cDuration");
  function selectedDuration(){ return durationSel.value==="custom"?Number($("#cDurationCustom").value||0):Number(durationSel.value); }
  function syncDuration(){ $("#customDurationWrap").style.display=durationSel.value==="custom"?"grid":"none"; if(!c || selectedDuration()!==currentDur){const r=suggestedRate(selectedDuration()); if(r>0){$("#cBaseValue").value=r;$("#cTotalValue").value=r;}} recalc(); }
  function recalc(){
    const count=$$("#studentList input:checked").length, status=$("#cStatus").value, base=Number($("#cBaseValue").value||0);
    const suggested=status==="impartida"?($("#cBilling").value==="perStudent"?base*count:base):0;
    if(document.activeElement!==$("#cTotalValue")) $("#cTotalValue").value=suggested.toFixed(2);
    $("#classHint").textContent=status==="impartida"?`${count} alumno(s) · Total sugerido: ${money(suggested)}. El total puede modificarse.`:"Cancelada o ausencia: $0 por defecto. Puedes indicar un valor si corresponde.";
  }
  durationSel.onchange=syncDuration; $("#cDurationCustom").oninput=recalc; $("#studentSearch").oninput=e=>$$('.check-row',$("#studentList")).forEach(r=>r.style.display=r.dataset.name.includes(e.target.value.toLowerCase())?"flex":"none");
  $$("#studentList input").forEach(i=>i.onchange=recalc); $("#cBilling").onchange=recalc; $("#cBaseValue").oninput=recalc;
  $("#cStatus").onchange=()=>{if($("#cStatus").value!=="impartida"){$("#cBaseValue").value="0";$("#cTotalValue").value="0";} recalc();};
  $("#saveClass").onclick=()=>{
    const studentIds=$$("#studentList input:checked").map(i=>i.value), status=$("#cStatus").value, duration=selectedDuration(), total=Number($("#cTotalValue").value||0);
    if(!$("#cDate").value) return alert("Selecciona una fecha."); if(!$("#cTime").value) return alert("Ingresa la hora de inicio."); if(!studentIds.length) return alert("Selecciona al menos un alumno."); if(!duration||duration<1) return alert("Ingresa una duración válida."); if(status==="impartida"&&total<=0) return alert("Una clase impartida debe tener un valor mayor a $0.");
    const obj={id:id||uid("cls"),date:$("#cDate").value,startTime:$("#cTime").value,duration,studentIds,status,billingMode:$("#cBilling").value,baseValue:Number($("#cBaseValue").value||0),totalValue:total,updatedAt:new Date().toISOString()};
    if(id){ const idx=data.classes.findIndex(x=>x.id===id); data.classes[idx]={...data.classes[idx],...obj}; audit("editó","clase",id,`${fmtDate(obj.date)} · ${studentNames(obj.studentIds)} · ${money(obj.totalValue)}`); }
    else{ data.classes.push({...obj,createdAt:new Date().toISOString()}); audit("creó","clase",obj.id,`${fmtDate(obj.date)} · ${studentNames(obj.studentIds)} · ${money(obj.totalValue)}`); }
    closeModal(); saveData();
  };
  syncDuration(); if(c){ $("#cTotalValue").value=Number(c.totalValue||0).toFixed(2); }
}
function suggestedRate(duration){ return Number(data.settings.durationRates?.[String(duration)]||0); }
function deleteClass(id){
  const c=data.classes.find(x=>x.id===id); if(!c) return;
  if(confirm("¿Eliminar esta clase? El saldo y los reportes se recalcularán.")){ audit("eliminó","clase",id,`${fmtDate(c.date)} · ${studentNames(c.studentIds)} · ${money(c.totalValue)}`); data.classes=data.classes.filter(x=>x.id!==id); saveData(); }
}

function renderPayments(){
  const ps=data.payments.slice().sort((a,b)=>b.date.localeCompare(a.date));
  $("#view").innerHTML=`<div class="actions"><button class="primary" id="addPayment">+ Registrar pago</button><button class="secondary" id="historyFromPay">Historial</button></div><div class="section-title"><h2>Pagos recibidos</h2></div><section>${ps.length?ps.map(p=>`<div class="card"><div class="row"><div><strong>${money(p.amount)}</strong><div class="muted">${fmtDate(p.date)} · ${capitalize(p.method)}</div></div><div class="list-actions"><button class="mini" data-edit-pay="${p.id}">Editar</button><button class="mini" data-del-pay="${p.id}">Eliminar</button></div></div></div>`).join(""):`<div class="empty">Todavía no hay pagos registrados.</div>`}</section>`;
  $("#addPayment").onclick=()=>openPaymentForm(); $("#historyFromPay").onclick=openHistory; $$('[data-edit-pay]').forEach(b=>b.onclick=()=>openPaymentForm(b.dataset.editPay)); $$('[data-del-pay]').forEach(b=>b.onclick=()=>deletePayment(b.dataset.delPay));
}
function openPaymentForm(id){
  const p=id?data.payments.find(x=>x.id===id):null, prev=currentBalance()+(p?Number(p.amount||0):0);
  openModal(`<div class="modal-head"><h2>${p?"Editar":"Registrar"} pago</h2><button class="close-btn" value="cancel">×</button></div><div class="form"><label>Fecha<input id="pDate" type="date" value="${p?.date||today()}"></label><label>Monto recibido (USD)<input id="pAmount" type="number" min="0.01" step="0.01" inputmode="decimal" value="${p?.amount||""}"></label><label>Medio de pago<select id="pMethod">${["efectivo","transferencia","otro"].map(v=>`<option value="${v}" ${p?.method===v?"selected":""}>${capitalize(v)}</option>`).join("")}</select></label><label>Semana relacionada (opcional)<input id="pWeek" type="week" value="${p?.weekRef||""}"></label><div class="banner" id="paymentPreview">Saldo anterior: ${money(prev)}</div><button class="primary" type="button" id="savePayment">Guardar pago</button></div>`);
  const preview=()=>$("#paymentPreview").textContent=`Saldo anterior: ${money(prev)} · Pago: ${money(Number($("#pAmount").value||0))} · Nuevo saldo: ${money(prev-Number($("#pAmount").value||0))}`; $("#pAmount").oninput=preview; preview();
  $("#savePayment").onclick=()=>{ const amount=Number($("#pAmount").value||0); if(!$("#pDate").value)return alert("Selecciona una fecha."); if(amount<=0)return alert("Ingresa un monto válido."); const obj={id:id||uid("pay"),date:$("#pDate").value,amount,method:$("#pMethod").value,weekRef:$("#pWeek").value,updatedAt:new Date().toISOString()}; if(id){const idx=data.payments.findIndex(x=>x.id===id);data.payments[idx]={...data.payments[idx],...obj};audit("editó","pago",id,`${fmtDate(obj.date)} · ${money(amount)}`);}else{data.payments.push({...obj,createdAt:new Date().toISOString()});audit("creó","pago",obj.id,`${fmtDate(obj.date)} · ${money(amount)}`);} closeModal();saveData(); };
}
function deletePayment(id){ const p=data.payments.find(x=>x.id===id); if(!p)return; if(confirm("¿Eliminar este pago? El saldo se recalculará.")){audit("eliminó","pago",id,`${fmtDate(p.date)} · ${money(p.amount)}`);data.payments=data.payments.filter(x=>x.id!==id);saveData();} }

function renderReports(){
  const currentWeek=mondayOf(today()), currentMonth=today().slice(0,7);
  $("#view").innerHTML=`
    <div class="card"><div class="section-title" style="margin-top:0"><h2>Reporte semanal</h2></div><label>Semana<input id="reportWeek" type="date" value="${currentWeek}"></label><div id="weekReportBody"></div><div class="actions"><button class="secondary" id="weekDetail">Ver detalle</button><button class="primary" id="weekPdf">Crear PDF</button></div></div>
    <div class="card"><div class="section-title" style="margin-top:0"><h2>Reporte mensual</h2></div><label>Mes<input id="reportMonth" type="month" value="${currentMonth}"></label><div id="monthReportBody"></div><div class="actions"><button class="secondary" id="monthDetail">Ver detalle</button><button class="primary" id="monthPdf">Crear PDF</button></div></div>
    <div class="section-title"><h2>Generado últimos 6 meses</h2></div><canvas id="chart" width="700" height="200"></canvas>`;
  function refreshWeek(){ const start=mondayOf($("#reportWeek").value||today()),end=sundayOf(start),s=periodStats(start,end); $("#weekReportBody").innerHTML=`<div class="muted" style="margin-top:8px">${fmtDate(start)} – ${fmtDate(end)}</div>${reportSummary(s)}`; $("#weekDetail").onclick=()=>openReportDetail(start,end,"Reporte semanal"); $("#weekPdf").onclick=()=>printReport(start,end,"semanal"); }
  function refreshMonth(){ const {start,end}=monthBounds($("#reportMonth").value),s=periodStats(start,end); $("#monthReportBody").innerHTML=`<div class="muted" style="margin-top:8px">${safeDate(start).toLocaleDateString("es-EC",{month:"long",year:"numeric"})}</div>${reportSummary(s)}`; $("#monthDetail").onclick=()=>openReportDetail(start,end,"Reporte mensual"); $("#monthPdf").onclick=()=>printReport(start,end,"mensual"); }
  $("#reportWeek").onchange=refreshWeek; $("#reportMonth").onchange=refreshMonth; refreshWeek(); refreshMonth(); drawChart();
}
function reportSummary(s){ return `<div class="report-summary" style="margin-top:12px"><div class="metric"><small>Horas trabajadas</small><strong>${minutesLabel(s.minutes)}</strong></div><div class="metric"><small>Generado</small><strong>${money(s.generated)}</strong></div><div class="metric"><small>Recibido</small><strong>${money(s.received)}</strong></div><div class="metric"><small>Saldo al cierre</small><strong>${money(s.closing)}</strong></div></div>`; }
function openReportDetail(start,end,title){
  const s=periodStats(start,end), rows=s.classes.slice().sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime));
  const section=(status,label)=>{const r=rows.filter(c=>c.status===status);return `<div class="section-title"><h2>${label}</h2><span class="muted">${r.length}</span></div>${r.length?r.map(classCard).join(""):`<div class="empty">Sin registros.</div>`}`;};
  openModal(`<div class="modal-head"><h2>${title}</h2><button class="close-btn" value="cancel">×</button></div><div class="muted">${fmtDate(start)} – ${fmtDate(end)}</div>${reportSummary(s)}${section("impartida","Clases impartidas")}${section("cancelada","Canceladas")}${section("ausencia","Ausencias")}<div class="section-title"><h2>Pagos</h2></div>${s.payments.length?s.payments.map(p=>`<div class="card"><div class="row"><span>${fmtDate(p.date)} · ${capitalize(p.method)}</span><strong>${money(p.amount)}</strong></div></div>`).join(""):`<div class="empty">Sin pagos en el período.</div>`}`);
}
function drawChart(){
  const c=$("#chart"); if(!c)return; const ctx=c.getContext("2d"),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);const months=[],d=new Date();d.setDate(1);for(let i=5;i>=0;i--){const x=new Date(d);x.setMonth(x.getMonth()-i);months.push(`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}`);}const vals=months.map(k=>data.classes.filter(c=>c.date.startsWith(k)).reduce((s,c)=>s+classValue(c),0)),max=Math.max(...vals,1),pad=36,bw=(w-pad*2)/months.length*.55;ctx.font="12px -apple-system";ctx.textAlign="center";months.forEach((m,i)=>{const x=pad+(i+.5)*(w-pad*2)/months.length,bh=(h-60)*(vals[i]/max),y=h-28-bh;ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();ctx.fillRect(x-bw/2,y,bw,bh);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();ctx.fillText(m.slice(5),x,h-10);ctx.fillText(`$${Math.round(vals[i])}`,x,y-6);});
}
function printReport(start,end,type){
  const s=periodStats(start,end), classes=s.classes.slice().sort((a,b)=>(a.date+a.startTime).localeCompare(b.date+b.startTime));
  const rowsFor=status=>classes.filter(c=>c.status===status).map(c=>`<tr><td>${fmtDate(c.date)}</td><td>${escapeHtml(c.startTime)}</td><td>${escapeHtml(classEndTime(c.startTime,c.duration))}</td><td>${c.duration} min</td><td>${escapeHtml(studentNames(c.studentIds))}</td><td>${money(c.totalValue)}</td></tr>`).join("");
  const table=(title,status)=>`<h2>${title}</h2><table><thead><tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Duración</th><th>Alumno(s)</th><th>Valor</th></tr></thead><tbody>${rowsFor(status)||'<tr><td colspan="6">Sin registros.</td></tr>'}</tbody></table>`;
  const paymentRows=s.payments.map(p=>`<tr><td>${fmtDate(p.date)}</td><td>${capitalize(p.method)}</td><td>${money(p.amount)}</td></tr>`).join("");
  const html=`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Reporte ${type}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#111;padding:28px;max-width:900px;margin:auto}h1{margin:0;font-size:24px}h2{font-size:16px;margin-top:26px}.sub{color:#555;margin-top:5px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}.box{border:1px solid #ddd;border-radius:10px;padding:12px}.box span{display:block;color:#666;font-size:12px}.box strong{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #ddd;padding:8px 5px;text-align:left}th{color:#555}@media print{body{padding:0}.no-print{display:none}}@media(max-width:650px){.summary{grid-template-columns:1fr 1fr}}</style></head><body><h1>${escapeHtml(data.settings.ownerName||"Matías Montoya")}</h1><div class="sub">Reporte ${type} de clases · ${fmtDate(start)} – ${fmtDate(end)}</div><div class="summary"><div class="box"><span>Horas trabajadas</span><strong>${minutesLabel(s.minutes)}</strong></div><div class="box"><span>Generado</span><strong>${money(s.generated)}</strong></div><div class="box"><span>Recibido</span><strong>${money(s.received)}</strong></div><div class="box"><span>Saldo al cierre</span><strong>${money(s.closing)}</strong></div></div>${table("Clases impartidas","impartida")}${table("Clases canceladas","cancelada")}${table("Ausencias","ausencia")}<h2>Pagos recibidos</h2><table><thead><tr><th>Fecha</th><th>Medio</th><th>Monto</th></tr></thead><tbody>${paymentRows||'<tr><td colspan="3">Sin pagos.</td></tr>'}</tbody></table><p class="no-print" style="margin-top:28px;color:#555">En iPhone, usa la opción de impresión/compartir para guardar o enviar el reporte como PDF.</p><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`;
  const w=window.open("","_blank"); if(!w)return alert("Safari bloqueó la ventana del reporte. Permite ventanas emergentes para esta app e inténtalo otra vez."); w.document.open();w.document.write(html);w.document.close();
}

function openStudents(){
  const rows=data.students.slice().sort((a,b)=>a.name.localeCompare(b.name));
  openModal(`<div class="modal-head"><h2>Alumnos</h2><button class="close-btn" value="cancel">×</button></div><div class="form"><label>Nuevo alumno<input id="newStudent" placeholder="Nombre" autocomplete="off"></label><button class="primary" type="button" id="addStudentBtn">Agregar</button></div><div class="section-title"><h2>Listado</h2></div>${rows.length?rows.map(s=>`<div class="card"><div class="row"><div><strong>${escapeHtml(s.name)}</strong><div class="muted">${s.active!==false?"Activo":"Inactivo"}</div></div><div class="list-actions"><button class="mini" data-toggle-st="${s.id}">${s.active!==false?"Desactivar":"Activar"}</button><button class="mini" data-edit-st="${s.id}">Editar</button></div></div></div>`).join(""):`<div class="empty">No hay alumnos registrados.</div>`}`);
  $("#addStudentBtn").onclick=()=>{const name=$("#newStudent").value.trim();if(!name)return;if(data.students.some(s=>s.name.toLowerCase()===name.toLowerCase()))return alert("Ese alumno ya está registrado.");const s={id:uid("stu"),name,active:true};data.students.push(s);audit("creó","alumno",s.id,name);closeModal();saveData();openStudents();};
  $$('[data-toggle-st]').forEach(b=>b.onclick=()=>{const s=data.students.find(x=>x.id===b.dataset.toggleSt);s.active=s.active===false; audit(s.active?"activó":"desactivó","alumno",s.id,s.name);closeModal();saveData();openStudents();});
  $$('[data-edit-st]').forEach(b=>b.onclick=()=>{const s=data.students.find(x=>x.id===b.dataset.editSt),n=prompt("Nombre del alumno",s.name);if(n?.trim()){const before=s.name;s.name=n.trim();audit("editó","alumno",s.id,`${before} → ${s.name}`);closeModal();saveData();openStudents();}});
}

function openHistory(){
  let list=movementList();
  list=list.filter(m=>historyFilters.type==="all"||m.type===historyFilters.type).filter(m=>!historyFilters.from||m.date>=historyFilters.from).filter(m=>!historyFilters.to||m.date<=historyFilters.to);
  if(historySort==="desc")list=list.slice().reverse();
  openModal(`<div class="modal-head"><h2>Historial</h2><button class="close-btn" value="cancel">×</button></div><div class="form compact"><label>Tipo<select id="historyType"><option value="all">Todos</option><option value="class" ${historyFilters.type==="class"?"selected":""}>Clases</option><option value="payment" ${historyFilters.type==="payment"?"selected":""}>Pagos</option><option value="adjustment" ${historyFilters.type==="adjustment"?"selected":""}>Ajustes</option><option value="initial" ${historyFilters.type==="initial"?"selected":""}>Saldo inicial</option></select></label><div class="inline"><label>Desde<input id="historyFrom" type="date" value="${historyFilters.from}"></label><label>Hasta<input id="historyTo" type="date" value="${historyFilters.to}"></label></div><div class="actions" style="margin:0"><button class="secondary" type="button" id="sortHistory">${historySort==="desc"?"Más recientes primero":"Más antiguos primero"}</button><button class="secondary" type="button" id="clearHistoryFilters">Limpiar</button></div></div><div style="margin-top:12px">${list.length?list.map(movementCard).join(""):`<div class="empty">Sin movimientos con estos filtros.</div>`}</div>`);
  $("#historyType").onchange=e=>{historyFilters.type=e.target.value;closeModal();openHistory();}; $("#historyFrom").onchange=e=>{historyFilters.from=e.target.value;closeModal();openHistory();}; $("#historyTo").onchange=e=>{historyFilters.to=e.target.value;closeModal();openHistory();}; $("#sortHistory").onclick=()=>{historySort=historySort==="desc"?"asc":"desc";closeModal();openHistory();}; $("#clearHistoryFilters").onclick=()=>{historyFilters={type:"all",from:"",to:""};closeModal();openHistory();};
}

function openSettings(){
  openModal(`<div class="modal-head"><h2>Configuración</h2><button class="close-btn" value="cancel">×</button></div><div class="form"><label>Nombre para reportes<input id="sOwner" value="${escapeAttr(data.settings.ownerName)}"></label><label>Duración habitual<select id="sDuration">${[60,90,120].map(v=>`<option value="${v}" ${Number(data.settings.defaultDuration)===v?"selected":""}>${v} minutos</option>`).join("")}</select></label><div class="inline"><label>Tarifa 60 min<input id="r60" type="number" min="0" step="0.01" value="${data.settings.durationRates["60"]||0}"></label><label>Tarifa 90 min<input id="r90" type="number" min="0" step="0.01" value="${data.settings.durationRates["90"]||0}"></label></div><label>Tarifa 120 min<input id="r120" type="number" min="0" step="0.01" value="${data.settings.durationRates["120"]||0}"></label><div class="inline"><label>Saldo inicial<input id="sInitial" type="number" step="0.01" value="${data.settings.initialBalance||0}" ${data.settings.initialBalanceLocked?"disabled":""}></label><label>Fecha saldo inicial<input id="sInitialDate" type="date" value="${data.settings.initialBalanceDate||today()}" ${data.settings.initialBalanceLocked?"disabled":""}></label></div>${data.settings.initialBalanceLocked?`<div class="banner">El saldo inicial está bloqueado. Para corregir la cuenta usa un ajuste.</div>`:""}<button class="primary" type="button" id="saveSettings">Guardar configuración</button><button class="secondary" type="button" id="addAdjustment">Registrar ajuste</button><button class="secondary" type="button" id="auditBtn">Historial de cambios</button><button class="secondary" type="button" id="backupBtn">Exportar respaldo</button><label class="secondary file-button">Restaurar respaldo<input id="restoreInput" type="file" accept="application/json"></label></div>`);
  $("#saveSettings").onclick=()=>{data.settings.ownerName=$("#sOwner").value.trim()||"Matías Montoya";data.settings.defaultDuration=Number($("#sDuration").value);data.settings.durationRates={"60":$("#r60").value,"90":$("#r90").value,"120":$("#r120").value};if(!data.settings.initialBalanceLocked){data.settings.initialBalance=Number($("#sInitial").value||0);data.settings.initialBalanceDate=$("#sInitialDate").value||today();data.settings.initialBalanceLocked=true;audit("configuró","saldo inicial","initial",`${fmtDate(data.settings.initialBalanceDate)} · ${money(data.settings.initialBalance)}`);}closeModal();saveData();};
  $("#addAdjustment").onclick=openAdjustment; $("#auditBtn").onclick=openAuditLog; $("#backupBtn").onclick=exportBackup; $("#restoreInput").onchange=restoreBackup;
}
function openAdjustment(){ closeModal();openModal(`<div class="modal-head"><h2>Registrar ajuste</h2><button class="close-btn" value="cancel">×</button></div><div class="form"><label>Fecha<input id="aDate" type="date" value="${today()}"></label><label>Monto (+ o −)<input id="aAmount" type="number" step="0.01" inputmode="decimal" placeholder="Ej. 10 o -5"></label><button class="primary" type="button" id="saveAdj">Guardar ajuste</button></div>`);$("#saveAdj").onclick=()=>{const amount=Number($("#aAmount").value||0);if(!amount)return alert("Ingresa un ajuste distinto de cero.");const a={id:uid("adj"),date:$("#aDate").value,amount,createdAt:new Date().toISOString()};data.adjustments.push(a);audit("creó","ajuste",a.id,`${fmtDate(a.date)} · ${money(amount)}`);closeModal();saveData();}; }
function openAuditLog(){ closeModal(); const logs=data.auditLog.slice().reverse(); openModal(`<div class="modal-head"><h2>Historial de cambios</h2><button class="close-btn" value="cancel">×</button></div>${logs.length?logs.map(l=>`<div class="card"><strong>${capitalize(l.action)} ${escapeHtml(l.entity)}</strong><div>${escapeHtml(l.summary||"")}</div><div class="muted">${new Date(l.at).toLocaleString("es-EC")}</div></div>`).join(""):`<div class="empty">Todavía no hay cambios registrados.</div>`}`); }
function exportBackup(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`control-clases-respaldo-${today()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000); }
function restoreBackup(e){ const f=e.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const obj=normalizeData(JSON.parse(reader.result));if(!obj.settings||!Array.isArray(obj.classes)||!Array.isArray(obj.payments)||!Array.isArray(obj.students))throw new Error();if(confirm("Esto reemplazará todos los datos actuales. ¿Continuar?")){data=obj;audit("restauró","respaldo","backup",f.name);closeModal();saveData();}}catch(err){alert("El archivo no parece ser un respaldo válido.");console.error(err);}};reader.readAsText(f); }

function openModal(html){ $("#modalCard").innerHTML=html; $("#modal").showModal(); }
function closeModal(){ if($("#modal").open) $("#modal").close(); }

if("serviceWorker" in navigator){ window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(e=>console.warn("SW",e))); }
render();
