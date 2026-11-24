let cur = null, draft = null, nextId = 10, actx = null;
const audio = new Audio();
audio.preload = 'metadata';

/* ====== RENDER ====== */
const NAV = [
  {id:'inicio', label:'Inicio', icon:'home'},
  {id:'episodios', label:'Episodios', icon:'list'},
  {id:'trabajo', label:'Trabajo Escolar', icon:'school'},
  {id:'biblioteca', label:'Biblioteca', icon:'lib'}
];
function buildNav(){
  const html = NAV.map(n => `<button data-nav="${n.id}" class="nav-btn flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition whitespace-nowrap">${I(n.icon)}<span class="text-sm font-medium">${n.label}</span></button>`).join('');
  $('#nav-desktop').innerHTML = html;
  $('#nav-mobile').innerHTML = html;
}
function card(ep){
  const has = !!ep.audio;
  return `<article class="card group bg-[#181818] rounded-xl p-4 rise">
    <div class="relative aspect-square rounded-lg overflow-hidden mb-4 shadow-lg">
      <img src="${ep.cover}" alt="" class="cover-img w-full h-full object-cover">
      <button data-act="play" data-id="${ep.id}" title="Reproducir" class="${has ? '' : 'hide'} absolute right-3 bottom-3 w-12 h-12 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 transition duration-300">${I('play','w-5 h-5')}</button>
    </div>
    <p class="text-xs text-gray-400 mb-1">Episodio ${ep.num} · ${ep.date}</p>
    <h3 class="font-semibold truncate">${esc(ep.title)}</h3>
    <p class="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">${esc(ep.desc)}</p>
    <div class="flex items-center gap-1 mt-3">
      <button data-act="edit" data-id="${ep.id}" title="Editar" class="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition">${I('edit','w-4 h-4')}</button>
      <button data-act="del" data-id="${ep.id}" title="Eliminar" class="p-2 rounded-full text-gray-300 hover:text-red-400 hover:bg-white/10 transition">${I('trash','w-4 h-4')}</button>
      ${has ? '' : '<span class="ml-auto text-xs text-amber-400">Sin audio</span>'}
    </div>
  </article>`;
}
function renderAll(){
  $('#pod-cover').src = podcast.cover;
  $('#pod-title').textContent = podcast.title;
  $('#pod-desc').textContent = podcast.desc;
  const sorted = [...episodes].sort((a,b) => b.num - a.num);
  const empty = '<p class="text-gray-400 col-span-full">Aún no hay episodios. Sube uno para empezar.</p>';
  $('#grid-recent').innerHTML = sorted.slice(0,4).map(card).join('') || empty;
  $('#grid-all').innerHTML = sorted.map(card).join('') || empty;
  $('#count').textContent = `${episodes.length} episodios`;
  $('#lib-list').innerHTML = sorted.map((ep,i) => `<div class="flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 transition">
      <span class="w-6 text-gray-400 text-sm">${i+1}</span>
      <img src="${ep.cover}" alt="" class="w-10 h-10 rounded object-cover">
      <div class="flex-1 min-w-0"><p class="truncate font-medium">${esc(ep.title)}</p><p class="text-xs text-gray-400">Ep. ${ep.num} · ${ep.date}</p></div>
      ${ep.audio ? `<button data-act="play" data-id="${ep.id}" class="p-2 rounded-full bg-[#1DB954] text-black hover:scale-110 transition">${I('play','w-4 h-4')}</button>` : ''}
      <button data-act="edit" data-id="${ep.id}" class="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full">${I('edit','w-4 h-4')}</button>
      <button data-act="del" data-id="${ep.id}" class="p-2 text-gray-300 hover:text-red-400 hover:bg-white/10 rounded-full">${I('trash','w-4 h-4')}</button>
    </div>`).join('') || empty;
  updatePlayerInfo();
}
function go(v){
  if (v === 'trabajo') return openProject();
  ['inicio','episodios','biblioteca'].forEach(x => $('#v-' + x).classList.toggle('hide', x !== v));
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === v));
  $('#main').scrollTop = 0;
}

/* ====== REPRODUCTOR ====== */
function bounds(){
  const lo = cur?.trim.s || 0;
  const hi = (cur?.trim.e) ?? (audio.duration || 0);
  return { lo, span: Math.max(0, hi - lo), hi };
}
function updatePlayerInfo(){
  if (!cur) return;
  $('#p-cover').src = cur.cover;
  $('#p-title').textContent = cur.title;
  $('#p-sub').textContent = `${podcast.title} · Ep. ${cur.num}`;
}
function resetPlayer(){
  $('#p-cover').removeAttribute('src');
  $('#p-title').textContent = 'Ningún episodio seleccionado';
  $('#p-sub').textContent = 'Elige un episodio para reproducir';
}
function updateProgress(){
  const { lo, span } = bounds();
  const t = Math.max(0, audio.currentTime - lo);
  $('#prog').value = span ? Math.min(1000, (t / span) * 1000) : 0;
  $('#t-cur').textContent = fmt(t);
  $('#t-dur').textContent = fmt(span);
}
function playEp(id){
  const ep = episodes.find(e => e.id == id);
  if (!ep || !ep.audio) return toast('Este episodio no tiene audio');
  if (cur && cur.id === ep.id) return togglePlay();
  cur = ep;
  audio.onloadedmetadata = () => { if (ep.trim.s) audio.currentTime = ep.trim.s; updateProgress(); };
  audio.src = ep.audio;
  audio.volume = ep.volume ?? 1;
  $('#vol').value = audio.volume;
  updatePlayerInfo();
  audio.play().catch(err => toast(err?.name === 'NotAllowedError' ? 'El navegador bloqueó el audio: pulsa Play de nuevo.' : 'No se pudo iniciar la reproducción.'));
}
function togglePlay(){
  if (!cur) {
    const first = [...episodes].sort((a,b) => a.num - b.num).find(e => e.audio);
    if (!first) return toast('Sube un audio primero');
    return playEp(first.id);
  }
  audio.paused ? audio.play().catch(() => {}) : audio.pause();
}
function skip(d){
  if (!cur) return;
  const { lo, hi } = bounds();
  audio.currentTime = Math.min(hi, Math.max(lo, audio.currentTime + d));
}
audio.onplay = audio.onpause = () => { $('#play-btn').innerHTML = I(audio.paused ? 'play' : 'pause', 'w-5 h-5'); };
audio.ontimeupdate = () => {
  if (cur && cur.trim.e != null && audio.currentTime >= cur.trim.e) { audio.pause(); audio.currentTime = cur.trim.s || 0; }
  updateProgress();
};
audio.onended = () => {
  const list = [...episodes].sort((a,b) => a.num - b.num).filter(e => e.audio);
  const i = list.findIndex(e => cur && e.id === cur.id);
  if (i >= 0 && i < list.length - 1) playEp(list[i+1].id);
};
audio.onerror = () => {
  const c = audio.error?.code;
  toast(c === 4
    ? 'No encuentro episodio-1.mp3. Debe estar en la misma carpeta que el HTML.'
    : 'No se pudo reproducir este audio.');
};

/* ====== EDITOR ====== */
function openEditor(id){
  const ep = id ? episodes.find(e => e.id == id) : null;
  draft = ep
    ? { ...ep, trim:{ ...ep.trim }, peaks:null, dur:0 }
    : { id:null, num:episodes.length + 1, title:'', desc:'', date:new Date().toISOString().slice(0,10),
        cover:svgCover('#8b5cf6','#1e1b4b','🎵'), audio:null, name:'', trim:{s:0,e:null}, volume:1, peaks:null, dur:0 };
  $('#ed-h').textContent = ep ? 'Editar episodio' : 'Subir episodio';
  $('#f-title').value = draft.title;
  $('#f-num').value = draft.num;
  $('#f-date').value = draft.date;
  $('#f-desc').value = draft.desc;
  $('#ed-cover').src = draft.cover;
  $('#vol-ed').value = draft.volume;
  $('#modal-editor').classList.remove('hide');
  resetWaveUI();
  if (draft.audio) analyze();
}
function closeModals(){
  $('#modal-editor').classList.add('hide');
  $('#modal-proj').classList.add('hide');
  $('#modal-pod').classList.add('hide');
  $('#modal-exp').classList.add('hide');
  draft = null;
}
function resetWaveUI(){
  $('#ed-audio-name').textContent = draft.name || (draft.audio ? 'Audio cargado' : 'Ningún archivo seleccionado');
  $('#wave-empty').classList.toggle('hide', !!draft.peaks);
  $('#wave').classList.toggle('hide', !draft.peaks);
  $('#cut-panel').classList.toggle('hide', !draft.peaks);
}
async function analyze(){
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const buf = await (await fetch(draft.audio)).arrayBuffer();
    const ab = await actx.decodeAudioData(buf);
    const d = ab.getChannelData(0), N = 160, step = Math.floor(d.length / N);
    draft.peaks = Array.from({length:N}, (_, i) => { let m = 0; for (let j = 0; j < step; j++) m = Math.max(m, Math.abs(d[i*step + j])); return m; });
    draft.dur = ab.duration;
  } catch (err) {
    draft.peaks = Array.from({length:160}, () => .1 + Math.random() * .6);
    draft.dur = draft.dur || 30;
    toast('Vista de onda simulada (formato no decodificable)');
  }
  setupCut();
}
function setupCut(){
  const dur = draft.dur || 1;
  $('#cut-s').value = Math.round((draft.trim.s / dur) * 1000);
  $('#cut-e').value = draft.trim.e == null ? 1000 : Math.round((draft.trim.e / dur) * 1000);
  resetWaveUI();
  updateCutInfo();
}
function updateCutInfo(){
  const dur = draft.dur || 0;
  let s = +$('#cut-s').value, e = +$('#cut-e').value;
  if (s > e) { if (document.activeElement?.id === 'cut-s') e = s; else s = e; $('#cut-s').value = s; $('#cut-e').value = e; }
  const a = s/1000*dur, b = e/1000*dur;
  $('#cut-info').textContent = `Selección: ${fmt(a)} – ${fmt(b)} (${fmt(b-a)})`;
  drawWave();
}
function drawWave(){
  if (!draft?.peaks) return;
  const c = $('#wave'), ctx = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = c.clientHeight;
  c.width = w * dpr; c.height = h * dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,w,h);
  const N = draft.peaks.length, bw = w / N, mid = h / 2;
  const s = +$('#cut-s').value / 1000, e = +$('#cut-e').value / 1000;
  draft.peaks.forEach((p, i) => {
    const f = i / N, inside = f >= s && f <= e;
    ctx.fillStyle = inside ? '#1DB954' : '#535353';
    const bh = Math.max(2, p * mid * .95);
    ctx.fillRect(i*bw + bw*.2, mid - bh, bw*.6, bh*2);
  });
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.fillRect(0, 0, s*w, h);
  ctx.fillRect(e*w, 0, w - e*w, h);
}
function applyCut(){
  if (!draft.dur) return;
  const s = +$('#cut-s').value / 1000 * draft.dur, e = +$('#cut-e').value / 1000 * draft.dur;
  if (e - s < .5) return toast('La selección es demasiado corta');
  draft.trim = { s, e: e >= draft.dur - .05 ? null : e };
  toast('Recorte aplicado al episodio');
  updateCutInfo();
}
function resetCut(){
  draft.trim = { s:0, e:null };
  setupCut();
}
function saveEditor(){
  const title = $('#f-title').value.trim();
  if (!title) return toast('Escribe un título');
  if (!draft.audio) return toast('Sube un archivo de audio');
  Object.assign(draft, {
    title, num: +$('#f-num').value || draft.num, date: $('#f-date').value,
    desc: $('#f-desc').value.trim(), volume: +$('#vol-ed').value
  });
  const { peaks, dur, ...rest } = draft;
  if (draft.id) {
    const ep = episodes.find(e => e.id === draft.id);
    if (cur && cur.id === ep.id && cur.audio !== ep.audio) { audio.pause(); cur = null; resetPlayer(); }
    Object.assign(ep, rest);
  } else {
    episodes.push({ ...rest, id: nextId++ });
  }
  closeModals();
  renderAll();
  toast('Episodio guardado');
}
function removeEp(id){
  const i = episodes.findIndex(e => e.id == id);
  if (i < 0) return;
  if (cur && cur.id == id) { audio.pause(); audio.removeAttribute('src'); audio.load(); cur = null; resetPlayer(); }
  const [ep] = episodes.splice(i, 1);
  renderAll();
  toast(`"${ep.title}" eliminado`);
}

/* ====== PROYECTO ====== */
let projEdit = false;
const field = (l, id, v) => `<label class="flex flex-col gap-1 text-xs text-gray-400">${l}<input id="${id}" value="${esc(v)}" class="bg-[#282828] rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#1DB954]"></label>`;
const area = (l, id, v, r = 3) => `<label class="flex flex-col gap-1 text-xs text-gray-400">${l}<textarea id="${id}" rows="${r}" class="bg-[#282828] rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-[#1DB954]">${esc(v)}</textarea></label>`;
function openProject(){ projEdit = false; renderProject(); $('#modal-proj').classList.remove('hide'); }
function renderProject(){
  const P = PROJECT, btn = $('#proj-head-btn');
  btn.textContent = projEdit ? 'Cancelar' : 'Editar';
  btn.dataset.act = projEdit ? 'proj-cancel' : 'proj-edit';
  if (projEdit) {
    $('#proj-body').innerHTML = `<div class="grid gap-4">
      ${field('Título del proyecto', 'p-titulo', P.titulo)}
      <div class="grid md:grid-cols-2 gap-4">${field('Materia', 'p-materia', P.materia)}${field('Curso / grado', 'p-curso', P.curso)}</div>
      ${area('Integrantes (uno por línea)', 'p-integrantes', P.integrantes.join('\n'), 3)}
      ${area('Objetivo del podcast', 'p-objetivo', P.objetivo, 4)}
      ${area('Temas abordados (uno por línea)', 'p-temas', P.temas.join('\n'), 4)}
      <div class="flex justify-end"><button data-act="proj-save" class="px-6 py-2 rounded-full bg-[#1DB954] text-black font-bold hover:scale-105 transition">Guardar datos</button></div>
    </div>`;
    return;
  }
  $('#proj-body').innerHTML = `
    <div>
      <p class="text-xs uppercase tracking-widest text-[#1DB954] font-bold">${esc(P.materia)} · ${esc(P.curso)}</p>
      <h3 class="text-2xl font-extrabold mt-1">${esc(P.titulo)}</h3>
    </div>
    <div>
      <h4 class="font-semibold mb-2">Integrantes del equipo</h4>
      <div class="flex flex-wrap gap-2">${P.integrantes.map(n => `<span class="px-3 py-1 rounded-full bg-[#282828] text-sm">${esc(n)}</span>`).join('')}</div>
    </div>
    <div>
      <h4 class="font-semibold mb-2">Objetivo del podcast</h4>
      <p class="text-gray-300 text-sm leading-relaxed">${esc(P.objetivo)}</p>
    </div>
    <div>
      <h4 class="font-semibold mb-2">Temas abordados</h4>
      <ol class="space-y-2">${P.temas.map((t,i) => `<li class="flex gap-3 text-sm bg-[#202020] rounded-lg p-3"><span class="text-[#1DB954] font-bold">${i+1}</span><span>${esc(t)}</span></li>`).join('')}</ol>
    </div>`;
}
function saveProject(){
  const t = $('#p-titulo').value.trim();
  if (!t) return toast('El título no puede estar vacío');
  const lines = id => $(id).value.split('\n').map(x => x.trim()).filter(Boolean);
  PROJECT = {
    titulo: t, materia: $('#p-materia').value.trim(), curso: $('#p-curso').value.trim(),
    integrantes: lines('#p-integrantes'), objetivo: $('#p-objetivo').value.trim(), temas: lines('#p-temas')
  };
  projEdit = false;
  renderProject();
  toast('Datos del trabajo guardados');
}
function openPodEdit(){
  $('#pod-t-in').value = podcast.title;
  $('#pod-d-in').value = podcast.desc;
  $('#modal-pod').classList.remove('hide');
}
function savePod(){
  const t = $('#pod-t-in').value.trim();
  if (!t) return toast('Escribe un nombre para el podcast');
  podcast.title = t;
  podcast.desc = $('#pod-d-in').value.trim();
  closeModals();
  renderAll();
  toast('Podcast actualizado');
}

/* ====== GUARDADO LOCAL ====== */
const STORE_KEY = 'mi-podcast-escolar-v2';
const DEMO_FREQ = {1:220, 2:330, 3:262};
function snapshot(){
  return {
    version: 1, podcast, project: PROJECT, nextId,
    episodes: episodes.map(e => {
      const demo = (e.id in DEMO_FREQ) && String(e.audio).startsWith('blob:');
      return { ...e, demo, audio: demo ? null : e.audio };
    })
  };
}
function applySnapshot(d){
  if (!Array.isArray(d.episodes)) throw new Error('Formato no válido');
  podcast = d.podcast || podcast;
  PROJECT = d.project || PROJECT;
  nextId = d.nextId || nextId;
  episodes = d.episodes.map(e => ({ ...e, audio: e.demo ? demoAudio(DEMO_FREQ[e.id], 30) : e.audio }));
}
function saveLocal(){
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(snapshot()));
    toast('Cambios guardados en este navegador');
  } catch (err) {
    toast('No hay espacio en el navegador. Usa audios más pequeños o exporta el archivo.');
  }
}
function loadLocal(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) applySnapshot(JSON.parse(raw));
  } catch (err) { console.warn('No se pudo cargar lo guardado', err); }
}
async function exportData(){
  const json = JSON.stringify(snapshot());
  const name = (podcast.title.replace(/[^\w\-]+/g, '_') || 'podcast') + '.json';
  // Si la página se abre fuera de Claude (VS Code, doble clic en el archivo), descarga directa:
  if (!window.claude) {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return toast('Archivo exportado');
  }
  let dl = null;
  try { dl = await window.claude.use('downloads'); } catch (err) { console.warn(err); }
  if (!dl) return showExportFallback(json, 'La descarga directa no está disponible en esta vista.');
  try {
    await dl.save({ filename: name, data: json });
    toast('Archivo exportado');
  } catch (err) {
    if (err?.code === 'declined') return toast('Exportación cancelada');
    showExportFallback(json, 'No se pudo descargar automáticamente (' + (err?.code || 'error') + ').');
  }
}
function showExportFallback(json, msg){
  $('#exp-msg').textContent = msg + ' Copia el texto de abajo, pégalo en un archivo de texto y guárdalo con el nombre podcast.json.';
  $('#exp-text').value = json;
  $('#modal-exp').classList.remove('hide');
  $('#exp-text').select();
}
$('#f-import').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await readAs(f, 'readAsText'));
    audio.pause(); cur = null; resetPlayer();
    applySnapshot(d);
    renderAll();
    saveLocal();
    toast('Datos importados');
  } catch (err) {
    toast('El archivo no es válido');
  }
  e.target.value = '';
};

/* ====== EVENTOS ====== */
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) return go(nav.dataset.nav);
  const b = e.target.closest('[data-act]');
  if (!b) {
    if (e.target.id === 'modal-editor') closeModals();
    if (e.target.id === 'modal-proj' || e.target.id === 'modal-pod' || e.target.id === 'modal-exp') closeModals();
    return;
  }
  const { act, id } = b.dataset;
  const actions = {
    play: () => playEp(id),
    edit: () => openEditor(id),
    del: () => removeEp(id),
    new: () => openEditor(null),
    toggle: togglePlay,
    back: () => skip(-10),
    fwd: () => skip(10),
    'cover-podcast': () => $('#f-cover-pod').click(),
    'pick-cover': () => $('#f-cover-ep').click(),
    'pick-audio': () => $('#f-audio').click(),
    project: openProject,
    'edit-pod': openPodEdit,
    'save-pod': savePod,
    'save-local': saveLocal,
    export: exportData,
    'exp-select': () => { $('#exp-text').focus(); $('#exp-text').select(); },
    import: () => $('#f-import').click(),
    'proj-edit': () => { projEdit = true; renderProject(); },
    'proj-cancel': () => { projEdit = false; renderProject(); },
    'proj-save': saveProject,
    'close-editor': closeModals,
    'close-proj': closeModals,
    save: saveEditor,
    'cut-apply': applyCut,
    'cut-reset': resetCut
  };
  actions[act]?.();
});
$('#f-cover-pod').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  podcast.cover = await readAs(f);
  e.target.value = '';
  renderAll();
  toast('Portada del podcast actualizada');
};
$('#f-cover-ep').onchange = async e => {
  const f = e.target.files[0]; if (!f || !draft) return;
  draft.cover = await readAs(f);
  $('#ed-cover').src = draft.cover;
  e.target.value = '';
};
$('#f-audio').onchange = async e => {
  const f = e.target.files[0]; if (!f || !draft) return;
  draft.audio = await readAs(f);
  draft.name = f.name;
  draft.trim = { s:0, e:null };
  draft.peaks = null;
  if (!$('#f-title').value.trim()) $('#f-title').value = f.name.replace(/\.[^.]+$/, '');
  e.target.value = '';
  resetWaveUI();
  await analyze();
};
$('#cut-s').oninput = updateCutInfo;
$('#cut-e').oninput = updateCutInfo;
$('#vol-ed').oninput = e => { if (draft) draft.volume = +e.target.value; };
$('#prog').oninput = e => {
  const { lo, span } = bounds();
  if (cur) audio.currentTime = lo + (e.target.value / 1000) * span;
};
$('#vol').oninput = e => { audio.volume = +e.target.value; if (cur) cur.volume = audio.volume; };
window.addEventListener('resize', () => { if (draft?.peaks) drawWave(); });

/* ====== INICIO ====== */
loadLocal();
buildNav();
$$('[data-i]').forEach(el => el.innerHTML = I(el.dataset.i, el.dataset.c || 'w-5 h-5'));
renderAll();
go('inicio');
