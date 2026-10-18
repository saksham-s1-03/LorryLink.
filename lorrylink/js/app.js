// Approximate Indian market data. Edit freely.
const RATES={'Tata Ace (Mini)':{w:4,cap:0.75,rate:15,toll:0.8,tyre:'145R12'},'Pickup (Bolero)':{w:4,cap:1.5,rate:19,toll:1,tyre:'175R14'},
'6-Wheeler Truck':{w:6,cap:9,rate:30,toll:1.8,tyre:'9.00R20'},'10-Wheeler Truck':{w:10,cap:16,rate:40,toll:2.5,tyre:'10.00R20'},
'12-Wheeler Truck':{w:12,cap:21,rate:48,toll:3,tyre:'10.00R20'},'14-Wheeler Truck':{w:14,cap:28,rate:58,toll:3.5,tyre:'11.00R20'}};
const CITIES={Indore:[22.72,75.86],Bhopal:[23.26,77.41],Jabalpur:[23.18,79.95],Mumbai:[19.08,72.88],Delhi:[28.61,77.21],Nagpur:[21.15,79.09],
Ahmedabad:[23.02,72.57],Jaipur:[26.91,75.79],Pune:[18.52,73.86],Hyderabad:[17.39,78.49],Lucknow:[26.85,80.95],Kolkata:[22.57,88.36],
Chennai:[13.08,80.27],Bengaluru:[12.97,77.59],Surat:[21.17,72.83],Kanpur:[26.45,80.35],Raipur:[21.25,81.63],Patna:[25.59,85.14],Agra:[27.18,78.01],Gwalior:[26.22,78.18],Jhansi:[25.45,78.57],Varanasi:[25.32,83.0],Visakhapatnam:[17.69,83.22],Bhubaneswar:[20.3,85.82],Vijayawada:[16.51,80.65],Udaipur:[24.58,73.71],Nashik:[19.99,73.79],Kota:[25.18,75.84],Madurai:[9.92,78.12],Kanyakumari:[8.09,77.54],Srinagar:[34.08,74.8],Jammu:[32.73,74.86]};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],KEY='lorrylink_v2',REG=/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;
const fmtReg=r=>r.replace(/^([A-Z]{2})(\d{2})([A-Z]+)(\d{4})$/,'$1$2 $3 $4'),inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const fmtD=d=>d?new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
const dayOff=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
const opts=a=>a.map(x=>`<option>${x}</option>`).join('');
function seed(){const S=[['MP20GA1234','6-Wheeler Truck','Ramesh Yadav','Indore','Mumbai'],['MP20HB4521','10-Wheeler Truck','Sunil Patel','Jabalpur','Delhi'],
['MH12KT7788','12-Wheeler Truck','Imran Khan','Pune','Hyderabad'],['GJ01XY9090','14-Wheeler Truck','Gurpreet Singh','Ahmedabad','Jaipur'],
['UP32AB1122','10-Wheeler Truck','Mahesh Kumar','Lucknow','Kolkata'],['KA05MN3344','6-Wheeler Truck','Anil Sharma','Bengaluru','Chennai'],
['MP09CD5566','Tata Ace (Mini)','Vijay Jadhav','Bhopal','Indore'],['MH31RT2020','Pickup (Bolero)','Deepak Verma','Nagpur','Raipur']];
return S.map(([reg,type,driver,a,b],i)=>({reg,type,driver,phone:'98'+(10000000+i*1234567),brand:['MRF','Apollo','CEAT','JK Tyre'][i%4],km:20000+i*6000,
ins:dayOff(10+i*40),fit:dayOff(200-i*20),per:dayOff(300-i*30),a,b,p:Math.random(),d:1}))}
let fleet;try{fleet=JSON.parse(localStorage.getItem(KEY))}catch{}fleet=fleet||seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(fleet))}catch{}};
const pos=t=>along(route(t.a,t.b).pts,t.p);
const moving=t=>t.a!==t.b,status=t=>moving(t)?'in transit':'idle';
function dist(a,b){return Math.round(pathLen(route(a,b))*1.08)}
function alerts(t){const a=[],soon=Date.now()+30*864e5,life=t.km/60000;if(life>=.92)a.push('Tyres due for replacement');
[['Insurance',t.ins],['Fitness',t.fit],['Permit',t.per]].forEach(([n,d])=>{if(d&&new Date(d)<soon)a.push(n+(new Date(d)<Date.now()?' expired':' expiring soon'))});return a}
// UI helpers
let tk=0,pend=null,flt='all',animated=false;const root=document.documentElement;
try{const th=localStorage.getItem('ll_theme');if(th)root.dataset.theme=th}catch{}
$('#theme').onclick=()=>{const d=root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;root.dataset.theme=d?'light':'dark';try{localStorage.setItem('ll_theme',root.dataset.theme)}catch{}};
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2400)}
const truckSVG=w=>{const n=Math.min(7,Math.ceil(w/2)),xs=[18];for(let i=1;i<n;i++)xs.push(n===2?100:44+(i-1)*(64/Math.max(1,n-2)));
return `<svg viewBox="0 0 124 46" width="112" height="42" aria-hidden="true"><path d="M3 31V17l14-7h13v21z" fill="#c9302c"/><rect x="32" y="5" width="89" height="26" rx="3" fill="#0b4fa0"/><rect x="36" y="9" width="81" height="3" fill="#ffc21a"/>${xs.map(x=>`<circle cx="${x}" cy="36" r="6.5" fill="#15171c"/><circle cx="${x}" cy="36" r="2.5" fill="#cfd4de"/>`).join('')}</svg>`};
function countUp(){$$('[data-n]').forEach(e=>{const n=+e.dataset.n;if(animated){e.textContent=n;return}let i=0;const st=()=>{i++;e.textContent=Math.round(n*i/15);if(i<15)requestAnimationFrame(st)};st()});animated=true}
// Map (drawn in SVG, no internet needed)
const NS='http://www.w3.org/2000/svg',X=l=>(l-67)*18.6,Y=a=>(37-a)*20;
const OUT=[[34.7,73.8],[35.5,74.6],[36.9,75.2],[35.9,76.6],[35.5,77.8],[34.4,78.7],[33.4,79.2],[32.6,78.4],[32,78.8],[31,79],[30.4,79.9],[30.1,81],[29.1,80.2],[28.6,80.6],[28.1,82],[27.6,83.3],[27.4,84.8],[26.5,86.2],[26.4,88],[27.1,88.2],[27.9,88.9],[27.3,89.6],[26.7,90.3],[26.9,92],[27.8,92.7],[28.3,93.9],[29.3,94.9],[29.3,96.1],[28.2,97.3],[27.2,97.4],[25.7,96.3],[25.2,95],[24.2,94.6],[23.1,93.4],[22,93.1],[23,92.4],[24.1,91.8],[25.1,92],[25.2,90.5],[25.2,89.1],[24.5,88.2],[23.6,88.6],[22.9,88.8],[21.7,88.9],[21.6,87.6],[20.7,87],[19.9,86.6],[19.3,85.1],[18.1,83.6],[16.9,82.3],[15.8,80.9],[14.5,80.1],[13.2,80.3],[11.8,79.8],[10.3,79.9],[9.3,79.3],[8.4,78.1],[8.1,77.5],[8.7,76.8],[9.9,76.2],[11.2,75.6],[12.4,74.9],[13.5,74.7],[14.8,74.1],[15.8,73.7],[17,73.3],[18.4,72.9],[19.7,72.7],[20.7,72.8],[21.4,72.6],[22.3,72.6],[21.7,72.1],[20.9,71.2],[20.8,70.5],[21.6,69.6],[22.4,69],[23.1,68.6],[23.7,68.2],[24.4,68.7],[24.7,70.1],[25.8,70.3],[27,70],[28,70],[29.4,71.9],[30,73],[30.9,74.3],[31.6,74.6],[32.5,75.2],[33.5,74],[34.2,74]];
const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 600 620');$('#map').appendChild(svg);
// Highways: approximate corridors drawn through the cities (verify numbers with NHAI / MoRTH)
const NH=[{id:'NH 44',k:6,c:'#e8590c',n:'Srinagar to Kanyakumari, the longest national highway',s:['Srinagar','Jammu','Delhi','Agra','Gwalior','Jhansi','Bhopal','Nagpur','Hyderabad','Bengaluru','Madurai','Kanyakumari']},
{id:'NH 48',k:4,c:'#0b7285',n:'Delhi to Chennai via Jaipur, Ahmedabad, Mumbai, Pune and Bengaluru',s:['Delhi','Jaipur','Udaipur','Ahmedabad','Surat','Mumbai','Pune','Bengaluru','Chennai']},
{id:'NH 19',k:3,c:'#862e9c',n:'Delhi to Kolkata along the Grand Trunk Road',s:['Delhi','Agra','Kanpur','Varanasi','Kolkata']},
{id:'NH 16',k:2,c:'#1864ab',n:'Kolkata to Chennai along the east coast',s:['Kolkata','Bhubaneswar','Visakhapatnam','Vijayawada','Chennai']},
{id:'NH 53',k:3,c:'#2b8a3e',n:'Surat to Kolkata via Nagpur and Raipur',s:['Surat','Nagpur','Raipur','Kolkata']},
{id:'NH 65',k:1,c:'#c2255c',n:'Pune to Vijayawada via Hyderabad',s:['Pune','Hyderabad','Vijayawada']}];
const LINK=[['Indore','Bhopal'],['Indore','Nashik'],['Nashik','Mumbai'],['Nashik','Pune'],['Bhopal','Jabalpur'],['Jabalpur','Nagpur'],['Jabalpur','Raipur'],['Jaipur','Kota'],['Kota','Indore'],['Lucknow','Kanpur'],['Lucknow','Varanasi'],['Patna','Varanasi'],['Patna','Kolkata']];
const hv=(a,b)=>{const A=CITIES[a],B=CITIES[b],r=x=>x*Math.PI/180,h=Math.sin(r(B[0]-A[0])/2)**2+Math.cos(r(A[0]))*Math.cos(r(B[0]))*Math.sin(r(B[1]-A[1])/2)**2;return 2*6371*Math.asin(Math.sqrt(h))};
const EDGES=[];NH.forEach(h=>h.s.forEach((c,i)=>i&&EDGES.push([h.s[i-1],c,h.id])));LINK.forEach(([a,b])=>EDGES.push([a,b,'Link road']));
const RC={};
function route(a,b){const k=a+'|'+b;if(RC[k])return RC[k];const d={[a]:0},prev={},done={};
while(true){let u=null;for(const c in d)if(!done[c]&&(u===null||d[c]<d[u]))u=c;if(u===null||u===b)break;done[u]=1;
EDGES.forEach(([x,y,id])=>[[x,y],[y,x]].forEach(([p,q])=>{if(p===u){const w=d[u]+hv(p,q);if(d[q]===undefined||w<d[q]){d[q]=w;prev[q]=[u,id]}}}))}
let st=[b],ids=[];if(d[b]===undefined)st=[a,b],ids=['Direct road'];else for(let c=b;c!==a;){const[p,id]=prev[c];st.unshift(p);ids.unshift(id);c=p}
if(st.length<2)st=[a,a];return RC[k]={names:st,pts:st.map(c=>CITIES[c]),ids:ids.filter((x,i)=>x!==ids[i-1])}}
function along(pts,p){const seg=[];let tot=0;for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);tot+=l}
let t=p*tot;for(let i=0;i<seg.length;i++){if(t<=seg[i]||i===seg.length-1){const f=seg[i]?Math.min(1,t/seg[i]):0;return[pts[i][0]+(pts[i+1][0]-pts[i][0])*f,pts[i][1]+(pts[i+1][1]-pts[i][1])*f]}t-=seg[i]}}
const pathLen=r=>r.names.reduce((s,c,i)=>i?s+hv(r.names[i-1],c):0,0),hw=(a,b)=>a===b?'-':route(a,b).ids.join(' → ');
const lay={nh:1,sh:1,ct:1};let hl=null;const P=c=>X(CITIES[c][1])+','+Y(CITIES[c][0]);
svg.innerHTML='<g id="base"></g><g id="lines"></g><g id="trk"></g>';
function drawBase(){let g=`<polygon points="${OUT.map(p=>X(p[1])+','+Y(p[0])).join(' ')}" fill="var(--land)" stroke="var(--mut)" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
for(let la=10;la<=35;la+=5)g+=`<line x1="0" x2="600" y1="${Y(la)}" y2="${Y(la)}" class="gr"/><text x="4" y="${Y(la)-3}" class="gt">${la}°N</text>`;
for(let lo=70;lo<=95;lo+=5)g+=`<line y1="0" y2="620" x1="${X(lo)}" x2="${X(lo)}" class="gr"/><text x="${X(lo)+3}" y="614" class="gt">${lo}°E</text>`;
if(lay.sh)LINK.forEach(([a,b])=>{const[p,q]=[P(a).split(','),P(b).split(',')];g+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="sh"/>`});
if(lay.nh){NH.forEach(h=>{g+=`<polyline points="${h.s.map(P).join(' ')}" fill="none" stroke="${h.c}" stroke-width="${hl===h.id?5:3}" opacity="${!hl||hl===h.id?.95:.15}" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`});
NH.forEach(h=>{if(hl&&hl!==h.id)return;const[p,q]=[P(h.s[h.k-1]).split(','),P(h.s[h.k]).split(',')],x=(+p[0]+ +q[0])/2,y=(+p[1]+ +q[1])/2;
g+=`<rect x="${x-17}" y="${y-8}" width="34" height="16" rx="4" fill="#ffc21a" stroke="#15171c" stroke-width="1.4"/><text x="${x}" y="${y+4}" text-anchor="middle" font-size="10" font-weight="700" fill="#15171c">${h.id}</text>`})}
if(lay.ct)Object.entries(CITIES).forEach(([n,c])=>{g+=`<circle cx="${X(c[1])}" cy="${Y(c[0])}" r="2.6" fill="var(--fg)"/><text x="${X(c[1])+5}" y="${Y(c[0])+3}" class="cl">${n}</text>`});
$('#base').innerHTML=g}
function drawHW(){const h=NH.find(x=>x.id===hl);
$('#hw').innerHTML=`<div class="chips">${[['nh','National highways'],['sh','Link and state roads'],['ct','City names']].map(([k,l])=>`<button data-l="${k}" class="${lay[k]?'on':''}">${l}</button>`).join('')}</div>
<div class="chips">${NH.map(x=>`<button data-h="${x.id}" class="${hl===x.id?'on':''}" style="border-left:8px solid ${x.c}">${x.id}</button>`).join('')}</div>
<div class="sub">${h?`<b>${h.id}</b>: ${h.n}. About ${Math.round(h.s.reduce((n,c,i)=>i?n+hv(h.s[i-1],c):0,0)*1.1).toLocaleString('en-IN')} km. Passes ${h.s.join(', ')}.`:'Tap a highway number to highlight it. Dashed grey lines are state highways and link roads. Their numbers differ in every state, so check the state PWD website. Highway data here is approximate.'}</div>`;
$$('#hw [data-l]').forEach(b=>b.onclick=()=>{lay[b.dataset.l]^=1;drawBase();drawHW()});
$$('#hw [data-h]').forEach(b=>b.onclick=()=>{hl=hl===b.dataset.h?null:b.dataset.h;drawBase();drawHW()})}
// Zoom and pan
let vb={x:0,y:0,w:600,h:620};const setVB=()=>svg.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`),clampVB=()=>{vb.x=Math.max(0,Math.min(600-vb.w,vb.x));vb.y=Math.max(0,Math.min(620-vb.h,vb.y))};
function zoom(f,cx=vb.x+vb.w/2,cy=vb.y+vb.h/2){const w=Math.max(110,Math.min(600,vb.w*f)),h=w*620/600;vb={x:cx-(cx-vb.x)*w/vb.w,y:cy-(cy-vb.y)*h/vb.h,w,h};clampVB();setVB()}
const scl=()=>{const r=svg.getBoundingClientRect(),k=Math.min(r.width/vb.w,r.height/vb.h);return{r,k,ox:(r.width-vb.w*k)/2,oy:(r.height-vb.h*k)/2}};
$('#zi').onclick=()=>zoom(.7);$('#zo').onclick=()=>zoom(1/.7);$('#zr').onclick=()=>{vb={x:0,y:0,w:600,h:620};setVB()};
svg.addEventListener('wheel',e=>{e.preventDefault();const{r,k,ox,oy}=scl();zoom(e.deltaY>0?1.2:.83,vb.x+(e.clientX-r.left-ox)/k,vb.y+(e.clientY-r.top-oy)/k)},{passive:false});
let drag=null;svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,vx:vb.x,vy:vb.y}});
addEventListener('pointermove',e=>{if(!drag)return;const{k}=scl();vb.x=drag.vx-(e.clientX-drag.x)/k;vb.y=drag.vy-(e.clientY-drag.y)/k;clampVB();setVB()});
addEventListener('pointerup',()=>drag=null);drawBase();drawHW();
let sel=null,me=null;
const popup=t=>`<span class="plate">${fmtReg(t.reg)}</span> <span class="badge ${moving(t)?'in':'idle'}">${status(t)}</span><br>${t.type} · ${RATES[t.type].w} wheels · ${RATES[t.type].cap} t<br>Driver: ${t.driver||'-'} ${t.phone||''}<br>${t.a}${moving(t)?' → '+t.b+'<br>Highways: '+hw(t.a,t.b):' (parked)'}`;
function drawTrucks(){
$('#lines').innerHTML=fleet.filter(t=>t.reg===sel&&moving(t)).map(t=>`<polyline points="${route(t.a,t.b).pts.map(c=>X(c[1])+','+Y(c[0])).join(' ')}" fill="none" stroke="var(--bl)" stroke-width="6" opacity=".5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
$('#trk').innerHTML=fleet.map(t=>{const p=pos(t),x=X(p[1]),y=Y(p[0]),s=t.reg===sel;
return `<g style="cursor:pointer">${moving(t)?`<circle class="pulse" cx="${x}" cy="${y}" r="5" fill="#0a7a43"/>`:''}<circle data-r="${t.reg}" cx="${x}" cy="${y}" r="12" fill="transparent"/><circle data-r="${t.reg}" cx="${x}" cy="${y}" r="${s?7:5}" fill="${moving(t)?'#1a8f3c':'#777'}" stroke="#fff" stroke-width="1.5"/>${s?`<text x="${x+9}" y="${y-8}" font-size="10" font-weight="700" fill="var(--fg)">${fmtReg(t.reg)}</text>`:''}</g>`}).join('')+(me?`<circle cx="${X(me[1])}" cy="${Y(me[0])}" r="6" fill="#1f4fd8" stroke="#fff" stroke-width="2"/>`:'');
const c=fleet.find(x=>x.reg===sel);$('#sel').innerHTML=c?`<div class="card" style="margin-bottom:8px">${popup(c)}</div>`:'<p style="font-size:12px;color:var(--mut)">Tap a truck on the map or in the list.</p>'}
svg.addEventListener('click',e=>{const r=e.target.dataset&&e.target.dataset.r;if(r)pick(r)});
function pick(r){sel=r;show('live');drawTrucks();drawList()}
function drawList(){const q=$('#q').value.toLowerCase(),F={all:()=>1,transit:moving,parked:t=>!moving(t),alert:t=>alerts(t).length},
l=fleet.filter(t=>(t.reg+(t.driver||'')+t.type).toLowerCase().includes(q)&&F[flt](t));
$('#lst').innerHTML=l.map(t=>`<div class="card li${t.reg===sel?' sel':''}" data-r="${t.reg}"><span class="plate sm">${fmtReg(t.reg)}</span> <span class="badge ${moving(t)?'in':'idle'}">${status(t)}</span><div class="sub">${t.type} · ${t.a}${moving(t)?' → '+t.b:''}</div></div>`).join('')||'<p class="sub">No trucks match. Try another search or filter.</p>';
$$('#lst .card').forEach(c=>c.onclick=()=>pick(c.dataset.r));
const mv=fleet.filter(moving).length,al=fleet.reduce((n,t)=>n+alerts(t).length,0);
$('#stats').innerHTML=[[fleet.length,'Trucks in fleet'],[mv,'On the road'],[fleet.length-mv,'Parked'],[al,'Need attention']].map(([n,l])=>`<div class="stat"><b data-n="${n}">0</b><small>${l}</small></div>`).join('');countUp()}
function drawFleet(){$('#cards').innerHTML=fleet.map(t=>{const s=RATES[t.type],life=Math.min(100,Math.round(t.km/600)),lc=life>=92?'var(--warn)':life>=70?'#e08a00':'var(--ok)';
return `<div class="card truck${moving(t)?'':' parked'}"><div class="th"><div><span class="plate">${fmtReg(t.reg)}</span> <span class="badge ${moving(t)?'in':'idle'}">${status(t)}</span></div>${truckSVG(s.w)}</div>
<div class="chip-row"><span>${t.type}</span><span>${s.w} wheels</span><span>${s.cap} tonne</span><span>${inr(s.rate)}/km</span></div>
<div class="kv"><span>Tyres</span><b>${s.w+1} × ${s.tyre} ${t.brand||''}</b></div>
<div class="bar"><i style="width:${life}%;background:${lc}"></i></div><small>${(+t.km).toLocaleString('en-IN')} km run, ${life}% of tyre life used</small>
<div class="kv"><span>Driver</span><b>${t.driver||'-'} ${t.phone||''}</b></div>
<div class="kv"><span>Route</span><b>${t.a}${moving(t)?' → '+t.b+' ('+Math.round((t.d>0?t.p:1-t.p)*100)+'%)':' (parked)'}</b></div>
${moving(t)?`<div class="kv"><span>Highways</span><b>${hw(t.a,t.b)}</b></div>`:''}<div class="kv"><span>Insurance</span><b>${fmtD(t.ins)}</b></div><div class="kv"><span>Fitness</span><b>${fmtD(t.fit)}</b></div><div class="kv"><span>Permit</span><b>${fmtD(t.per)}</b></div>
${alerts(t).map(a=>`<div class="alert">⚠ ${a}</div>`).join('')}
<div class="acts"><button class="btn s" onclick="track('${t.reg}')">Track on map</button><button class="btn s r" onclick="del('${t.reg}')">Delete</button></div></div>`}).join('')||'<p class="sub">No trucks yet. Use Add truck to register your first one.</p>'}
function track(r){pick(r)}
function del(r){if(pend!==r){pend=r;toast('Tap Delete again to remove '+fmtReg(r));setTimeout(()=>{if(pend===r)pend=null},3000);return}fleet=fleet.filter(t=>t.reg!==r);pend=null;save();all();toast('Truck deleted')}
function all(){drawTrucks();drawList();drawFleet()}
function show(t){$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));$$('.sec').forEach(s=>s.classList.toggle('on',s.id===t))}
$$('nav button').forEach(b=>b.onclick=()=>show(b.dataset.t));$('#q').oninput=drawList;
$('#me').onclick=()=>{try{navigator.geolocation.getCurrentPosition(p=>{me=[p.coords.latitude,p.coords.longitude];drawTrucks();toast('Your location is the blue dot')},()=>toast('Location is not available'))}catch{toast('Location is not available')}};
$$('#fc button').forEach(b=>b.onclick=()=>{flt=b.dataset.f;$$('#fc button').forEach(x=>x.classList.toggle('on',x===b));drawList()});
// Forms
$('#type').innerHTML=$('#rty').innerHTML=opts(Object.keys(RATES));$('#from').innerHTML=$('#rf').innerHTML=opts(Object.keys(CITIES));
$('#to').innerHTML='<option>Parked (no trip)</option>'+opts(Object.keys(CITIES));$('#rt').innerHTML=opts(Object.keys(CITIES).reverse());
const spec=()=>{const s=RATES[$('#type').value];$('#spec').innerHTML=truckSVG(s.w)+`<br>${s.w} wheels · ${s.cap} t capacity · tyre ${s.tyre} · ${inr(s.rate)}/km`};$('#type').onchange=spec;spec();
$('#save').onclick=()=>{const reg=$('#reg').value.replace(/\s/g,'').toUpperCase(),m=$('#msg');
if(!REG.test(reg))return m.textContent='Invalid number. Example: MP20GA1234';if(fleet.some(t=>t.reg===reg))return m.textContent='Already registered';
const a=$('#from').value,b=$('#to').value in CITIES?$('#to').value:a;
fleet.push({reg,type:$('#type').value,driver:$('#dn').value,phone:$('#dp').value,brand:$('#brand').value,km:+$('#km').value||0,ins:$('#ins').value,fit:$('#fit').value,per:$('#per').value,a,b,p:0,d:1});
save();m.textContent='';$('#reg').value='';all();show('fleet');toast(fmtReg(reg)+' added to your fleet')};
$('#calc').onclick=()=>{const f=$('#rf').value,t=$('#rt').value,ty=$('#rty').value,w=+$('#rw').value||0,s=RATES[ty],o=$('#out');
if(f===t){o.innerHTML='<div class="alert">Choose two different cities.</div>';return}
const km=dist(f,t),fr=km*s.rate,toll=km*s.toll,ld=500+w*100,tot=fr+toll+ld,hrs=km/45,ok=fleet.filter(x=>x.type===ty&&RATES[x.type].cap>=w);
o.innerHTML=`<div class="result"><div class="route">${f} <span>to</span> ${t}</div><div class="sub">${km} km, about ${Math.floor(hrs/24)} day ${Math.round(hrs%24)} hr on the road</div><div class="sub">Highways: ${hw(f,t)}</div>
<div class="total" id="tot">${inr(tot)}</div><div class="sub">${w?inr(tot/w)+' per tonne. ':''}GST is extra.</div>
<div class="stack"><i style="width:${fr/tot*100}%;background:var(--bl)"></i><i style="width:${toll/tot*100}%;background:var(--ye)"></i><i style="width:${ld/tot*100}%;background:var(--ok)"></i></div>
<div class="legend"><span><u style="background:var(--bl)"></u>Freight ${inr(fr)}</span><span><u style="background:var(--ye)"></u>Toll ${inr(toll)}</span><span><u style="background:var(--ok)"></u>Loading ${inr(ld)}</span></div>
${w>s.cap?`<div class="alert">${w} t is above the ${s.cap} t capacity of this truck type. Choose a bigger one.</div>`:''}</div>
<h4>Trucks in your fleet that fit</h4>${ok.map(x=>`<div class="card" style="margin-top:6px"><span class="plate sm">${fmtReg(x.reg)}</span> ${x.driver||''} <span class="sub">${status(x)}</span></div>`).join('')||'<p class="sub">You have no truck of this type that can take this load.</p>'}`;
const e=$('#tot');let i=0;const st=()=>{i++;e.textContent=inr(tot*i/20);if(i<20)requestAnimationFrame(st)};st()};
[['Indore','Mumbai'],['Delhi','Kolkata'],['Pune','Hyderabad'],['Jaipur','Ahmedabad']].forEach(([a,b])=>{const x=document.createElement('button');x.textContent=a+' to '+b;x.onclick=()=>{$('#rf').value=a;$('#rt').value=b;$('#calc').click()};$('#pr').appendChild(x)});
// Live simulation
setInterval(()=>{fleet.forEach(t=>{if(!moving(t))return;t.p+=0.006*t.d;if(t.p>=1||t.p<=0){t.d*=-1;t.p=Math.max(0,Math.min(1,t.p))}0});save();drawTrucks();
if($('#fleet').classList.contains('on')&&++tk%3===0)drawFleet()},2000);
all();
