/* Hell Camp Growth Hub coin checkout foundation.
   Coins are never charged while a real provider connection is unavailable. */
(function () {
  'use strict';
  var ready = false;
  function byId(id){ return document.getElementById(id); }
  function isAdmin(){
    return !!(window.authProfile && window.authProfile.role === 'admin') ||
      String(window.authUser && window.authUser.email || '').toLowerCase() === 'kaptainarizonah@gmail.com';
  }
  function escapeText(v){
    if (typeof window.hcGrowthEscape === 'function') return window.hcGrowthEscape(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});
  }
  function addDurationField(){
    var form=byId('hcGrowthOrderForm');
    if(!form || form.querySelector('#hcGrowthDuration')) return;
    var label=document.createElement('label');
    label.className='hc-growth-label'; label.htmlFor='hcGrowthDuration';
    label.textContent='Delivery type';
    var select=document.createElement('select');
    select.className='field'; select.id='hcGrowthDuration'; select.innerHTML=
      '<option value="standard">Standard delivery (verified provider service)</option>';
    var note=byId('hcGrowthNote');
    (note ? note.parentNode : form.lastElementChild).insertBefore(label,note||form.lastElementChild);
    label.insertAdjacentElement('afterend',select);
    var notice=form.querySelector('.notice');
    if(notice) notice.textContent='Coins are charged only when a verified provider is connected and this service is available for fulfilment. Do not enter a social-media password.';
    var btn=byId('hcGrowthSubmit'); if(btn) btn.textContent='Place boost order';
  }
  function renderCards(){
    var host=byId('hcGrowthServiceGrid'); if(!host || !window.hcGrowthServicesCache) return;
    var cache=window.hcGrowthServicesCache;
    var filter=window.hcGrowthFilter || 'All';
    var rows=cache.filter(function(s){return filter==='All'||s.platform===filter||(filter==='Multi-platform'&&['X','Telegram','Multi-platform'].includes(s.platform));});
    if(!rows.length){host.innerHTML='<div class="card muted">No services in this category yet.</div>';return;}
    host.innerHTML=rows.map(function(s){
      var ready=!!s.active && !!s.fulfillment_enabled && !!s.provider_service_code && Number(s.price_coins_per_1000)>0;
      var price=Number(s.price_coins_per_1000)>0 ? Number(s.price_coins_per_1000).toLocaleString()+' coins / 1,000' : 'Price not configured';
      return '<article class="tile hc-growth-service">'+
        '<div class="row spread"><span class="hc-growth-platform">'+(typeof window.hcGrowthPlatformIcon==='function'?window.hcGrowthPlatformIcon(s.platform):'✦')+'</span><span class="hc-growth-pill">'+escapeText(s.platform)+'</span></div>'+
        '<h3>'+escapeText(s.title)+'</h3><p>'+escapeText(s.description||'')+'</p>'+
        '<div class="hc-growth-card-bottom"><span>'+escapeText(s.category||'Promotion')+'</span>'+
        '<button class="btn '+(ready?'primary':'')+'" type="button" data-action="growthSelectService" data-id="'+escapeText(s.id)+'"> '+(ready?'Order boost':'View service')+' →</button></div>'+
        '<div class="muted tiny">Quantity: '+Number(s.min_quantity||1).toLocaleString()+'–'+Number(s.max_quantity||100000).toLocaleString()+'</div>'+
        '<div class="muted tiny">'+escapeText(price)+'</div>'+
        '<div class="muted tiny">'+(ready?'Provider connection enabled':'Not available for checkout yet — no coins will be charged')+'</div>'+
        (isAdmin()?'<div class="muted tiny">Fulfilment: '+(ready?'enabled':'not connected')+'</div>':'')+
      '</article>';
    }).join('');
  }
  async function loadServices(){
    var host=byId('hcGrowthServiceGrid'), status=byId('hcGrowthServiceStatus');
    if(!host || !window.supabaseClient) return;
    if(status) status.textContent='Loading available services…';
    var query=window.supabaseClient.from('growth_services')
      .select('id,title,platform,category,description,delivery_window,price_ngn,price_coins_per_1000,provider_service_code,fulfillment_enabled,min_quantity,max_quantity,active')
      .order('platform').order('title');
    if(!isAdmin()) query=query.eq('active',true);
    var result=await query;
    if(result.error){if(status)status.textContent='Could not load services. Please refresh.';return;}
    window.hcGrowthServicesCache=result.data||[];
    renderCards();
    if(status)status.textContent=window.hcGrowthServicesCache.length+' services listed';
    addDurationField();
    if(typeof window.loadGrowthOrders==='function') window.loadGrowthOrders();
  }
  function chooseService(id){
    var service=(window.hcGrowthServicesCache||[]).find(function(s){return s.id===id;});
    if(!service)return;
    var panel=byId('hcGrowthOrderPanel'); if(!panel)return;
    byId('hcGrowthServiceId').value=service.id;
    byId('hcGrowthServiceTitle').value=service.title;
    byId('hcGrowthPlatform').value=service.platform;
    byId('hcGrowthSelectedLabel').textContent=service.platform+' · '+service.title;
    var q=byId('hcGrowthQuantity'); q.min=String(service.min_quantity||1);q.max=String(service.max_quantity||100000);q.value=String(service.min_quantity||1);
    var help=byId('hcGrowthQuantityHelp');
    var rate=Number(service.price_coins_per_1000||0);
    if(help) help.textContent=rate>0?'Estimated charge: '+Math.ceil(rate*Number(q.value)/1000).toLocaleString()+' coins. Final charge is checked securely at checkout.':'This service is not ready for checkout. No coins will be deducted until a real provider is connected.';
    var notice=panel.querySelector('.notice');
    if(notice)notice.textContent=service.fulfillment_enabled&&service.provider_service_code&&rate>0?'Coin price is based on quantity. Permanent/temporary delivery is available only where the provider supports it.':'Provider setup is incomplete for this service. You may review the form, but checkout will not charge coins.';
    panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'start'});
    addDurationField();
  }
  async function submitCoinOrder(e){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    var status=byId('hcGrowthSubmitStatus'),btn=byId('hcGrowthSubmit');
    if(!window.authUser || !window.supabaseClient){if(status)status.textContent='Sign in to place a boost order.';return;}
    var serviceId=byId('hcGrowthServiceId').value;
    var target=byId('hcGrowthTarget').value.trim();
    var quantity=Number(byId('hcGrowthQuantity').value);
    var duration=(byId('hcGrowthDuration')||{}).value||'standard';
    var note=(byId('hcGrowthNote').value||'').trim();
    var service=(window.hcGrowthServicesCache||[]).find(function(s){return s.id===serviceId;});
    if(!service){if(status)status.textContent='Choose a service first.';return;}
    try{var u=new URL(target);if(!['http:','https:'].includes(u.protocol))throw new Error();}catch(_){if(status)status.textContent='Enter a valid public profile or post URL.';return;}
    if(!Number.isInteger(quantity)||quantity<Number(service.min_quantity||1)||quantity>Number(service.max_quantity||100000)){if(status)status.textContent='Quantity is outside this service limit.';return;}
    if(btn){btn.disabled=true;btn.textContent='Checking coin price…';}
    if(status)status.textContent='';
    try{
      var result=await window.supabaseClient.rpc('create_growth_coin_order',{
        p_service_id:serviceId,p_target_url:target,p_quantity:quantity,p_duration_type:duration,p_customer_note:note
      });
      if(result.error) throw new Error(result.error.message||'Order could not be submitted.');
      var data=result.data||{};
      if(data.provider_not_ready){
        if(status)status.textContent='This service is not connected to a verified delivery provider yet. No coins were deducted.';
        return;
      }
      if(data.insufficient_coins){
        if(status)status.textContent='Not enough purchased coins. Required: '+Number(data.required_coins||0).toLocaleString()+'. Your purchased balance: '+Number(data.balance||0).toLocaleString()+'. Buy more coins and try again.';
        return;
      }
      if(!data.paid||!data.order_id)throw new Error(data.message||'Order could not be confirmed.');
      if(status)status.textContent='Payment recorded. Submitting order securely to Sproute…';
      var providerResponse=await window.supabaseClient.functions.invoke('sproute-provider',{body:{action:'submit_order',order_id:data.order_id}});
      if(providerResponse.error){
        if(status)status.textContent='Order reference '+data.order_id+' was created, but provider acceptance could not be confirmed. Do not submit it again. Refresh order history or contact Hell Camp support before retrying.';
        if(typeof window.loadGrowthOrders==='function')await window.loadGrowthOrders();
        return;
      }
      var providerData=providerResponse.data||{};
      if(providerData.refunded){
        if(status)status.textContent='Sproute did not accept order '+data.order_id+'. The charged coins have been returned to your wallet.';
        e.target.reset();var refundedPanel=byId('hcGrowthOrderPanel');if(refundedPanel)refundedPanel.hidden=true;
        if(typeof window.loadGrowthOrders==='function')await window.loadGrowthOrders();
        return;
      }
      if(!providerData.ok){
        if(status)status.textContent=(providerData.error||'Provider submission was not confirmed.')+' Order reference: '+data.order_id+'. Do not submit again; check order history or contact support.';
        if(typeof window.loadGrowthOrders==='function')await window.loadGrowthOrders();
        return;
      }
      if(status)status.textContent='Order '+data.order_id+' accepted by Sproute. Provider reference: '+providerData.provider_order_id+'. '+Number(data.coins_charged||0).toLocaleString()+' coins charged. Remaining purchased balance: '+Number(data.balance||0).toLocaleString()+'.';
      e.target.reset();var panel=byId('hcGrowthOrderPanel');if(panel)panel.hidden=true;
      if(typeof window.loadGrowthOrders==='function')await window.loadGrowthOrders();
    }catch(err){if(status)status.textContent=err.message||'Order could not be submitted.';}
    finally{if(btn){btn.disabled=false;btn.textContent='Place boost order';}}
  }
  function bind(){
    addDurationField();
    var form=byId('hcGrowthOrderForm');
    if(form && !form.dataset.hcCoinBound){
      form.dataset.hcCoinBound='1';
      document.addEventListener('submit',function(e){if(e.target&&e.target.id==='hcGrowthOrderForm')submitCoinOrder(e);},true);
      form.addEventListener('input',function(e){
        if(e.target&&e.target.id==='hcGrowthQuantity'){
          var s=(window.hcGrowthServicesCache||[]).find(function(x){return x.id===byId('hcGrowthServiceId').value;});
          var help=byId('hcGrowthQuantityHelp');if(s&&help&&Number(s.price_coins_per_1000)>0)help.textContent='Estimated charge: '+Math.ceil(Number(s.price_coins_per_1000)*Math.max(0,Number(e.target.value)||0)/1000).toLocaleString()+' coins. Final charge is checked securely at checkout.';
        }
      });
    }
    if(!ready){
      ready=true;
      if(typeof window.loadGrowthServices==='function') window.loadGrowthServices=loadServices;
      document.addEventListener('click',function(e){
        var b=e.target&&e.target.closest('[data-action="growthSelectService"]');
        if(b){e.preventDefault();e.stopImmediatePropagation();chooseService(b.getAttribute('data-id'));}
      },true);
      document.addEventListener('click',function(e){
        var b=e.target&&e.target.closest('[data-action="growthRefreshOrders"]');
        if(b && typeof window.loadGrowthOrders==='function')window.loadGrowthOrders();
      },true);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
  new MutationObserver(function(){if(byId('hcGrowthOrderForm'))bind();}).observe(document.documentElement,{childList:true,subtree:true});
})();