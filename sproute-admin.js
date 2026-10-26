(function () {
  'use strict';
  function isOwner() {
    return String(window.authUser && window.authUser.email || '').toLowerCase() === 'kaptainarizonah@gmail.com';
  }
  function mount() {
    if (!isOwner() || document.getElementById('hcSprouteAdminPanel')) return;
    var grid = document.getElementById('hcGrowthServiceGrid');
    if (!grid || !grid.parentNode) return;
    var panel = document.createElement('section');
    panel.id = 'hcSprouteAdminPanel';
    panel.className = 'card';
    panel.style.cssText = 'margin:12px 0;padding:16px;border:1px solid rgba(139,92,246,.45);border-radius:16px;';
    panel.innerHTML = '<h3 style="margin:0 0 8px">Sproute provider connection</h3>' +
      '<p class="muted tiny">Owner-only diagnostics. These tests only read the service list or account balance; they do not submit orders.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">' +
      '<button type="button" class="btn" data-hc-sproute-test="services">Test service list</button>' +
      '<button type="button" class="btn" data-hc-sproute-test="balance">Test provider balance</button></div>' +
      '<p id="hcSprouteTestStatus" class="muted tiny" role="status" aria-live="polite">Ready to test.</p>' +
      '<pre id="hcSprouteTestOutput" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;font-size:12px"></pre>';
    grid.parentNode.insertBefore(panel, grid);
  }
  async function runTest(action, button) {
    var status = document.getElementById('hcSprouteTestStatus');
    var output = document.getElementById('hcSprouteTestOutput');
    if (!isOwner()) { if (status) status.textContent = 'Owner access required.'; return; }
    if (!window.supabaseClient || !window.supabaseClient.functions) {
      if (status) status.textContent = 'Supabase client is not available. Refresh Hell Camp and try again.';
      return;
    }
    if (button) button.disabled = true;
    if (status) status.textContent = 'Testing Sproute ' + action + '…';
    if (output) output.textContent = '';
    try {
      var response = await window.supabaseClient.functions.invoke('sproute-provider', { body: { action: action } });
      if (response.error) throw new Error(response.error.message || 'Function request failed.');
      var data = response.data || {};
      if (!data.ok) throw new Error(data.error || 'Provider test failed.');
      if (status) status.textContent = 'Sproute responded to the ' + action + ' test. Review the result below.';
      if (output) output.textContent = JSON.stringify(data.result, null, 2);
    } catch (error) {
      if (status) status.textContent = 'Test failed: ' + (error && error.message ? error.message : 'Unknown error') + '. Check Supabase function logs and confirm SPROUTE_API_KEY is saved.';
    } finally {
      if (button) button.disabled = false;
    }
  }
  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest('[data-hc-sproute-test]');
    if (!button) return;
    event.preventDefault();
    runTest(button.getAttribute('data-hc-sproute-test'), button);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
  // Auth can resolve after the Growth Hub has already rendered, so retry on session changes too.
  try {
    if (window.supabaseClient && window.supabaseClient.auth && window.supabaseClient.auth.onAuthStateChange) {
      window.supabaseClient.auth.onAuthStateChange(function () { window.setTimeout(mount, 0); });
    }
  } catch (_) {}
  window.addEventListener('hellcamp-auth-ready', mount);
})();