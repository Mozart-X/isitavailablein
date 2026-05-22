// /widget/embed.js — self-contained JS bundle that other sites embed.
// Drops a styled "Is X available in [your country]?" card into the host page.
// Includes a tracked affiliate CTA in the unblock prompt.
//
// Usage on host site:
//   <div data-iial-widget data-service="netflix"></div>
//   <script src="https://isitavailablein.com/widget/embed.js" async></script>
//
// Each widget = one backlink (script tag) + tracked outbound when users click.

import { NextResponse } from 'next/server';

export const runtime = 'edge';

const JS = `(function(){
  var ORIGIN = 'https://isitavailablein.com';
  function css(){
    if (document.getElementById('iial-widget-css')) return;
    var s = document.createElement('style');
    s.id = 'iial-widget-css';
    s.textContent = [
      '.iial-card{font-family:system-ui,-apple-system,sans-serif;border:1px solid #e5e7eb;border-radius:12px;padding:1rem 1.1rem;background:#fff;color:#1a1a1a;max-width:480px;box-shadow:0 1px 4px rgba(0,0,0,0.04);}',
      '.iial-title{font-size:1rem;font-weight:600;margin:0 0 .5rem;color:#0a2540;}',
      '.iial-row{display:flex;align-items:center;justify-content:space-between;gap:.6rem;padding:.4rem 0;border-top:1px solid #f1f1f1;font-size:.92rem;}',
      '.iial-row:first-of-type{border-top:0;}',
      '.iial-status{font-weight:700;padding:.15rem .55rem;border-radius:6px;font-size:.78rem;}',
      '.iial-status-yes{background:#e8f7ee;color:#0a7a3a;}',
      '.iial-status-no{background:#fce8e8;color:#a32020;}',
      '.iial-status-partial,.iial-status-vpn_only{background:#fff4d6;color:#8a6300;}',
      '.iial-cta{display:block;text-align:center;margin-top:.7rem;padding:.55rem .9rem;background:#0066cc;color:#fff !important;border-radius:8px;text-decoration:none;font-weight:600;font-size:.92rem;}',
      '.iial-cta:hover{background:#0052a3;}',
      '.iial-foot{margin-top:.6rem;font-size:.72rem;color:#888;text-align:right;}',
      '.iial-foot a{color:#0066cc;text-decoration:none;}',
    ].join('');
    document.head.appendChild(s);
  }
  function escapeHTML(s){ return String(s||'').replace(/[&<>\"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c];}); }
  function fmtStatus(s){ return s==='yes'?'Available':s==='no'?'Blocked':s==='partial'?'Partial':s==='vpn_only'?'VPN only':'Unknown'; }
  async function detectCountry(){
    try{
      var r = await fetch(ORIGIN + '/api/v1/geo');
      if (r.ok) { var j = await r.json(); return j.iso2; }
    }catch(_){}
    return null;
  }
  async function render(el){
    css();
    var service = el.getAttribute('data-service') || '';
    var country = (el.getAttribute('data-country') || '').toUpperCase();
    if (!country) country = await detectCountry();
    var html = '';
    try{
      var qs = 'service=' + encodeURIComponent(service.toLowerCase());
      if (country) qs += '&country=' + encodeURIComponent(country);
      var res = await fetch(ORIGIN + '/api/v1/availability?' + qs);
      var j = await res.json();
      var rows = (j.data || []);
      if (!service && country) rows = rows.slice(0, 6);
      if (!rows.length) {
        html = '<div class="iial-title">No data for that combination</div>';
      } else {
        var title = service && country ? ('Is ' + escapeHTML(rows[0].service_name) + ' available in ' + escapeHTML(rows[0].country_name) + '?')
                                       : service ? ('Where is ' + escapeHTML(rows[0].service_name) + ' available?')
                                       : ('Services in ' + escapeHTML(rows[0].country_name));
        html = '<div class="iial-title">' + title + '</div>';
        for (var i=0;i<rows.length;i++) {
          var r = rows[i];
          var lbl = service && country ? r.country_name : (service ? r.country_name : r.service_name);
          html += '<div class="iial-row"><span>' + escapeHTML(lbl) + '</span><span class="iial-status iial-status-' + escapeHTML(r.status) + '">' + fmtStatus(r.status) + '</span></div>';
        }
        var blocked = rows.some(function(r){return r.status==='no' || r.status==='vpn_only';});
        if (blocked) {
          html += '<a class="iial-cta" href="' + ORIGIN + '/best-vpn?utm_source=embed&utm_medium=widget&utm_campaign=' + encodeURIComponent(service || country || 'na') + '" target="_blank" rel="nofollow sponsored noopener">Unblock with a VPN →</a>';
        }
        html += '<div class="iial-foot">Data: <a href="' + ORIGIN + '" target="_blank" rel="noopener">IsItAvailableIn</a></div>';
      }
    }catch(e){
      html = '<div class="iial-title">Couldn\\'t load data</div><div class="iial-foot"><a href="' + ORIGIN + '" target="_blank">isitavailablein.com</a></div>';
    }
    el.className = 'iial-card';
    el.innerHTML = html;
  }
  function init(){
    var nodes = document.querySelectorAll('[data-iial-widget]');
    for (var i=0;i<nodes.length;i++) render(nodes[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();`;

export async function GET() {
  return new NextResponse(JS, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
