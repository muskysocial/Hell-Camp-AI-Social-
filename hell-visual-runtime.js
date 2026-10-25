(function(){
'use strict';
const KEY='hellcamp_visual_edits_v1';
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function apply(){const edits=load(),path=location.pathname;Object.keys(edits).forEach(k=>{if(!k.startsWith(path+'|'))return;const selector=k.slice(path.length+1),d=edits[k];try{const el=document.querySelector(selector);if(!el)return;if(d.text!==undefined&&el.children.length===0&&el.textContent!==d.text)el.textContent=d.text;if(d.color)el.style.setProperty('color',d.color);if(d.background)el.style.setProperty('background-color',d.background);if(d.fontSize)el.style.setProperty('font-size',d.fontSize);if(d.radius)el.style.setProperty('border-radius',d.radius);if(d.transform)el.style.setProperty('transform',d.transform);if(d.image&&el.tagName==='IMG'&&el.getAttribute('src')!==d.image)el.setAttribute('src',d.image)}catch(e){}})}
let queued=false;function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;apply()},150)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
window.addEventListener('storage',e=>{if(e.key===KEY)apply()});
})();