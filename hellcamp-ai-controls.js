(function(){
"use strict";
function client(){return window.supabaseClient||null}
function user(){return window.authUser||null}
function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
async function api(action,data){if(!client()||!user())throw Error("Please sign in first.");var r=await client().functions.invoke("hellcamp-ai",{body:Object.assign({action:action},data||{})});if(r.error)throw Error(r.data&&r.data.error||r.error.message||"AI request failed.");if(r.data&&r.data.error)throw Error(r.data.error);return r.data||{}}
function status(s){var n=document.getElementById("hcGroqStatus");if(n)n.textContent=s}
function bubble(log,role,content){var b=el("div","hc-groq-bubble"+(role==="user"?" me":""));b.appendChild(el("b","",role==="user"?"You":"Hell Camp AI"));b.appendChild(el("p","",content||""));if(role==="assistant"){var s=el("button","btn","🔊 Speak");s.type="button";s.setAttribute("data-hc-speak","true");b.appendChild(s)}log.appendChild(b)}
function install(){
 var card=document.getElementById("hcGroqChatCard");if(!card)return;
 var bar=card.querySelector("[data-hc-ai-tools]");
 if(!bar){
  bar=el("div","hc-ai-persistence-tools");bar.dataset.hcAiTools="true";
  [["new","＋ New chat"],["history","Chat history"],["memories","Saved memory"]].forEach(function(x){var b=el("button","",x[1]);b.type="button";b.dataset.hcAiAction=x[0];bar.appendChild(b)});
  var panel=el("section","hc-ai-persistence-panel");panel.hidden=true;panel.setAttribute("aria-live","polite");
  var form=card.querySelector("#hcGroqForm");card.insertBefore(bar,form||null);card.insertBefore(panel,form||null);
 }
 var owner=String((user()||{}).email||"").toLowerCase()==="kaptainarizonah@gmail.com";
 var diag=bar.querySelector('[data-hc-ai-action="diagnostics"]');
 if(owner&&!diag){diag=el("button","","Run AI diagnostics");diag.type="button";diag.dataset.hcAiAction="diagnostics";bar.appendChild(diag)}
 if(!owner&&diag)diag.remove();
}
function panelStart(panel,title){panel.hidden=false;panel.replaceChildren();panel.appendChild(el("strong","",title));var out=el("div","hc-ai-persistence-note","Loading…");panel.appendChild(out);return out}
async function memories(panel,out){
 var data=await api("memory_list"),list=data.memories||[];out.replaceChildren();
 out.appendChild(el("p","hc-ai-persistence-note","Save only information you want the AI to remember. You can delete saved memories at any time."));
 var area=el("textarea");area.maxLength=2000;area.placeholder="Add a preference or project detail…";area.setAttribute("aria-label","New AI memory");out.appendChild(area);
 var save=el("button","","Save memory");save.type="button";save.dataset.hcAiSave="true";out.appendChild(save);
 var items=el("div");out.appendChild(items);
 if(!list.length)items.appendChild(el("p","hc-ai-persistence-note","No saved memories yet."));
 list.forEach(function(m){var row=el("div","hc-ai-persistence-item"),txt=el("div","hc-ai-persistence-note",m.memory),del=el("button","","Delete");del.type="button";del.dataset.hcAiDelete=m.id;row.append(txt,del);items.appendChild(row)});
}
document.addEventListener("click",async function(e){
 var b=e.target.closest&&e.target.closest("[data-hc-ai-action],[data-hc-ai-save],[data-hc-ai-delete],[data-hc-ai-open]");if(!b)return;
 var panel=document.querySelector("#hcGroqChatCard .hc-ai-persistence-panel"),log=document.getElementById("hcGroqLog");
 try{
  if(b.dataset.hcAiAction==="new"){
   var u=user();if(!u)throw Error("Please sign in first.");
   window.hcGroqConversationId=null;window.hcGroqConversationOwner=u.id;window.hcGroqRestoredConversation=null;window.hcGroqHistory=[];
   localStorage.removeItem("hcGroqConversationId:"+u.id);
   if(log){log.replaceChildren();bubble(log,"assistant","New conversation started. What would you like help with?")}
   if(panel)panel.hidden=true;status("New chat ready. Your earlier conversations remain saved.");return;
  }
  if(b.dataset.hcAiAction==="history"){
   var out=panelStart(panel,"Your saved conversations"),data=await api("conversations"),items=data.conversations||[];out.replaceChildren();
   if(!items.length){out.textContent="No saved conversations yet.";return}
   items.forEach(function(item){var row=el("div","hc-ai-persistence-item"),info=el("div"),title=el("strong","",item.title||"Conversation"),date=el("div","hc-ai-persistence-note",item.last_message_at?new Date(item.last_message_at).toLocaleString():""),open=el("button","","Open");open.type="button";open.dataset.hcAiOpen=item.id;info.append(title,date);row.append(info,open);out.appendChild(row)});return;
  }
  if(b.dataset.hcAiAction==="memories"){await memories(panel,panelStart(panel,"Your saved AI memories"));return}
  if(b.dataset.hcAiAction==="diagnostics"){
   var dout=panelStart(panel,"Owner-only AI diagnostics"),report=await api("health_check");dout.className="hc-ai-health-output";dout.textContent=JSON.stringify(report,null,2);return;
  }
  if(b.dataset.hcAiSave!==undefined){
   var area=panel.querySelector("textarea"),memory=area&&area.value.trim();if(!memory)throw Error("Write a memory before saving.");
   await api("memory_save",{memory:memory,memory_type:"project_context"});status("Memory saved to your AI profile.");await memories(panel,panelStart(panel,"Your saved AI memories"));return;
  }
  if(b.dataset.hcAiDelete){
   await api("memory_delete",{memory_id:b.dataset.hcAiDelete});status("Saved memory deleted.");await memories(panel,panelStart(panel,"Your saved AI memories"));return;
  }
  if(b.dataset.hcAiOpen){
   var u=user(),h=await api("history",{conversation_id:b.dataset.hcAiOpen}),msgs=h.messages||[];
   window.hcGroqConversationId=b.dataset.hcAiOpen;window.hcGroqConversationOwner=u.id;window.hcGroqRestoredConversation=b.dataset.hcAiOpen;
   window.hcGroqHistory=msgs.filter(function(m){return m.role==="user"||m.role==="assistant"}).map(function(m){return {role:m.role,content:m.content}});
   localStorage.setItem("hcGroqConversationId:"+u.id,b.dataset.hcAiOpen);
   if(log){log.replaceChildren();msgs.forEach(function(m){if(m.role==="user"||m.role==="assistant")bubble(log,m.role,m.content)});log.scrollTop=log.scrollHeight}
   panel.hidden=true;status("Saved conversation loaded.");return;
  }
 }catch(err){status(String(err.message||err))}
});
var css=el("style");css.textContent=".hc-ai-persistence-tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.hc-ai-persistence-tools button,.hc-ai-persistence-panel button{min-height:36px;padding:7px 11px;border:1px solid rgba(139,92,246,.3);border-radius:11px;background:rgba(139,92,246,.08);color:inherit;font:inherit;font-size:12px;cursor:pointer}.hc-ai-persistence-panel{margin:10px 0;padding:12px;border:1px solid rgba(139,92,246,.25);border-radius:15px;background:rgba(139,92,246,.05)}.hc-ai-persistence-panel[hidden]{display:none!important}.hc-ai-persistence-panel textarea{display:block;width:100%;min-height:70px;box-sizing:border-box;margin:8px 0;padding:10px;border-radius:10px;background:transparent;color:inherit;border:1px solid rgba(139,92,246,.3);font:inherit}.hc-ai-persistence-item{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid rgba(139,92,246,.15)}.hc-ai-persistence-note{font-size:12px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}.hc-ai-health-output{max-height:260px;overflow:auto;font-size:11px}";document.head.appendChild(css);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
})();