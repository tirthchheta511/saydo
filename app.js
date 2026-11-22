/* SayDo — plain JavaScript, no build step. Data comes from the files in /data (made by the Phase 9 notebook). */
(function () {
  'use strict';
  var D = window.SAYDO || {};
  var companies = D.companies || [], summary = D.summary || {}, findings = D.findings || {}, tryIt = D.try_it || {}, notes = D.notes || [];
  var $ = function (id) { return document.getElementById(id); };

  // ---------- small helpers ----------
  function el(tag, props) {
    var node = document.createElement(tag), i, child;
    if (props) { for (var k in props) { if (k === 'text') { node.textContent = props[k]; } else if (k === 'class') { node.className = props[k]; } else { node.setAttribute(k, props[k]); } } }
    for (i = 2; i < arguments.length; i++) { child = arguments[i]; if (child == null) { continue; } node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child); }
    return node;
  }
  function clear(node) { while (node.firstChild) { node.removeChild(node.firstChild); } return node; }
  function get(obj, path, fallback) { var o = obj; path.split('.').forEach(function (k) { o = (o == null) ? o : o[k]; }); return o == null ? fallback : o; }
  function commas(v, d) { return Number(v).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pct(v, d) { return v == null ? 'n/a' : (v * 100).toFixed(d || 0) + '%'; }
  function signed(v, d) { return (v > 0 ? '+' : (v < 0 ? '−' : '')) + Math.abs(v).toFixed(d == null ? 1 : d); }
  function money(v) { if (v == null) { return 'n/a'; } var a = Math.abs(v), s = v < 0 ? '−' : ''; return a >= 1000 ? s + '$' + commas(a / 1000, 2) + ' billion' : s + '$' + commas(a, a < 10 ? 1 : 0) + ' million'; }
  function value(v, unit, growth) {
    if (v == null) { return 'n/a'; }
    if (unit === '$M') { return money(v); }
    if (unit === '%') { return growth ? signed(v, 1) + '%' : v.toFixed(1) + '%'; }
    return (v < 0 ? '−$' : '$') + Math.abs(v).toFixed(2);
  }
  function range(p) {
    var lo = p.low, hi = p.high, u = p.unit, g = p.growth;
    if (lo != null && hi != null && hi !== lo) { return value(lo, u, g) + ' to ' + value(hi, u, g); }
    if (lo != null && hi == null) { return 'at least ' + value(lo, u, g); }
    if (hi != null && lo == null) { return 'up to ' + value(hi, u, g); }
    return 'about ' + value(lo != null ? lo : hi, u, g);
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dateWords(s) { if (!s) { return ''; } var p = s.split('-'); return Number(p[2]) + ' ' + MONTHS[Number(p[1]) - 1] + ' ' + p[0]; }
  function periodWords(p) { var m = /^Q(\d)FY(\d{4})$/.exec(p || ''); if (m) { return 'quarter ' + m[1] + ' of fiscal ' + m[2]; } m = /^FY(\d{4})$/.exec(p || ''); return m ? 'fiscal year ' + m[1] : (p || ''); }
  function wasKept(o) { return o !== 'below'; }
  function setThread(node, kept) { if (node) { node.className = 'thread' + (kept ? '' : ' is-missed'); } }

  // ---------- hero: one real promise and its result ----------
  var heroSet = notes.filter(function (n) { return n.low != null && n.high != null && n.actual != null; });
  var heroMissed = heroSet.filter(function (n) { return n.actual < n.low; })[0], heroKept = heroSet.filter(function (n) { return n.actual >= n.low; })[0];
  var heroShown = heroMissed || heroKept;
  function drawHero() {
    var n = heroShown, a = clear($('hero-promise')), b = clear($('hero-result'));
    if (!n) { return; }
    var kept = n.actual >= n.low, gap = (n.actual / n.mid - 1) * 100;
    a.appendChild(el('p', { class: 'who', text: n.name + ', ' + dateWords(n.made) }));
    a.appendChild(el('p', { class: 'what', text: 'Revenue of ' + money(n.low) + ' to ' + money(n.high) + ' for ' + periodWords(n.period) + '.' }));
    b.appendChild(el('p', { class: 'who', text: 'Reported result' }));
    b.appendChild(el('p', { class: 'what', text: money(n.actual) + ', ' + signed(gap, 1) + '% against the middle of the promise.' }));
    b.appendChild(el('span', { class: 'stamp ' + (kept ? 'kept' : 'missed'), text: kept ? 'KEPT' : 'MISSED' }));
    if (heroMissed && heroKept) {
      var other = el('button', { class: 'quiet', type: 'button', style: 'margin-left:18px', text: kept ? 'Show a missed promise' : 'Show a kept promise' });
      other.addEventListener('click', function () { heroShown = kept ? heroMissed : heroKept; drawHero(); });
      b.appendChild(other);
    }
    setThread($('hero-thread'), kept);
  }

  // ---------- headline figures ----------
  function figure(list, number, words) { if (number != null) { list.appendChild(el('div', null, el('dd', { text: number }), el('dt', { text: words }))); } }
  function drawFigures() {
    var s = $('figures-say'), d = $('figures-do');
    var read = get(summary, 'reader.reread.v2'), from = get(summary, 'reader.reread.companies'), shown = companies.reduce(function (t, c) { return t + (c.shown || 0); }, 0);
    figure(s, read != null ? commas(read) : null, 'promises read from the press releases of ' + from + ' companies, 2019 to 2026');
    figure(s, commas(shown), 'of them could be checked against an official result and are shown on this page');
    figure(s, String(companies.filter(function (c) { return c.score != null; }).length), 'companies have enough promises to get a Say-Do score');
    figure(d, findings.kept_all != null ? pct(findings.kept_all) : null, 'of promises were kept: the result landed inside or above what was promised');
    figure(d, get(findings, 'landing.above_top') != null ? pct(findings.landing.above_top) : null, 'of revenue results landed above the top of the promised range, so companies promise carefully');
    figure(d, get(summary, 'audit.weighted_right') != null ? pct(summary.audit.weighted_right) : null, 'of promises were read fully right in a blind hand check, so some results here are wrong');
  }

  // ---------- company lookup ----------
  var cache = {}, waiting = {}, loaded = {}, current = null, rowsShown = 10;
  D.onPack = function (list) {
    list.forEach(function (obj) { cache[obj.ticker] = obj; });
    Object.keys(waiting).forEach(function (t) { if (cache[t]) { waiting[t].forEach(function (f) { f(cache[t]); }); delete waiting[t]; } });
  };
  window.SAYDO = D;
  function loadCompany(ticker, done) {
    if (cache[ticker]) { done(cache[ticker]); return; }
    if (waiting[ticker]) { waiting[ticker].push(done); return; }
    waiting[ticker] = [done];
    var head = companies.filter(function (c) { return c.ticker === ticker; })[0], pack = head ? head.pack : null;
    if (pack == null || loaded[pack]) { return; }
    loaded[pack] = true;
    var s = document.createElement('script');
    s.src = 'data/pack_' + (pack < 10 ? '0' : '') + pack + '.js';
    s.onerror = function () { delete waiting[ticker]; loaded[pack] = false; $('lookup-hint').textContent = 'The data for ' + ticker + ' could not be loaded.'; };
    document.body.appendChild(s);
  }
  function findCompany(text) {
    var t = (text || '').trim().toLowerCase(), m = /\(([^)]+)\)\s*$/.exec(text || '');
    if (!t) { return null; }
    if (m) { t = m[1].toLowerCase(); }
    return companies.filter(function (c) { return c.ticker.toLowerCase() === t; })[0] || companies.filter(function (c) { return c.name.toLowerCase() === t; })[0] ||
      companies.filter(function (c) { return c.name.toLowerCase().indexOf(t) === 0; })[0] || (t.length >= 3 ? companies.filter(function (c) { return c.name.toLowerCase().indexOf(t) >= 0; })[0] : null);
  }
  function drawScorecard(c) {
    var box = clear($('scorecard')), all = (findings.kept_all || 0) * 100;
    box.appendChild(el('p', { class: 'name', text: c.name + ' (' + c.ticker + ')' }));
    box.appendChild(el('p', { class: 'sub', text: c.sector + ' · promises for ' + c.years }));
    if (c.score == null) {
      box.appendChild(el('p', { text: 'Too few promises to score. A company needs 8 checked promises; this one has ' + c.promises + ', of which ' + c.kept + ' were kept.' }));
    } else {
      box.appendChild(el('p', { class: 'score' }, el('b', { text: c.score.toFixed(0) }), el('span', { text: 'Say-Do score. ' + c.tier.charAt(0).toUpperCase() + c.tier.slice(1) + '.' })));
      var g = el('div', { class: 'gauge' }, el('span', { class: 'axis' }), el('span', { class: 'all', style: 'left:' + all + '%' }),
        el('span', { class: 'band', style: 'left:' + c.low + '%;width:' + (c.high - c.low) + '%' }), el('span', { class: 'dot', style: 'left:' + c.score + '%' }));
      box.appendChild(g);
      box.appendChild(el('div', { class: 'gauge-labels' }, el('span', { text: '0' }), el('span', { text: 'dashed line: all companies together, ' + all.toFixed(0) }), el('span', { text: '100' })));
      box.appendChild(el('p', { class: 'aside-list', text: 'Kept ' + c.kept + ' of ' + c.promises + ' first-time promises. The grey band is the likely range of the score: the fewer promises, the wider it is.' }));
    }
    var check = D.nameCheck, flag = check && check.flags && check.flags[c.ticker];
    if (flag) { box.appendChild(el('p', { class: 'handcheck ' + flag.level, text: flag.text })); }
    else if (check && (check.confirmed || []).indexOf(c.ticker) >= 0) { box.appendChild(el('p', { class: 'aside-list', text: 'Hand-checked on ' + check.date + ': the sampled promises behind this score were read correctly, with at most one exception.' })); }
    var aside = c.set_aside || {}, parts = Object.keys(aside).sort(function (a, b) { return aside[b] - aside[a]; }).slice(0, 2).map(function (k) { return commas(aside[k]) + ' ' + k; });
    if (parts.length) { box.appendChild(el('p', { class: 'aside-list', text: 'Not scored for this company: ' + parts.join('; ') + '.' })); }
  }
  function promiseRow(p) {
    var kept = wasKept(p.outcome), counts = p.outcome != null && p.measure !== 'Capital spending';
    var say = el('div', { class: 'say' },
      el('p', { class: 'when', text: periodWords(p.period) + ' · promised ' + dateWords(p.made) }),
      el('p', { class: 'line', text: p.measure + (p.growth ? ' growth of ' : ' of ') + range(p) }));
    var notes_ = [];
    if (p.change === 'raised') { notes_.push('raised from an earlier promise'); } else if (p.change === 'lowered') { notes_.push('lowered from an earlier promise'); } else if (p.change === 'kept') { notes_.push('repeated'); }
    if (!p.counted && counts) { notes_.push('not counted in the score (only the first statement is)'); }
    if (notes_.length) { say.appendChild(el('p', { class: 'small', text: notes_.join(' · ') })); }
    if (p.text) {
      say.appendChild(el('details', null, el('summary', { text: 'Where the press release says so' }), el('p', { text: p.text }), el('a', { href: p.url, rel: 'noopener', target: '_blank', text: 'Open the filing on sec.gov' })));
    }
    var single = p.low != null && p.high != null && p.low === p.high;
    var verdict = p.outcome === 'above' ? (single ? 'above the promise' : 'above the promised range') : p.outcome === 'below' ? (single ? 'below the promise' : 'below the promised range') : (single ? 'on the promise' : 'inside the promised range');
    var doSide = el('div', { class: 'do' }, el('p', { class: 'when', text: 'Reported result' }), el('p', { class: 'line', text: value(p.actual, p.unit, p.growth) }));
    var first = el('p', { class: 'small' });
    if (counts) { first.appendChild(el('b', { class: kept ? 'kept' : 'missed', text: kept ? 'Kept: ' : 'Missed: ' })); }
    first.appendChild(document.createTextNode(verdict + (p.gap != null ? ', ' + signed(p.gap, 1) + (p.unit === '%' ? ' points' : '%') + ' against the middle of the promise' : '')));
    doSide.appendChild(first);
    if (p.misread) { doSide.appendChild(el('p', { class: 'small missed', text: 'Hand check: this promise was misread (' + p.misread + '). It is still counted in the score shown.' })); }
    if (p.chance != null) { doSide.appendChild(el('p', { class: 'small', text: 'The model, on the day of the promise: ' + pct(p.chance) + ' chance of being kept.' })); }
    if (p.fpa != null) { doSide.appendChild(el('p', { class: 'small', text: 'The forecaster, on the same day: ' + money(p.fpa) + ' (likely between ' + money(p.fpa_low) + ' and ' + money(p.fpa_high) + ').' })); }
    var row = el('div', { class: 'row' }, say, doSide);
    if (counts) { row.appendChild(el('span', { class: 'thread' + (kept ? '' : ' is-missed'), 'aria-hidden': 'true' })); }
    return row;
  }
  function drawRows() {
    var box = clear($('promise-rows')), list = current ? current.list.slice().sort(function (a, b) { return (b.ends || '').localeCompare(a.ends || '') || (b.made || '').localeCompare(a.made || ''); }) : [];
    list.slice(0, rowsShown).forEach(function (p) { box.appendChild(promiseRow(p)); });
    var more = $('more-rows');
    more.hidden = list.length <= rowsShown;
    more.textContent = 'Show earlier promises (' + (list.length - rowsShown) + ' more)';
  }
  function showCompany(ticker, scroll) {
    var head = companies.filter(function (c) { return c.ticker === ticker; })[0];
    if (!head) { return; }
    $('lookup-hint').textContent = 'Loading ' + head.name + '…';
    loadCompany(ticker, function (obj) {
      current = obj; rowsShown = 10;
      $('company-input').value = head.name + ' (' + head.ticker + ')';
      $('lookup-hint').textContent = obj.list.length + ' checked promises. The newest come first.';
      drawScorecard(obj); drawRows();
      Array.prototype.forEach.call(document.querySelectorAll('#strip circle'), function (c) { c.classList.toggle('on', c.getAttribute('data-t') === ticker); });
      if (scroll) { $('lookup').scrollIntoView(); }
    });
  }
  function setupLookup() {
    var list = $('company-list');
    companies.forEach(function (c) { list.appendChild(el('option', { value: c.name + ' (' + c.ticker + ')' })); });
    var input = $('company-input');
    function go() { var c = findCompany(input.value); if (c) { showCompany(c.ticker, false); } else if (input.value.trim()) { $('lookup-hint').textContent = 'No company found for “' + input.value.trim() + '”. Try the ticker.'; } }
    input.addEventListener('change', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { go(); } });
    input.addEventListener('focus', function () { input.select(); });
    $('more-rows').addEventListener('click', function () { rowsShown += 20; drawRows(); });
    var start = ['NVDA', 'AMZN', 'MSFT', 'AAPL'].filter(function (t) { return companies.some(function (c) { return c.ticker === t && c.score != null; }); })[0] || (companies[0] && companies[0].ticker);
    if (start) { showCompany(start, false); }
  }

  // ---------- every scored company on one line ----------
  function drawStrip() {
    var scored = companies.filter(function (c) { return c.score != null; }), box = clear($('strip'));
    if (!scored.length) { return; }
    var lo = Math.min(40, Math.floor(Math.min.apply(null, scored.map(function (c) { return c.score; })) / 10) * 10), W = 1000, r = 6, step = 13.5, stacks = {}, top = 0;
    var dots = scored.slice().sort(function (a, b) { return a.score - b.score; }).map(function (c) {
      var bin = Math.round((c.score - lo) / (100 - lo) * (W / (2 * r + 1.5))), k = stacks[bin] = (stacks[bin] || 0) + 1;
      top = Math.max(top, k);
      return { c: c, x: bin * (2 * r + 1.5), k: k };
    });
    var H = top * step + 34, ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '-10 0 ' + (W + 20) + ' ' + H);
    function add(tag, attrs, text) { var n = document.createElementNS(ns, tag); for (var k in attrs) { n.setAttribute(k, attrs[k]); } if (text) { n.textContent = text; } svg.appendChild(n); return n; }
    add('line', { x1: 0, x2: W, y1: H - 24, y2: H - 24, stroke: '#17233a', 'stroke-width': 1.5 });
    for (var t = lo; t <= 100; t += 10) { var x = (t - lo) / (100 - lo) * W; add('line', { x1: x, x2: x, y1: H - 24, y2: H - 18, stroke: '#17233a', 'stroke-width': 1.5 }); add('text', { x: x, y: H - 3, 'text-anchor': 'middle' }, String(t)); }
    var tip = el('div', { class: 'tip', hidden: '' });
    dots.forEach(function (d) {
      var cls = d.c.tier.indexOf('keeps') === 0 ? 't-keeps' : (d.c.tier.indexOf('misses') === 0 ? 't-misses' : 't-line');
      var flagged = D.nameCheck && D.nameCheck.flags && D.nameCheck.flags[d.c.ticker];
      if (flagged && flagged.level === 'unreliable') { cls += ' hollow'; }
      var node = add('circle', { cx: d.x, cy: H - 24 - r - 3 - (d.k - 1) * step, r: r, class: cls, 'data-t': d.c.ticker, tabindex: 0, role: 'button', 'aria-label': d.c.name + ', score ' + d.c.score.toFixed(0) });
      function show() { var b = node.getBoundingClientRect(), p = box.getBoundingClientRect(); tip.textContent = d.c.name + ' · score ' + d.c.score.toFixed(0) + ' · kept ' + d.c.kept + ' of ' + d.c.promises + (flagged && flagged.level === 'unreliable' ? ' · not confirmed by the hand check' : ''); tip.style.left = (b.left + b.width / 2 - p.left) + 'px'; tip.style.top = (b.top - p.top) + 'px'; tip.hidden = false; }
      node.addEventListener('mouseenter', show); node.addEventListener('focus', show);
      node.addEventListener('mouseleave', function () { tip.hidden = true; }); node.addEventListener('blur', function () { tip.hidden = true; });
      node.addEventListener('click', function () { showCompany(d.c.ticker, true); });
      node.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCompany(d.c.ticker, true); } });
    });
    box.appendChild(svg); box.appendChild(tip);
    $('ranking-sub').textContent = scored.length + ' companies with 8 or more checked promises, placed by Say-Do score. The score is the share of promises kept, pulled toward the average when a company has only a few. Point at a dot for the name; click it to see the promises.';
    var check = D.nameCheck;
    if (check) {
      var bad = Object.keys(check.flags || {}).filter(function (t) { return check.flags[t].level === 'unreliable'; }).map(function (t) { var c = companies.filter(function (x) { return x.ticker === t; })[0]; return c ? c.name : t; });
      $('ranking-note').textContent = 'Checked by hand on ' + check.date + ': for the ' + check.top.companies + ' highest companies, ' + check.top.right + ' of ' + check.top.checked + ' sampled promises were read right. For the ' + check.bottom.companies +
        ' lowest, ' + check.bottom.right + ' of ' + check.bottom.checked + ' were. Misreads gather at the low end' + (bad.length ? ': the scores of ' + bad.join(' and ') + ' are not confirmed and are drawn as hollow dots.' : '.');
    } else {
      $('ranking-note').textContent = 'Draft: about 1 promise in 8 is still misread, and misreads gather in a few companies. The companies at both ends of the line are being checked by hand.';
      $('ranking-h').appendChild(el('span', { class: 'draft', text: 'draft' }));
    }
  }

  // ---------- patterns ----------
  function bars(groups) {
    var names = Object.keys(groups), min = Math.min.apply(null, names.map(function (k) { return groups[k].kept; })), box = el('div', { class: 'bars' });
    names.forEach(function (k) {
      var g = groups[k];
      box.appendChild(el('div', { class: 'bar' + (g.kept === min && names.length > 1 ? ' low' : '') }, el('span', { text: k }), el('span', null, el('i', { style: 'width:' + (g.kept * 100) + '%' })), el('b', { text: pct(g.kept) }),
        g.n ? el('small', { text: commas(g.n) + ' promises' }) : null));
    });
    return box;
  }
  function drawPatterns() {
    var f = get(summary, 'model.facts', {}), r = get(summary, 'forecaster.test.ranges'), box = clear($('pattern-rows'));
    var rows = [
      ['horizon', 'A promise about the far future', 'Promises about the next few months are kept much more often than promises that look most of a year ahead.'],
      ['change', 'A promise that was changed before', 'When a company raises a promise, it usually delivers. When it lowers one, the lowered promise is missed more often than a fresh one.'],
      ['pace', 'A full-year promise, judged by the year so far', 'If the company is behind last year’s pace on the day it promises, the promise is in trouble.'],
      ['stretch', 'A promise to grow faster than it just did', 'Promising to speed up is riskier than promising more of the same.'],
      ['track', 'A company with a poor record', 'The record a company had on the day of the promise carries over to the next one.']];
    rows.forEach(function (x) {
      if (!f[x[0]]) { return; }
      box.appendChild(el('div', { class: 'row' }, el('div', { class: 'say' }, el('p', { class: 'line', text: x[1] }), el('p', { class: 'small', text: x[2] })), el('div', { class: 'do' }, bars(f[x[0]]))));
    });
    if (r) {
      box.appendChild(el('div', { class: 'row' }, el('div', { class: 'say' }, el('p', { class: 'line', text: 'A range, such as “$5.0 to $6.0 billion”' }),
        el('p', { class: 'small', text: 'Companies’ own revenue ranges are narrow and rarely hold the result. SayDo’s forecaster draws a wider range meant to hold 8 results in 10. Share of results inside each range:' })),
        el('div', { class: 'do' }, bars({ 'Company’s own range': { kept: r.own_in }, 'SayDo’s range': { kept: r.ours_in } }))));
    }
  }

  // ---------- try the model (logistic model, runs here in the browser) ----------
  var M = tryIt.model, usual = tryIt.usual || {}, form = {};
  function chanceOf(x) {
    var n = M.features.length, z = M.intercept, i, v, miss = {};
    for (i = 0; i < n; i++) { v = x[M.features[i]]; if (v == null || isNaN(v)) { miss[i] = 1; v = M.fill[i]; } z += (v - M.mean[i]) / M.scale[i] * M.weight[i]; }
    M.empty_flags.forEach(function (j, k) { z += ((miss[j] ? 1 : 0) - M.mean[n + k]) / M.scale[n + k] * M.weight[n + k]; });
    return 1 / (1 + Math.exp(-z));
  }
  function inputsToX(v) {
    var x = {}, k;
    for (k in usual) { x[k] = usual[k]; }
    M.features.forEach(function (f) { if (f.indexOf('measure: ') === 0) { x[f] = f === 'measure: ' + v.measure ? 1 : 0; } if (f.indexOf('sector: ') === 0) { x[f] = f === 'sector: ' + v.sector ? 1 : 0; } });
    if (tryIt.sector_rate && tryIt.sector_rate[v.sector] != null) { x.sector_rate = tryIt.sector_rate[v.sector]; }
    x.is_quarter = v.kind === 'quarter' ? 1 : 0;
    x.horizon_days = v.days;
    x.company_rate = v.record / 100; x.company_rate_same_measure = v.record / 100;
    x.stretch = v.stretch; x.implied_change = (usual.recent_change || 0) + v.stretch;
    x.pace = v.kind === 'quarter' ? NaN : v.pace;
    x.statement_no = v.revision === 'first' ? 1 : 2;
    x.was_raised = v.revision === 'raised' ? 1 : 0; x.was_lowered = v.revision === 'lowered' ? 1 : 0; x.was_kept = v.revision === 'repeated' ? 1 : 0;
    return x;
  }
  function readForm() {
    return { measure: form.measure.value, sector: form.sector.value, kind: form.kind.value, days: Number(form.days.value), record: Number(form.record.value), stretch: Number(form.stretch.value), pace: Number(form.pace.value), revision: form.revision.value };
  }
  var defaults = null;
  function drawChance() {
    var v = readForm(), p = chanceOf(inputsToX(v)), basis = {}, k;
    for (k in defaults) { basis[k] = defaults[k]; }
    basis.measure = v.measure; basis.sector = v.sector; basis.kind = v.kind;
    if (v.kind !== defaults.kind) { basis.days = v.kind === 'quarter' ? 75 : defaults.days; }
    var pBase = chanceOf(inputsToX(basis));
    form.daysOut.textContent = v.days + ' days'; form.recordOut.textContent = v.record + '% kept'; form.stretchOut.textContent = signed(v.stretch, 0) + ' points'; form.paceOut.textContent = v.kind === 'quarter' ? 'full-year promises only' : signed(v.pace, 0) + ' points';
    form.pace.disabled = v.kind === 'quarter';
    $('try-chance').textContent = pct(p);
    $('try-meter').style.width = (p * 100) + '%';
    $('try-base').style.left = (pBase * 100) + '%';
    $('try-base-label').textContent = 'Dashed line: a usual promise of this kind, ' + pct(pBase) + '.';
    var labels = { days: 'How far ahead it looks', record: 'The company’s record', stretch: 'Promise against recent results', pace: 'Pace so far this year', revision: 'Earlier changes' }, moves = [];
    Object.keys(labels).forEach(function (key) { var w = {}, j; for (j in v) { w[j] = v[j]; } w[key] = basis[key]; var d = (p - chanceOf(inputsToX(w))) * 100; if (Math.abs(d) >= 0.5) { moves.push([labels[key], d]); } });
    moves.sort(function (a, b) { return Math.abs(b[1]) - Math.abs(a[1]); });
    var ul = clear($('try-moves'));
    moves.slice(0, 4).forEach(function (m) { ul.appendChild(el('li', null, el('b', { class: m[1] > 0 ? 'kept' : 'missed', text: signed(m[1], 0) + ' points ' }), m[0].charAt(0).toLowerCase() + m[0].slice(1))); });
    if (!moves.length) { ul.appendChild(el('li', { text: 'Move a slider to see what changes the chance.' })); }
  }
  function slider(name, label, lo, hi, val, step) {
    var out = el('output'), input = el('input', { type: 'range', min: lo, max: hi, step: step || 1, value: val, id: 'try-' + name });
    form[name] = input; form[name + 'Out'] = out;
    return el('label', { for: 'try-' + name }, el('span', null, label + ': ', out), input);
  }
  function chooser(name, label, options) {
    var sel = el('select', { id: 'try-' + name });
    options.forEach(function (o) { sel.appendChild(el('option', { value: o[0], text: o[1] })); });
    form[name] = sel;
    return el('label', { for: 'try-' + name }, label, sel);
  }
  function setupTry() {
    if (!M) { $('try').hidden = true; return; }
    var words = tryIt.measure_words || {}, R = tryIt.range || {}, weak = get(summary, 'checks.stress.weak', []);
    var measures = (tryIt.measures || []).map(function (m) { return [m, words[m] || m]; }), sectors = (tryIt.sectors || []).map(function (s) { return [s, s]; });
    var box = $('try-form'), daysR = R.horizon_days || [30, 365], sR = R.stretch || [-20, 20], pR = R.pace || [-10, 10];
    box.appendChild(el('div', { class: 'two' }, chooser('measure', 'What is promised', measures), chooser('sector', 'Sector', sectors)));
    box.appendChild(el('div', { class: 'two' }, chooser('kind', 'For which period', [['year', 'A full year'], ['quarter', 'One quarter']]), chooser('revision', 'Has it changed before', [['first', 'No, first statement'], ['raised', 'It was raised'], ['lowered', 'It was lowered'], ['repeated', 'It was repeated']])));
    box.appendChild(slider('days', 'Days until the period ends', 20, Math.max(365, Math.round(daysR[1])), Math.round(usual.horizon_days || 180), 5));
    box.appendChild(slider('record', 'The company’s record so far', 40, 98, Math.round((usual.company_rate || 0.78) * 100), 1));
    box.appendChild(slider('stretch', 'Promised growth against recent growth', Math.max(-30, Math.round(sR[0])), Math.min(30, Math.round(sR[1])), 0, 1));
    box.appendChild(slider('pace', 'Share of the year’s promise already earned, against last year', Math.max(-15, Math.round(pR[0])), Math.min(15, Math.round(pR[1])), 0, 1));
    if (measures.some(function (m) { return m[0] === 'rev'; })) { form.measure.value = 'rev'; }
    if (sectors.some(function (s) { return s[0] === 'Information Technology'; })) { form.sector.value = 'Information Technology'; }
    defaults = readForm();
    box.addEventListener('input', drawChance); box.addEventListener('change', drawChance);
    var t = tryIt.test || {};
    $('try-honest').textContent = 'A logistic model, run in your browser. On promises made from 2024 on, its ranking score was ' + (t.ranking != null ? t.ranking.toFixed(2) : 'n/a') + ' (a coin flip scores 0.50, a perfect model 1.00).' +
      (weak.length ? ' It is weak for: ' + weak.join(', ') + '.' : '');
    drawChance();
  }

  // ---------- analyst notes ----------
  var noteAt = 0;
  function noteParts(text) {
    var lines = (text || '').split('\n'), head = lines[0] && lines[0].indexOf('  ') !== 0 ? lines.shift() : null;
    return { head: head, rows: lines.map(function (l) { var i = l.indexOf(':'); return i < 0 ? null : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }).filter(Boolean) };
  }
  function noteGraph(n) {
    var vals = [n.low, n.high, n.mid, n.forecast_low, n.forecast_high, n.actual].filter(function (v) { return v != null; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = (hi - lo) * 0.14 || hi * 0.02, a = lo - pad, b = hi + pad, W = 520, ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' 150'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Promised range, forecast range and the reported result on one scale');
    function X(v) { return (v - a) / (b - a) * W; }
    function add(tag, attrs, text) { var e = document.createElementNS(ns, tag); for (var k in attrs) { e.setAttribute(k, attrs[k]); } if (text) { e.textContent = text; } svg.appendChild(e); }
    add('text', { x: 0, y: 14, class: 'muted' }, 'The promise');
    if (n.low != null && n.high != null && n.high > n.low) { add('rect', { x: X(n.low), y: 22, width: Math.max(2, X(n.high) - X(n.low)), height: 16, rx: 2, fill: '#17233a' }); } else { add('rect', { x: X(n.mid) - 2, y: 20, width: 4, height: 20, fill: '#17233a' }); }
    add('text', { x: 0, y: 66, class: 'muted' }, 'SayDo’s forecast, made the same day');
    if (n.forecast_low != null) { add('rect', { x: X(n.forecast_low), y: 74, width: Math.max(2, X(n.forecast_high) - X(n.forecast_low)), height: 16, rx: 2, fill: '#2140a8', opacity: 0.3 }); }
    if (n.forecast != null) { add('rect', { x: X(n.forecast) - 2, y: 72, width: 4, height: 20, fill: '#2140a8' }); }
    var kept = n.low == null || n.actual >= n.low, c = kept ? '#2140a8' : '#b8262b', ax = X(n.actual);
    add('line', { x1: ax, x2: ax, y1: 18, y2: 112, stroke: c, 'stroke-width': 2, 'stroke-dasharray': '4 3' });
    add('circle', { cx: ax, cy: 116, r: 6, fill: c, stroke: '#fff', 'stroke-width': 2 });
    add('text', { x: Math.min(Math.max(ax, 60), W - 60), y: 140, 'text-anchor': 'middle' }, 'Result ' + money(n.actual));
    return svg;
  }
  function drawNote() {
    if (!notes.length) { $('notes').hidden = true; return; }
    var n = notes[noteAt], before = noteParts(n.before), after = noteParts(n.after), a = clear($('note-before')), b = clear($('note-after')), dl = el('dl'), dl2 = el('dl');
    a.appendChild(el('h3', { text: (before.head || n.name).replace(/ · what was known on .*/, '') }));
    a.appendChild(el('p', { class: 'hint', text: 'Written with what was known on ' + dateWords(n.made) + '.' }));
    before.rows.forEach(function (r) { dl.appendChild(el('dt', { text: r[0] })); dl.appendChild(el('dd', { text: r[1] })); });
    a.appendChild(dl);
    clear($('note-graph')).appendChild(noteGraph(n));
    after.rows.forEach(function (r) { dl2.appendChild(el('dt', { text: r[0] })); dl2.appendChild(el('dd', { text: r[1] })); });
    b.appendChild(dl2);
    $('note-count').textContent = (noteAt + 1) + ' of ' + notes.length;
    setThread($('note-thread'), n.low == null || n.actual >= n.low);
    $('note-thread').style.bottom = 'auto'; $('note-thread').style.top = '190px';
  }
  function setupNotes() {
    $('note-prev').addEventListener('click', function () { noteAt = (noteAt - 1 + notes.length) % notes.length; drawNote(); });
    $('note-next').addEventListener('click', function () { noteAt = (noteAt + 1) % notes.length; drawNote(); });
    drawNote();
  }

  // ---------- what it claims, and where it falls short ----------
  function drawLimits() {
    var c = $('claims'), s = $('shortfalls'), t6 = get(summary, 'model.test', {}), t7 = get(summary, 'forecaster.test', {}), last = get(summary, 'checks.lasting'), audit = summary.audit || {};
    function li(list, text) { if (text) { list.appendChild(el('li', { text: text })); } }
    var chosen = t6.chosen, rank = get(t6, 'scores.' + chosen + '.ranking'), track = get(t6, 'scores.track.ranking'), ch7 = t7.chosen;
    li(c, 'It reads promises from the earnings press releases companies file with the SEC, and checks each one against the official result reported later.');
    li(c, audit.weighted_right != null ? 'In a blind hand check of ' + audit.checked + ' promises, about ' + pct(audit.weighted_right) + ' were read fully right. Only promises found in guidance sections are shown here; those were right about ' + pct(get(audit, 'by_from.guidance section.weighted_right')) + ' of the time.' : null);
    li(c, rank != null ? 'Its kept-or-missed model was tested once, on ' + commas(t6.n) + ' promises made after it stopped learning. Ranking score ' + rank.toFixed(2) + '; a coin flip scores 0.50 and the company’s track record alone ' + (track != null ? track.toFixed(2) : 'n/a') + '.' : null);
    li(c, get(t7, 'cards.' + ch7 + '.typical') != null ? 'Its revenue forecaster typically misses by ' + t7.cards[ch7].typical.toFixed(2) + '% of real revenue, against ' + t7.cards.midpoint.typical.toFixed(2) + '% for the middle of the company’s own promise.' : null);
    li(c, last ? 'A company’s record before 2023 agrees with its record after (agreement ' + last.agreement.toFixed(2) + ' on a scale where 0 is no link), so the score reflects a lasting habit.' : null);
    var sect = get(audit, 'by_from.guidance section.weighted_right'), down = get(summary, 'checks.fpa_checks.downside'), weak = get(summary, 'checks.stress.weak', []);
    li(s, sect != null ? 'About ' + pct(1 - sect) + ' of the promises shown are still misread, so some verdicts on this page are wrong. Every promise links to its source so you can check.' : null);
    li(s, 'Only promises that can be checked against official (GAAP) figures are scored. Promises on an “adjusted” basis, which are very common, are set aside.');
    li(s, 'A high score can mean cautious promises as much as strong results. It measures the gap between words and results, not the quality of the business.');
    li(s, 'It covers large U.S. companies that are in the S&P 500 today. Companies that left the index are missing.');
    li(s, down && down.said_below != null ? 'The revenue forecaster does not see trouble coming: of ' + down.n + ' promises that ended below their range, it warned on ' + pct(down.said_below) + '.' : null);
    li(s, weak.length ? 'The kept-or-missed model is weak for: ' + weak.join(', ') + '.' : null);
    li(s, 'The test period, 2024 to 2026, had no shock like 2020. The models have not been tested through one.');
  }

  drawHero(); drawFigures(); setupLookup(); drawStrip(); drawPatterns(); setupTry(); setupNotes(); drawLimits();
})();
