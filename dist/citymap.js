let cityMap,loading;
const $=id=>document.getElementById(id);
const centre=[69.2797,41.3112];
function library(){return new Promise((resolve,reject)=>{if(window.maplibregl)return resolve();const s=document.createElement('script');s.src='./vendor/maplibre-gl.js';s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Не удалось загрузить библиотеку карты.'));};document.head.append(s);});}
export async function showCity(){
 if(cityMap){cityMap.resize();return;}if(loading)return loading;
 loading=(async()=>{try{
 $('cityStatus').textContent='Загружаем карту Ташкента…';await library();
 cityMap=new maplibregl.Map({container:'cityMap',style:'https://tiles.openfreemap.org/styles/liberty',center:centre,zoom:16,pitch:60,bearing:-25,antialias:true,maxZoom:19,maxPitch:70});
 cityMap.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-right');cityMap.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
 cityMap.on('load',()=>{$('cityStatus').textContent='Карта загружена. Приближайте кварталы, чтобы рассмотреть объёмные здания.';cityMap.setPaintProperty('building-3d','fill-extrusion-color','#8eabb1');cityMap.setPaintProperty('building-3d','fill-extrusion-opacity',.92);});
 cityMap.on('idle',()=>{if(!cityMap.getLayer('building-3d'))return;const buildings=cityMap.queryRenderedFeatures({layers:['building-3d']});$('cityStatus').textContent=buildings.length?'Ташкент · 3D-здания отображаются. Нажмите на здание для сведений.':'Приблизьте карту до квартала: 3D-здания видны на крупном масштабе.';});
 cityMap.on('error',()=>{$('cityStatus').textContent='Часть карты не загрузилась. Для тайлов нужен интернет. Можно повторить загрузку.';});
 cityMap.on('click',e=>{if(!cityMap.getLayer('building-3d'))return;const f=cityMap.queryRenderedFeatures(e.point,{layers:['building-3d']})[0];if(!f)return;const content=document.createElement('div');content.style.color='#17242d';const title=document.createElement('strong');title.textContent=f.properties.name||'Здание на карте';const note=document.createElement('p');note.textContent=`Высота визуализации: ${f.properties.render_height??'не указана'} м. Значение из картографических данных, может быть оценочным.`;content.append(title,note);new maplibregl.Popup().setLngLat(e.lngLat).setDOMContent(content).addTo(cityMap);});
 $('cityHome').onclick=()=>cityMap.easeTo({center:centre,zoom:16,pitch:60,bearing:-25,duration:1800});
 $('cityWide').onclick=()=>cityMap.easeTo({center:centre,zoom:11.8,pitch:35,bearing:0,duration:1800});
 $('cityPitch').oninput=()=>cityMap.setPitch(+$('cityPitch').value);
 $('cityLeft').onclick=()=>cityMap.easeTo({bearing:cityMap.getBearing()-30,duration:1200});$('cityRight').onclick=()=>cityMap.easeTo({bearing:cityMap.getBearing()+30,duration:1200});
 cityMap.on('pitchend',()=>{$('cityPitch').value=cityMap.getPitch();});
 }catch(e){$('cityStatus').textContent=`Карта недоступна: ${e.message} Схема движения остаётся доступной во вкладке «Дорожная сеть».`;cityMap?.remove();cityMap=null;}finally{loading=null;}})();return loading;
}
export function retryCity(){cityMap?.remove();cityMap=null;return showCity();}
