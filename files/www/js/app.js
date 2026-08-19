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

