const API=(cmd,arg='',arg2='')=>fetch(`/cgi-bin/api?cmd=${encodeURIComponent(cmd)}&arg=${encodeURIComponent(arg)}&arg2=${encodeURIComponent(arg2)}`).then(r=>r.text());
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtBytes=n=>{n=Number(n);if(!n)return'0 B';const u=['B','KB','MB','GB','TB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return n.toFixed(2)+' '+u[i]};
const fmtLease=s=>{s=Number(s);if(!s)return'—';const h=Math.floor(s/3600);return h+' ч ('+s+' с)'};
$('orig-link').href=`http://${location.hostname}:8080/`;

document.querySelectorAll('.tab[data-tab]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.tab[data-tab]').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');$('tab-'+b.dataset.tab).classList.add('active');
  onTab(b.dataset.tab);
});
document.querySelectorAll('.subtab').forEach(b=>b.onclick=()=>{
  const p=b.closest('.tab-panel');
  p.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
  p.querySelectorAll('.subpanel').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');p.querySelector('#sub-'+b.dataset.sub).classList.add('active');
  onSub(b.dataset.sub);
});
function onTab(n){({dashboard:loadDash,system:loadSys,keen:()=>onSub('vnstat'),wifi:loadWifi,network:()=>onSub('dns'),clients:loadClients,components:loadComp,files:()=>onSub('usb'),tools:()=>onSub('rci')})[n]?.()}
function onSub(n){({vnstat:loadVn,darkstat:loadDark,cron:loadCron,dns:loadDns,dhcp:loadDhcp,nextdns:loadNextdns,usb:loadUsb,browse:loadBrowse,logs:loadLogs})[n]?.()}

// === Дашборд ===



// === Система ===
async function loadSys(){
  const g=$('sys-grid');
  if(!g.dataset.loaded){g.innerHTML='<div class="card"><div class="spinner"></div></div>';}
  try{
    const v=JSON.parse(await API('version'));
    const sysRaw=await API('system');
    let sys={};
    try{const p=JSON.parse(sysRaw);sys=p.system||p}catch{}

    // CPU temp
    let cpuTemp='—';
    try{
      const r=await API('exec','cat /sys/class/thermal/thermal_zone0/temp');
      const p=JSON.parse(r);
      const t=parseInt((p.parse?.message||[])[0]||'0');
      if(t>0)cpuTemp=Math.round(t/1000)+'°C';
    }catch{}

    // WiFi temp
    let wifiTemp='—';
    try{
      const r=await API('rci','show interface WifiMaster1');
      const t=r.match(/"temperature":\s*(\d+)/);
      if(t)wifiTemp=t[1]+'°C';
    }catch{}

    // RAM
    const mt=Number(sys.memtotal)||0;
    const mf=Number(sys.memfree)||0;
    const mc=Number(sys.memcache)||0;
    const mb=Number(sys.membuffers)||0;
    const used=mt-mf-mc-mb;
    const memPct=mt?Math.round(used/mt*100):0;
    const memUsedMB=Math.round(used/1024);
    const memTotalMB=Math.round(mt/1024);

    // Swap
    const st=Number(sys.swaptotal)||0;
    const sf=Number(sys.swapfree)||0;
    const swapUsed=st-sf;
    const swapPct=st?Math.round(swapUsed/st*100):0;
    const swapUsedMB=Math.round(swapUsed/1024);

    // Uptime
    const upS=Number(sys.uptime)||0;
    const d=Math.floor(upS/86400),h=Math.floor(upS%86400/3600),m=Math.floor(upS%3600/60);
    const upStr=upS?(d?d+'д ':'')+h+'ч '+m+'м':'—';

    // Connections
    const ct=Number(sys.conntotal)||0;
    const cf=Number(sys.connfree)||0;
    const active=ct-cf;

    // Hostname
    const hostname=sys.hostname||'—';
    const domain=sys.domainname||'—';

    const cards=[
      ['Hostname', hostname, ''],
      ['Domain', domain, ''],
      ['Модель', v.model||v.description||'—', ''],
      ['Прошивка', v.title||'—', ''],
      ['Архитектура', v.arch||'—', ''],
      ['Uptime', upStr, ''],
      ['CPU load', sys.cpuload!=null?sys.cpuload+'%':'—', sys.cpuload>90?'err':(sys.cpuload>70?'warn':'')],
      ['CPU temp', cpuTemp, ''],
      ['WiFi temp', wifiTemp, ''],
      ['RAM', `${memPct}% (${memUsedMB}/${memTotalMB} MB)`, memPct>85?'err':(memPct>70?'warn':'')],
      ['Swap', st?`${swapPct}% (${swapUsedMB} MB)`:'нет', swapPct>50?'warn':''],
      ['Соединения', `${active} / ${ct}`, '']
    ];
    g.innerHTML=cards.map(([t,val,cls])=>`<div class="card"><div class="card-title">${t}</div><div class="card-value ${cls}">${esc(val)}</div></div>`).join('');
    g.dataset.loaded='1';
  }catch(e){
    g.innerHTML=`<div class="card"><div class="card-value err">${esc(e.message)}</div></div>`;
  }
}
$('sys-refresh').onclick=loadSys;
$('sys-reboot').onclick=async()=>{if(confirm('Перезагрузить роутер?')){await API('parse','system reboot');alert('Перезагрузка запущена')}};

// === vnstat ===
async function loadVn(){$('vnstat-json').textContent='загрузка...';$('vnstat-json').textContent=await API('vnstat-oneline');loadVnMode('s')}
async function loadVnMode(m){try{const d=JSON.parse(await API('vnstati',m));if(d.url)$('vnstat-img').src=d.url}catch{}}
$('vnstat-refresh').onclick=loadVn;
$('vnstat-summary').onclick=()=>loadVnMode('s');
$('vnstat-hours').onclick=()=>loadVnMode('h');
$('vnstat-days').onclick=()=>loadVnMode('d');
$('vnstat-months').onclick=()=>loadVnMode('m');
$('vnstat-top').onclick=()=>loadVnMode('t');

// === darkstat ===
async function loadDark(){
  try{const s=JSON.parse(await API('darkstat-status'));const b=$('darkstat-status-badge');b.textContent=s.status;b.className='badge '+(s.status==='running'?'ok':'err')}catch{}
  try{const o=JSON.parse(await API('darkstat-overview'));
    $('darkstat-overview').innerHTML=[
      ['Uptime',o.uptime],['Трафик',fmtBytes(o.bytes)],['Пакетов',(o.packets||0).toLocaleString()],
      ['Captured',(o.captured||0).toLocaleString()],['Dropped',(o.dropped||0).toLocaleString()],['Since',o.since]
    ].map(([t,x])=>`<div class="card"><div class="card-title">${t}</div><div class="card-value">${esc(x)}</div></div>`).join('');
  }catch(e){$('darkstat-overview').innerHTML=`<div class="card"><div class="card-value err">${esc(e.message)}</div></div>`}
  try{const h=JSON.parse(await API('darkstat-hosts'));
    $('darkstat-hosts').querySelector('tbody').innerHTML=h.map(x=>`<tr><td>${esc(x.ip)}</td><td>${esc(x.mac)}</td><td class="num">${fmtBytes(x.in)}</td><td class="num">${fmtBytes(x.out)}</td><td class="num">${fmtBytes(x.total)}</td><td>${esc(x.last)}</td></tr>`).join('');
  }catch(e){$('darkstat-hosts').querySelector('tbody').innerHTML=`<tr><td colspan="6" class="err">${esc(e.message)}</td></tr>`}
}
$('darkstat-refresh').onclick=loadDark;

// === cron ===
async function loadCron(){
  const tb=$('cron-table').querySelector('tbody');
  tb.innerHTML='<tr><td colspan="4"><div class="spinner"></div></td></tr>';
  try{
    const arr=JSON.parse(await API('cron-list'));
    if(!arr.length){tb.innerHTML='<tr><td colspan="4" style="color:var(--fg-dim)">Пусто</td></tr>';return}
    tb.innerHTML=arr.map(o=>{
      const p=o.line.split(/\s+/),sched=p.slice(0,5).join(' '),user=p[5]||'',cmd=p.slice(6).join(' ');
      return `<tr><td style="font-family:ui-monospace">${esc(sched)}</td><td>${esc(user)}</td><td style="font-family:ui-monospace">${esc(cmd)}</td><td><button class="btn-sm danger" data-line="${esc(o.line)}">Удалить</button></td></tr>`;
    }).join('');
    tb.querySelectorAll('button[data-line]').forEach(b=>b.onclick=async()=>{
      if(confirm('Удалить задание?')){await API('cron-del',b.dataset.line);loadCron()}
    });
  }catch(e){tb.innerHTML=`<tr><td colspan="4" class="err">${esc(e.message)}</td></tr>`}
}
$('cron-refresh').onclick=loadCron;
$('cron-add-btn').onclick=()=>{
  const sched=prompt('Расписание (5 полей, например "0 3 * * *"):','0 3 * * *');
  if(!sched)return;const cmd=prompt('Команда:','/opt/bin/echo hello');
  if(!cmd)return;const user=prompt('Пользователь:','root')||'root';
  API('cron-add',`${sched} ${user} ${cmd}`).then(loadCron);
};

// === WiFi ===
async function loadWifi(){
  const g=$('wifi-grid');
  g.innerHTML='<div class="card"><div class="spinner"></div></div>';
  try{
    const arr=JSON.parse(await API('wifi-list'));
    if(!arr.length){
      g.innerHTML='<div class="card">WiFi-интерфейсы не найдены</div>';
      return;
    }
    g.innerHTML=arr.map(v=>{
      const up=v.state==='up';
      return `<div class="card">
        <div class="card-title">${esc(v.label)} <span style="color:var(--fg-dim);font-weight:400;text-transform:none">${esc(v.key)}</span></div>
        <div class="card-value" style="font-size:18px">${esc(v.ssid||'—')}</div>
        <div style="margin-top:10px;color:var(--fg-dim);font-size:12px;line-height:1.8">
          Статус: <span class="badge ${up?'ok':'err'}">${esc(v.state||'—')}</span><br>
          Канал: <b>${esc(v.channel||'—')}</b>${v.bandwidth?' / '+esc(v.bandwidth)+' МГц':''}<br>
          Защита: ${esc(v.encryption||'—')}<br>
          ${v.temperature?'Темп: '+esc(v.temperature)+'°C<br>':''}
        </div>
        <div class="actions" style="margin-top:12px">
          <button class="btn-sm" data-act="ssid" data-if="${esc(v.key)}" data-val="${esc(v.ssid||'')}">SSID</button>
          <button class="btn-sm" data-act="pwd" data-if="${esc(v.key)}">Пароль</button>
          <button class="btn-sm ${up?'danger':'ok'}" data-act="toggle" data-if="${esc(v.key)}" data-up="${up}">${up?'Выключить':'Включить'}</button>
        </div>
      </div>`;
    }).join('');
    g.querySelectorAll('button[data-act]').forEach(b=>b.onclick=async()=>{
      if(b.dataset.act==='ssid'){
        const nv=prompt('Новый SSID:',b.dataset.val);
        if(nv){await API('wifi-ssid',b.dataset.if,nv);setTimeout(loadWifi,1500)}
      }
      if(b.dataset.act==='pwd'){
        const nv=prompt('Новый пароль (мин. 8 символов):');
        if(nv&&nv.length>=8){await API('wifi-password',b.dataset.if,nv);alert('Отправлено');setTimeout(loadWifi,2000)}
      }
      if(b.dataset.act==='toggle'){
        const action=b.dataset.up==='true'?'wifi-down':'wifi-up';
        await API(action,b.dataset.if);
        setTimeout(loadWifi,1500);
      }
    });
  }catch(e){
    g.innerHTML=`<div class="card"><div class="card-value err">${esc(e.message)}</div></div>`;
  }
}
$('wifi-refresh').onclick=loadWifi;
window.editSsid=async(iface,old)=>{const v=prompt('Новый SSID:',old);if(v)await API('wifi-ssid',iface,v).then(loadWifi)};
window.editWifiPwd=async(iface)=>{const v=prompt('Новый пароль (мин. 8 символов):');if(v&&v.length>=8)await API('wifi-password',iface,v)};

async function loadDns(){
  const tb=$('dns-table').querySelector('tbody');
  tb.innerHTML='<tr><td colspan="4"><div class="spinner"></div></td></tr>';
  try{
    const r=JSON.parse(await API('dns-list'));
    const srv=r.servers||[];
    if(!srv.length){tb.innerHTML='<tr><td colspan="4" style="color:var(--fg-dim)">Нет DNS-серверов</td></tr>';return}
    tb.innerHTML=srv.map(s=>{
      // Источник: Dhcp::Client-X → DHCP от X; статический → Static
      const svc=s.service||'';
      const isDhcp=svc.startsWith('Dhcp::');
      const src=isDhcp?'DHCP':'Static';
      const srcCls=isDhcp?'info':'ok';
      // Меняем "Dhcp::Client-GigabitEthernet1" на "GigabitEthernet1"
      const srcDisp=isDhcp?svc.replace(/^Dhcp::Client-/,''):'вручную';
      const canDelete=!isDhcp;
      return `<tr>
        <td><b>${esc(s.address)}</b></td>
        <td>${esc(srcDisp)}</td>
        <td><span class="badge ${srcCls}">${src}</span></td>
        <td>${canDelete?`<button class="btn-sm danger" data-addr="${esc(s.address)}">Удалить</button>`:'<span style="color:var(--fg-dim);font-size:11px">только для чтения</span>'}</td>
      </tr>`;
    }).join('');
    tb.querySelectorAll('button[data-addr]').forEach(b=>b.onclick=async()=>{
      if(!confirm('Удалить '+b.dataset.addr+'?'))return;
      await API('dns-remove',b.dataset.addr);
      setTimeout(loadDns,1000);
    });
  }catch(e){tb.innerHTML=`<tr><td colspan="4" class="err">${esc(e.message)}</td></tr>`}
}
$('dns-refresh').onclick=loadDns;
$('dns-add-btn').onclick=async()=>{
  const v=$('dns-new').value.trim();
  if(!v){alert('Введите IP');return}
  if(!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v)){alert('Неверный IP');return}
  const r=await API('dns-add',v);
  try{
    const p=JSON.parse(r);
    const st=p.parse?.status?.[0];
    if(st && st.status==='error'){alert('Ошибка: '+st.message);return}
  }catch{}
  $('dns-new').value='';
  setTimeout(loadDns,1500);
};


// === DHCP ===
async function loadDhcp(){
  const tb=$('dhcp-table').querySelector('tbody');
  tb.innerHTML='<tr><td colspan="8"><div class="spinner"></div></td></tr>';
  try{
    const r=await API('dhcp-get');let d=JSON.parse(r);
    // структура: {_WEBADMIN: {interface,network,begin,end,router,lease,state,size,used}, ...}
    const items=[];
    for(const [k,v] of Object.entries(d)){
      if(v && typeof v==='object' && (v.network||v.begin||v.end)){
        items.push([k,v]);
      }
    }
    if(!items.length){
      // fallback — плоский вывод
      tb.innerHTML=`<tr><td colspan="8" style="color:var(--fg-dim)">Пулы не найдены</td></tr>`;
      return;
    }
    tb.innerHTML=items.map(([k,v])=>{
      const iface=v.interface?.interface||v.interface?.binding||'—';
      const net=v.network||'—';
      const range=`${v.begin||'—'} — ${v.end||'—'}`;
      const gw=v.router?.router||v.router||'—';
      const lease=v.lease?.lease||v.lease||'—';
      const state=v.state||'—';
      const used=v.used!=null&&v.size!=null?`${v.used} / ${v.size}`:'—';
      const stCls=state==='running'?'ok':(state==='down'?'err':'warn');
      return `<tr>
        <td><b>${esc(k)}</b></td>
        <td>${esc(iface)}</td>
        <td>${esc(net)}</td>
        <td style="font-family:ui-monospace;font-size:12px">${esc(range)}</td>
        <td>${esc(gw)}</td>
        <td>${esc(fmtLease(lease))}</td>
        <td><span class="badge ${stCls}">${esc(state)}</span></td>
        <td class="num">${esc(used)}</td>
      </tr>`;
    }).join('');
  }catch(e){tb.innerHTML=`<tr><td colspan="8" class="err">${esc(e.message)}</td></tr>`}
}
$('dhcp-refresh').onclick=loadDhcp;

// === Клиенты ===
let clientsCache=[];
async function loadClients(){
  const tb=$('clients-table').querySelector('tbody');tb.innerHTML='<tr><td colspan="5"><div class="spinner"></div></td></tr>';
  try{
    const r=await API('clients');let d=JSON.parse(r);
    let arr=[];
    if(Array.isArray(d)) arr=d;
    else if(d['ip/hotspot/host']) arr=Array.isArray(d['ip/hotspot/host'])?d['ip/hotspot/host']:Object.values(d['ip/hotspot/host']);
    else if(d.host) arr=Array.isArray(d.host)?d.host:Object.values(d.host);
    else if(d.hosts) arr=Array.isArray(d.hosts)?d.hosts:Object.values(d.hosts);
    else arr=Object.entries(d).filter(([k,v])=>v&&typeof v==='object').map(([k,v])=>({...v,mac:k}));
    clientsCache=arr;
    renderClients(arr);
  }catch(e){tb.innerHTML=`<tr><td colspan="5" class="err">${esc(e.message)}</td></tr>`}
}
function renderClients(arr){
  const tb=$('clients-table').querySelector('tbody');
  // Дедуп по MAC, предпочитаем запись с реальным IP
  const byMac=new Map();
  for(const h of arr){
    const mac=(h.mac||'').toLowerCase();
    if(!mac)continue;
    const ip=h.ip||'';
    const cur=byMac.get(mac);
    if(!cur || (ip && ip!=='0.0.0.0' && (!cur.ip || cur.ip==='0.0.0.0'))){
      byMac.set(mac,h);
    }
  }
  // Фильтр: только с IP или активные
  let list=Array.from(byMac.values()).filter(h=>{
    const ip=h.ip||'';
    return (ip && ip!=='0.0.0.0') || h.active===true;
  });
  // Сортировка: online вверх, потом по IP
  list.sort((a,b)=>{
    const aa=a.active===true||a.link==='up'?0:1;
    const bb=b.active===true||b.link==='up'?0:1;
    if(aa!==bb)return aa-bb;
    return (a.ip||'').localeCompare(b.ip||'');
  });
  if(!list.length){tb.innerHTML='<tr><td colspan="7" style="color:var(--fg-dim)">Нет активных клиентов</td></tr>';return}
  // Сокращаем длинные имена: "realme-16-5G - Основная - 2026-08-31 10:57" → "realme-16-5G"
  const shortName=n=>{
    if(!n)return'—';
    const i=n.indexOf(' - ');
    return i>0 ? n.substring(0,i) : n;
  };
  tb.innerHTML=list.map(h=>{
    const mac=h.mac||'';
    const ip=h.ip||'';
    const name=shortName(h.name||h.hostname);
    const active=h.active===true||h.link==='up';
    const rx=h.rxbytes||0, tx=h.txbytes||0;
    const last=h['last-seen']!=null?(h['last-seen']<60?h['last-seen']+' с':Math.floor(h['last-seen']/60)+' мин'):'—';
    const ssid=h.ssid||'—';
    const access=h.access||'permit';
    const blocked=access==='deny';
    return `<tr>
      <td><b>${esc(ip||'—')}</b></td>
      <td>${esc(name)}${blocked?' <span class="badge err" style="font-size:10px">blocked</span>':''}</td>
      <td style="font-size:11px">${esc(mac)}</td>
      <td><span class="badge ${active?'ok':'err'}">${active?'online':'offline'}</span></td>
      <td style="font-size:11px;color:var(--fg-dim)">${esc(ssid)}<br>↓${fmtBytes(rx)} ↑${fmtBytes(tx)}</td>
      <td style="font-size:11px">${esc(last)}</td>
      <td><div class="actions">
        <button class="btn-sm" data-act="rename" data-mac="${esc(mac)}" data-name="${esc(h.name||'')}">Имя</button>
        <button class="btn-sm" data-act="static" data-mac="${esc(mac)}" data-ip="${esc(ip)}">Static</button>
        <button class="btn-sm" data-act="wol" data-mac="${esc(mac)}">WOL</button>
        <button class="btn-sm ${blocked?'ok':'danger'}" data-act="${blocked?'unblock':'block'}" data-mac="${esc(mac)}">${blocked?'Unblock':'Block'}</button>
      </div></td></tr>`;
  }).join('');
  tb.querySelectorAll('button[data-act]').forEach(b=>b.onclick=()=>clientAction(b.dataset));
}
async function clientAction(d){
  if(!d.mac){alert('MAC неизвестен');return}
  if(d.act==='rename'){
    const n=prompt('Новое имя:',d.name||'');
    if(n){
      const r=await API('client-rename',d.mac,n);
      try{
        const p=JSON.parse(r);
        const st=p.parse?.status?.[0];
        if(st && st.status==='error'){alert('Ошибка: '+st.message);return}
      }catch{}
      setTimeout(loadClients,1500);
    }
  }
  if(d.act==='static'){
    const ip=prompt('IP адрес:',d.ip||'');
    if(ip){await API('client-static',d.mac,ip);setTimeout(loadClients,1500)}
  }
  if(d.act==='wol'){await API('client-wol',d.mac);alert('WOL отправлен')}
  if(d.act==='block'){if(confirm('Заблокировать?')){await API('client-block',d.mac);setTimeout(loadClients,1500)}}
  if(d.act==='unblock'){await API('client-unblock',d.mac);setTimeout(loadClients,1500)}
}
$('clients-refresh').onclick=loadClients;
$('clients-search').oninput=e=>{const q=e.target.value.toLowerCase();renderClients(clientsCache.filter(h=>JSON.stringify(h).toLowerCase().includes(q)))};

