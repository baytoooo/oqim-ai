import {initCityTraffic} from './citytraffic.js';
import {initJunctions} from './junctions.js';
import {initParking} from './parking-ui.js';
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
 cityMap.on('load',()=>{$('cityStatus').textContent='Карта загружена. Приближайте кварталы, чтобы рассмотреть объёмные здания.';cityMap.setPaintProperty('building-3d','fill-extrusion-color','#8eabb1');cityMap.setPaintProperty('building-3d','fill-extrusion-opacity',.92);initParking(cityMap);initJunctions(cityMap);initCityTraffic(cityMap);});
 cityMap.on('idle',()=>{if(!cityMap.getLayer('building-3d'))return;const buildings=cityMap.queryRenderedFeatures({layers:['building-3d']});$('cityStatus').textContent=buildings.length?'Ташкент · 3D-здания отображаются. Нажмите на карту, чтобы выбрать место назначения.':'Приблизьте карту до квартала: 3D-здания видны на крупном масштабе.';});
 cityMap.on('error',()=>{$('cityStatus').textContent='Часть карты не загрузилась. Для тайлов нужен интернет. Можно повторить загрузку.';});
 $('cityHome').onclick=()=>cityMap.easeTo({center:centre,zoom:16,pitch:60,bearing:-25,duration:1800});
 $('cityWide').onclick=()=>cityMap.easeTo({center:centre,zoom:11.8,pitch:35,bearing:0,duration:1800});
 $('cityPitch').oninput=()=>cityMap.setPitch(+$('cityPitch').value);
 $('cityLeft').onclick=()=>cityMap.easeTo({bearing:cityMap.getBearing()-30,duration:1200});$('cityRight').onclick=()=>cityMap.easeTo({bearing:cityMap.getBearing()+30,duration:1200});
 cityMap.on('pitchend',()=>{$('cityPitch').value=cityMap.getPitch();});
 }catch(e){$('cityStatus').textContent=`Карта недоступна: ${e.message} Схема движения остаётся доступной во вкладке «Дорожная сеть».`;cityMap?.remove();cityMap=null;}finally{loading=null;}})();return loading;
}
export function retryCity(){cityMap?.remove();cityMap=null;return showCity();}
