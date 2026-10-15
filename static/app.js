const themePreference = window.matchMedia('(prefers-color-scheme: dark)');
let selectedTheme = 'system';
try {
  const saved = localStorage.getItem('scopekit-theme');
  if (['light', 'dark', 'system'].includes(saved)) selectedTheme = saved;
} catch { /* Themes still work when browser storage is unavailable. */ }
function applyTheme() {
  document.documentElement.dataset.theme = selectedTheme === 'system'
    ? (themePreference.matches ? 'dark' : 'light') : selectedTheme;
}
applyTheme();
themePreference.addEventListener('change', applyTheme);
window.addEventListener('DOMContentLoaded', () => {
  const themeButton = document.getElementById('theme');
  const themeMenu = document.getElementById('theme-menu');
  const themeOptions = [...themeMenu.querySelectorAll('[data-theme-choice]')];
  function syncThemeMenu() {
    document.getElementById('theme-value').textContent = selectedTheme[0].toUpperCase() + selectedTheme.slice(1);
    themeOptions.forEach(option => option.setAttribute('aria-checked', String(option.dataset.themeChoice === selectedTheme)));
  }
  function closeThemeMenu(restoreFocus = false) {
    themeMenu.hidden = true;
    themeButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) themeButton.focus();
  }
  function openThemeMenu() {
    themeMenu.hidden = false;
    themeButton.setAttribute('aria-expanded', 'true');
    themeOptions.find(option => option.dataset.themeChoice === selectedTheme).focus();
  }
  syncThemeMenu();
  themeButton.addEventListener('click', () => themeMenu.hidden ? openThemeMenu() : closeThemeMenu());
  themeButton.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); openThemeMenu(); }
  });
  themeOptions.forEach(option => option.addEventListener('click', () => {
    selectedTheme = option.dataset.themeChoice;
    applyTheme(); syncThemeMenu(); closeThemeMenu(true);
    try { localStorage.setItem('scopekit-theme', selectedTheme); } catch { /* Optional persistence. */ }
  }));
  themeMenu.addEventListener('keydown', event => {
    const index = themeOptions.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); closeThemeMenu(true); }
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? themeOptions.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + themeOptions.length) % themeOptions.length;
      themeOptions[next].focus();
    } else if (event.key === 'Tab') closeThemeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!themeButton.parentElement.contains(event.target)) closeThemeMenu();
  });
  document.addEventListener('focusin', event => {
    if (!themeButton.parentElement.contains(event.target)) closeThemeMenu();
  });
const $ = id => document.getElementById(id);
let scope = null, totals = null, sampleMode = false, busy = false, quoteSequence = 0, scopeModel = '';
const exampleBrief = `Hi! I run a little pottery studio called Clay & Co. Could you make a simple one-page website with our story, a gallery of 8 products, and a contact form? It needs to look good on phones. We have a logo and photos ready. I'd love it by the end of the month. Maybe we can add online payments later? Let me know what this would cost.`;
const exampleScope = {
  title: 'Clay & Co. · Studio website',
  summary: 'A mobile-friendly, one-page website to introduce the pottery studio, showcase its work, and collect inquiries.',
  deliverables: [
    { name: 'One-page layout and studio story', evidence: 'one-page website with our story', hours: 5 },
    { name: 'Product gallery with supplied photos', evidence: 'a gallery of 8 products', hours: 3 },
    { name: 'Contact form and submission flow', evidence: 'a contact form', hours: 3 },
    { name: 'Mobile layout and device checks', evidence: 'look good on phones', hours: 2 }
  ],
  questions: ['Who will provide the final website copy?', 'Where should contact submissions be delivered?', 'Is hosting already arranged?', 'What exact date is the launch target?'],
  assumptions: ['The client supplies the logo and eight product photos.', 'One feedback round is included as a proposed term, subject to agreement.'],
  out_of_scope: ['Online checkout and payments; scope as a separate phase.', 'Domain, hosting, and third-party service fees.']
};

function message(value) { $('message').textContent = value; }
function money(value) { return new Intl.NumberFormat('en', { style: 'currency', currency: $('currency').value }).format(value); }
function hours() { return [...document.querySelectorAll('.hours')].map(input => input.value === '' ? NaN : Number(input.value)); }
function numeric(id) { return $(id).value === '' ? NaN : Number($(id).value); }
async function api(path, data) {
  const response = await fetch(path, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed. Please try again.');
  return result;
}
// Keep native values as the source of truth while presenting consistent menus.
const dropdowns = new Map();
function enhanceDropdown(id) {
  const select = $(id), container = select.parentElement;
  const label = document.querySelector(`label[for="${id}"]`);
  select.hidden = true;
  const trigger = document.createElement('button');
  trigger.type = 'button'; trigger.id = `${id}-picker`; trigger.className = 'dropdown-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', `${id}-menu`);
  if (label) { label.id = `${id}-label`; label.htmlFor = trigger.id; trigger.setAttribute('aria-labelledby', `${label.id} ${id}-value`); }
  const value = document.createElement('span'); value.id = `${id}-value`;
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chevron.setAttribute('class', 'icon dropdown-chevron'); chevron.setAttribute('viewBox', '0 0 24 24');
  chevron.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm7 10 5 5 5-5'); chevron.append(path);
  trigger.append(value, chevron);
  const menu = document.createElement('div'); menu.id = `${id}-menu`; menu.className = 'dropdown-menu';
  menu.setAttribute('role', 'listbox'); menu.setAttribute('aria-label', label ? label.textContent : id); menu.hidden = true;
  container.append(trigger, menu);
  function close(restore = false) { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); if (restore) trigger.focus(); }
  function sync() {
    value.textContent = select.selectedOptions[0]?.textContent || 'Choose a model'; trigger.disabled = select.disabled;
    menu.replaceChildren();
    for (const option of select.options) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'dropdown-option';
      button.setAttribute('role', 'option'); button.setAttribute('aria-selected', String(option.selected)); button.tabIndex = -1;
      const text = document.createElement('span'); text.textContent = option.textContent;
      const check = document.createElement('span'); check.className = 'dropdown-check'; check.setAttribute('aria-hidden', 'true');
      button.append(text, check); button.disabled = option.disabled;
      button.addEventListener('click', () => {
        select.value = option.value; sync(); close(true);
        select.dispatchEvent(new Event('input', {bubbles:true})); select.dispatchEvent(new Event('change', {bubbles:true}));
      });
      menu.append(button);
    }
    if (select.disabled) close();
  }
  function open() {
    if (select.disabled) return;
    document.dispatchEvent(new CustomEvent('scopekit-dropdown-open', {detail: id}));
    closeThemeMenu();
    menu.hidden = false; trigger.setAttribute('aria-expanded', 'true');
    (menu.querySelector('[aria-selected="true"]') || menu.querySelector('button'))?.focus();
  }
  trigger.addEventListener('click', () => menu.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); open(); }
  });
  let search = '', lastKey = 0;
  menu.addEventListener('keydown', event => {
    const options = [...menu.querySelectorAll('button:not(:disabled)')], index = options.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    else if (event.key === 'Tab') close(true);
    else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length-1 : (index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;
      options[next]?.focus();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.key !== ' ') {
      event.preventDefault(); search = Date.now()-lastKey>800 ? event.key : search+event.key; lastKey = Date.now();
      options.find(option => option.textContent.toLowerCase().startsWith(search.toLowerCase()))?.focus();
    }
  });
  document.addEventListener('click', event => { if (!container.contains(event.target)) close(); });
  document.addEventListener('focusin', event => { if (!container.contains(event.target)) close(); });
  document.addEventListener('scopekit-dropdown-open', event => { if (event.detail !== id) close(); });
  themeButton.addEventListener('click', () => close());
  select.addEventListener('change', sync);
  sync(); dropdowns.set(id, {sync});
}
for (const id of ['currency', 'model']) enhanceDropdown(id);
async function status() {
  $('connection').textContent = 'Checking Ollama…';
  try {
    const result = await api('/api/status');
    $('connection').classList.toggle('online', result.online && result.models.length > 0);
    $('connection').textContent = !result.online ? 'Ollama is offline · follow the setup below' : result.models.length ? 'Connected · local inference ready' : 'Ollama is ready · download a model first';
    const previous = $('model').value;
    $('model').replaceChildren();
    const models = [...new Set([result.default, ...result.models])];
    for (const name of models) { const option = document.createElement('option'); option.value = name; option.textContent = name; $('model').append(option); }
    $('model').value = models.includes(previous) ? previous : result.default;
    dropdowns.get('model').sync();
  } catch { $('connection').textContent = 'App connection failed · restart ScopeKit and reload'; }
}
function list(id, values) {
  $(id).replaceChildren();
  for (const value of values.length ? values : ['None suggested. Review with the client.']) {
    const li = document.createElement('li'); li.textContent = value; $(id).append(li);
  }
}
function setExportEnabled(enabled) { $('copy').disabled = !enabled; $('download').disabled = !enabled; }
function renderScope() {
  $('empty').hidden = true; $('output').hidden = false;
  $('result-badge').textContent = sampleMode ? 'SAMPLE · NOT AI GENERATED' : 'DRAFT FOR REVIEW';
  $('provenance').textContent = sampleMode ? 'HAND-WRITTEN EXAMPLE · TRY THE WORKFLOW' : `GENERATED LOCALLY WITH ${scopeModel}`;
  $('reply-warning').hidden = true; $('export-fallback').hidden = true;
  $('scope-title').textContent = scope.title; $('summary').textContent = scope.summary;
  $('deliverables').replaceChildren();
  scope.deliverables.forEach((item, index) => {
    const row = document.createElement('div'); row.className = 'deliverable';
    const info = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = item.name;
    const evidence = document.createElement('small'); evidence.textContent = `From the brief: “${item.evidence}”`;
    info.append(title, evidence);
    const edit = document.createElement('div'); const input = document.createElement('input');
    input.type = 'number'; input.className = 'hours'; input.id = `hours-${index}`;
    input.min = '0'; input.max = '200'; input.step = 'any'; input.value = item.hours;
    input.addEventListener('input', updateQuote);
    const label = document.createElement('label'); label.htmlFor = input.id; label.textContent = 'hours';
    input.setAttribute('aria-label', `Hours for ${item.name}`);
    edit.append(input, label); row.append(info, edit); $('deliverables').append(row);
  });
  for (const key of ['questions', 'assumptions', 'out_of_scope']) list(key, scope[key]);
  updateQuote();
}
function replyDraft() {
  return `Thanks for sharing the brief! Here’s my proposed scope for ${scope.title}:\n\n${scope.deliverables.map(d => `• ${d.name}`).join('\n')}\n\nThe estimated project fee is ${money(totals.total)}, including a ${$('buffer').value}% contingency. I suggest a ${$('deposit').value}% deposit (${money(totals.deposit)}) to begin, with ${money(totals.balance)} due on completion. Taxes and third-party costs are excluded.\n\nBefore confirming the scope and timeline:\n${scope.questions.map(q => `• ${q}`).join('\n') || '• Please confirm these deliverables and the target launch date.'}\n\nI’ll confirm the final scope, exclusions, and schedule once we’ve agreed on the details.`;
}
async function updateQuote() {
  const sequence = ++quoteSequence; totals = null; setExportEnabled(false);
  $('total').textContent = '…'; $('breakdown').textContent = ''; $('deposit-line').textContent = '';
  const inputs = [...document.querySelectorAll('.hours'), $('rate'), $('buffer'), $('deposit')];
  if (inputs.some(input => input.value === '' || !input.checkValidity())) {
    $('total').textContent = '—'; message('Enter valid hours, rate, contingency, and deposit to calculate the quote.'); return;
  }
  try {
    const result = await api('/api/quote', { hours: hours(), rate: numeric('rate'), buffer: numeric('buffer'), deposit: numeric('deposit') });
    if (sequence !== quoteSequence) return;
    totals = result;
    $('total').textContent = money(result.total);
    $('breakdown').textContent = `${hours().reduce((a,b) => a+b,0)} hours × ${money(numeric('rate'))} + ${money(result.buffer)} contingency`;
    $('deposit-line').textContent = `${money(result.deposit)} deposit · ${money(result.balance)} on completion`;
    if (!$('reply').dataset.edited) $('reply').value = replyDraft();
    $('reply-warning').hidden = !$('reply').dataset.edited;
    setExportEnabled(true);
    message(sampleMode ? 'This is a hand-written sample. Paste your own brief and create a scope to use local AI.' : 'Scope created. Review the estimates and open questions before exporting.');
  } catch (error) { if (sequence === quoteSequence) { $('total').textContent = '—'; message(error.message); } }
}
$('brief').addEventListener('input', () => { $('count').textContent = `${$('brief').value.length.toLocaleString()} / 12,000`; });
$('sample').addEventListener('click', () => {
  if (busy) return;
  $('brief').value = exampleBrief; $('brief').dispatchEvent(new Event('input'));
  scope = structuredClone(exampleScope); sampleMode = true; scopeModel = '';
  delete $('reply').dataset.edited; renderScope();
});
$('generate').addEventListener('click', async () => {
  if (busy) return;
  if ($('brief').value.trim().length < 20) return message('Add a little more detail: at least 20 characters from the client’s brief.');
  busy = true; $('generate').disabled = true; $('sample').disabled = true; $('brief').disabled = true; $('model').disabled = true; dropdowns.get('model').sync();
  $('generate-label').textContent = 'Reading your brief…'; message('Running on your computer. The first request may take a few minutes while the model loads.');
  try {
    const result = await api('/api/generate', { brief: $('brief').value, model: $('model').value });
    scope = result; sampleMode = false; scopeModel = $('model').value; delete $('reply').dataset.edited; renderScope();
  } catch (error) { message(error.message + (scope ? ' Your previous scope is still shown.' : '')); }
  finally { busy = false; $('generate').disabled = false; $('sample').disabled = false; $('brief').disabled = false; $('model').disabled = false; dropdowns.get('model').sync(); $('generate-label').textContent = 'Create my scope'; }
});
for (const id of ['rate', 'currency', 'buffer', 'deposit']) $(id).addEventListener('input', () => { if (scope) updateQuote(); });
$('reply').addEventListener('input', () => { $('reply').dataset.edited = 'true'; });
$('refresh-reply').addEventListener('click', () => {
  if (!scope || !totals) return;
  delete $('reply').dataset.edited; $('reply').value = replyDraft(); $('reply-warning').hidden = true;
  message('Reply refreshed from the current quote.');
});
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('reply').value); message('Reply copied.'); }
  catch { $('reply').focus(); $('reply').select(); message('Clipboard unavailable. The reply is selected; press Ctrl+C or Command+C to copy.'); }
});
$('download').addEventListener('click', () => {
  if (!scope || !totals) return;
  const edits = hours();
  let proposal = `# ${scope.title}\n\n${sampleMode ? '> Hand-written demonstration sample; not AI-generated.\n\n' : ''}> Draft proposal. All estimates and terms require agreement.\n\n${scope.summary}\n\n## Deliverables\n\n`;
  if (!sampleMode) proposal = `<!-- Scope extracted locally with ${scopeModel} via Ollama. -->\n\n` + proposal;
  scope.deliverables.forEach((d,i) => { proposal += `- **${d.name}** — ${edits[i]} hours\n  - Source: “${d.evidence}”\n`; });
  proposal += `\n## Estimated quote\n\nCurrency: ${$('currency').value}\n\n- Base: ${money(totals.base)}\n- Contingency (${$('buffer').value}%): ${money(totals.buffer)}\n- Total: **${money(totals.total)}**\n- Proposed deposit (${$('deposit').value}%): ${money(totals.deposit)}\n- Balance: ${money(totals.balance)}\n\nTaxes and third-party costs excluded.\n`;
  for (const [key, title] of [['questions','Questions to resolve'],['assumptions','Working assumptions'],['out_of_scope','Suggested exclusions']]) proposal += `\n## ${title}\n\n${scope[key].map(s => `- ${s}`).join('\n') || 'None suggested.'}\n`;
  proposal += `\n## Client reply\n\n${$('reply').value}\n`;
  if ($('reply').dataset.edited) proposal += '\nNote: The reply was manually edited. Check that its price and terms match the quote above.\n';
  $('proposal-text').value = proposal; $('export-fallback').hidden = false;
  const url = URL.createObjectURL(new Blob([proposal], {type:'text/markdown;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'scopekit-proposal.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Proposal prepared. If the download does not appear, copy the proposal text below.');
});
$('recheck').addEventListener('click', status);
status();

});
