// Auto-generated from admin-super.html inline scripts
// Del 6 – del 2/6: Tab logic
    (function(){
      const TAB_MAP = [
        { btn:'[data-tab="branding"]',  panel:'#tab-branding' },
        { btn:'[data-tab="lang"]',      panel:'#tab-lang' },
        { btn:'[data-tab="users"]',     panel:'#tab-users' },
        { btn:'[data-tab="pages"]',     panel:'#tab-pages' },
        { btn:'[data-tab="stripe"]',    panel:'#tab-stripe' },
        { btn:'[data-tab="orders"]',    panel:'#tab-orders' },
        { btn:'[data-tab="nfc"]',       panel:'#tab-nfc' },
        { btn:'[data-tab="seo"]',       panel:'#tab-seo' },
        { btn:'[data-tab="settings"]',  panel:'#tab-settings' }
      ];

      const qs = (sel, root=document) => root.querySelector(sel);
      const qsa = (sel, root=document) => [...root.querySelectorAll(sel)];
      const panels = TAB_MAP.map(t => qs(t.panel)).filter(Boolean);
      const buttons = TAB_MAP.map(t => qs(t.btn)).filter(Boolean);

      function activateTab(key, pushHash=true){
        const entry = TAB_MAP.find(t => qs(t.btn)?.dataset.tab === key);
        if(!entry){ return; }
        buttons.forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === key)));
        panels.forEach(p => p.classList.add('hidden'));
        qs(entry.panel)?.classList.remove('hidden');
        if(pushHash){
          const url = new URL(location.href);
          url.hash = key;
          history.replaceState(null, '', url);
        }
      }

      qsa('.tab-btn').forEach(btn => {
        if(btn.getAttribute('role') === 'tab'){
          btn.addEventListener('click', () => activateTab(btn.dataset.tab));
        }
      });

      const userBadge = qs('#userBadge');
      try {
        const name = localStorage.getItem('nfcking.userName');
        const role = localStorage.getItem('nfcking.role');
        if(name || role){
          userBadge.textContent = [name, role ? `(${role})` : ''].filter(Boolean).join(' ');
        }
      } catch(_) {}

      function focusPanelHeader(panelSel){
        const h = qs(panelSel + ' h2');
        if(h){ h.setAttribute('tabindex','-1'); h.focus({preventScroll:false}); }
      }
      const _activate = activateTab;
      activateTab = function(key, pushHash=true){
        _activate(key, pushHash);
        const entry = TAB_MAP.find(t => qs(t.btn)?.dataset.tab === key);
        if(entry){ focusPanelHeader(entry.panel); }
      };

      const initial = (location.hash || '').replace(/^#/, '') || 'branding';
      activateTab(initial, false);
      window.addEventListener('hashchange', () => {
        const key = (location.hash || '').replace(/^#/, '') || 'branding';
        activateTab(key, false);
      });
    })();
  

// Del 6 – del 3/6: Branding script
  (function(){
    const qs = (s, r=document)=>r.querySelector(s);
    const el = {
      primary: qs('#themePrimary'),
      secondary: qs('#themeSecondary'),
      bg: qs('#themeBg'),
      card: qs('#themeCard'),
      text: qs('#themeText'),
      muted: qs('#themeMuted'),
      radius: qs('#themeRadius'),
      mode: qs('#themeMode'),
      msg: qs('#brandMsg'),
      logoFile: qs('#logoFile'),
      logoImg: qs('#logoImg'),
      pvPrimary: qs('#pvPrimary'),
      pvBg: qs('#pvBg'),
    };

    const STORAGE_KEY = 'nfcking.theme.v1';
    const LOGO_KEY = 'nfcking.logoUrl';

    function applyTheme(t){
      const r = document.documentElement;
      if(!t) return;
      r.style.setProperty('--brand', t.primary || '#ff1a1a');
      r.style.setProperty('--bg',    t.bg      || '#0b0b10');
      r.style.setProperty('--card',  t.card    || '#12131a');
      r.style.setProperty('--text',  t.text    || '#e9eef5');
      r.style.setProperty('--muted', t.muted   || '#1a1c25');
      r.style.setProperty('--radius', (t.radius??16)+'px');
      document.body.dataset.theme = t.mode || 'dark';
      el.pvPrimary.textContent = t.primary;
      el.pvBg.textContent = t.bg;
    }

    function readForm(){
      return {
        primary:  el.primary.value,
        secondary:el.secondary.value,
        bg:       el.bg.value,
        card:     el.card.value,
        text:     el.text.value,
        muted:    el.muted.value,
        radius:   Number(el.radius.value || 16),
        mode:     el.mode.value
      };
    }

    function writeForm(t){
      if(!t) return;
      el.primary.value   = t.primary   || '#ff1a1a';
      el.secondary.value = t.secondary || '#111827';
      el.bg.value        = t.bg        || '#0b0b10';
      el.card.value      = t.card      || '#12131a';
      el.text.value      = t.text      || '#e9eef5';
      el.muted.value     = t.muted     || '#1a1c25';
      el.radius.value    = t.radius    ?? 16;
      el.mode.value      = t.mode      || 'dark';
    }

    function saveLocal(t){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
      el.msg.textContent = 'Tema lagret lokalt.';
    }

    function loadLocal(){
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
      catch{ return null; }
    }

    const initTheme = loadLocal();
    if(initTheme){ writeForm(initTheme); applyTheme(initTheme); }
    else { applyTheme(readForm()); }

    ['input','change'].forEach(evt=>{
      ['#themePrimary','#themeSecondary','#themeBg','#themeCard','#themeText','#themeMuted','#themeRadius','#themeMode']
        .forEach(sel => qs(sel).addEventListener(evt, ()=>applyTheme(readForm())));
    });

    qs('#btnSaveTheme').addEventListener('click', ()=> saveLocal(readForm()));
    qs('#btnResetTheme').addEventListener('click', ()=>{
      localStorage.removeItem(STORAGE_KEY);
      const def = {primary:'#ff1a1a',secondary:'#111827',bg:'#0b0b10',card:'#12131a',text:'#e9eef5',muted:'#1a1c25',radius:16,mode:'dark'};
      writeForm(def); applyTheme(def); el.msg.textContent = 'Tilbakestilt til standard.';
    });

    qs('#btnExportTheme').addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(readForm(), null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='nfcking-theme.json'; a.click();
      URL.revokeObjectURL(url);
    });
    qs('#importThemeFile').addEventListener('change', async (e)=>{
      const f = e.target.files?.[0]; if(!f) return;
      try{
        const txt = await f.text();
        const t = JSON.parse(txt);
        writeForm(t); applyTheme(t); saveLocal(t);
      }catch{ el.msg.textContent = 'Kunne ikke lese JSON.'; }
      e.target.value = '';
    });

    const uploadEndpoint = '/.netlify/functions/uploadLogo';
    async function uploadLogo(file){
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(uploadEndpoint, { method:'POST', body: fd });
      if(!res.ok) throw new Error('Upload feilet');
      const data = await res.json();
      return data.url || data.location || null;
    }

    const storedLogo = localStorage.getItem(LOGO_KEY);
    if(storedLogo){ el.logoImg.src = storedLogo; el.logoImg.style.display='block'; }

    qs('#btnUploadLogo').addEventListener('click', async ()=>{
      const f = el.logoFile.files?.[0];
      if(!f){ el.msg.textContent = 'Velg en logo-fil først.'; return; }
      el.msg.textContent = 'Laster opp logo …';
      try{
        const url = await uploadLogo(f);
        if(url){
          localStorage.setItem(LOGO_KEY, url);
          el.logoImg.src = url; el.logoImg.style.display='block';
          el.msg.textContent = 'Logo lastet opp.';
        } else {
          el.msg.textContent = 'Manglende URL i svar.';
        }
      }catch(err){
        el.msg.textContent = 'Opplasting feilet.';
      }
    });
  })();
  

// Del 6 – del 4/6: Språk script
  (function(){
    const qs=(s,r=document)=>r.querySelector(s);
    const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
    const STORAGE_KEY='nfcking.i18n.v1';
    const API={
      get:'/.netlify/functions/i18n-get',
      save:'/.netlify/functions/i18n-save',
    };

    const DEFAULT_KEYS={
      'app.title': { nb:'NFCKING administrasjon', en:'NFCKING administration' },
      'nav.home':  { nb:'Hjem', en:'Home' },
      'nav.order': { nb:'Bestill', en:'Order' },
      'nav.demo':  { nb:'Demo', en:'Demo' },
      'nav.superadmin': { nb:'Superadmin', en:'Superadmin' },
      'nav.cards': { nb:'Kort', en:'Cards' },
      'tab.branding': { nb:'Branding', en:'Branding' },
      'tab.lang': { nb:'Språk', en:'Languages' },
      'tab.users': { nb:'Brukere', en:'Users' },
      'tab.pages': { nb:'Sider', en:'Pages' },
      'tab.stripe': { nb:'Stripe', en:'Stripe' },
      'tab.orders': { nb:'Ordrer', en:'Orders' },
      'tab.nfc': { nb:'NFC-Batcher', en:'NFC batches' },
      'tab.seo': { nb:'SEO', en:'SEO' },
      'tab.settings': { nb:'System', en:'System' },
      'cta.login': { nb:'Logg inn', en:'Log in' },
      'cta.logout': { nb:'Logg ut', en:'Log out' },
      'cta.invite': { nb:'Send invitasjon', en:'Send invite' },
      'cta.save': { nb:'Lagre', en:'Save' },
      'cta.cancel': { nb:'Avbryt', en:'Cancel' },
      'cta.addLanguage': { nb:'Legg til språk', en:'Add language' },
      'cta.addKey': { nb:'Legg til nøkkel', en:'Add key' },
      'cta.export': { nb:'Eksporter', en:'Export' },
      'cta.import': { nb:'Importer', en:'Import' },
      'users.status.active': { nb:'Aktiv', en:'Active' },
      'users.status.disabled': { nb:'Deaktivert', en:'Disabled' },
      'users.role.viewer': { nb:'Leser', en:'Viewer' },
      'users.role.support': { nb:'Support', en:'Support' },
      'users.role.editor': { nb:'Redaktør', en:'Editor' },
      'users.role.admin': { nb:'Administrator', en:'Administrator' },
      'users.role.owner': { nb:'Eier', en:'Owner' },
      'users.role.superadmin': { nb:'Superadministrator', en:'Super administrator' },
      'lang.default': { nb:'Standardspråk', en:'Default language' },
      'lang.available': { nb:'Tilgjengelige språk', en:'Available languages' },
      'lang.key': { nb:'Nøkkel', en:'Key' },
      'lang.value': { nb:'Verdi', en:'Value' },
      'lang.search': { nb:'Søk i nøklene', en:'Search keys' },
      'lang.reset': { nb:'Tilbakestill', en:'Reset' },
      'lang.lastUpdated': { nb:'Sist oppdatert', en:'Last updated' },
      'status.loading': { nb:'Laster …', en:'Loading…' },
      'status.error': { nb:'Noe gikk galt', en:'Something went wrong' },
      'status.success': { nb:'Fullført', en:'Completed' }
    };

    function cloneDefaults(){
      return JSON.parse(JSON.stringify(DEFAULT_KEYS));
    }

    function defaultState(){
      return {
        defaultLang:'nb',
        langs:['nb','en'],
        data:cloneDefaults(),
      };
    }

    function sanitizeLang(code){
      if(code===null||code===undefined) return null;
      const trimmed=String(code).trim();
      if(!trimmed) return null;
      const cleaned=trimmed.toLowerCase().replace(/[^a-z0-9-]/g,'');
      if(!cleaned) return null;
      return cleaned.slice(0,12);
    }

    function sanitizeLangList(input){
      const set=new Set();
      const list=Array.isArray(input)?input:String(input||'').split(/[,\s]+/);
      list.forEach((entry)=>{
        const clean=sanitizeLang(entry);
        if(clean) set.add(clean);
      });
      return Array.from(set);
    }

    function sanitizeKey(key){
      if(key===null||key===undefined) return null;
      const trimmed=String(key).trim();
      if(!trimmed) return null;
      if(!/^[A-Za-z0-9_.-]+$/.test(trimmed)) return null;
      return trimmed;
    }

    function ensureKeyLanguages(map, langs){
      const result={};
      Object.entries(map||{}).forEach(([key,value])=>{
        const cleanKey=sanitizeKey(key);
        if(!cleanKey) return;
        const row={};
        langs.forEach((lang)=>{
          const raw=value && typeof value==='object'?value[lang]:'';
          row[lang]=typeof raw==='string'?raw:raw===null||raw===undefined?'':String(raw);
        });
        result[cleanKey]=row;
      });
      return result;
    }

    function normaliseState(input){
      if(!input||typeof input!=='object') return null;
      const langs=sanitizeLangList(input.langs||input.languages||[]);
      const defaultLang=sanitizeLang(input.defaultLang)||langs[0]||'nb';
      if(!langs.includes(defaultLang)) langs.unshift(defaultLang);
      const data=ensureKeyLanguages(input.data||input.keys||{}, langs.length?langs:['nb']);
      if(!Object.keys(data).length){
        return { defaultLang, langs: langs.length?langs:['nb'], data: cloneDefaults() };
      }
      return { defaultLang, langs: langs.length?langs:['nb'], data };
    }

    function loadCache(){
      try{
        const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
        return normaliseState(raw);
      }catch{
        return null;
      }
    }

    function saveCache(st){
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); }
      catch(_){ /* ignore */ }
    }

    const el={
      msg: qs('#i18nMsg'),
      def: qs('#i18nDefaultLang'),
      langs: qs('#i18nLangs'),
      table: qs('#i18nTable'),
      tbody: qs('#i18nTable tbody'),
      search: qs('#i18nSearch'),
      addKey: qs('#i18nAddKey'),
      save: qs('#i18nSave'),
      reset: qs('#i18nReset'),
      expJson: qs('#i18nExportJson'),
      expCsv: qs('#i18nExportCsv'),
      impJson: qs('#i18nImportJson'),
      impCsv: qs('#i18nImportCsv'),
    };

    let state=loadCache()||defaultState();
    let meta={ updatedAt:null, updatedBy:null, source:'cache' };
    let dirty=false;
    let loading=false;
    let dirtyNoticeShown=false;

    hydrateControls();
    renderTable();
    setMsg('Laster oversettelser …');
    fetchRemote(true);

    function setMsg(txt){ if(el.msg) el.msg.textContent=txt||''; }

    function formatDate(iso){
      if(!iso) return '';
      try{
        return new Date(iso).toLocaleString('no-NO',{ dateStyle:'short', timeStyle:'short' });
      }catch{
        return iso;
      }
    }

    function describeMeta(){
      const parts=[];
      if(meta.updatedAt) parts.push(`sist oppdatert ${formatDate(meta.updatedAt)}`);
      if(meta.updatedBy) parts.push(`av ${meta.updatedBy}`);
      return parts.join(' ');
    }

    function resetDirty(){
      dirty=false;
      dirtyNoticeShown=false;
    }

    function markDirty(message){
      dirty=true;
      saveCache(state);
      if(message){
        setMsg(message);
        dirtyNoticeShown=false;
        return;
      }
      if(!loading && !dirtyNoticeShown){
        setMsg('Endringer er lagret lokalt – trykk «Lagre» for å publisere.');
        dirtyNoticeShown=true;
      }
    }

    function ensureLangConsistency(){
      state.langs=sanitizeLangList(state.langs);
      if(!state.langs.length) state.langs=['nb'];
      state.defaultLang=sanitizeLang(state.defaultLang)||state.langs[0];
      if(!state.langs.includes(state.defaultLang)) state.langs.unshift(state.defaultLang);
      state.langs=Array.from(new Set(state.langs));
    }

    function ensureKeyCoverage(){
      ensureLangConsistency();
      const langs=state.langs;
      const current=state.data||{};
      const next={};
      Object.keys(current).forEach((key)=>{
        const cleanKey=sanitizeKey(key);
        if(!cleanKey) return;
        const base=current[key]&&typeof current[key]==='object'?{...current[key]}:{};
        langs.forEach((lang)=>{
          const raw=base[lang];
          base[lang]=typeof raw==='string'?raw:raw===null||raw===undefined?'':String(raw);
        });
        next[cleanKey]=base;
      });
      if(!Object.keys(next).length){
        state.data=cloneDefaults();
      }else{
        state.data=next;
      }
    }

    function hydrateControls(){
      ensureLangConsistency();
      if(el.def) el.def.value=state.defaultLang;
      if(el.langs) el.langs.value=state.langs.join(',');
    }

    function renderHeader(){
      qsa('th[data-lang]', el.table).forEach(th=>th.remove());
      const headRow=qs('thead tr', el.table);
      const actionTh=headRow?.lastElementChild;
      state.langs.forEach((lang)=>{
        const th=document.createElement('th');
        th.setAttribute('data-lang', lang);
        th.style.cssText='text-align:left;padding:8px;border-bottom:1px solid #222736;min-width:200px';
        th.textContent=lang;
        if(headRow && actionTh){ headRow.insertBefore(th, actionTh); }
        else if(headRow){ headRow.appendChild(th); }
      });
    }

    function renderTable(){
      ensureKeyCoverage();
      hydrateControls();
      renderHeader();
      const q=(el.search?.value||'').toLowerCase();
      const keys=Object.keys(state.data).sort();
      const rows=[];
      keys.forEach((key)=>{
        const obj=state.data[key]||{};
        const textBlob=[key].concat(state.langs.map((lang)=>obj[lang]||'')).join(' ').toLowerCase();
        if(q && !textBlob.includes(q)) return;

        const tr=document.createElement('tr');
        tr.setAttribute('data-key', key);

        const tdKey=document.createElement('td');
        tdKey.style.cssText='padding:8px;border-bottom:1px solid #1b2030;vertical-align:top';
        const keyInput=document.createElement('input');
        keyInput.type='text';
        keyInput.value=key;
        keyInput.style='width:100%';
        keyInput.addEventListener('change', ()=>{
          const currentKey=tr.getAttribute('data-key');
          const newKey=sanitizeKey(keyInput.value);
          if(!newKey){
            keyInput.value=currentKey||'';
            setMsg('Ugyldig nøkkel.');
            return;
          }
          if(newKey===currentKey) return;
          if(state.data[newKey]){
            keyInput.value=currentKey||'';
            setMsg('Nøkkel finnes allerede.');
            return;
          }
          state.data[newKey]=state.data[currentKey]||createLangMap('');
          delete state.data[currentKey];
          markDirty(`Endret nøkkel: ${currentKey} → ${newKey}`);
          renderTable();
        });
        tdKey.appendChild(keyInput);
        tr.appendChild(tdKey);

        state.langs.forEach((lang)=>{
          const td=document.createElement('td');
          td.style.cssText='padding:8px;border-bottom:1px solid #1b2030';
          const ta=document.createElement('textarea');
          ta.value=obj[lang]||'';
          ta.rows=2;
          ta.style='width:100%;font-family:system-ui,monospace';
          ta.style.border=ta.value?'1px solid #222736':'1px solid #ff6b6b';
          ta.addEventListener('input', ()=>{
            const currentKey=tr.getAttribute('data-key');
            if(!state.data[currentKey]) state.data[currentKey]=createLangMap('');
            state.data[currentKey][lang]=ta.value;
            ta.style.border=ta.value?'1px solid #222736':'1px solid #ff6b6b';
            markDirty();
          });
          td.appendChild(ta);
          tr.appendChild(td);
        });

        const tdAct=document.createElement('td');
        tdAct.style.cssText='padding:8px;border-bottom:1px solid #1b2030;vertical-align:top';
        const delBtn=document.createElement('button');
        delBtn.className='tab-btn';
        delBtn.textContent='Slett';
        delBtn.addEventListener('click', ()=>{
          const currentKey=tr.getAttribute('data-key');
          delete state.data[currentKey];
          tr.remove();
          markDirty(`Slettet nøkkel: ${currentKey}`);
        });
        tdAct.appendChild(delBtn);
        tr.appendChild(tdAct);

        rows.push(tr);
      });

      if(el.tbody){ el.tbody.replaceChildren(...rows); }
    }

    function createLangMap(fill=''){
      const map={};
      state.langs.forEach((lang)=>{ map[lang]=fill; });
      return map;
    }

    function parseLangInput(){
      const parsed=sanitizeLangList(el.langs?.value?.split(',')||state.langs);
      state.langs=parsed.length?parsed:['nb'];
      if(!state.langs.includes(state.defaultLang)) state.langs.unshift(state.defaultLang);
      state.langs=Array.from(new Set(state.langs));
      if(el.langs) el.langs.value=state.langs.join(',');
    }

    async function fetchRemote(initial=false){
      loading=true;
      try{
        setMsg(initial?'Henter oversettelser …':'Oppdaterer oversettelser …');
        const res=await fetch(API.get,{ headers:{ Accept:'application/json' }});
        const text=await res.text();
        let data;
        try{ data=text?JSON.parse(text):null; }
        catch{ data=null; }
        if(!res.ok || !data || data.ok===false){
          const errMsg=data?.error||text||res.statusText||'Kunne ikke hente oversettelser';
          throw new Error(errMsg);
        }
        const next=normaliseState({
          defaultLang:data.defaultLang,
          langs:data.activeLangs||data.langs,
          data:data.keys||data.data,
        })||defaultState();
        state=next;
        meta={
          updatedAt:data.updatedAt||data.settings?.updatedAt||null,
          updatedBy:data.updatedBy||data.settings?.updatedBy||'',
          source:data.source||'firestore',
        };
        resetDirty();
        renderTable();
        saveCache(state);
        const count=Object.keys(state.data||{}).length;
        const info=describeMeta();
        setMsg(`Lastet ${count} nøkler${info?` – ${info}`:''}.`);
      }catch(err){
        if(initial){
          const count=Object.keys(state.data||{}).length;
          setMsg(`Bruker lokale data (${count} nøkler) – kunne ikke hente fra server: ${err?.message||err}`);
        }else{
          setMsg(`Kunne ikke hente oversettelser: ${err?.message||err}`);
        }
      }finally{
        loading=false;
      }
    }

    async function saveRemote(){
      ensureKeyCoverage();
      const payload={
        defaultLang: state.defaultLang,
        activeLangs: state.langs,
        keys: state.data,
      };
      try{
        setMsg('Lagrer oversettelser …');
        const res=await fetch(API.save, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify(payload),
        });
        const text=await res.text();
        let data;
        try{ data=text?JSON.parse(text):null; }
        catch{ data=null; }
        if(!res.ok || !data || data.ok===false){
          const errMsg=data?.error||text||res.statusText||'Kunne ikke lagre oversettelser';
          throw new Error(errMsg);
        }
        meta={
          updatedAt:data.settings?.updatedAt||data.updatedAt||new Date().toISOString(),
          updatedBy:data.settings?.updatedBy||data.updatedBy||'',
          source:'firestore',
        };
        resetDirty();
        saveCache(state);
        const count=Object.keys(state.data||{}).length;
        const info=describeMeta();
        setMsg(`Lagret ${count} nøkler${info?` – ${info}`:''}.`);
      }catch(err){
        setMsg(`Kunne ikke lagre oversettelser: ${err?.message||err}`);
      }
    }

    el.search?.addEventListener('input', renderTable);
    el.def?.addEventListener('change', ()=>{
      const code=sanitizeLang(el.def.value)||state.defaultLang;
      state.defaultLang=code;
      if(!state.langs.includes(code)) state.langs.unshift(code);
      hydrateControls();
      renderTable();
      markDirty(`Standard språk: ${state.defaultLang}`);
    });
    el.langs?.addEventListener('change', ()=>{
      parseLangInput();
      renderTable();
      markDirty('Oppdatert språk-liste.');
    });

    el.addKey?.addEventListener('click', ()=>{
      parseLangInput();
      let base='section.title', i=1, key=base;
      while(state.data[key]){ i++; key=`${base}.${i}`; }
      state.data[key]=createLangMap('');
      renderTable();
      markDirty(`La til nøkkel: ${key}`);
    });

    el.save?.addEventListener('click', ()=>{ saveRemote(); });

    el.reset?.addEventListener('click', ()=>{ fetchRemote(false); });

    el.expJson?.addEventListener('click', ()=>{
      const payload={
        defaultLang: state.defaultLang,
        langs: state.langs,
        data: state.data,
        meta,
      };
      const blob=new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='i18n.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    el.expCsv?.addEventListener('click', ()=>{
      const lines=[['key','lang','value']];
      for(const [k,obj] of Object.entries(state.data)){
        state.langs.forEach((lang)=>{
          const val=(obj[lang]||'').replaceAll('"','""');
          lines.push([k, lang, val]);
        });
      }
      const csv=lines.map((row)=>row.map((col)=>`"${col}"`).join(',')).join('\n');
      const blob=new Blob([csv], {type:'text/csv;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='i18n.csv';
      a.click();
      URL.revokeObjectURL(url);
    });

    el.impJson?.addEventListener('change', async (e)=>{
      const file=e.target.files?.[0];
      if(!file) return;
      try{
        const txt=await file.text();
        const incoming=JSON.parse(txt);
        const normalised=normaliseState(incoming)||defaultState();
        state.defaultLang=normalised.defaultLang;
        state.langs=normalised.langs;
        Object.entries(normalised.data).forEach(([key,value])=>{
          state.data[key]={...(state.data[key]||{})};
          state.langs.forEach((lang)=>{
            const raw=value[lang];
            state.data[key][lang]=typeof raw==='string'?raw:raw===null||raw===undefined?'':String(raw);
          });
        });
        renderTable();
        markDirty('Importert JSON og slått sammen.');
      }catch(err){
        setMsg('Kunne ikke importere JSON.');
      }
      e.target.value='';
    });

    el.impCsv?.addEventListener('change', async (e)=>{
      const file=e.target.files?.[0];
      if(!file) return;
      try{
        const txt=await file.text();
        const rows=txt.split(/\r?\n/).filter(Boolean).map((line)=>{
          const matches=[...line.matchAll(/"((?:[^"]|"")*)"(,|$)/g)].map((match)=>match[1].replaceAll('""','"'));
          return matches;
        });
        const header=(rows.shift()||[]).map((h)=>h.toLowerCase());
        const idxKey=header.indexOf('key');
        const idxLang=header.indexOf('lang');
        const idxVal=header.indexOf('value');
        if(idxKey<0||idxLang<0||idxVal<0) throw new Error('bad header');
        rows.forEach((cols)=>{
          const key=sanitizeKey(cols[idxKey]);
          const lang=sanitizeLang(cols[idxLang]);
          if(!key||!lang) return;
          if(!state.data[key]) state.data[key]=createLangMap('');
          state.data[key][lang]=cols[idxVal]||'';
          if(!state.langs.includes(lang)) state.langs.push(lang);
        });
        renderTable();
        markDirty('Importert CSV.');
      }catch(err){
        setMsg('Kunne ikke importere CSV.');
      }
      e.target.value='';
    });
  })();


// Del 6 – system script
  (function(){
    const API = {
      get: '/.netlify/functions/settings-get',
      save: '/.netlify/functions/settings-save',
      test: '/.netlify/functions/settings-test-smtp',
    };

    const state = {
      loaded: false,
      loading: false,
      hasPass: false,
      activeSource: 'none',
      envInfo: null,
    };

    const el = {};
    let ready = false;

    const qs = (sel, root=document) => root.querySelector(sel);

    function setupElements(){
      if (ready) return true;
      el.form = qs('#smtpForm');
      if (!el.form) return false;
      el.enabled = qs('#smtpEnabled');
      el.host = qs('#smtpHost');
      el.port = qs('#smtpPort');
      el.secure = qs('#smtpSecure');
      el.user = qs('#smtpUser');
      el.pass = qs('#smtpPass');
      el.clearPass = qs('#smtpClearPass');
      el.from = qs('#smtpFrom');
      el.reply = qs('#smtpReply');
      el.status = qs('#smtpStatus');
      el.reload = qs('#smtpReload');
      el.testBtn = qs('#smtpTest');
      el.testEmail = qs('#smtpTestEmail');
      el.meta = qs('#smtpMeta');

      el.form.addEventListener('submit', onSubmit);
      el.reload?.addEventListener('click', (ev) => { ev.preventDefault(); load(true); });
      el.testBtn?.addEventListener('click', onTest);

      if (el.clearPass) {
        el.clearPass.checked = false;
        el.clearPass.disabled = true;
      }
      if (el.meta) {
        el.meta.textContent = 'Logg inn som superadministrator for å konfigurere SMTP.';
      }

      ready = true;
      return true;
    }

    function setStatus(message, type){
      if (!ready && !setupElements()) return;
      if (!el.status) return;
      el.status.textContent = message || '';
      el.status.classList.remove('ok','err');
      if (!message) return;
      if (type === 'ok') el.status.classList.add('ok');
      else if (type === 'err') el.status.classList.add('err');
    }

    function formatDate(iso){
      if (!iso) return '';
      try {
        return new Date(iso).toLocaleString('no-NO', { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return iso;
      }
    }

    function updateMeta(data){
      if (!el.meta) return;
      const parts = [];
      if (state.activeSource === 'env') {
        parts.push('Miljøvariabler brukes for utsendelser.');
        if (state.envInfo?.host) parts.push(`Host: ${state.envInfo.host}`);
        if (state.envInfo?.from) parts.push(`From: ${state.envInfo.from}`);
      } else {
        const stamp = formatDate(data.updatedAt);
        if (stamp) parts.push(`Sist oppdatert ${stamp}`);
        if (data.updatedBy) parts.push(`av ${data.updatedBy}`);
      }
      if (state.hasPass) {
        parts.push('Passord/API-nøkkel er lagret.');
      }
      if (!data.enabled && state.activeSource !== 'env' && data.host) {
        parts.push('Utsendelser er deaktivert.');
      }
      if (!parts.length) {
        parts.push('Ingen SMTP-innstillinger lagret enda.');
      }
      el.meta.textContent = parts.join(' • ');
    }

    function populate(data){
      if (!setupElements()) return;
      state.hasPass = Boolean(data.hasPass);
      if (el.enabled) el.enabled.checked = Boolean(data.enabled);
      if (el.host) el.host.value = data.host || '';
      if (el.port) el.port.value = data.port || '';
      if (el.secure) el.secure.checked = Boolean(data.secure);
      if (el.user) el.user.value = data.user || '';
      if (el.from) el.from.value = data.from || '';
      if (el.reply) el.reply.value = data.replyTo || '';
      if (el.pass) {
        el.pass.value = '';
        el.pass.placeholder = state.hasPass ? '••••••••' : '';
      }
      if (el.clearPass) {
        el.clearPass.checked = false;
        el.clearPass.disabled = !state.hasPass;
      }
      updateMeta(data);
    }

    function gatherPayload(){
      if (!setupElements()) return null;
      const payload = {
        host: (el.host?.value || '').trim(),
        port: el.port?.value || '',
        secure: Boolean(el.secure?.checked),
        user: (el.user?.value || '').trim(),
        from: (el.from?.value || '').trim(),
        replyTo: (el.reply?.value || '').trim(),
        enabled: Boolean(el.enabled?.checked),
      };
      if (el.pass) {
        const pwd = el.pass.value;
        if (pwd) {
          payload.pass = pwd;
        } else if (state.hasPass && el.clearPass?.checked) {
          payload.pass = '';
        } else {
          payload.pass = null;
        }
      } else {
        payload.pass = null;
      }
      return payload;
    }

    async function request(url, options){
      const res = await fetch(url, options);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { throw new Error(text || `HTTP ${res.status}`); }
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || data.message || text || `HTTP ${res.status}`);
      }
      return data;
    }

    function isSuperadmin(){
      try {
        return (localStorage.getItem('nfcking.role') || '').toLowerCase() === 'superadmin';
      } catch {
        return false;
      }
    }

    function isSettingsTabActive(){
      const hash = (location.hash || '#branding').replace('#','');
      return hash === 'settings';
    }

    async function load(force){
      if (!setupElements()) return;
      if (!isSuperadmin()) {
        if (force) {
          setStatus('Kun superadministratorer kan endre SMTP.', 'err');
        }
        return;
      }
      if (state.loading) return;
      if (state.loaded && !force && !isSettingsTabActive()) return;

      state.loading = true;
      setStatus('Laster SMTP-oppsett …');
      try {
        const data = await request(API.get);
        state.loaded = true;
        state.activeSource = data.activeSource || 'none';
        state.envInfo = data.env || null;
        populate(data.smtp || {});
        if (state.activeSource === 'env') {
          setStatus('Miljøvariabler er aktive.', null);
        } else {
          setStatus('');
          if (!data.smtp?.host) {
            setStatus('Legg inn serverdetaljene for å aktivere e-post.', 'err');
          } else if (!data.smtp?.enabled) {
            setStatus('SMTP-oppsettet er lagret, men utsendelser er deaktivert.', 'err');
          }
        }
      } catch (err) {
        state.loaded = false;
        setStatus(`Kunne ikke hente SMTP: ${err.message}`, 'err');
      } finally {
        state.loading = false;
      }
    }

    async function onSubmit(ev){
      ev.preventDefault();
      if (!setupElements()) return;
      if (!isSuperadmin()) {
        setStatus('Kun superadministratorer kan lagre SMTP.', 'err');
        return;
      }
      const payload = gatherPayload();
      if (!payload) return;
      if (!payload.host || !payload.user || (!payload.pass && !state.hasPass) || !payload.from) {
        setStatus('Vertsnavn, brukernavn, avsender og passord/API-nøkkel er påkrevd.', 'err');
        return;
      }
      setStatus('Lagrer SMTP-oppsett …');
      try {
        const data = await request(API.save, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        state.loaded = true;
        state.activeSource = data.smtp?.enabled ? 'stored' : 'none';
        state.envInfo = null;
        populate(data.smtp || {});
        if (data.smtp?.enabled) {
          setStatus('SMTP-oppsett lagret.', 'ok');
        } else {
          setStatus('SMTP-oppsett lagret, men utsendelser er deaktivert.', 'err');
        }
      } catch (err) {
        setStatus(`Kunne ikke lagre: ${err.message}`, 'err');
      }
    }

    async function onTest(ev){
      ev.preventDefault();
      if (!setupElements()) return;
      if (!isSuperadmin()) {
        setStatus('Kun superadministratorer kan sende test.', 'err');
        return;
      }
      const email = (el.testEmail?.value || '').trim();
      if (!email) {
        setStatus('Angi en testadresse.', 'err');
        return;
      }
      setStatus(`Sender test til ${email} …`);
      try {
        const res = await request(API.test, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email }),
        });
        setStatus(`Test sendt til ${res.deliveredTo || email}.`, 'ok');
      } catch (err) {
        setStatus(`Kunne ikke sende test: ${err.message}`, 'err');
      }
    }

    function resetForm(){
      if (!setupElements()) return;
      state.loaded = false;
      state.hasPass = false;
      state.activeSource = 'none';
      state.envInfo = null;
      if (el.form) el.form.reset();
      if (el.enabled) el.enabled.checked = false;
      if (el.host) el.host.value = '';
      if (el.port) el.port.value = '';
      if (el.secure) el.secure.checked = false;
      if (el.user) el.user.value = '';
      if (el.from) el.from.value = '';
      if (el.reply) el.reply.value = '';
      if (el.pass) {
        el.pass.value = '';
        el.pass.placeholder = '';
      }
      if (el.clearPass) {
        el.clearPass.checked = false;
        el.clearPass.disabled = true;
      }
      if (el.testEmail) el.testEmail.value = '';
      setStatus('');
      if (el.meta) {
        el.meta.textContent = 'Logg inn som superadministrator for å konfigurere SMTP.';
      }
    }

    function onRoleChange(ev){
      const role = (ev.detail && ev.detail.role) ? String(ev.detail.role).toLowerCase() : '';
      if (role === 'superadmin') {
        load(true);
      } else {
        resetForm();
      }
    }

    function onHashChange(){
      if (!isSuperadmin()) return;
      if (isSettingsTabActive()) {
        load(false);
      }
    }

    document.addEventListener('nfcking:role', onRoleChange);
    window.addEventListener('hashchange', onHashChange);

    document.addEventListener('DOMContentLoaded', () => {
      if (!setupElements()) return;
      if (isSuperadmin() && isSettingsTabActive()) {
        load(true);
      } else {
        resetForm();
      }
    });
  })();
  

// Del 6 – del 5/6: Brukere script
  (function(){
    const qs = (sel, root=document) => root.querySelector(sel);
    const el = {
      msg: qs('#usrMsg'),
      table: qs('#usrTable tbody'),
      search: qs('#usrSearch'),
      role: qs('#usrRoleFilter'),
      status: qs('#usrStatusFilter'),
      refresh: qs('#usrRefresh'),
      inviteOpen: qs('#usrInviteOpen'),
      inviteBox: qs('#usrInvite'),
      invName: qs('#invName'),
      invEmail: qs('#invEmail'),
      invRole: qs('#invRole'),
      invOrg: qs('#invOrg'),
      invSend: qs('#invSend'),
      invCancel: qs('#invCancel'),
      prev: qs('#usrPrev'),
      next: qs('#usrNext'),
      orgWrap: qs('#orgManager'),
      orgKey: qs('#orgKeyInput'),
      orgName: qs('#orgNameInput'),
      orgSite: qs('#orgSiteInput'),
      orgAccent: qs('#orgAccentInput'),
      orgLogo: qs('#orgLogoInput'),
      orgLogoBg: qs('#orgLogoBgInput'),
      orgSave: qs('#orgSaveBtn'),
      orgReset: qs('#orgResetBtn'),
      orgReload: qs('#orgReloadBtn'),
      orgTable: qs('#orgTable tbody'),
      orgMsg: qs('#orgMsg'),
    };

    const builderLangBtns = Array.from(document.querySelectorAll('#pageBuilder .lang-btn'));

    const API = {
      list:   '/.netlify/functions/users-list',
      create: '/.netlify/functions/users-invite',
      role:   '/.netlify/functions/users-role',
      status: '/.netlify/functions/users-status',
      imp:    '/.netlify/functions/users-impersonate',
    };

    const ORG_API = {
      list: '/.netlify/functions/orgs-list',
      save: '/.netlify/functions/orgs-save',
    };

    const state = {
      pageTokens: [null],
      index: 0,
      nextToken: null,
      loading: false,
      loadedOnce: false,
    };

    const orgState = {
      list: [],
      map: new Map(),
      loading: false,
      loaded: false,
      promise: null,
    };

    const orgAdders = new Set();
    const orgFormState = { currentKey: null };

    const roleOptions = ['superadmin','owner','admin','editor','support','viewer'];
    const ORG_KEY_PATTERN = /^[A-Za-z0-9_-]+$/;

    function parseOrgList(input){
      const raw = Array.isArray(input) ? input : String(input || '')
        .split(/[,\s]+/);
      const set = new Set();
      raw.forEach((entry) => {
        if (entry === null || entry === undefined) return;
        const value = String(entry).trim();
        if (!value) return;
        if (!ORG_KEY_PATTERN.test(value)) return;
        set.add(value);
      });
      return Array.from(set);
    }

    function formatOrgList(list){
      if (!Array.isArray(list) || list.length === 0) return '';
      return list.join(', ');
    }

    function normaliseOrgKeyValue(value){
      if (value === null || value === undefined) return '';
      const trimmed = String(value).trim();
      if (!trimmed) return '';
      if (!ORG_KEY_PATTERN.test(trimmed)) return '';
      return trimmed;
    }

    function setOrgMsg(text, opts={}){
      if (!el.orgMsg) return;
      el.orgMsg.textContent = '';
      el.orgMsg.classList.remove('ok','err');
      el.orgMsg.style.color = '';
      if (!text) return;
      if (opts.type === 'ok') {
        el.orgMsg.classList.add('ok');
        el.orgMsg.style.color = '#21c36a';
      }
      if (opts.type === 'err') {
        el.orgMsg.classList.add('err');
        el.orgMsg.style.color = '#ff6b6b';
      }
      el.orgMsg.append(document.createTextNode(text));
    }

    function toggleOrgManager(show){
      if (!el.orgWrap) return;
      el.orgWrap.classList.toggle('hidden', !show);
      if (!show) {
        clearOrgForm();
        setOrgMsg('');
        orgState.list = [];
        orgState.map = new Map();
        orgState.loaded = false;
        orgState.promise = null;
        orgState.loading = false;
        if (el.orgTable) {
          el.orgTable.innerHTML = '';
        }
      }
    }

    function clearOrgForm(){
      if (el.orgKey) el.orgKey.value = '';
      if (el.orgName) el.orgName.value = '';
      if (el.orgSite) el.orgSite.value = '';
      if (el.orgAccent) el.orgAccent.value = '';
      if (el.orgLogo) el.orgLogo.value = '';
      if (el.orgLogoBg) el.orgLogoBg.value = '';
      orgFormState.currentKey = null;
    }

    function populateOrgForm(record){
      if (!record) {
        clearOrgForm();
        return;
      }
      if (el.orgKey) el.orgKey.value = record.key || '';
      if (el.orgName) el.orgName.value = record.name || '';
      if (el.orgSite) el.orgSite.value = record.site || '';
      if (el.orgAccent) el.orgAccent.value = record.accent || '';
      if (el.orgLogo) el.orgLogo.value = record.logo || '';
      if (el.orgLogoBg) el.orgLogoBg.value = record.logoBg || '';
      orgFormState.currentKey = record.key || null;
      setOrgMsg(`Redigerer ${record.key}.`);
    }

    function gatherOrgPayload(){
      const key = normaliseOrgKeyValue(el.orgKey?.value);
      if (!key) {
        setOrgMsg('Org-nøkkel må settes (A–Z, 0–9, bindestrek eller underscore).', { type: 'err' });
        return null;
      }
      let name = (el.orgName?.value || '').trim();
      let site = (el.orgSite?.value || '').trim();
      if (site && !/^https?:\/\//i.test(site)) {
        site = `https://${site}`;
      }
      const accent = (el.orgAccent?.value || '').trim();
      const logo = (el.orgLogo?.value || '').trim();
      const logoBg = (el.orgLogoBg?.value || '').trim();
      if (!name) name = key;
      return { key, name, site, accent, logo, logoBg };
    }

    function renderOrgTable(){
      if (!el.orgTable) return;
      if (!Array.isArray(orgState.list) || orgState.list.length === 0) {
        el.orgTable.innerHTML = '<tr><td colspan="5" style="padding:10px;text-align:center;color:var(--sub)">Ingen organisasjoner funnet.</td></tr>';
        return;
      }
      const rows = orgState.list.map((org) => {
        const tr = document.createElement('tr');
        const makeCell = () => {
          const td = document.createElement('td');
          td.style.cssText = 'padding:8px;border-bottom:1px solid #1b2030;vertical-align:top';
          return td;
        };
        const keyTd = makeCell();
        keyTd.textContent = org.key;
        tr.appendChild(keyTd);

        const nameTd = makeCell();
        nameTd.textContent = org.name || '—';
        tr.appendChild(nameTd);

        const siteTd = makeCell();
        if (org.site) {
          const link = document.createElement('a');
          link.href = org.site;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = org.site.replace(/^https?:\/\//i, '');
          siteTd.appendChild(link);
        } else {
          siteTd.textContent = '—';
        }
        tr.appendChild(siteTd);

        const accentTd = makeCell();
        if (org.accent) {
          const swatch = document.createElement('span');
          swatch.style.cssText = 'display:inline-block;width:18px;height:18px;border-radius:6px;border:1px solid #2d3243;margin-right:6px;';
          swatch.style.background = org.accent;
          accentTd.appendChild(swatch);
        }
        accentTd.append(document.createTextNode(org.accent || '—'));
        tr.appendChild(accentTd);

        const actionTd = makeCell();
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'tab-btn';
        editBtn.textContent = 'Rediger';
        editBtn.addEventListener('click', () => populateOrgForm(org));
        actionTd.appendChild(editBtn);
        tr.appendChild(actionTd);

        tr.addEventListener('dblclick', () => populateOrgForm(org));
        return tr;
      });

      el.orgTable.replaceChildren(...rows);
    }

    function populateOrgSelect(select){
      if (!select) return;
      select.innerHTML = '';
      const base = document.createElement('option');
      base.value = '';
      base.textContent = 'Velg organisasjon…';
      select.appendChild(base);
      orgState.list.forEach((org) => {
        const opt = document.createElement('option');
        opt.value = org.key;
        opt.textContent = org.name && org.name !== org.key ? `${org.name} (${org.key})` : org.key;
        select.appendChild(opt);
      });
    }

    function refreshOrgAdders(){
      orgAdders.forEach((entry) => {
        if (entry && typeof entry.refresh === 'function') {
          entry.refresh();
        }
      });
    }

    function resetOrgAdders(){
      for (const entry of Array.from(orgAdders)) {
        if (!entry || entry.persistent) continue;
        orgAdders.delete(entry);
      }
    }

    function createOrgAdder(targetInput, opts = {}){
      if (!targetInput) return { wrap: null };
      const persistent = Boolean(opts.persistent);
      const wrap = document.createElement('div');
      wrap.className = 'org-adder';
      const select = document.createElement('select');
      populateOrgSelect(select);
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'tab-btn';
      addBtn.textContent = 'Legg til';
      addBtn.addEventListener('click', () => {
        const value = normaliseOrgKeyValue(select.value);
        if (!value) return;
        const set = new Set(parseOrgList(targetInput.value));
        if (!set.has(value)) {
          set.add(value);
          targetInput.value = formatOrgList(Array.from(set));
          targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        select.value = '';
      });
      wrap.appendChild(select);
      wrap.appendChild(addBtn);
      const entry = {
        persistent,
        refresh: () => populateOrgSelect(select),
      };
      orgAdders.add(entry);
      return { wrap, entry };
    }

    async function loadOrgDirectory(force=false){
      if (!el.orgWrap) return [];
      if (orgState.loading) {
        return orgState.promise;
      }
      if (orgState.loaded && !force) {
        return orgState.list;
      }
      orgState.loading = true;
      setOrgMsg('Laster organisasjoner …');
      const promise = request(ORG_API.list)
        .then((data) => {
          const raw = Array.isArray(data.orgs) ? data.orgs : [];
          const mapped = raw.map((item) => {
            const key = normaliseOrgKeyValue(item.key || item.id || item.orgKey || item.slug);
            if (!key) return null;
            const name = (item.name || item.title || '').toString().trim();
            const site = (item.site || '').toString().trim();
            const accent = (item.accent || '').toString().trim();
            const logo = (item.logo || '').toString().trim();
            const logoBg = (item.logoBg || '').toString().trim();
            return { key, name: name || key, site, accent, logo, logoBg };
          }).filter(Boolean);
          mapped.sort((a, b) => a.key.localeCompare(b.key));
          orgState.list = mapped;
          orgState.map = new Map(mapped.map((org) => [org.key, org]));
          orgState.loaded = true;
          renderOrgTable();
          refreshOrgAdders();
          setOrgMsg(mapped.length ? `Fant ${mapped.length} organisasjoner.` : 'Ingen organisasjoner funnet.');
          return mapped;
        })
        .catch((err) => {
          orgState.loaded = false;
          setOrgMsg(`Kunne ikke hente organisasjoner: ${err.message}`, { type: 'err' });
          throw err;
        })
        .finally(() => {
          orgState.loading = false;
          orgState.promise = null;
        });

      orgState.promise = promise;
      return promise;
    }

    async function saveOrg(){
      if (!ensureLoggedIn()) return;
      const payload = gatherOrgPayload();
      if (!payload) return;
      try {
        setOrgMsg(`Lagrer ${payload.key} …`);
        await request(ORG_API.save, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        await loadOrgDirectory(true);
        const next = orgState.map.get(payload.key);
        if (next) {
          populateOrgForm(next);
          setOrgMsg(`Lagret ${payload.key}.`, { type: 'ok' });
        } else {
          clearOrgForm();
          setOrgMsg(`Lagret ${payload.key}.`, { type: 'ok' });
        }
      } catch (err) {
        setOrgMsg(`Kunne ikke lagre: ${err.message}`, { type: 'err' });
      }
    }

    function clearTable(){
      if (el.table) {
        el.table.textContent = '';
      }
    }

    function setMsg(text, opts={}){
      if (!el.msg) return;
      el.msg.textContent = '';
      el.msg.classList.remove('ok','err');
      el.msg.style.color = '';
      if (!text) return;
      if (opts.type === 'ok') {
        el.msg.classList.add('ok');
        el.msg.style.color = '#21c36a';
      }
      if (opts.type === 'err') {
        el.msg.classList.add('err');
        el.msg.style.color = '#ff6b6b';
      }
      el.msg.append(document.createTextNode(text));
      if (opts.link) {
        const a = document.createElement('a');
        a.href = opts.link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = ' Åpne lenke';
        el.msg.append(' ');
        el.msg.append(a);
      }
      if (opts.extra) {
        el.msg.append(' ');
        el.msg.append(opts.extra);
      }
    }

    function ensureLoggedIn(){
      const user = firebase.auth().currentUser;
      if (!user) {
        clearTable();
        if (el.prev) el.prev.disabled = true;
        if (el.next) el.next.disabled = true;
        setMsg('Logg inn for å administrere brukere.');
        toggleOrgManager(false);
        return false;
      }
      const role = (localStorage.getItem('nfcking.role') || '').toLowerCase();
      if (role !== 'superadmin') {
        clearTable();
        if (el.prev) el.prev.disabled = true;
        if (el.next) el.next.disabled = true;
        setMsg('Kun superadministratorer kan administrere brukere.');
        toggleOrgManager(false);
        return false;
      }
      toggleOrgManager(true);
      return true;
    }

    function renderRows(users){
      if (!el.table) return;
      if (!Array.isArray(users) || users.length === 0){
        el.table.innerHTML = '<tr><td colspan="6" style="padding:12px;text-align:center;color:var(--sub)">Ingen brukere funnet.</td></tr>';
        return;
      }

      resetOrgAdders();
      const rows = users.map((user) => {
        const data = { ...user };
        let orgList = [];
        if (Array.isArray(data.orgs) && data.orgs.length) {
          orgList = parseOrgList(data.orgs);
        } else if (data.orgKey) {
          orgList = parseOrgList([data.orgKey]);
        }
        data.orgs = orgList;
        data.orgKey = data.orgs.length ? data.orgs[0] : (data.orgKey || null);
        const tr = document.createElement('tr');
        const cell = () => {
          const td = document.createElement('td');
          td.style.cssText = 'padding:8px;border-bottom:1px solid #1b2030;vertical-align:top';
          return td;
        };

        const nameTd = cell();
        nameTd.textContent = data.displayName || '—';
        tr.appendChild(nameTd);

        const mailTd = cell();
        if (data.email) {
          const link = document.createElement('a');
          link.href = `mailto:${data.email}`;
          link.textContent = data.email;
          mailTd.appendChild(link);
        } else {
          mailTd.textContent = '—';
        }
        tr.appendChild(mailTd);

        const roleTd = cell();
        const roleSel = document.createElement('select');
        roleOptions.forEach((role) => {
          const opt = document.createElement('option');
          opt.value = role;
          opt.textContent = role;
          if ((data.role || 'viewer') === role) opt.selected = true;
          roleSel.appendChild(opt);
        });
        roleSel.addEventListener('change', async () => {
          const nextRole = roleSel.value;
          try {
            const res = await request(API.role, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: data.uid,
                roles: [nextRole],
                orgs: data.orgs,
              }),
            });
            data.role = nextRole;
            if (res && Array.isArray(res.orgs)) {
              data.orgs = parseOrgList(res.orgs);
              data.orgKey = res.orgKey || (data.orgs[0] || null);
              orgInput.value = formatOrgList(data.orgs);
            }
            setMsg(`Oppdatert rolle for ${data.email || data.uid} → ${nextRole}`, { type: 'ok' });
          } catch (err) {
            roleSel.value = data.role || 'viewer';
            setMsg(`Kunne ikke endre rolle: ${err.message}`, { type: 'err' });
          }
        });
        roleTd.appendChild(roleSel);
        tr.appendChild(roleTd);

        const orgTd = cell();
        const orgInput = document.createElement('input');
        orgInput.type = 'text';
        orgInput.value = formatOrgList(data.orgs);
        orgInput.placeholder = 'Wayback, Eksempel';
        orgInput.style.minWidth = '200px';
        orgInput.className = 'org-input';
        orgInput.addEventListener('change', () => {
          data.orgs = parseOrgList(orgInput.value);
        });
        orgTd.appendChild(orgInput);

        const adder = createOrgAdder(orgInput);
        if (adder.wrap) {
          orgTd.appendChild(adder.wrap);
        }
        tr.appendChild(orgTd);

        const statusTd = cell();
        statusTd.textContent = data.status || (data.disabled ? 'disabled' : 'active');
        tr.appendChild(statusTd);

        const actionsTd = cell();
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '6px';
        actions.style.flexWrap = 'wrap';

        const orgBtn = document.createElement('button');
        orgBtn.type = 'button';
        orgBtn.className = 'tab-btn';
        orgBtn.textContent = 'Oppdater org';
        orgBtn.addEventListener('click', async () => {
          const list = parseOrgList(orgInput.value);
          try {
            const res = await request(API.role, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: data.uid,
                roles: [data.role || 'viewer'],
                orgs: list,
              }),
            });
            const nextOrgs = res && Array.isArray(res.orgs) ? parseOrgList(res.orgs) : list;
            data.orgs = nextOrgs;
            data.orgKey = (res && res.orgKey) || (nextOrgs[0] || null);
            orgInput.value = formatOrgList(nextOrgs);
            setMsg(`Org-tilgang oppdatert for ${data.email || data.uid}.`, { type: 'ok' });
          } catch (err) {
            setMsg(`Kunne ikke oppdatere org-tilgang: ${err.message}`, { type: 'err' });
          }
        });
        actions.appendChild(orgBtn);

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'tab-btn';
        const setToggleLabel = () => {
          toggleBtn.textContent = data.status === 'disabled' ? 'Aktiver' : 'Deaktiver';
        };
        setToggleLabel();
        toggleBtn.addEventListener('click', async () => {
          const targetStatus = data.status === 'disabled' ? 'active' : 'disabled';
          try {
            const res = await request(API.status, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: data.uid, status: targetStatus }),
            });
            data.status = res.status;
            data.disabled = res.disabled;
            statusTd.textContent = res.status;
            setToggleLabel();
            setMsg(`Status oppdatert for ${data.email || data.uid} → ${res.status}`, { type: 'ok' });
          } catch (err) {
            setMsg(`Kunne ikke endre status: ${err.message}`, { type: 'err' });
          }
        });
        actions.appendChild(toggleBtn);

        const impBtn = document.createElement('button');
        impBtn.className = 'tab-btn';
        impBtn.textContent = 'Impersonate';
        impBtn.addEventListener('click', async () => {
          try {
            const res = await request(API.imp, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: data.uid }),
            });
            if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(res.customToken);
              setMsg(`Impersonate-token kopiert til utklippstavlen for ${data.email || data.uid}.`, { type: 'ok' });
            } else {
              const code = document.createElement('code');
              code.textContent = res.customToken;
              setMsg('Impersonate-token generert.', { type: 'ok', extra: code });
            }
          } catch (err) {
            setMsg(`Kunne ikke impersonere: ${err.message}`, { type: 'err' });
          }
        });
        actions.appendChild(impBtn);

        actionsTd.appendChild(actions);
        tr.appendChild(actionsTd);

        return tr;
      });

      el.table.replaceChildren(...rows);
      refreshOrgAdders();
    }

    async function request(url, options) {
      const res = await fetch(url, options);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch { data = { ok: false, error: text || `HTTP ${res.status}` }; }
      if (!res.ok || data.ok === false) {
        const msg = data && (data.error || data.message) ? (data.error || data.message) : text || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data;
    }

    async function loadUsers({ token, reset } = {}) {
      if (state.loading) return;
      if (!ensureLoggedIn()) return;
      try {
        await loadOrgDirectory();
      } catch (_) {
        // Ignorer feil her – visning av brukere kan fortsatt fortsette.
      }
      state.loading = true;
      try {
        if (reset) {
          state.pageTokens = [null];
          state.index = 0;
        }
        const currentToken = token !== undefined ? token : state.pageTokens[state.index] || null;
        const params = new URLSearchParams();
        const q = (el.search?.value || '').trim();
        const roleVal = el.role?.value || '';
        const statusVal = el.status?.value || '';
        if (q) params.set('q', q);
        if (roleVal) params.set('role', roleVal);
        if (statusVal) params.set('status', statusVal);
        params.set('limit', '20');
        if (currentToken) params.set('pageToken', currentToken);

        setMsg('Laster brukere …');
        const url = params.toString() ? `${API.list}?${params}` : API.list;
        const data = await request(url);
        renderRows(data.users || []);
        state.nextToken = data.nextPageToken || null;
        if (token !== undefined) {
          state.pageTokens[state.index] = currentToken || null;
        }
        if (el.prev) el.prev.disabled = state.index === 0;
        if (el.next) el.next.disabled = !state.nextToken;
        setMsg(`Fant ${data.count ?? (data.users || []).length} brukere.`);
        state.loadedOnce = true;
      } catch (err) {
        clearTable();
        setMsg(`Kunne ikke hente brukere: ${err.message}`, { type: 'err' });
      } finally {
        state.loading = false;
      }
    }

    function toggleInvite(show) {
      if (!el.inviteBox) return;
      el.inviteBox.classList.toggle('hidden', !show);
      if (show) {
        el.invName?.focus();
      }
    }

    async function sendInvite() {
      const email = (el.invEmail?.value || '').trim();
      const displayName = (el.invName?.value || '').trim();
      const role = el.invRole?.value || 'viewer';
      const orgs = parseOrgList(el.invOrg?.value || '');
      if (!email) {
        setMsg('E-post er påkrevd.', { type: 'err' });
        return;
      }
      try {
        setMsg('Sender invitasjon …');
        const payload = { email, displayName, role };
        if (orgs.length) {
          payload.orgs = orgs;
          payload.orgKey = orgs[0];
        }
        const data = await request(API.create, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        el.invName.value = '';
        el.invEmail.value = '';
        el.invOrg.value = '';
        toggleInvite(false);
        if (data.emailSent) {
          setMsg(`Invitasjon sendt til ${email}.`, { type: 'ok' });
        } else if (data.inviteLink) {
          const link = document.createElement('a');
          link.href = data.inviteLink;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'Åpne invitasjonslenke';
          setMsg('Invitasjon generert (lenke er kopierbar).', { type: 'ok', extra: link });
        } else if (data.note) {
          setMsg(data.note, { type: 'ok' });
        } else {
          setMsg('Invitasjon opprettet.', { type: 'ok' });
        }
        await loadUsers({ token: state.pageTokens[state.index] || null });
      } catch (err) {
        setMsg(`Kunne ikke sende invitasjon: ${err.message}`, { type: 'err' });
      }
    }

    if (el.invOrg) {
      const inviteAdder = createOrgAdder(el.invOrg, { persistent: true });
      if (inviteAdder.wrap) {
        el.invOrg.insertAdjacentElement('afterend', inviteAdder.wrap);
      }
    }

    if (el.inviteOpen) el.inviteOpen.addEventListener('click', () => toggleInvite(true));
    if (el.invCancel) el.invCancel.addEventListener('click', () => toggleInvite(false));
    if (el.invSend) el.invSend.addEventListener('click', sendInvite);
    if (el.orgSave) el.orgSave.addEventListener('click', saveOrg);
    if (el.orgReset) el.orgReset.addEventListener('click', () => { clearOrgForm(); setOrgMsg('Skjema nullstilt.'); });
    if (el.orgReload) el.orgReload.addEventListener('click', () => loadOrgDirectory(true));
    if (el.refresh) el.refresh.addEventListener('click', () => loadUsers({ token: state.pageTokens[state.index] || null }));
    if (el.search) el.search.addEventListener('input', () => loadUsers({ token: null, reset: true }));
    if (el.role) el.role.addEventListener('change', () => loadUsers({ token: null, reset: true }));
    if (el.status) el.status.addEventListener('change', () => loadUsers({ token: null, reset: true }));
    if (el.prev) el.prev.addEventListener('click', () => {
      if (state.index === 0) return;
      state.index -= 1;
      loadUsers({ token: state.pageTokens[state.index] || null });
    });
    if (el.next) el.next.addEventListener('click', () => {
      if (!state.nextToken) return;
      state.index += 1;
      state.pageTokens[state.index] = state.nextToken;
      loadUsers({ token: state.pageTokens[state.index] });
    });

    function onTabChange(){
      const active = (location.hash || '#branding').replace('#','');
      if (active === 'users' && !state.loading) {
        const initialToken = state.pageTokens[state.index] || null;
        loadUsers({ token: initialToken, reset: !state.loadedOnce });
      }
    }

    window.addEventListener('hashchange', onTabChange);
    onTabChange();
  })();
  

// Del 6 – del 6/6: Sider script
  (function(){
    const qs=(s,r=document)=>r.querySelector(s);
    const ce=(t)=>document.createElement(t);
    const el = {
      msg: qs('#pgMsg'),
      table: qs('#pgTable tbody'),
      search: qs('#pgSearch'),
      status: qs('#pgStatus'),
      refresh: qs('#pgRefresh'),
      create: qs('#pgNew'),
      editor: qs('#pgEditor'),
      editorTitle: qs('#pgEditorTitle'),
      slug: qs('#pgSlug'),
      statusEdit: qs('#pgStatusEdit'),
      scheduleAt: qs('#pgScheduleAt'),
      org: qs('#pgOrg'),
      titleNb: qs('#pgTitleNb'),
      titleEn: qs('#pgTitleEn'),
      bodyNb: qs('#pgBodyNb'),
      bodyEn: qs('#pgBodyEn'),
      seoTitle: qs('#pgSeoTitle'),
      seoDesc: qs('#pgSeoDesc'),
      seoOg: qs('#pgSeoOg'),
      seoCanonical: qs('#pgSeoCanonical'),
      menuShow: qs('#pgMenuShow'),
      menuOrder: qs('#pgMenuOrder'),
      saveDraft: qs('#pgSaveDraft'),
      publish: qs('#pgPublish'),
      preview: qs('#pgPreview'),
      close: qs('#pgClose'),
      editMsg: qs('#pgEditMsg'),
      menuList: qs('#menuList'),
      menuAdd: qs('#menuAdd'),
      menuSave: qs('#menuSave'),
      menuMsg: qs('#menuMsg'),
      builderWrap: qs('#pageBuilder'),
      builderList: qs('#pgBuilderList'),
      builderEmpty: qs('#pgBuilderEmpty'),
      builderDrop: qs('#pgBuilderDrop'),
      builderAdd: qs('#pageBuilder .builder-add'),
    };

    const builderLangBtns = Array.from(
      (el.builderWrap || document).querySelectorAll('.lang-btn')
    );

    const API = {
      list:   '/.netlify/functions/pages-list',
      get:    '/.netlify/functions/pages-get',
      save:   '/.netlify/functions/pages-save',
      publish:'/.netlify/functions/pages-publish',
      del:    '/.netlify/functions/pages-delete',
      menuGet:'/.netlify/functions/menu-get',
      menuSave:'/.netlify/functions/menu-save',
      preview:'/preview/'
    };

    let editingId = null;
    let editingSource = null;
    let lastPages = [];

    const builder = { lang: 'nb', blocks: [] };
    let draggingIndex = null;
    let syncTimer = null;

    const blockLabels = {
      heading: 'Overskrift',
      text: 'Tekst',
      image: 'Bilde',
      button: 'Knapp/Lenke',
      list: 'Liste',
      columns: 'Kolonner',
      video: 'Video',
      contact: 'Kontaktskjema',
      html: 'Custom HTML'
    };

    function makeId(){
      return 'b' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36);
    }

    function makeBlock(type, defaults = true){
      const base = { id: makeId(), type: type || 'text' };
      switch (base.type) {
        case 'heading':
          base.level = 'h2';
          base.align = 'left';
          base.text = { nb: defaults ? 'Ny overskrift' : '', en: defaults ? 'New heading' : '' };
          break;
        case 'text':
          base.text = { nb: defaults ? 'Nytt avsnitt' : '', en: defaults ? 'New paragraph' : '' };
          break;
        case 'image':
          base.src = '';
          base.alt = { nb: '', en: '' };
          base.caption = { nb: '', en: '' };
          base.fullWidth = false;
          break;
        case 'button':
          base.url = '';
          base.text = { nb: defaults ? 'Les mer' : '', en: defaults ? 'Read more' : '' };
          base.style = 'primary';
          base.newTab = false;
          break;
        case 'list':
          base.listType = 'ul';
          base.items = { nb: defaults ? ['Punkt'] : [], en: defaults ? ['Item'] : [] };
          break;
        case 'columns':
          base.left = { nb: defaults ? 'Venstre kolonne' : '', en: defaults ? 'Left column' : '' };
          base.right = { nb: defaults ? 'Høyre kolonne' : '', en: defaults ? 'Right column' : '' };
          base.stack = true;
          break;
        case 'video':
          base.url = '';
          base.caption = { nb: '', en: '' };
          base.aspect = '16x9';
          break;
        case 'contact':
          base.heading = { nb: defaults ? 'Kontakt oss' : '', en: defaults ? 'Contact us' : '' };
          base.intro = { nb: '', en: '' };
          base.success = { nb: defaults ? 'Takk for meldingen!' : '', en: defaults ? 'Thanks for your message!' : '' };
          base.recipient = '';
          base.showPhone = true;
          break;
        case 'html':
        default:
          base.code = { nb: '', en: '' };
          break;
      }
      return base;
    }

    function normalizeBlock(data){
      const type = data?.type || 'text';
      const base = makeBlock(type, false);
      base.id = data?.id || base.id;
      switch (type) {
        case 'heading':
          base.level = data?.level || base.level;
          base.align = data?.align || base.align;
          base.text.nb = data?.text?.nb ?? base.text.nb;
          base.text.en = data?.text?.en ?? base.text.en;
          break;
        case 'text':
          base.text.nb = data?.text?.nb ?? base.text.nb;
          base.text.en = data?.text?.en ?? base.text.en;
          break;
        case 'image':
          base.src = data?.src || base.src;
          base.alt.nb = data?.alt?.nb ?? base.alt.nb;
          base.alt.en = data?.alt?.en ?? base.alt.en;
          base.caption.nb = data?.caption?.nb ?? base.caption.nb;
          base.caption.en = data?.caption?.en ?? base.caption.en;
          base.fullWidth = data?.fullWidth ?? base.fullWidth;
          break;
        case 'button':
          base.url = data?.url || base.url;
          base.text.nb = data?.text?.nb ?? base.text.nb;
          base.text.en = data?.text?.en ?? base.text.en;
          base.style = data?.style || base.style;
          base.newTab = data?.newTab ?? base.newTab;
          break;
        case 'list':
          base.listType = data?.listType || base.listType;
          base.items.nb = Array.isArray(data?.items?.nb) ? data.items.nb.slice() : base.items.nb;
          base.items.en = Array.isArray(data?.items?.en) ? data.items.en.slice() : base.items.en;
          break;
        case 'columns':
          base.left.nb = data?.left?.nb ?? base.left.nb;
          base.left.en = data?.left?.en ?? base.left.en;
          base.right.nb = data?.right?.nb ?? base.right.nb;
          base.right.en = data?.right?.en ?? base.right.en;
          base.stack = data?.stack ?? base.stack;
          break;
        case 'video':
          base.url = data?.url || base.url;
          base.caption.nb = data?.caption?.nb ?? base.caption.nb;
          base.caption.en = data?.caption?.en ?? base.caption.en;
          base.aspect = data?.aspect || base.aspect;
          break;
        case 'contact':
          base.heading.nb = data?.heading?.nb ?? base.heading.nb;
          base.heading.en = data?.heading?.en ?? base.heading.en;
          base.intro.nb = data?.intro?.nb ?? base.intro.nb;
          base.intro.en = data?.intro?.en ?? base.intro.en;
          base.success.nb = data?.success?.nb ?? base.success.nb;
          base.success.en = data?.success?.en ?? base.success.en;
          base.recipient = data?.recipient || base.recipient;
          base.showPhone = data?.showPhone ?? base.showPhone;
          break;
        case 'html':
        default:
          base.code.nb = data?.code?.nb ?? base.code.nb;
          base.code.en = data?.code?.en ?? base.code.en;
          break;
      }
      return base;
    }

    function cloneBlock(block){
      return JSON.parse(JSON.stringify(block));
    }

    function updateLangButtons(){
      builderLangBtns.forEach(btn => {
        const active = btn.dataset.lang === builder.lang;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function setBuilderLang(lang){
      builder.lang = lang === 'en' ? 'en' : 'nb';
      updateLangButtons();
      renderBlocks();
    }

    function scheduleSync(){
      clearTimeout(syncTimer);
      syncTimer = setTimeout(updateBodiesFromBuilder, 120);
    }

    function escapeHtml(str = ''){
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };
      return str.replace(/[&<>"']/g, ch => map[ch]);
    }

    function textToHtml(value = ''){
      const trimmed = (value || '').trim();
      if (!trimmed) return '';
      const parts = trimmed.split(/\n{2,}/).map(segment => segment.trim());
      return parts.map(segment => `<p>${escapeHtml(segment).replace(/\n/g, '<br />')}</p>`).join('\n');
    }

    function videoEmbedUrl(url = ''){
      const u = (url || '').trim();
      if (!u) return '';
      if (/youtu\.be|youtube\.com/.test(u)){
        const match = u.match(/(?:v=|be\/|embed\/)([A-Za-z0-9_-]{11})/);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
      }
      if (/vimeo\.com/.test(u)){
        const match = u.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
        if (match) return `https://player.vimeo.com/video/${match[1]}`;
      }
      return u;
    }

    function blockToHtml(block, lang){
      const l = lang === 'en' ? 'en' : 'nb';
      switch (block.type) {
        case 'heading': {
          const txt = (block.text?.[l] || '').trim();
          if (!txt) return '';
          const level = block.level || 'h2';
          const align = block.align && block.align !== 'left' ? ` style="text-align:${escapeHtml(block.align)}"` : '';
          return `<${level}${align}>${escapeHtml(txt)}</${level}>`;
        }
        case 'text':
          return textToHtml(block.text?.[l] || '');
        case 'image': {
          if (!block.src) return '';
          const alt = block.alt?.[l] || block.alt?.nb || '';
          const caption = block.caption?.[l] || block.caption?.nb || '';
          const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(alt)}"${block.fullWidth ? ' style="width:100%;height:auto;"' : ''} />`;
          return caption ? `<figure>${img}<figcaption>${escapeHtml(caption)}</figcaption></figure>` : (block.fullWidth ? `<figure>${img}</figure>` : img);
        }
        case 'button': {
          const label = (block.text?.[l] || block.text?.nb || '').trim();
          if (!label) return '';
          const href = block.url ? escapeHtml(block.url) : '#';
          const cls = block.style === 'link' ? 'link' : (block.style === 'secondary' ? 'button secondary' : 'button');
          const target = block.newTab ? ' target="_blank" rel="noopener"' : '';
          return `<p><a class="${cls}" href="${href}"${target}>${escapeHtml(label)}</a></p>`;
        }
        case 'list': {
          const items = Array.isArray(block.items?.[l]) ? block.items[l].filter(Boolean) : [];
          if (!items.length) return '';
          const tag = block.listType === 'ol' ? 'ol' : 'ul';
          return `<${tag}>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
        }
        case 'columns': {
          const leftHtml = textToHtml(block.left?.[l] || '');
          const rightHtml = textToHtml(block.right?.[l] || '');
          if (!leftHtml && !rightHtml) return '';
          const cls = block.stack ? 'two-columns stack' : 'two-columns';
          return `<section class="${cls}"><div class="col">${leftHtml || ''}</div><div class="col">${rightHtml || ''}</div></section>`;
        }
        case 'video': {
          if (!block.url) return '';
          const src = videoEmbedUrl(block.url);
          const cap = block.caption?.[l] || '';
          const aspect = block.aspect || '16x9';
          const ratio = aspect === '1x1' ? 'padding-top:100%' : (aspect === '4x3' ? 'padding-top:75%' : 'padding-top:56.25%');
          const iframe = `<div class="video-frame" style="position:relative;${ratio};height:0;overflow:hidden;"><iframe src="${escapeHtml(src)}" title="Video" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe></div>`;
          return cap ? `<figure class="video">${iframe}<figcaption>${escapeHtml(cap)}</figcaption></figure>` : iframe;
        }
        case 'contact': {
          const heading = block.heading?.[l] || block.heading?.nb || '';
          const intro = textToHtml(block.intro?.[l] || block.intro?.nb || '');
          const success = block.success?.[l] || block.success?.nb || '';
          const recipientAttr = block.recipient ? ` data-recipient="${escapeHtml(block.recipient)}"` : '';
          const phoneField = block.showPhone ? '<label>Telefon<input name="phone" type="tel" /></label>' : '';
          return `<section class="contact-form">${heading ? `<h2>${escapeHtml(heading)}</h2>` : ''}${intro || ''}<form data-form="contact"${recipientAttr}><label>Navn<input name="name" required /></label><label>E-post<input name="email" type="email" required /></label>${phoneField}<label>Melding<textarea name="message" required></textarea></label><button type="submit">Send</button><p class="contact-success" hidden>${escapeHtml(success)}</p></form></section>`;
        }
        case 'html':
        default:
          return (block.code?.[l] || '').trim();
      }
    }

    function blocksToHtml(lang){
      return builder.blocks.map(block => blockToHtml(block, lang)).filter(Boolean).join('\n\n');
    }

    function updateBodiesFromBuilder(){
      if (el.bodyNb) el.bodyNb.value = blocksToHtml('nb');
      if (el.bodyEn) el.bodyEn.value = blocksToHtml('en');
    }

    function hasLangContent(block, lang){
      switch (block.type) {
        case 'heading':
        case 'text':
        case 'button':
          return Boolean((block.text?.[lang] || '').trim());
        case 'image':
          return Boolean((block.alt?.[lang] || '').trim() || (block.caption?.[lang] || '').trim());
        case 'list':
          return Array.isArray(block.items?.[lang]) && block.items[lang].some(Boolean);
        case 'columns':
          return Boolean((block.left?.[lang] || '').trim() || (block.right?.[lang] || '').trim());
        case 'video':
          return Boolean((block.caption?.[lang] || '').trim());
        case 'contact':
          return Boolean((block.heading?.[lang] || '').trim() || (block.intro?.[lang] || '').trim() || (block.success?.[lang] || '').trim());
        case 'html':
          return Boolean((block.code?.[lang] || '').trim());
        default:
          return false;
      }
    }

    function copyBlockLang(target, source, lang){
      switch (target.type) {
        case 'heading':
          target.level = source.level || target.level;
          target.align = source.align || target.align;
          if (!target.text) target.text = { nb: '', en: '' };
          target.text[lang] = source.text?.[lang] || '';
          break;
        case 'text':
          if (!target.text) target.text = { nb: '', en: '' };
          target.text[lang] = source.text?.[lang] || '';
          break;
        case 'image':
          target.src = source.src || target.src;
          if (!target.alt) target.alt = { nb: '', en: '' };
          if (!target.caption) target.caption = { nb: '', en: '' };
          target.alt[lang] = source.alt?.[lang] || '';
          target.caption[lang] = source.caption?.[lang] || '';
          target.fullWidth = source.fullWidth ?? target.fullWidth;
          break;
        case 'button':
          if (!target.text) target.text = { nb: '', en: '' };
          target.text[lang] = source.text?.[lang] || '';
          target.url = source.url || target.url;
          target.style = source.style || target.style;
          target.newTab = source.newTab ?? target.newTab;
          break;
        case 'list':
          target.listType = source.listType || target.listType;
          if (!target.items) target.items = { nb: [], en: [] };
          target.items[lang] = Array.isArray(source.items?.[lang]) ? source.items[lang].slice() : [];
          break;
        case 'columns':
          if (!target.left) target.left = { nb: '', en: '' };
          if (!target.right) target.right = { nb: '', en: '' };
          target.left[lang] = source.left?.[lang] || '';
          target.right[lang] = source.right?.[lang] || '';
          target.stack = source.stack ?? target.stack;
          break;
        case 'video':
          target.url = source.url || target.url;
          if (!target.caption) target.caption = { nb: '', en: '' };
          target.caption[lang] = source.caption?.[lang] || '';
          target.aspect = source.aspect || target.aspect;
          break;
        case 'contact':
          if (!target.heading) target.heading = { nb: '', en: '' };
          if (!target.intro) target.intro = { nb: '', en: '' };
          if (!target.success) target.success = { nb: '', en: '' };
          target.heading[lang] = source.heading?.[lang] || '';
          target.intro[lang] = source.intro?.[lang] || '';
          target.success[lang] = source.success?.[lang] || '';
          target.recipient = source.recipient || target.recipient;
          target.showPhone = source.showPhone ?? target.showPhone;
          break;
        case 'html':
        default:
          if (!target.code) target.code = { nb: '', en: '' };
          target.code[lang] = source.code?.[lang] || '';
          break;
      }
    }

    function mergeLanguageBlocks(base, altBlocks, lang){
      altBlocks.forEach((altBlock, idx) => {
        const direct = base[idx];
        if (direct && direct.type === altBlock.type) {
          copyBlockLang(direct, altBlock, lang);
          return;
        }
        const fallbackIndex = base.findIndex(block => block.type === altBlock.type && !hasLangContent(block, lang));
        if (fallbackIndex >= 0) {
          copyBlockLang(base[fallbackIndex], altBlock, lang);
          return;
        }
        const insertIndex = Math.min(idx, base.length);
        base.splice(insertIndex, 0, normalizeBlock(altBlock));
      });
    }

    function parseHtmlToBlocks(html, lang){
      const tpl = document.createElement('template');
      tpl.innerHTML = html || '';
      const nodes = [];
      tpl.content.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim()) nodes.push(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          nodes.push(node);
        }
      });
      const blocks = [];
      nodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (!text) return;
          const block = makeBlock('text', false);
          block.text[lang] = text;
          blocks.push(block);
          return;
        }
        const elNode = node;
        const tag = elNode.tagName.toLowerCase();
        let block = null;
        if (/^h[1-6]$/.test(tag)) {
          block = makeBlock('heading', false);
          block.level = tag;
          block.text[lang] = elNode.textContent.trim();
        } else if (tag === 'p') {
          const inner = elNode.innerHTML.trim();
          if (/<(?!br\b)/i.test(inner)) {
            block = makeBlock('html', false);
            block.code[lang] = elNode.outerHTML.trim();
          } else {
            block = makeBlock('text', false);
            block.text[lang] = elNode.textContent.trim();
          }
        } else if (tag === 'ul' || tag === 'ol') {
          block = makeBlock('list', false);
          block.listType = tag;
          block.items[lang] = Array.from(elNode.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
        } else if (tag === 'figure' && elNode.querySelector('img')) {
          block = makeBlock('image', false);
          const img = elNode.querySelector('img');
          block.src = img?.getAttribute('src') || '';
          block.alt[lang] = img?.getAttribute('alt') || '';
          const cap = elNode.querySelector('figcaption');
          if (cap) block.caption[lang] = cap.textContent.trim();
        } else if (tag === 'img') {
          block = makeBlock('image', false);
          block.src = elNode.getAttribute('src') || '';
          block.alt[lang] = elNode.getAttribute('alt') || '';
        } else if (tag === 'a') {
          block = makeBlock('button', false);
          block.url = elNode.getAttribute('href') || '';
          block.text[lang] = elNode.textContent.trim();
          block.newTab = elNode.getAttribute('target') === '_blank';
        } else if (tag === 'iframe') {
          block = makeBlock('video', false);
          block.url = elNode.getAttribute('src') || '';
        } else {
          block = makeBlock('html', false);
          block.code[lang] = elNode.outerHTML.trim();
        }
        if (block) blocks.push(block);
      });
      return blocks;
    }

    function deriveBlocksFromHtml(nbHtml, enHtml){
      const nbBlocks = parseHtmlToBlocks(nbHtml, 'nb').map(normalizeBlock);
      const base = nbBlocks.slice();
      const enBlocks = parseHtmlToBlocks(enHtml, 'en').map(normalizeBlock);
      if (!base.length && enBlocks.length) {
        return enBlocks.map(normalizeBlock);
      }
      mergeLanguageBlocks(base, enBlocks, 'en');
      if (!base.length && (nbHtml || enHtml)) {
        const fallback = makeBlock('html', false);
        fallback.code.nb = nbHtml || '';
        fallback.code.en = enHtml || '';
        base.push(fallback);
      }
      return base.map(normalizeBlock);
    }

    function resetBuilder(){
      builder.blocks = [];
      builder.lang = 'nb';
      updateLangButtons();
      renderBlocks();
    }

    function loadBuilderFromDoc(doc){
      const sourceBlocks = Array.isArray(doc?.builder?.blocks) ? doc.builder.blocks : null;
      builder.lang = 'nb';
      updateLangButtons();
      if (sourceBlocks && sourceBlocks.length) {
        builder.blocks = sourceBlocks.map(normalizeBlock);
      } else {
        const nb = el.bodyNb?.value || '';
        const en = el.bodyEn?.value || '';
        try {
          builder.blocks = deriveBlocksFromHtml(nb, en);
        } catch (err) {
          const fallback = makeBlock('html', false);
          fallback.code.nb = nb;
          fallback.code.en = en;
          builder.blocks = [fallback];
        }
      }
      renderBlocks();
    }

    function addBlock(type, initial){
      const block = normalizeBlock(initial || makeBlock(type, true));
      builder.blocks.push(block);
      renderBlocks();
    }

    function removeBlock(index){
      if (index < 0 || index >= builder.blocks.length) return;
      builder.blocks.splice(index, 1);
      renderBlocks();
    }

    function duplicateBlock(index){
      const block = builder.blocks[index];
      if (!block) return;
      const copy = normalizeBlock({ ...cloneBlock(block), id: makeId() });
      builder.blocks.splice(index + 1, 0, copy);
      renderBlocks();
    }

    function moveBlock(from, to){
      if (from === to) return;
      if (from < 0 || from >= builder.blocks.length) return;
      if (to < 0) to = 0;
      if (to >= builder.blocks.length) to = builder.blocks.length - 1;
      const [blk] = builder.blocks.splice(from, 1);
      builder.blocks.splice(to, 0, blk);
      renderBlocks();
    }

    function buildFields(block, container){
      const lang = builder.lang === 'en' ? 'en' : 'nb';
      const langLabel = lang === 'en' ? 'English' : 'Norsk';
      const field = (labelText) => {
        const wrap = ce('label');
        wrap.className = 'builder-field';
        if (labelText) {
          const span = ce('span');
          span.textContent = labelText;
          wrap.append(span);
        }
        return wrap;
      };

      if (block.type === 'heading') {
        const levelField = field('Nivå');
        const select = ce('select');
        ['h1','h2','h3','h4','h5','h6'].forEach(tag => {
          const opt = ce('option');
          opt.value = tag;
          opt.textContent = tag.toUpperCase();
          if ((block.level || 'h2') === tag) opt.selected = true;
          select.append(opt);
        });
        select.addEventListener('change', () => { block.level = select.value; scheduleSync(); });
        levelField.append(select);
        container.append(levelField);

        const alignField = field('Justering');
        const alignSelect = ce('select');
        [['left','Venstre'],['center','Midt'],['right','Høyre']].forEach(([value, label]) => {
          const opt = ce('option');
          opt.value = value;
          opt.textContent = label;
          if ((block.align || 'left') === value) opt.selected = true;
          alignSelect.append(opt);
        });
        alignSelect.addEventListener('change', () => { block.align = alignSelect.value; scheduleSync(); });
        alignField.append(alignSelect);
        container.append(alignField);

        const textField = field(`Tekst (${langLabel})`);
        const input = ce('input');
        input.type = 'text';
        input.value = block.text?.[lang] || '';
        input.addEventListener('input', () => { if (!block.text) block.text = { nb: '', en: '' }; block.text[lang] = input.value; scheduleSync(); });
        textField.append(input);
        container.append(textField);
        return;
      }

      if (block.type === 'text') {
        const textField = field(`Tekst (${langLabel})`);
        const textarea = ce('textarea');
        textarea.rows = 4;
        textarea.value = block.text?.[lang] || '';
        textarea.addEventListener('input', () => { if (!block.text) block.text = { nb: '', en: '' }; block.text[lang] = textarea.value; scheduleSync(); });
        textField.append(textarea);
        container.append(textField);
        const hint = ce('div'); hint.className = 'muted'; hint.textContent = 'Bruk blank linje for å lage nye avsnitt.';
        container.append(hint);
        return;
      }

      if (block.type === 'image') {
        const srcField = field('Bilde-URL');
        const srcInput = ce('input');
        srcInput.type = 'text';
        srcInput.value = block.src || '';
        srcInput.addEventListener('input', () => { block.src = srcInput.value.trim(); scheduleSync(); });
        srcField.append(srcInput);
        container.append(srcField);

        const altField = field(`Alt-tekst (${langLabel})`);
        const altInput = ce('input');
        altInput.type = 'text';
        altInput.value = block.alt?.[lang] || '';
        altInput.addEventListener('input', () => { if (!block.alt) block.alt = { nb: '', en: '' }; block.alt[lang] = altInput.value; scheduleSync(); });
        altField.append(altInput);
        container.append(altField);

        const capField = field(`Bildetekst (${langLabel})`);
        const capInput = ce('input');
        capInput.type = 'text';
        capInput.value = block.caption?.[lang] || '';
        capInput.addEventListener('input', () => { if (!block.caption) block.caption = { nb: '', en: '' }; block.caption[lang] = capInput.value; scheduleSync(); });
        capField.append(capInput);
        container.append(capField);

        const fullField = field('Full bredde');
        const chk = ce('input');
        chk.type = 'checkbox';
        chk.checked = Boolean(block.fullWidth);
        chk.addEventListener('change', () => { block.fullWidth = chk.checked; scheduleSync(); });
        fullField.append(chk);
        container.append(fullField);
        return;
      }

      if (block.type === 'button') {
        const textField = field(`Tekst (${langLabel})`);
        const textInput = ce('input');
        textInput.type = 'text';
        textInput.value = block.text?.[lang] || '';
        textInput.addEventListener('input', () => { if (!block.text) block.text = { nb: '', en: '' }; block.text[lang] = textInput.value; scheduleSync(); });
        textField.append(textInput);
        container.append(textField);

        const urlField = field('Lenkeadresse (URL)');
        const urlInput = ce('input');
        urlInput.type = 'text';
        urlInput.value = block.url || '';
        urlInput.addEventListener('input', () => { block.url = urlInput.value.trim(); scheduleSync(); });
        urlField.append(urlInput);
        container.append(urlField);

        const styleField = field('Stil');
        const styleSelect = ce('select');
        [['primary','Primær'],['secondary','Sekundær'],['link','Lenke']].forEach(([value, label]) => {
          const opt = ce('option');
          opt.value = value;
          opt.textContent = label;
          if ((block.style || 'primary') === value) opt.selected = true;
          styleSelect.append(opt);
        });
        styleSelect.addEventListener('change', () => { block.style = styleSelect.value; scheduleSync(); });
        styleField.append(styleSelect);
        container.append(styleField);

        const newTabField = field('Åpne i ny fane');
        const chk = ce('input');
        chk.type = 'checkbox';
        chk.checked = Boolean(block.newTab);
        chk.addEventListener('change', () => { block.newTab = chk.checked; scheduleSync(); });
        newTabField.append(chk);
        container.append(newTabField);
        return;
      }

      if (block.type === 'list') {
        const typeField = field('Liste-type');
        const typeSelect = ce('select');
        [['ul','Punktliste'],['ol','Nummerert liste']].forEach(([value, label]) => {
          const opt = ce('option');
          opt.value = value;
          opt.textContent = label;
          if ((block.listType || 'ul') === value) opt.selected = true;
          typeSelect.append(opt);
        });
        typeSelect.addEventListener('change', () => { block.listType = typeSelect.value; scheduleSync(); });
        typeField.append(typeSelect);
        container.append(typeField);

        const itemsField = field(`Elementer (${langLabel}) – én per linje`);
        const itemsArea = ce('textarea');
        itemsArea.rows = 4;
        itemsArea.value = Array.isArray(block.items?.[lang]) ? block.items[lang].join('\n') : '';
        itemsArea.addEventListener('input', () => { if (!block.items) block.items = { nb: [], en: [] }; block.items[lang] = itemsArea.value.split(/\n+/).map(v => v.trim()).filter(Boolean); scheduleSync(); });
        itemsField.append(itemsArea);
        container.append(itemsField);
        return;
      }

      if (block.type === 'columns') {
        const leftField = field(`Venstre kolonne (${langLabel})`);
        const leftArea = ce('textarea');
        leftArea.rows = 4;
        leftArea.value = block.left?.[lang] || '';
        leftArea.addEventListener('input', () => { if (!block.left) block.left = { nb: '', en: '' }; block.left[lang] = leftArea.value; scheduleSync(); });
        leftField.append(leftArea);
        container.append(leftField);

        const rightField = field(`Høyre kolonne (${langLabel})`);
        const rightArea = ce('textarea');
        rightArea.rows = 4;
        rightArea.value = block.right?.[lang] || '';
        rightArea.addEventListener('input', () => { if (!block.right) block.right = { nb: '', en: '' }; block.right[lang] = rightArea.value; scheduleSync(); });
        rightField.append(rightArea);
        container.append(rightField);

        const stackField = field('Stable på mobil');
        const stackChk = ce('input');
        stackChk.type = 'checkbox';
        stackChk.checked = block.stack !== false;
        stackChk.addEventListener('change', () => { block.stack = stackChk.checked; scheduleSync(); });
        stackField.append(stackChk);
        container.append(stackField);
        return;
      }

      if (block.type === 'video') {
        const urlField = field('Video-URL (YouTube/Vimeo)');
        const urlInput = ce('input');
        urlInput.type = 'text';
        urlInput.value = block.url || '';
        urlInput.addEventListener('input', () => { block.url = urlInput.value.trim(); scheduleSync(); });
        urlField.append(urlInput);
        container.append(urlField);

        const capField = field(`Bildetekst (${langLabel})`);
        const capInput = ce('input');
        capInput.type = 'text';
        capInput.value = block.caption?.[lang] || '';
        capInput.addEventListener('input', () => { if (!block.caption) block.caption = { nb: '', en: '' }; block.caption[lang] = capInput.value; scheduleSync(); });
        capField.append(capInput);
        container.append(capField);

        const aspectField = field('Format');
        const aspectSelect = ce('select');
        [['16x9','16:9'],['4x3','4:3'],['1x1','1:1']].forEach(([value, label]) => {
          const opt = ce('option');
          opt.value = value;
          opt.textContent = label;
          if ((block.aspect || '16x9') === value) opt.selected = true;
          aspectSelect.append(opt);
        });
        aspectSelect.addEventListener('change', () => { block.aspect = aspectSelect.value; scheduleSync(); });
        aspectField.append(aspectSelect);
        container.append(aspectField);
        return;
      }

      if (block.type === 'contact') {
        const headField = field(`Overskrift (${langLabel})`);
        const headInput = ce('input');
        headInput.type = 'text';
        headInput.value = block.heading?.[lang] || '';
        headInput.addEventListener('input', () => { if (!block.heading) block.heading = { nb: '', en: '' }; block.heading[lang] = headInput.value; scheduleSync(); });
        headField.append(headInput);
        container.append(headField);

        const introField = field(`Intro (${langLabel})`);
        const introArea = ce('textarea');
        introArea.rows = 4;
        introArea.value = block.intro?.[lang] || '';
        introArea.addEventListener('input', () => { if (!block.intro) block.intro = { nb: '', en: '' }; block.intro[lang] = introArea.value; scheduleSync(); });
        introField.append(introArea);
        container.append(introField);

        const successField = field(`Suksessmelding (${langLabel})`);
        const successInput = ce('input');
        successInput.type = 'text';
        successInput.value = block.success?.[lang] || '';
        successInput.addEventListener('input', () => { if (!block.success) block.success = { nb: '', en: '' }; block.success[lang] = successInput.value; scheduleSync(); });
        successField.append(successInput);
        container.append(successField);

        const recField = field('Mottaker e-post');
        const recInput = ce('input');
        recInput.type = 'email';
        recInput.placeholder = 'kontakt@firma.no';
        recInput.value = block.recipient || '';
        recInput.addEventListener('input', () => { block.recipient = recInput.value.trim(); scheduleSync(); });
        recField.append(recInput);
        container.append(recField);

        const phoneField = field('Inkluder telefonfelt');
        const phoneChk = ce('input');
        phoneChk.type = 'checkbox';
        phoneChk.checked = block.showPhone !== false;
        phoneChk.addEventListener('change', () => { block.showPhone = phoneChk.checked; scheduleSync(); });
        phoneField.append(phoneChk);
        container.append(phoneField);
        return;
      }

      const codeField = field(`HTML (${langLabel})`);
      const codeArea = ce('textarea');
      codeArea.rows = 6;
      codeArea.value = block.code?.[lang] || '';
      codeArea.addEventListener('input', () => { if (!block.code) block.code = { nb: '', en: '' }; block.code[lang] = codeArea.value; scheduleSync(); });
      codeField.append(codeArea);
      container.append(codeField);
      const note = ce('div'); note.className = 'muted'; note.textContent = 'HTML-blokken rendres som skrevet. Bruk med forsiktighet.';
      container.append(note);
    }

    function createBlockElement(block, index){
      const wrap = ce('div');
      wrap.className = 'builder-block';
      wrap.draggable = true;
      wrap.dataset.index = String(index);

      const head = ce('div');
      head.className = 'block-head';
      const titleWrap = ce('div');
      titleWrap.className = 'block-title';
      const drag = ce('span');
      drag.className = 'builder-drag';
      drag.textContent = '☰';
      const label = ce('span');
      label.textContent = blockLabels[block.type] || block.type;
      titleWrap.append(drag, label);
      head.append(titleWrap);

      const actions = ce('div');
      actions.className = 'block-actions';
      const up = ce('button'); up.type = 'button'; up.textContent = '↑'; up.addEventListener('click', () => moveBlock(index, index - 1));
      const down = ce('button'); down.type = 'button'; down.textContent = '↓'; down.addEventListener('click', () => moveBlock(index, index + 1));
      const dup = ce('button'); dup.type = 'button'; dup.textContent = 'Dupliser'; dup.addEventListener('click', () => duplicateBlock(index));
      const del = ce('button'); del.type = 'button'; del.textContent = 'Slett'; del.addEventListener('click', () => removeBlock(index));
      actions.append(up, down, dup, del);
      head.append(actions);
      wrap.append(head);

      const fields = ce('div');
      fields.className = 'builder-fields';
      buildFields(block, fields);
      wrap.append(fields);

      wrap.addEventListener('dragstart', (e) => {
        draggingIndex = index;
        wrap.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      });
      wrap.addEventListener('dragend', () => {
        draggingIndex = null;
        wrap.classList.remove('dragging');
        if (el.builderDrop) el.builderDrop.classList.remove('active');
      });
      wrap.addEventListener('dragover', (e) => {
        if (draggingIndex === null) return;
        e.preventDefault();
        wrap.classList.add('drag-over');
      });
      wrap.addEventListener('dragleave', () => {
        wrap.classList.remove('drag-over');
      });
      wrap.addEventListener('drop', (e) => {
        if (draggingIndex === null) return;
        e.preventDefault();
        wrap.classList.remove('drag-over');
        const rect = wrap.getBoundingClientRect();
        const dropAfter = (e.clientY - rect.top) > rect.height / 2;
        let insertIndex = index + (dropAfter ? 1 : 0);
        if (draggingIndex < insertIndex) insertIndex -= 1;
        if (insertIndex < 0) insertIndex = 0;
        const [blk] = builder.blocks.splice(draggingIndex, 1);
        builder.blocks.splice(insertIndex, 0, blk);
        draggingIndex = null;
        renderBlocks();
      });

      return wrap;
    }

    function renderBlocks(){
      if (!el.builderList) return;
      const items = builder.blocks.map((block, index) => createBlockElement(block, index));
      el.builderList.replaceChildren(...items);
      if (el.builderEmpty) el.builderEmpty.classList.toggle('hidden', builder.blocks.length > 0);
      if (el.builderDrop) el.builderDrop.classList.toggle('hidden', builder.blocks.length === 0);
      updateBodiesFromBuilder();
    }

    if (el.builderAdd){
      el.builderAdd.addEventListener('click', (e) => {
        const btn = e.target.closest('.builder-add-btn');
        if (!btn) return;
        e.preventDefault();
        addBlock(btn.dataset.type);
      });
    }

    builderLangBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        setBuilderLang(btn.dataset.lang);
      });
    });

    if (el.builderDrop){
      el.builderDrop.addEventListener('dragover', (e) => {
        if (draggingIndex === null) return;
        e.preventDefault();
        el.builderDrop.classList.add('active');
      });
      el.builderDrop.addEventListener('dragleave', () => {
        el.builderDrop.classList.remove('active');
      });
      el.builderDrop.addEventListener('drop', (e) => {
        if (draggingIndex === null) return;
        e.preventDefault();
        el.builderDrop.classList.remove('active');
        const [blk] = builder.blocks.splice(draggingIndex, 1);
        builder.blocks.push(blk);
        draggingIndex = null;
        renderBlocks();
      });
    }

    updateLangButtons();
    renderBlocks();

    function setMsg(t){ el.msg.textContent = t || ''; }
    function setEditMsg(t){ el.editMsg.textContent = t || ''; }
    function setMenuMsg(t){ el.menuMsg.textContent = t || ''; }

    async function token(){
      return localStorage.getItem('nfcking.idToken') || '';
    }
    async function buildApiError(res, fallback){
      let message = fallback;
      let payload = null;
      try {
        const text = await res.text();
        if (text) {
          try {
            payload = JSON.parse(text);
          } catch {
            if (text.trim()) message = text.trim();
          }
        }
        if (payload) {
          const msg = payload.message || payload.error;
          if (typeof msg === 'string' && msg.trim()) message = msg.trim();
        }
      } catch (_) {}
      const err = new Error(message || fallback);
      err.status = res.status;
      if (payload && payload.error) err.code = payload.error;
      if (payload && payload.missing) err.missing = payload.missing;
      return err;
    }
    async function apiGet(url, params={}){
      const tk = await token();
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(url + (qs?`?${qs}`:''), { headers: { Authorization: tk?`Bearer ${tk}`:'' } });
      if(!res.ok) throw await buildApiError(res, `GET ${url} ${res.status}`);
      return res.json();
    }
    async function apiPost(url, body){
      const tk = await token();
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json', Authorization: tk?`Bearer ${tk}`:''}, body: JSON.stringify(body||{}) });
      if(!res.ok) throw await buildApiError(res, `POST ${url} ${res.status}`);
      return res.json();
    }

    function fmtDate(ts){
      try{ const d = new Date(ts); return d.toLocaleString(); }catch{ return '—'; }
    }

    function renderPages(pages){
      lastPages = pages || [];
      const rows = lastPages.map(p=>{
        const tr = ce('tr');
        const td = (n)=>{ const t=ce('td'); t.style.cssText='padding:8px;border-bottom:1px solid #1b2030;vertical-align:top'; t.append(n); return t; };

        tr.appendChild(td(document.createTextNode((p.title?.nb || p.title?.en || '—'))));
        tr.appendChild(td(document.createTextNode(p.slug || '—')));
        tr.appendChild(td(document.createTextNode(p.status || 'draft')));
        tr.appendChild(td(document.createTextNode(p.updatedAt ? fmtDate(p.updatedAt) : '—')));

        const actions = ce('div'); actions.style.display='flex'; actions.style.gap='6px'; actions.style.flexWrap='wrap';
        const bEdit = ce('button'); bEdit.className='tab-btn'; bEdit.textContent='Rediger';
        const bPub  = ce('button'); bPub.className='tab-btn'; bPub.textContent='Publiser';
        const bPrev = ce('button'); bPrev.className='tab-btn'; bPrev.textContent='Vis';
        const bDel  = ce('button'); bDel.className='tab-btn'; bDel.textContent='Slett';

        bEdit.onclick = ()=> openEditor(p.slug);
        bPub.onclick  = async ()=>{
          setMsg('Publiserer …');
          try{
            const publishRes = await apiPost(API.publish, { slug:p.slug });
            const displayUrl = publishRes?.previewUrl
              || (Array.isArray(publishRes?.urls) && publishRes.urls[0])
              || `/${p.slug}`;
            const absoluteUrl = displayUrl.startsWith('http')
              ? displayUrl
              : new URL(displayUrl, location.origin).href;
            setMsg(`Publisert: ${absoluteUrl}`);
            await loadPages();
          }catch(err){
            const msg = err?.message ? `Publisering feilet: ${err.message}` : 'Publisering feilet.';
            setMsg(msg);
          }
        };
        const previewUrl = p.previewUrl || (p.slug === 'index' ? '/' : `/${p.slug.replace(/^\/+/, '')}`);
        bPrev.onclick = ()=> window.open(previewUrl, '_blank');
        bDel.onclick = async ()=>{
          if(!confirm(`Slette side /${p.slug}?`)) return;
          setMsg('Sletter …');
          try{
            await apiPost(API.del, { slug:p.slug });
            setMsg(`Slettet /${p.slug}`);
            await loadPages();
          }catch(err){
            const msg = err?.message ? `Sletting feilet: ${err.message}` : 'Sletting feilet.';
            setMsg(msg);
          }
        };

        actions.append(bEdit,bPub,bPrev,bDel);
        tr.appendChild(td(actions));
        return tr;
      });

      el.table.replaceChildren(...rows);
    }

    async function loadPages(){
      setMsg('Laster sider …');
      try{
        const data = await apiGet(API.list, { q: el.search.value || '', status: el.status.value || '', limit: 100 });
        renderPages(data.pages || []);
        setMsg(`Fant ${data.count ?? (data.pages||[]).length} sider.`);
      }catch(err){
        const msg = err?.message ? `Kunne ikke hente sider: ${err.message}` : 'Kunne ikke hente sider.';
        setMsg(msg);
      }
    }

    function openEditor(slug){
      if(!slug){
        editingId = null;
        editingSource = null;
        el.editorTitle.textContent = 'Ny side';
        el.slug.value=''; el.statusEdit.value='draft'; el.scheduleAt.value=''; el.org.value='';
        el.titleNb.value=''; el.titleEn.value='';
        el.bodyNb.value=''; el.bodyEn.value='';
        el.seoTitle.value=''; el.seoDesc.value=''; el.seoOg.value=''; el.seoCanonical.value='';
        el.menuShow.value='true'; el.menuOrder.value='10';
        resetBuilder();
        setEditMsg('');
        el.editor.classList.remove('hidden');
        return;
      }
      setMsg('Åpner side …');
      apiGet(API.get, { slug }).then(p=>{
        editingId = slug;
        editingSource = p.source || null;
        el.editorTitle.textContent = `Rediger: /${slug}`;
        el.slug.value = p.slug || slug;
        el.statusEdit.value = p.status || 'draft';
        el.scheduleAt.value = p.scheduleAt ? new Date(p.scheduleAt).toISOString().slice(0,16) : '';
        el.org.value = p.orgKey || '';
        el.titleNb.value = p.title?.nb || '';
        el.titleEn.value = p.title?.en || '';
        el.bodyNb.value  = p.body?.nb  || '';
        el.bodyEn.value  = p.body?.en  || '';
        el.seoTitle.value = p.seo?.title || '';
        el.seoDesc.value  = p.seo?.description || '';
        el.seoOg.value    = p.seo?.ogImage || '';
        el.seoCanonical.value = p.seo?.canonical || '';
        el.menuShow.value = String(p.menu?.show ?? true);
        el.menuOrder.value = Number(p.menu?.order ?? 10);
        loadBuilderFromDoc(p);
        setEditMsg('');
        el.editor.classList.remove('hidden');
        setMsg('');
      }).catch((err)=> {
        const msg = err?.message ? `Kunne ikke åpne side: ${err.message}` : 'Kunne ikke åpne side.';
        setMsg(msg);
      });
    }

    function sanitizeSlugInput(value){
      const raw = String(value || '').trim();
      return raw.replace(/^\/+/, '').replace(/\/+$/, '');
    }

    function collectPage(statusOverride){
      updateBodiesFromBuilder();
      const scheduleValue = el.scheduleAt.value ? new Date(el.scheduleAt.value).toISOString() : null;
      const slug = sanitizeSlugInput(el.slug.value || '');
      if (el.slug && el.slug.value !== slug) {
        el.slug.value = slug;
      }
      return {
        slug,
        status: statusOverride || el.statusEdit.value || 'draft',
        scheduleAt: scheduleValue,
        orgKey: (el.org.value || '').trim() || null,
        title: { nb: el.titleNb.value || '', en: el.titleEn.value || '' },
        body:  { nb: el.bodyNb.value  || '', en: el.bodyEn.value  || '' },
        seo:   { title: el.seoTitle.value || '', description: el.seoDesc.value || '', ogImage: el.seoOg.value || '', canonical: el.seoCanonical.value || '' },
        menu:  { show: el.menuShow.value === 'true', order: Number(el.menuOrder.value || 10) },
        builder: { version: 1, blocks: builder.blocks.map(cloneBlock) },
        source: editingSource || null
      };
    }

    async function saveDraft(){
      const doc = collectPage('draft');
      if(!doc.slug){ setEditMsg('Slug er påkrevd.'); return; }
      setEditMsg('Lagrer kladd …');
      try{
        await apiPost(API.save, doc);
        setEditMsg('Kladd lagret.');
        await loadPages();
      }catch(err){
        const msg = err?.message ? `Lagring feilet: ${err.message}` : 'Lagring feilet.';
        setEditMsg(msg);
      }
    }

    async function publishNow(){
      const doc = collectPage('published');
      if(!doc.slug){ setEditMsg('Slug er påkrevd.'); return; }
      setEditMsg('Publiserer …');
      try{
        await apiPost(API.save, doc);
        const publishRes = await apiPost(API.publish, { slug: doc.slug });
        const displayUrl = publishRes?.previewUrl
          || (Array.isArray(publishRes?.urls) && publishRes.urls[0])
          || `/${doc.slug}`;
        const absoluteUrl = displayUrl.startsWith('http')
          ? displayUrl
          : new URL(displayUrl, location.origin).href;
        setEditMsg(`Publisert: ${absoluteUrl}`);
        await loadPages();
      }catch(err){
        const msg = err?.message ? `Publisering feilet: ${err.message}` : 'Publisering feilet.';
        setEditMsg(msg);
      }
    }

    el.refresh.addEventListener('click', loadPages);
    el.search.addEventListener('input', loadPages);
    el.status.addEventListener('change', loadPages);
    el.create.addEventListener('click', ()=> openEditor(null));
    el.saveDraft.addEventListener('click', saveDraft);
    el.publish.addEventListener('click', publishNow);
    el.preview.addEventListener('click', ()=>{
      const slug = (el.slug.value||'').trim();
      if(!slug) { setEditMsg('Sett slug først.'); return; }
      const url = slug === 'index' ? '/' : `/${slug.replace(/^\/+/, '')}`;
      window.open(url, '_blank');
    });
    el.close.addEventListener('click', ()=> el.editor.classList.add('hidden'));

    function onTabChange(){
      const active = (location.hash||'#branding').replace('#','');
      if(active==='pages'){ loadPages(); loadMenu(); }
    }
    window.addEventListener('hashchange', onTabChange);
    onTabChange();

    function menuRow(item, idx){
      const wrap = ce('div'); wrap.className='card'; wrap.style.display='grid'; wrap.style.gap='8px'; wrap.style.gridTemplateColumns='1fr 1fr auto';
      const lbl = ce('input'); lbl.type='text'; lbl.value=item.label||''; lbl.placeholder='Label';
      const href= ce('input'); href.type='text'; href.value=item.href||''; href.placeholder='/bestill-kort';
      const controls = ce('div'); controls.style.display='flex'; controls.style.gap='6px';
      const up = ce('button'); up.className='tab-btn'; up.textContent='↑';
      const down = ce('button'); down.className='tab-btn'; down.textContent='↓';
      const del = ce('button'); del.className='tab-btn'; del.textContent='Slett';

      up.onclick = ()=> move(idx, -1);
      down.onclick = ()=> move(idx, +1);
      del.onclick = ()=> { state.menu.splice(idx,1); renderMenu(); };

      lbl.oninput = ()=> state.menu[idx].label = lbl.value;
      href.oninput = ()=> state.menu[idx].href  = href.value;

      controls.append(up,down,del);
      wrap.append(lbl, href, controls);
      return wrap;
    }

    const state = { menu: [] };

    function renderMenu(){
      el.menuList.replaceChildren(...state.menu.map(menuRow));
    }
    function move(i, d){
      const j = i + d; if(j<0 || j>=state.menu.length) return;
      const tmp = state.menu[i]; state.menu[i]=state.menu[j]; state.menu[j]=tmp;
      renderMenu();
    }

    async function loadMenu(){
      setMenuMsg('Laster meny …');
      try{
        const data = await apiGet(API.menuGet, {});
        state.menu = Array.isArray(data.nav) ? data.nav : [];
        renderMenu();
        setMenuMsg(`Meny lastet (${state.menu.length} element).`);
      }catch{
        setMenuMsg('Kunne ikke laste meny.');
      }
    }
    async function saveMenu(){
      setMenuMsg('Lagrer meny …');
      try{
        await apiPost(API.menuSave, { nav: state.menu });
        setMenuMsg('Meny lagret.');
      }catch{
        setMenuMsg('Kunne ikke lagre meny.');
      }
    }

    el.menuAdd.addEventListener('click', ()=>{
      state.menu.push({ label:'Ny side', href:'/' });
      renderMenu();
    });
    el.menuSave.addEventListener('click', saveMenu);

  })();
  

(function(){
  // ----- helpers -----
  const qs=(s,r=document)=>r.querySelector(s);
  const ce=(t)=>document.createElement(t);
  const API={

  };
  async function token(){ return localStorage.getItem('nfcking.idToken') || ''; }
  async function get(url, params={}){
    const t = await token();
    const q = new URLSearchParams(params).toString();
    const res = await fetch(url+(q?`?${q}`:''), { headers:{ Authorization: t?`Bearer ${t}`:'' }});
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async function post(url, body){
    const t = await token();
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json', Authorization: t?`Bearer ${t}`:''}, body: JSON.stringify(body||{}) });
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // ----- Konfig -----
  const el = {
    mode: qs('#stMode'),
    pub: qs('#stPubKey'),
    connect: qs('#stConnect'),
    webhookInfo: qs('#stWebhookInfo'),
    load: qs('#stLoad'),
    save: qs('#stSave'),
    msg: qs('#stMsg'),

    // produkter
    prodReload: qs('#stProdReload'),
    prodNew: qs('#stProdNew'),
    prodForm: qs('#stProdForm'),
    prodName: qs('#stNewProdName'),
    prodDesc: qs('#stNewProdDesc'),
    prodCreate: qs('#stProdCreate'),
    prodCancel: qs('#stProdCancel'),
    prodMsg: qs('#stProdMsg'),
    prodSearch: qs('#stProdSearch'),
    prodTable: qs('#stProdTable tbody'),

    // priser (skapes inline pr produkt)
    // betalinger
    chStatus: qs('#stChStatus'),
    chFrom: qs('#stChFrom'),
    chTo: qs('#stChTo'),
    chReload: qs('#stChReload'),
    chMsg: qs('#stChMsg'),
    chTable: qs('#stChTable tbody'),

    // kunder
    custEmail: qs('#stCustEmail'),
    custReload: qs('#stCustReload'),
    custCreate: qs('#stCustCreate'),
    custMsg: qs('#stCustMsg'),
    custTable: qs('#stCustTable tbody'),

    // test
    testPrice: qs('#stTestPrice'),
    testQty: qs('#stTestQty'),
    testStart: qs('#stStartCheckout'),
    testMsg: qs('#stTestMsg'),
  };

  async function loadCfg(){
    el.msg.textContent='Laster...';
    try{
      const d = await get(API.cfg, {});
      el.mode.value = d.mode || 'test';
      el.pub.value = d.publishableKey || '';
      el.connect.value = String(d.connect?.enabled || false);
      el.webhookInfo.textContent = 'Webhook secret: ' + (d.hasWebhookSecret ? 'satt ✅' : 'mangler ❌');
      el.msg.textContent='OK';
    }catch(e){ el.msg.textContent='Kunne ikke hente konfig.'; }
  }
  async function saveCfg(){
    el.msg.textContent='Lagrer...';
    try{
      await post(API.cfg, {
        mode: el.mode.value,
        publishableKey: el.pub.value,
        connect: { enabled: el.connect.value === 'true' }
      });
      el.msg.textContent='Lagret.';
    }catch(e){ el.msg.textContent='Lagring feilet.'; }
  }
  el.load.addEventListener('click', loadCfg);
  el.save.addEventListener('click', saveCfg);

  // ----- Produkter & priser -----
  let products = [];
  function renderProducts(){
    const q = (el.prodSearch.value||'').toLowerCase();
    const rows = [];
    products.forEach(p=>{
      if(q && !String(p.name||'').toLowerCase().includes(q)) return;
      const tr = ce('tr');
      const td=(n)=>{ const t=ce('td'); t.style.cssText='padding:8px;border-bottom:1px solid #1b2030;vertical-align:top'; t.append(n); return t; };

      // navn
      tr.appendChild(td(document.createTextNode(p.name)));

      // priser
      const wrap = ce('div'); wrap.style.display='flex'; wrap.style.flexDirection='column'; wrap.style.gap='4px';
      (p.prices||[]).forEach(pr=>{
        const line = ce('div');
        line.textContent = `${(pr.unit_amount/100).toFixed(2)} ${String(pr.currency||'').toUpperCase()} ${pr.recurring? `(${pr.recurring.interval})`:''}`;
        wrap.append(line);
      });
      tr.appendChild(td(wrap));

      // handlinger
      const actions = ce('div'); actions.style.display='flex'; actions.style.gap='6px'; actions.style.flexWrap='wrap';
      const makePrice = ce('button'); makePrice.className='tab-btn'; makePrice.textContent='+ Pris';
      makePrice.onclick = ()=> openPriceForm(p.id);
      actions.append(makePrice);
      tr.appendChild(td(actions));

      rows.push(tr);
    });
    el.prodTable.replaceChildren(...rows);
  }
  async function loadProducts(){
    el.prodMsg.textContent='Laster...';
    try{
      const d = await get(API.prods, { active:'true', limit: 50 });
      products = d.data || [];
      el.prodMsg.textContent = `Fant ${products.length} produkt.`;
      renderProducts();
    }catch(e){ el.prodMsg.textContent='Kunne ikke hente produkter.'; }
  }
  function toggleProdForm(show){
    el.prodForm.classList.toggle('hidden', !show);
    if(show) el.prodName.focus();
  }
  el.prodNew.addEventListener('click', ()=> toggleProdForm(true));
  el.prodCancel.addEventListener('click', ()=> toggleProdForm(false));
  el.prodCreate.addEventListener('click', async ()=>{
    const name = el.prodName.value.trim();
    if(!name){ el.prodMsg.textContent='Navn mangler.'; return; }
    el.prodMsg.textContent='Oppretter...';
    try{
      await post(API.prods, { name, description: el.prodDesc.value.trim(), prices: [] });
      el.prodMsg.textContent='Opprettet.';
      toggleProdForm(false); el.prodName.value=''; el.prodDesc.value='';
      await loadProducts();
    }catch(e){ el.prodMsg.textContent='Opprettelse feilet.'; }
  });
  el.prodReload.addEventListener('click', loadProducts);
  el.prodSearch.addEventListener('input', renderProducts);

  // inline pris-form (modal-ish)
  function openPriceForm(productId){
    const dlg = ce('div'); dlg.className='card'; dlg.style.cssText='position:fixed;inset:20% auto auto 50%;transform:translateX(-50%);max-width:480px;z-index:50';
    dlg.innerHTML = `
      <h3>Ny pris</h3>
      <div class="grid" style="gap:8px">
        <label>Valuta
          <input type="text" id="prCur" value="nok" />
        </label>
        <label>Beløp (øre)
          <input type="number" id="prAmt" value="9900" />
        </label>
        <label>Type
          <select id="prType"><option value="one_time">one_time</option><option value="recurring">recurring</option></select>
        </label>
        <label>Intervall (ved abonnement)
          <select id="prInterval"><option>month</option><option>year</option><option>week</option></select>
        </label>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button id="prSave" class="tab-btn">Lagre</button>
        <button id="prClose" class="tab-btn">Lukk</button>
        <span id="prMsg" class="muted"></span>
      </div>`;
    document.body.appendChild(dlg);
    qs('#prClose', dlg).onclick = ()=> dlg.remove();
    qs('#prSave', dlg).onclick = async ()=>{
      const cur = qs('#prCur', dlg).value.trim() || 'nok';
      const amt = Number(qs('#prAmt', dlg).value || 0);
      const type = qs('#prType', dlg).value;
      const interval = qs('#prInterval', dlg).value;
      qs('#prMsg', dlg).textContent='Lagrer...';
      try{
        await post(API.prices, { product: productId, currency: cur, unit_amount: amt, type: type==='recurring'?'recurring':'one_time', interval });
        qs('#prMsg', dlg).textContent='Lagret.';
        await loadProducts();
        setTimeout(()=> dlg.remove(), 400);
      }catch(e){ qs('#prMsg', dlg).textContent='Feil ved lagring.'; }
    };
  }

  // ----- Betalinger -----
  function renderCharges(list){
    const rows = (list||[]).map(c=>{
      const tr = ce('tr');
      const td=(n)=>{ const t=ce('td'); t.style.cssText='padding:8px;border-bottom:1px solid #1b2030;vertical-align:top'; t.append(n); return t; };
      tr.appendChild(td(document.createTextNode(new Date(c.created).toLocaleString())));
      tr.appendChild(td(document.createTextNode(`${(c.amount/100).toFixed(2)} ${c.currency}`)));
      tr.appendChild(td(document.createTextNode(c.customer?.email || c.customer?.id || '')));
      const actions = ce('div'); actions.style.display='flex'; actions.style.gap='6px';
      const refund = ce('button'); refund.className='tab-btn'; refund.textContent='Refund';
      refund.onclick = async ()=>{
        el.chMsg.textContent='Refunderer...';
        try{
          await post(API.refund, { chargeId: c.id });
          el.chMsg.textContent='Refundert.';
          await loadCharges();
        }catch(e){ el.chMsg.textContent='Refund feilet.'; }
      };
      actions.append(refund);
      tr.appendChild(td(actions));
      return tr;
    });
    el.chTable.replaceChildren(...rows);
  }
  async function loadCharges(){
    el.chMsg.textContent='Laster...';
    try{
      const params = { status: el.chStatus.value || '', limit: 50 };
      if(el.chFrom.value) params.from = el.chFrom.value;
      if(el.chTo.value) params.to = el.chTo.value;
      const d = await get(API.charges, params);
      renderCharges(d.data||[]);
      el.chMsg.textContent = `Rader: ${(d.data||[]).length}`;
    }catch(e){ el.chMsg.textContent='Kunne ikke hente betalinger.'; }
  }
  el.chReload.addEventListener('click', loadCharges);

  // ----- Kunder -----
  function renderCustomers(list){
    const rows = (list||[]).map(c=>{
      const tr = ce('tr');
      const td=(n)=>{ const t=ce('td'); t.style.cssText='padding:8px;border-bottom:1px solid #1b2030'; t.append(n); return t; };
      tr.appendChild(td(document.createTextNode(c.name || '—')));
      tr.appendChild(td(document.createTextNode(c.email || '—')));
      return tr;
    });
    el.custTable.replaceChildren(...rows);
  }
  async function loadCustomers(){
    el.custMsg.textContent='Laster...';
    try{
      const d = await get(API.customers, { email: (el.custEmail.value||'').trim() || undefined, limit: 50 });
      renderCustomers(d.data||[]);
      el.custMsg.textContent = `Kunder: ${(d.data||[]).length}`;
    }catch(e){ el.custMsg.textContent='Kunne ikke hente kunder.'; }
  }
  async function createCustomer(){
    const email = prompt('E-post for ny kunde:');
    if(!email) return;
    el.custMsg.textContent='Oppretter...';
    try{
      await post(API.customers, { email });
      el.custMsg.textContent='Opprettet.';
      await loadCustomers();
    }catch(e){ el.custMsg.textContent='Feil ved opprettelse.'; }
  }
  el.custReload.addEventListener('click', loadCustomers);
  el.custCreate.addEventListener('click', createCustomer);

  // ----- Test-checkout -----
  el.testStart.addEventListener('click', async ()=>{
    const priceId = (el.testPrice.value||'').trim();
    const qty = Math.max(1, Number(el.testQty.value||1));
    if(!priceId){ el.testMsg.textContent='Sett Price ID.'; return; }
    el.testMsg.textContent='Oppretter sesjon...';
    try{
      const d = await post(API.test, { priceId, quantity: qty, successUrl: location.origin + '/demo.html', cancelUrl: location.href });
      if(d.checkoutUrl){ window.open(d.checkoutUrl, '_blank'); el.testMsg.textContent='Åpnet Stripe Checkout.'; }
      else { el.testMsg.textContent='Fikk ikke URL.'; }
    }catch(e){ el.testMsg.textContent='Feil ved opprettelse.'; }
  });

  // Autoload når Stripe-fanen åpnes
  function onTabChange(){
    const active = (location.hash||'#branding').replace('#','');
    if(active==='stripe'){
      loadCfg(); loadProducts(); loadCharges(); loadCustomers();
    }
  }
  window.addEventListener('hashchange', onTabChange);
  onTabChange();
})();

(function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const ce=(t)=>document.createElement(t);
  const API={
    list:'/.netlify/functions/orders-list',
    get: '/.netlify/functions/orders-get',
    upd: '/.netlify/functions/orders-update',
    inv: '/.netlify/functions/orders-invoice',
    mail:'/.netlify/functions/orders-email',
    refund:'/.netlify/functions/orders-refund'
  };
  async function token(){ return localStorage.getItem('nfcking.idToken') || ''; }
  async function get(url, params={}){
    const t = await token();
    const q = new URLSearchParams(params).toString();
    const res = await fetch(url+(q?`?${q}`:''), { headers:{ Authorization: t?`Bearer ${t}`:'' }});
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async function post(url, body){
    const t = await token();
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json', Authorization: t?`Bearer ${t}`:''}, body: JSON.stringify(body||{}) });
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }

  const el = {
    msg: qs('#ordMsg'),
    table: qs('#ordTable tbody'),
    search: qs('#ordSearch'),
    status: qs('#ordStatus'),
    from: qs('#ordFrom'),
    to: qs('#ordTo'),
    reload: qs('#ordReload'),

    drawer: qs('#ordDrawer'),
    title: qs('#ordTitle'),
    meta: qs('#ordMeta'),
    items: qs('#ordItems'),
    stripe: qs('#ordStripe'),
    editStatus: qs('#ordEditStatus'),
    editNotes: qs('#ordEditNotes'),
    shipAddr: qs('#ordShipAddr'),
    shipTrack: qs('#ordShipTrack'),
    shipCarrier: qs('#ordShipCarrier'),
    save: qs('#ordSave'),
    invoice: qs('#ordInvoice'),
    email: qs('#ordEmail'),
    refund: qs('#ordRefund'),
    close: qs('#ordClose'),
    editMsg: qs('#ordEditMsg')
  };

  let cacheList = [];
  let currentId = null;

  function fmt(ts){ try{ return new Date(ts).toLocaleString(); }catch{ return '—'; } }
  function money(n,c='NOK'){ return `${(n/100).toFixed(2)} ${String(c).toUpperCase()}`; }

  function renderTable(){
    const q=(el.search.value||'').toLowerCase();
    const rows = [];
    cacheList.forEach(o=>{
      const searchable = [
        o.customer?.name||'', o.customer?.email||'',
        (o.items||[]).map(x=>x.name||x.sku||'').join(' ')
      ].join(' ').toLowerCase();
      if(q && !searchable.includes(q)) return;

      const tr = ce('tr');
      const td=(n)=>{ const t=ce('td'); t.style.cssText='padding:8px;border-bottom:1px solid #1b2030;vertical-align:top'; t.append(n); return t; };
      tr.appendChild(td(document.createTextNode(fmt(o.createdAt || Date.now()))));
      tr.appendChild(td(document.createTextNode(`${o.customer?.name||''} <${o.customer?.email||''}>`)));
      tr.appendChild(td(document.createTextNode((o.items||[]).map(x=>`${x.name||x.sku} ×${x.qty}`).join(', '))));
      tr.appendChild(td(document.createTextNode(money(o.amountTotal||0, o.items?.[0]?.currency||'NOK'))));
      tr.appendChild(td(document.createTextNode(o.status||'new')));

      const actions = ce('div'); actions.style.cssText='display:flex;gap:6px;flex-wrap:wrap';
      const edit = ce('button'); edit.className='tab-btn'; edit.textContent='Åpne';
      edit.onclick = ()=> openDrawer(o.id);
      actions.append(edit);
      tr.appendChild(td(actions));

      rows.push(tr);
    });
    el.table.replaceChildren(...rows);
  }

  async function loadOrders(){
    el.msg.textContent='Laster…';
    try{
      const d = await get(API.list, {
        status: el.status.value || '',
        limit: 100
      });
      cacheList = d.data || [];
      // enkel dato-filter i frontend (API har createdAt-index? hvis ikke, filtrer her)
      const from = el.from.value ? new Date(el.from.value).getTime() : null;
      const to   = el.to.value ? new Date(el.to.value).getTime() + 24*3600*1000 - 1 : null;
      if(from || to){
        cacheList = cacheList.filter(o=>{
          const t = o.createdAt || 0;
          if(from && t < from) return false;
          if(to && t > to) return false;
          return true;
        });
      }
      el.msg.textContent = `Rader: ${cacheList.length}`;
      renderTable();
    }catch(e){ el.msg.textContent='Kunne ikke hente ordrer.'; }
  }

  async function openDrawer(id){
    el.editMsg.textContent='Laster…';
    try{
      const d = await get(API.get, { id });
      currentId = id;
      el.title.textContent = `Ordre #${id}`;
      el.meta.textContent = `${fmt(d.createdAt)} — ${d.customer?.name||''} <${d.customer?.email||''}>`;
      el.editStatus.value = d.status || 'new';
      el.editNotes.value = d.notes || '';
      el.shipAddr.value = d.shipping?.address || '';
      el.shipTrack.value = d.shipping?.tracking || '';
      el.shipCarrier.value = d.shipping?.carrier || '';

      // Varer
      const lis = (d.items||[]).map(x=>{
        const li = ce('li');
        li.textContent = `${x.name||x.sku} ×${x.qty} — ${money((x.unit||0)* (x.qty||1), x.currency||'NOK')}`;
        return li;
      });
      el.items.replaceChildren(...lis);

      // Stripe-info
      const s = d.stripe||{};
      el.stripe.textContent = `PI: ${s.paymentIntent||'—'}  •  Charge: ${s.charge||'—'}  •  Customer: ${s.customerId||'—'}`;

      el.drawer.classList.remove('hidden');
      el.editMsg.textContent='';
    }catch(e){ el.editMsg.textContent='Kunne ikke åpne ordren.'; }
  }

  async function saveOrder(){
    if(!currentId){ return; }
    el.editMsg.textContent='Lagrer…';
    try{
      await post(API.upd, {
        id: currentId,
        status: el.editStatus.value,
        notes: el.editNotes.value,
        shipping: {
          address: el.shipAddr.value || null,
          tracking: el.shipTrack.value || null,
          carrier: el.shipCarrier.value || null
        }
      });
      el.editMsg.textContent='Lagret.';
      await loadOrders();
    }catch(e){ el.editMsg.textContent='Lagring feilet.'; }
  }

  async function makeInvoice(){
    if(!currentId){ return; }
    el.editMsg.textContent='Lager faktura…';
    try{
      const r = await post(API.inv, { id: currentId });
      el.editMsg.innerHTML = `Faktura generert: <a href="${r.pdfUrl}" target="_blank">${r.pdfUrl}</a>`;
    }catch(e){ el.editMsg.textContent='Fakturering feilet.'; }
  }

  async function sendEmail(){
    if(!currentId){ return; }
    const subject = prompt('Emne (valgfritt):','Ordrebekreftelse');
    el.editMsg.textContent='Sender e-post…';
    try{
      const r = await post(API.mail, { id: currentId, subject, template: 'order-confirmation' });
      el.editMsg.textContent = `Sendt til ${r.to || 'kunde'}  (msg: ${r.messageId||'—'})`;
    }catch(e){ el.editMsg.textContent='E-post feilet.'; }
  }

  async function refund(){
    if(!currentId){ return; }
    if(!confirm('Refunder betalingen?')) return;
    el.editMsg.textContent='Refunderer…';
    try{
      await post(API.refund, { id: currentId });
      el.editMsg.textContent='Refundert.';
      await loadOrders(); // status → refunded
    }catch(e){ el.editMsg.textContent='Refund feilet.'; }
  }

  // Events
  el.reload.addEventListener('click', loadOrders);
  el.search.addEventListener('input', renderTable);
  el.status.addEventListener('change', loadOrders);
  el.from.addEventListener('change', loadOrders);
  el.to.addEventListener('change', loadOrders);

  el.save.addEventListener('click', saveOrder);
  el.invoice.addEventListener('click', makeInvoice);
  el.email.addEventListener('click', sendEmail);
  el.refund.addEventListener('click', refund);
  el.close.addEventListener('click', ()=> el.drawer.classList.add('hidden'));

  // Autoload når fanen åpnes
  function onTabChange(){
    const active = (location.hash||'#branding').replace('#','');
    if(active==='orders'){ loadOrders(); }
  }
  window.addEventListener('hashchange', onTabChange);
  onTabChange();
})();

(function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const ce=(t)=>document.createElement(t);

  const API={
    list:'/.netlify/functions/nfc-batches-list',
    create:'/.netlify/functions/nfc-batches-create',
    get:'/.netlify/functions/nfc-batches-get',
    start:'/.netlify/functions/nfc-batches-start',
    stop:'/.netlify/functions/nfc-batches-stop',
    files:'/.netlify/functions/nfc-batches-files',
    encode:'/.netlify/functions/nfc-encode',
    verify:'/.netlify/functions/nfc-batches-verify'
  };

  async function token(){ return localStorage.getItem('nfcking.idToken') || ''; }
  async function get(url, params={}){
    const t = await token();
    const q = new URLSearchParams(params).toString();
    const res = await fetch(url+(q?`?${q}`:''), { headers:{ Authorization: t?`Bearer ${t}`:'' }});
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }
  async function post(url, body){
    const t = await token();
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json', Authorization: t?`Bearer ${t}`:''}, body: JSON.stringify(body||{}) });
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }

  const el = {
    msg: qs('#nfcMsg'),
    status: qs('#nfcStatus'),
    reload: qs('#nfcReload'),
    newOpen: qs('#nfcNewOpen'),
    table: qs('#nfcTable tbody'),

    // new
    box: qs('#nfcNew'),
    nbOrg: qs('#nbOrg'),
    nbPreset: qs('#nbPreset'),
    nbSource: qs('#nbSource'),
    nbLock: qs('#nbLock'),
    nbOrderIds: qs('#nbOrderIds'),
    nbType: qs('#nbNdefType'),
    nbVal: qs('#nbNdefVal'),
    nbCreate: qs('#nbCreate'),
    nbCancel: qs('#nbCancel'),
    nbMsg: qs('#nbMsg'),

    // drawer
    drawer: qs('#nfcDrawer'),
    title: qs('#ndTitle'),
    meta: qs('#ndMeta'),
    stEng: qs('#stEng'), stEnc: qs('#stEnc'), stVer: qs('#stVer'), stFail: qs('#stFail'),
    start: qs('#ndStart'), stop: qs('#ndStop'), zip: qs('#ndZip'), close: qs('#ndClose'),
    dMsg: qs('#ndMsg'),

    // encode
    eOrder: qs('#encOrder'),
    eUID: qs('#encUID'),
    ePayload: qs('#encPayload'),
    eLock: qs('#encLock'),
    eSave: qs('#encSave'),
    eMsg: qs('#encMsg'),

    // verify
    vBatch: qs('#verBatch'),
    vUID: qs('#verUID'),
    vRes: qs('#verResult'),
    vHash: qs('#verHash'),
    vSave: qs('#verSave'),
    vMsg: qs('#verMsg')
  };

  let cache = [];
  let currentBatch = null;

  function fmt(ts){ try{ return new Date(ts).toLocaleString(); }catch{ return '—'; } }

  function renderTable(){
    const rows = cache.map(b=>{
      const tr = ce('tr');
      const td=(n)=>{ const t=ce('td'); t.style.cssText='padding:8px;border-bottom:1px solid #1b2030;vertical-align:top'; t.append(n); return t; };
      tr.appendChild(td(document.createTextNode(fmt(b.createdAt || 0))));
      tr.appendChild(td(document.createTextNode(b.id)));
      tr.appendChild(td(document.createTextNode(b.status || 'draft')));
      tr.appendChild(td(document.createTextNode(String(b.count || 0))));

      const actions = ce('div'); actions.style.cssText='display:flex;gap:6px;flex-wrap:wrap';
      const open = ce('button'); open.className='tab-btn'; open.textContent='Åpne';
      open.onclick = ()=> openDrawer(b.id);
      actions.append(open);
      tr.appendChild(td(actions));

      return tr;
    });
    el.table.replaceChildren(...rows);
  }

  async function loadList(){
    el.msg.textContent='Laster…';
    try{
      const d = await get(API.list, { status: el.status.value || '', limit: 100 });
      cache = d.data || [];
      el.msg.textContent = `Batcher: ${cache.length}`;
      renderTable();
    }catch(e){ el.msg.textContent='Kunne ikke hente batcher.'; }
  }

  function toggleNew(show){
    el.box.classList.toggle('hidden', !show);
    if(show) el.nbOrg.focus();
  }

  async function createBatch(){
    el.nbMsg.textContent='Oppretter…';
    try{
      const ids = (el.nbOrderIds.value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      const payload = {
        orgKey: (el.nbOrg.value||'').trim() || null,
        presetId: (el.nbPreset.value||'').trim() || null,
        source: el.nbSource.value,
        ndef: { type: el.nbType.value, value: el.nbVal.value || 'https://nfcking.no/u/{orderId}', lock: el.nbLock.value==='true' },
        orderIds: ids
      };
      const r = await post(API.create, payload);
      el.nbMsg.textContent = `Batch opprettet: ${r.id}`;
      toggleNew(false);
      await loadList();
      openDrawer(r.id);
    }catch(e){ el.nbMsg.textContent='Opprettelse feilet.'; }
  }

  async function openDrawer(id){
    el.dMsg.textContent='Laster…';
    try{
      const d = await get(API.get, { id });
      currentBatch = id;
      el.title.textContent = `Batch #${id}`;
      el.meta.textContent = `${d.status} • ${d.count||d.orderIds?.length||0} kort • Opprettet ${fmt(d.createdAt)}`;
      el.stEng.textContent = d.stats?.engrave ?? 0;
      el.stEnc.textContent = d.stats?.encode ?? 0;
      el.stVer.textContent = d.stats?.verify ?? 0;
      el.stFail.textContent = d.stats?.failed ?? 0;
      el.drawer.classList.remove('hidden');
      el.vBatch.value = id;
      el.dMsg.textContent='';
    }catch(e){ el.dMsg.textContent='Kunne ikke åpne batch.'; }
  }

  async function startBatch(){
    if(!currentBatch) return;
    el.dMsg.textContent='Starter…';
    try{ await post(API.start, { id: currentBatch }); el.dMsg.textContent='Startet.'; await openDrawer(currentBatch); }
    catch(e){ el.dMsg.textContent='Start feilet.'; }
  }
  async function stopBatch(){
    if(!currentBatch) return;
    el.dMsg.textContent='Stopper…';
    try{ await post(API.stop, { id: currentBatch }); el.dMsg.textContent='Stoppet.'; await openDrawer(currentBatch); }
    catch(e){ el.dMsg.textContent='Stopp feilet.'; }
  }
  async function downloadZip(){
    if(!currentBatch) return;
    el.dMsg.textContent='Lager lenke…';
    try{
      const r = await get(API.files, { id: currentBatch, type: 'zip' });
      window.open(r.downloadUrl, '_blank');
      el.dMsg.textContent='Åpnet ZIP.';
    }catch(e){ el.dMsg.textContent='Kunne ikke lage ZIP-lenke.'; }
  }

  async function saveEncode(){
    el.eMsg.textContent='Registrerer…';
    try{
      const payload = JSON.parse(el.ePayload.value || '{}');
      await post(API.encode, {
        orderId: (el.eOrder.value||'').trim(),
        chipUID: (el.eUID.value||'').trim(),
        payload,
        lock: el.eLock.value==='true'
      });
      el.eMsg.textContent='Registrert.';
    }catch(e){ el.eMsg.textContent='Feil ved registrering (sjekk JSON).'; }
  }

  async function saveVerify(){
    el.vMsg.textContent='Registrerer…';
    try{
      await post(API.verify, {
        batchId: (el.vBatch.value||'').trim(),
        chipUID: (el.vUID.value||'').trim(),
        result: el.vRes.value,
        payloadHash: (el.vHash.value||'').trim() || null
      });
      el.vMsg.textContent='Registrert.';
      if(currentBatch) await openDrawer(currentBatch);
    }catch(e){ el.vMsg.textContent='Feil ved verifisering.'; }
  }

  // Events
  el.reload.addEventListener('click', loadList);
  el.status.addEventListener('change', loadList);
  el.newOpen.addEventListener('click', ()=> toggleNew(true));
  el.nbCancel.addEventListener('click', ()=> toggleNew(false));
  el.nbCreate.addEventListener('click', createBatch);

  el.start.addEventListener('click', startBatch);
  el.stop.addEventListener('click', stopBatch);
  el.zip.addEventListener('click', downloadZip);
  el.close.addEventListener('click', ()=> el.drawer.classList.add('hidden'));

  el.eSave.addEventListener('click', saveEncode);
  el.vSave.addEventListener('click', saveVerify);

  // Auto-load når fanen åpnes
  function onTabChange(){
    const active = (location.hash||'#branding').replace('#','');
    if(active==='nfc'){ loadList(); }
  }
  window.addEventListener('hashchange', onTabChange);
  onTabChange();
})();

  (function(){
    const auth = firebase.auth();
    const SUPERADMIN_EMAILS = new Set(['trygve.waagen@gmail.com']);
    const main = document.getElementById('superadminMain');
    const gate = document.getElementById('accessGate');
    const gateRole = document.getElementById('accessRole');
    const navSuperLink = document.querySelector('[data-nav-superadmin]');

    function setSuperNavVisibility(isSuper) {
      if (!navSuperLink) return;
      if (isSuper) {
        navSuperLink.removeAttribute('hidden');
        navSuperLink.removeAttribute('aria-hidden');
      } else {
        navSuperLink.setAttribute('hidden', '');
        navSuperLink.setAttribute('aria-hidden', 'true');
      }
    }

    function enforceAccess(role){
      const allowed = role === 'superadmin';
      if (main) main.classList.toggle('hidden', !allowed);
      if (gate) gate.classList.toggle('hidden', allowed);
      if (gateRole) gateRole.textContent = role || 'ingen';
      setSuperNavVisibility(allowed);
    }

    (function patchFetch(){
      if (window.__nfckingFetchPatched) return;
      window.__nfckingFetchPatched = true;
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const isFunctionCall = /^\/\.netlify\/functions\//.test(url);
        if (isFunctionCall) {
          try {
            const user = auth.currentUser;
            if (user) {
              const token = await user.getIdToken(true);
              const headers = new Headers(init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined) || {});
              if (!headers.has('Authorization')) {
                headers.set('Authorization', `Bearer ${token}`);
              }
              const body = init.body;
              const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
              if (body && !isFormData && !headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
              }
              init.headers = headers;
            }
          } catch (err) {
            console.warn('Kunne ikke hente ID-token for fetch', err);
          }
        }
        return originalFetch(input, init);
      };
    })();

    async function refreshIdToken(user) {
      if (!user) {
        localStorage.removeItem('nfcking.idToken');
        return null;
      }
      const token = await user.getIdToken(true);
      localStorage.setItem('nfcking.idToken', token);
      return token;
    }

    function updateBadge(user, role = 'viewer') {
      const badgeText = document.getElementById('ubText');
      const badgeDot = document.getElementById('ubDot');
      if (badgeText) {
        badgeText.textContent = user ? `${user.email || 'ukjent'} (${role})` : 'Ikke innlogget';
      }
      if (badgeDot) {
        if (user) badgeDot.classList.add('ok');
        else badgeDot.classList.remove('ok');
      }
    }

    auth.onAuthStateChanged(async (user) => {
      const btnLogin = document.getElementById('btnLogin');
      const btnLogout = document.getElementById('btnLogout');

      if (!user) {
        updateBadge(null);
        btnLogin?.classList.remove('hidden');
        btnLogout?.classList.add('hidden');
        localStorage.removeItem('nfcking.role');
        localStorage.removeItem('nfcking.userName');
        localStorage.removeItem('nfcking.idToken');
        localStorage.removeItem('nfcking:isSuperAdmin');
        enforceAccess(null);
        document.dispatchEvent(new CustomEvent('nfcking:role', { detail: { role: null } }));
        return;
      }

      await refreshIdToken(user);
      let role = 'viewer';
      try {
        const result = await user.getIdTokenResult(true);
        role = result.claims?.role || 'viewer';
        localStorage.setItem('nfcking.role', role);
      } catch (err) {
        console.warn('Kunne ikke lese rolle-claim', err);
      }
      const emailLower = (user.email || '').toLowerCase();
      if (emailLower && SUPERADMIN_EMAILS.has(emailLower)) {
        role = 'superadmin';
        localStorage.setItem('nfcking.role', role);
      }
      localStorage.setItem('nfcking.userName', user.email || user.displayName || '');

      if (role === 'superadmin') {
        localStorage.setItem('nfcking:isSuperAdmin', '1');
      } else {
        localStorage.removeItem('nfcking:isSuperAdmin');
      }

      updateBadge(user, role);
      btnLogin?.classList.add('hidden');
      btnLogout?.classList.remove('hidden');
      enforceAccess(role);
      document.dispatchEvent(
        new CustomEvent('nfcking:role', {
          detail: {
            role,
            email: user.email || '',
            uid: user.uid || null,
          },
        })
      );
    });

    async function doLogin(){
      try {
        const email = prompt('E-post:');
        if (!email) return;
        const password = prompt('Passord:');
        if (!password) return;
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        await auth.signInWithEmailAndPassword(email.trim(), password);
        alert('Innlogget ✅');
      } catch (err) {
        alert('Innlogging feilet: ' + (err?.message || err));
      }
    }

    async function doLogout(){
      try {
        await auth.signOut();
        alert('Logget ut');
      } catch (err) {
        alert('Utlogging feilet: ' + (err?.message || err));
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      const btnLogin = document.getElementById('btnLogin');
      const btnLogout = document.getElementById('btnLogout');
      btnLogin?.addEventListener('click', (ev) => { ev.preventDefault(); doLogin(); });
      btnLogout?.addEventListener('click', (ev) => { ev.preventDefault(); doLogout(); });
    });

    window.doLogin = doLogin;
    window.doLogout = doLogout;
  })();
