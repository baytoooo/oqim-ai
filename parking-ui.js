import {metres,publicAccess,availability,eligible,decodePolyline} from './parking.js';
const $=id=>document.getElementById(id),endpoint='https://valhalla1.openstreetmap.de/';
let datasetPromise;
const landmarkNames={'way/1340792417':'Парковка рядом с Вебстером','way/1221764205':'Парковка рядом с Ильхомом','way/651542624':'Парковка западнее Ильхома'};
const name=p=>p.tags['name:ru']||p.tags.name||landmarkNames[p.id]||`Парковка OSM · ${p.id.split('/')[1]}`;
const num=(n,d=1)=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:d});
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
async function request(path,payload,signal){const r=await fetch(endpoint+path+'?json='+encodeURIComponent(JSON.stringify(payload)),{signal});if(!r.ok)throw Error('Пеший маршрутизатор временно недоступен');const data=await r.json();if(data.error)throw Error(data.error);return data;}
function options(){return {costing:'pedestrian',costing_options:{pedestrian:{walking_speed:4.8}},units:'kilometers'};}
function location(c){return {lon:c[0],lat:c[1]};}
async function loadArea(point,minutes,signal){
 const radius=Math.min(950,minutes*80+100),dy=radius/111320,dx=dy/Math.cos(point[1]*Math.PI/180),bounds=[point[0]-dx,point[1]-dy,point[0]+dx,point[1]+dy];
 const response=await fetch('https://api.openstreetmap.org/api/0.6/map?bbox='+bounds.join(','),{signal});if(!response.ok)throw Error('Каталог в этом районе временно недоступен. Попробуйте позже или выберите Вебстер.');
 const raw=await response.text();if(raw.length>15000000)throw Error('Этот участок карты слишком большой. Выберите меньший предел времени.');const xml=new DOMParser().parseFromString(raw,'text/xml');if(xml.querySelector('parsererror'))throw Error('Не удалось прочитать карту района');const nodes=new Map([...xml.querySelectorAll('node')].map(n=>[n.getAttribute('id'),[+n.getAttribute('lon'),+n.getAttribute('lat')]])),parkings=[];
 for(const e of xml.querySelectorAll('node,way')){const tags=Object.fromEntries([...e.querySelectorAll(':scope > tag')].map(t=>[t.getAttribute('k'),t.getAttribute('v')]));if(tags.amenity!=='parking')continue;const coords=e.tagName==='node'?[nodes.get(e.getAttribute('id'))]:[...e.querySelectorAll('nd')].map(n=>nodes.get(n.getAttribute('ref'))).filter(Boolean);if(!coords.length)continue;if(coords.length>1&&coords[0]===coords[coords.length-1])coords.pop();const id=e.tagName+'/'+e.getAttribute('id');parkings.push({id,tags,coordinates:[0,1].map(i=>coords.reduce((n,p)=>n+p[i],0)/coords.length),source:'https://www.openstreetmap.org/'+id});}
 return {bounds,parkings};
}
export async function initParking(map){
 datasetPromise ||= fetch('./data/parking-tashkent.json').then(r=>{if(!r.ok)throw Error('Каталог парковок недоступен');return r.json();});
 let data;try{data=await datasetPromise;}catch(e){$('parkingStatus').textContent=e.message;datasetPromise=null;return;}
 let area=data,destination=data.places[0],items=[],markers=[],destMarker,controller,requestId=0,selected=null,demo={},manual={},searching=false,routeGeneration=0;
 try{manual=JSON.parse(localStorage.getItem('oqim-parking-manual')||'{}');}catch{}
 const getObservation=p=>availability($('parkingDemoMode').checked?demo[p.id]:manual[p.id]);
 function clearRoute(){routeGeneration++;selected=null;map.getSource('parking-route')?.setData({type:'FeatureCollection',features:[]});$('parkingDirections').replaceChildren();}
 function cancel(){searching=false;$('parkingSearch').disabled=false;requestId++;controller?.abort();clearRoute();markers.forEach(m=>m.remove());markers=[];items=[];$('parkingResults').replaceChildren();}
 function setDestination(place){cancel();destination=place;$('parkingDestination').textContent=place.name;$('parkingStatus').textContent='Точка выбрана. Нажмите «Найти парковку». Для точного маршрута выбирайте нужный вход в здание.';destMarker?.remove();destMarker=new maplibregl.Marker({color:'#547dff'}).setLngLat(place.coordinates).addTo(map);map.easeTo({center:place.coordinates,zoom:16,pitch:55,duration:900});$('parkingSearch').disabled=false;}
 map.addSource('parking-route',{type:'geojson',data:{type:'FeatureCollection',features:[]}});map.addLayer({id:'parking-route-line',type:'line',source:'parking-route',paint:{'line-color':'#266bda','line-width':6,'line-opacity':.9},layout:{'line-cap':'round','line-join':'round'}});
 map.on('click',e=>{if(document.getElementById('junctionMode').checked)return;const feature=map.queryRenderedFeatures(e.point).find(f=>f.properties?.name&&f.layer.type==='symbol');setDestination({name:feature?.properties?.name||`Точка ${e.lngLat.lat.toFixed(5)}, ${e.lngLat.lng.toFixed(5)}`,coordinates:[e.lngLat.lng,e.lngLat.lat]});});
 function render(){
  markers.forEach(m=>m.remove());markers=[];$('parkingResults').replaceChildren();
  const sorted=[...items].sort((a,b)=>{const rank={free:0,unknown:1,full:2};return rank[getObservation(a.p).state]-rank[getObservation(b.p).state]||a.seconds-b.seconds;});
  let recommendation=false;
  for(const item of sorted){const p=item.p,obs=getObservation(p),card=element('article',undefined,'parkingCard '+obs.state),title=element('h3',name(p));card.append(title);
   if(obs.state==='free'&&!recommendation){card.append(element('strong',$('parkingDemoMode').checked?'Подходит в демо-сценарии':'Подходит по вашей свежей отметке','parkingRecommended'));recommendation=true;}
   card.append(element('p',`≈ ${num(item.seconds/60)} мин пешком · ${Math.round(item.distance*1000)} м`),element('span',obs.label,'parkingBadge '+obs.state));
   const info=element('p',`${p.tags.fee==='no'?'Бесплатная по OSM. ':p.tags.fee==='yes'?'Платная по OSM. ':''}${p.tags.access?'Доступ: '+p.tags.access+'. ':'Условия въезда не указаны в OSM. '}${obs.at?'Отметка '+new Date(obs.at).toLocaleTimeString('ru-RU')+'. ':''}Свободное место не бронируется.`,'caption');card.append(info);
   const source=element('a','Место на OpenStreetMap ↗');source.href=p.source;source.target='_blank';source.rel='noreferrer';card.append(source);
   const routeButton=element('button','Показать пеший маршрут','primary');routeButton.onclick=()=>showRoute(item);card.append(routeButton);const drive=element('a','Поехать к парковке ↗');drive.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.coordinates[1]+','+p.coordinates[0])+'&travelmode=driving';drive.target='_blank';drive.rel='noreferrer';card.append(drive);
   const controls=element('div',undefined,'parkingManual');const input=element('input');input.type='number';input.min='0';input.max='9999';input.step='1';input.placeholder='Свободных мест';input.setAttribute('aria-label','Свободных мест: '+name(p));const save=element('button','Отметить вручную');save.onclick=()=>{if(input.value===''||!input.checkValidity())return;const count=Number(input.value);manual[p.id]={kind:'manual',free:count,at:Date.now()};try{localStorage.setItem('oqim-parking-manual',JSON.stringify(manual));}catch{}$('parkingDemoMode').checked=false;clearRoute();render();status();};controls.append(input,save);card.append(controls);$('parkingResults').append(card);
   const markerButton=element('button','P','parkingPin '+obs.state);markerButton.setAttribute('aria-label',name(p));markerButton.onclick=e=>{e.stopPropagation();showRoute(item);card.scrollIntoView({behavior:'smooth',block:'nearest'});};markers.push(new maplibregl.Marker({element:markerButton}).setLngLat(p.coordinates).addTo(map));
  }
 }
 function status(){const free=items.filter(x=>getObservation(x.p).state==='free').length;$('parkingStatus').textContent=items.length?`${items.length} вариантов в пределах ${$('parkingMinutes').value} мин по пешей сети. ${free?`${free} со свободными местами ${$('parkingDemoMode').checked?'в ДЕМО':'по вашим ручным отметкам'}.`:'Свободные места не подтверждены — показаны подходящие по расстоянию парковки.'}`:'В пределах выбранного времени подходящих парковок не найдено. Увеличьте время или выберите другой вход.';}
 async function showRoute(item){
  const id=++routeGeneration,point=[...destination.coordinates];selected=item;$('parkingDirections').textContent='Строим пеший маршрут…';
  try{const response=await request('route',{...options(),locations:[location(item.p.coordinates),location(point)],language:'ru-RU'},AbortSignal.timeout(20000));if(id!==routeGeneration)return;const trip=response.trip;if(!trip?.legs?.length)throw Error('Маршрут не найден');if(trip.summary.time>+$('parkingMinutes').value*60){clearRoute();$('parkingDirections').textContent='Уточнённый маршрут превышает выбранный предел времени. Выберите другую парковку или увеличьте предел.';return;}
   const coordinates=trip.legs.flatMap(l=>decodePolyline(l.shape));map.getSource('parking-route').setData({type:'Feature',properties:{},geometry:{type:'LineString',coordinates}});const bounds=new maplibregl.LngLatBounds();coordinates.forEach(c=>bounds.extend(c));bounds.extend(point);bounds.extend(item.p.coordinates);map.fitBounds(bounds,{padding:70,maxZoom:17,pitch:45,duration:1200});
   const obs=getObservation(item.p);$('parkingDirections').replaceChildren(element('h3',`${name(item.p)} → ${destination.name}`),element('p',`≈ ${num(trip.summary.time/60)} мин пешком · ${Math.round(trip.summary.length*1000)} м · ${obs.label}`));const list=element('ol');trip.legs.flatMap(l=>l.maneuvers||[]).forEach(m=>list.append(element('li',m.instruction)));$('parkingDirections').append(list,element('p','Маршрут рассчитан Valhalla по OpenStreetMap, скорость 4,8 км/ч. Входы, проходы и ограничения на месте могут отличаться. Это маршрут пешком от парковки до назначения.','caption'));
  }catch(e){if(id===routeGeneration){map.getSource('parking-route')?.setData({type:'FeatureCollection',features:[]});$('parkingDirections').textContent='Не удалось подтвердить пеший маршрут. Попробуйте ещё раз. '+e.message;}}
 }
 async function search(){
  cancel();const id=requestId;controller=new AbortController();const localController=controller;const timer=setTimeout(()=>localController.abort(),25000);searching=true;$('parkingSearch').disabled=true;
  try{
   const c=destination.coordinates,limit=+$('parkingMinutes').value;if(c[0]<69.10||c[0]>69.45||c[1]<41.18||c[1]>41.42)throw Error('Выберите место в Ташкенте.');const margin=(limit*80+15)/111320,lonMargin=margin/Math.cos(c[1]*Math.PI/180);const within=b=>c[0]-lonMargin>=b[0]&&c[0]+lonMargin<=b[2]&&c[1]-margin>=b[1]&&c[1]+margin<=b[3];if(within(data.bounds))area=data;else if(!within(area.bounds)){ $('parkingStatus').textContent='Загружаем отмеченные парковки выбранного района…';area=await loadArea(c,limit,controller.signal);if(id!==requestId)return;}
   const candidates=area.parkings.filter(publicAccess).map(p=>({p,d:metres(p.coordinates,c)})).filter(x=>x.d<=limit*80).sort((a,b)=>a.d-b.d).slice(0,24);
   if(!candidates.length){status();return;}$('parkingStatus').textContent=`Проверяем пешие маршруты для ${candidates.length} парковок…`;
   const response=await request('sources_to_targets',{...options(),sources:candidates.map(x=>location(x.p.coordinates)),targets:[location(c)]},controller.signal);if(id!==requestId)return;
   items=candidates.map((x,i)=>({p:x.p,seconds:response.sources_to_targets?.[i]?.[0]?.time,distance:response.sources_to_targets?.[i]?.[0]?.distance})).filter(x=>eligible(x.p,x.seconds,limit)&&Number.isFinite(x.distance));render();status();const best=[...items].filter(x=>getObservation(x.p).state==='free').sort((a,b)=>a.seconds-b.seconds)[0];if(best)await showRoute(best);
  }catch(e){if(id===requestId)$('parkingStatus').textContent=e.name==='AbortError'?'Проверка маршрутов заняла слишком долго. Попробуйте снова.':e.message;}finally{clearTimeout(timer);if(id===requestId){searching=false;$('parkingSearch').disabled=false;}}
 }
 $('parkingSearch').onclick=search;$('parkingMinutes').onchange=()=>{cancel();$('parkingStatus').textContent='Предел изменён. Запустите подбор заново.';};$('parkingDemoMode').onchange=()=>{clearRoute();render();status();};
 $('parkingWebster').onclick=()=>setDestination(data.places[0]);$('parkingIlkhom').onclick=()=>setDestination(data.places[1]);
 $('parkingDemo').onclick=async()=>{setDestination(data.places[0]);$('parkingDemoMode').checked=true;$('parkingMinutes').value='5';demo={'way/1340792417':{kind:'demo',free:0,at:Date.now()},'way/1221764205':{kind:'demo',free:5,at:Date.now()},'way/651542624':{kind:'demo',free:3,at:Date.now()}};await search();};
 // Geocoding is explicit-submit only (never autocomplete), scoped to Tashkent.
 let lastGeocode=0;
 $('parkingFindPlace').onclick=async()=>{const q=$('parkingPlaceQuery').value.trim();if(!q||Date.now()-lastGeocode<1200)return;lastGeocode=Date.now();$('parkingFindPlace').disabled=true;try{const url='https://nominatim.openstreetmap.org/search?'+new URLSearchParams({q:q+' Ташкент',format:'jsonv2',limit:'1',viewbox:'69.10,41.42,69.45,41.18',bounded:'1'});const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Поиск места недоступен. Выберите точку на карте.');const results=await r.json();if(!results.length)throw Error('Место не найдено. Выберите точку на карте.');setDestination({name:results[0].name||q,coordinates:[+results[0].lon,+results[0].lat]});}catch(e){$('parkingStatus').textContent=e.message;}finally{$('parkingFindPlace').disabled=false;}};
 const expire=setInterval(()=>{if(!document.getElementById('city').classList.contains('active')||searching||!items.length)return;render();status();if(selected&&getObservation(selected.p).state==='unknown'){clearRoute();$('parkingDirections').textContent='Отметка занятости устарела. Обновите её перед выбором парковки.';}},30000);map.on('remove',()=>{clearInterval(expire);controller?.abort();});
 setDestination(destination);
}
