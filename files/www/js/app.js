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

