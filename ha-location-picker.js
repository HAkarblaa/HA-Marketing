(function(){
  const GOVS=[
    {name:'بغداد',lat:33.3152,lng:44.3661,zoom:10},
    {name:'البصرة',lat:30.5085,lng:47.7804,zoom:9},
    {name:'نينوى',lat:36.3400,lng:43.1300,zoom:8},
    {name:'أربيل',lat:36.1911,lng:44.0092,zoom:9},
    {name:'السليمانية',lat:35.5570,lng:45.4350,zoom:9},
    {name:'دهوك',lat:36.8670,lng:42.9880,zoom:9},
    {name:'كركوك',lat:35.4681,lng:44.3922,zoom:9},
    {name:'الأنبار',lat:33.4250,lng:43.3000,zoom:7},
    {name:'بابل',lat:32.4800,lng:44.4300,zoom:9},
    {name:'كربلاء',lat:32.6160,lng:44.0240,zoom:10},
    {name:'النجف',lat:32.0000,lng:44.3300,zoom:9},
    {name:'القادسية',lat:31.9900,lng:44.9300,zoom:9},
    {name:'المثنى',lat:31.3200,lng:45.2800,zoom:8},
    {name:'ذي قار',lat:31.0500,lng:46.2600,zoom:9},
    {name:'ميسان',lat:31.8400,lng:47.1400,zoom:9},
    {name:'واسط',lat:32.5100,lng:45.8200,zoom:9},
    {name:'ديالى',lat:33.7500,lng:44.6400,zoom:9},
    {name:'صلاح الدين',lat:34.6000,lng:43.6800,zoom:8},
    {name:'حلبجة',lat:35.1800,lng:45.9900,zoom:10}
  ];

  const alias={
    'بغداد':'بغداد','baghdad':'بغداد',
    'البصرة':'البصرة','بصره':'البصرة','basra':'البصرة','basrah':'البصرة',
    'نينوى':'نينوى','الموصل':'نينوى','nineveh':'نينوى','mosul':'نينوى',
    'أربيل':'أربيل','اربيل':'أربيل','erbil':'أربيل','hawler':'أربيل',
    'السليمانية':'السليمانية','سليمانية':'السليمانية','sulaymaniyah':'السليمانية',
    'دهوك':'دهوك','duhok':'دهوك','dohuk':'دهوك',
    'كركوك':'كركوك','kirkuk':'كركوك',
    'الأنبار':'الأنبار','الانبار':'الأنبار','anbar':'الأنبار',
    'بابل':'بابل','الحلة':'بابل','babylon':'بابل',
    'كربلاء':'كربلاء','karbala':'كربلاء',
    'النجف':'النجف','نجف':'النجف','najaf':'النجف',
    'القادسية':'القادسية','الديوانية':'القادسية','qadisiyah':'القادسية',
    'المثنى':'المثنى','السماوة':'المثنى','muthanna':'المثنى',
    'ذي قار':'ذي قار','الناصرية':'ذي قار','dhi qar':'ذي قار',
    'ميسان':'ميسان','العمارة':'ميسان','maysan':'ميسان',
    'واسط':'واسط','الكوت':'واسط','wasit':'واسط',
    'ديالى':'ديالى','بعقوبة':'ديالى','diyala':'ديالى',
    'صلاح الدين':'صلاح الدين','تكريت':'صلاح الدين','salah al-din':'صلاح الدين',
    'حلبجة':'حلبجة','halabja':'حلبجة'
  };

  function el(v){return typeof v==='string'?document.querySelector(v):v}
  function norm(v){return String(v||'').trim()}
  function center(name){return GOVS.find(x=>x.name===name)||{name:'العراق',lat:33.2232,lng:43.6793,zoom:6}}
  function nearestGov(lat,lng){
    let best=null,bd=Infinity;
    GOVS.forEach(g=>{
      const d=(g.lat-lat)*(g.lat-lat)+(g.lng-lng)*(g.lng-lng);
      if(d<bd){bd=d;best=g}
    });
    return best?.name||'';
  }
  function populate(select){
    if(!select)return;
    const current=norm(select.value);
    select.innerHTML='<option value="">اختر المحافظة</option>'+GOVS.map(g=>`<option value="${g.name}">${g.name}</option>`).join('');
    if(current && GOVS.some(g=>g.name===current))select.value=current;
  }
  async function geocode(q){
    if(!q)return null;
    try{
      const u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=iq&accept-language=ar&q='+encodeURIComponent(q);
      const r=await fetch(u,{headers:{'Accept':'application/json'}});
      if(!r.ok)return null;
      const a=await r.json();
      return a?.[0]?{lat:+a[0].lat,lng:+a[0].lon,label:a[0].display_name}:null;
    }catch(_e){return null}
  }
  async function reverse(lat,lng){
    try{
      const u='https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=ar&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lng);
      const r=await fetch(u,{headers:{'Accept':'application/json'}});
      if(!r.ok)return null;
      return await r.json();
    }catch(_e){return null}
  }
  function resolveGovFromReverse(data){
    const a=data?.address||{};
    const vals=[a.state,a.governorate,a.region,a.city,a.county].map(x=>norm(x).toLowerCase()).filter(Boolean);
    for(const v of vals){
      for(const [k,val] of Object.entries(alias)){
        if(v.includes(k.toLowerCase()))return val;
      }
    }
    return '';
  }

  function attach(cfg){
    const gov=el(cfg.governorate),area=el(cfg.area),address=el(cfg.address),
      latEl=el(cfg.lat),lngEl=el(cfg.lng),mapEl=el(cfg.map),
      mapBtn=el(cfg.mapButton),gpsBtn=el(cfg.gpsButton),status=el(cfg.status);

    populate(gov);
    let map=null,marker=null,lat=latEl?.value?+latEl.value:null,lng=lngEl?.value?+lngEl.value:null;

    function setStatus(msg,type=''){
      if(!status)return;
      status.textContent=msg;
      status.classList.remove('ok','bad');
      if(type)status.classList.add(type);
    }
    function notify(){
      if(latEl)latEl.value=Number.isFinite(lat)?String(lat):'';
      if(lngEl)lngEl.value=Number.isFinite(lng)?String(lng):'';
      if(typeof cfg.onChange==='function')cfg.onChange(getValue());
    }
    function setPoint(a,b,zoom=16){
      lat=+a;lng=+b;
      if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
      if(map){
        if(!marker){
          marker=L.marker([lat,lng],{draggable:true}).addTo(map);
          marker.on('dragend',()=>{const p=marker.getLatLng();lat=p.lat;lng=p.lng;notify();setStatus('✅ تم تثبيت دبوس الموقع','ok')});
        }else marker.setLatLng([lat,lng]);
        map.setView([lat,lng],zoom);
      }
      notify();
      setStatus('✅ تم تثبيت دبوس الموقع','ok');
    }
    function ensureMap(){
      if(map || !mapEl || !window.L)return;
      map=L.map(mapEl,{zoomControl:true}).setView([33.2232,43.6793],6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,
        attribution:'&copy; OpenStreetMap'
      }).addTo(map);
      map.on('click',e=>setPoint(e.latlng.lat,e.latlng.lng,map.getZoom()));
      if(Number.isFinite(lat)&&Number.isFinite(lng))setPoint(lat,lng,16);
    }
    async function openMap(){
      if(!mapEl)return;
      mapEl.classList.add('show');
      ensureMap();
      setTimeout(()=>map?.invalidateSize(),60);

      if(Number.isFinite(lat)&&Number.isFinite(lng)){
        map.setView([lat,lng],16);
        return;
      }

      const g=center(gov?.value);
      const q=[norm(area?.value),norm(gov?.value),'العراق'].filter(Boolean).join('، ');
      setStatus('جاري فتح الخريطة داخل المحافظة...');
      const found=norm(area?.value)?await geocode(q):null;
      if(found){
        map.setView([found.lat,found.lng],15);
        setStatus('اضغط على المكان الصحيح بالخريطة لتثبيت الدبوس.');
      }else{
        map.setView([g.lat,g.lng],g.zoom||9);
        setStatus('اضغط على المكان الصحيح بالخريطة لتثبيت الدبوس.');
      }
    }
    async function useGps(){
      if(!navigator.geolocation){
        setStatus('الجهاز لا يدعم تحديد الموقع.','bad');
        return;
      }
      setStatus('جاري تحديد موقعك...');
      navigator.geolocation.getCurrentPosition(async pos=>{
        const a=pos.coords.latitude,b=pos.coords.longitude;
        if(!gov?.value){
          const rv=await reverse(a,b);
          const guessed=resolveGovFromReverse(rv)||nearestGov(a,b);
          if(guessed)gov.value=guessed;
        }
        if(mapEl)mapEl.classList.add('show');
        ensureMap();
        setTimeout(()=>map?.invalidateSize(),60);
        setPoint(a,b,17);
        setStatus('✅ تم تحديد موقعك الحالي وتثبيت الدبوس','ok');
      },()=>{
        setStatus('تعذر تحديد الموقع. فعّل GPS واسمح للموقع بالوصول.','bad');
      },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
    }

    mapBtn?.addEventListener('click',e=>{e.preventDefault();openMap()});
    gpsBtn?.addEventListener('click',e=>{e.preventDefault();useGps()});
    gov?.addEventListener('change',()=>{
      if(map){
        const g=center(gov.value);
        map.setView([g.lat,g.lng],g.zoom||9);
      }
      notify();
    });
    area?.addEventListener('input',notify);
    address?.addEventListener('input',notify);

    function getValue(){
      const parts=[norm(gov?.value),norm(area?.value),norm(address?.value)].filter(Boolean);
      return {
        governorate:norm(gov?.value),
        area:norm(area?.value),
        address:norm(address?.value),
        location_text:parts.join(' - '),
        lat:Number.isFinite(lat)?lat:null,
        lng:Number.isFinite(lng)?lng:null,
        map_url:(Number.isFinite(lat)&&Number.isFinite(lng))
          ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
          : null
      };
    }

    function setValue(v={}){
      const gv=norm(v.governorate);
      if(gov && gv && GOVS.some(g=>g.name===gv))gov.value=gv;
      if(area)area.value=norm(v.area);
      if(address)address.value=norm(v.address);
      const a=v.lat==null?null:+v.lat,b=v.lng==null?null:+v.lng;
      lat=Number.isFinite(a)?a:null;lng=Number.isFinite(b)?b:null;
      if(Number.isFinite(lat)&&Number.isFinite(lng)){
        setStatus('✅ موقع محفوظ','ok');
        if(map){setPoint(lat,lng,16)}
      }else setStatus('حدد الموقع من الخريطة أو استخدم دبوس موقعك الحالي.');
      notify();
    }

    function reset(){
      if(gov)gov.value='';
      if(area)area.value='';
      if(address)address.value='';
      lat=null;lng=null;
      if(marker&&map){map.removeLayer(marker);marker=null}
      if(mapEl)mapEl.classList.remove('show');
      setStatus('حدد الموقع من الخريطة أو استخدم دبوس موقعك الحالي.');
      notify();
    }

    setValue({lat,lng});
    return {openMap,useGps,getValue,setValue,reset};
  }

  function splitLocation(text){
    const parts=String(text||'').split(' - ').map(x=>x.trim()).filter(Boolean);
    const gv=parts.find(x=>GOVS.some(g=>g.name===x))||'';
    if(gv && parts[0]===gv)return {governorate:gv,area:parts[1]||'',address:parts.slice(2).join(' - ')||''};
    return {governorate:'',area:'',address:String(text||'').trim()};
  }

  window.HA_LocationPicker={GOVS,attach,splitLocation,nearestGov};
})();