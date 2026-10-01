const state = { general: {}, schedule: [], videos: [], news: [], socials: [] };
const schemas = {
  schedule: [
    ['label', 'Label', 'LIVE'], ['title', 'Title', 'Stream nights'], ['timing', 'Timing', 'Multiple times weekly'],
    ['url', 'Link URL', 'https://...'], ['linkLabel', 'Link label', 'See announcements']
  ],
  videos: [
    ['title', 'Video title', 'Latest upload'], ['url', 'YouTube URL', 'https://...'], ['description', 'Description', 'Short description']
  ],
  news: [
    ['date', 'Date', 'SEP 18, 2026'], ['title', 'Headline', 'New transmission'], ['url', 'Optional link', 'https://...'], ['excerpt', 'Summary', 'What happened?', true]
  ],
  socials: [
    ['label', 'Platform', 'TWITCH'], ['url', 'Profile URL', 'https://...'], ['subtitle', 'Subtitle', '@HarutoGinrou']
  ]
};

const editors = {
  schedule: document.querySelector('#scheduleEditor'), videos: document.querySelector('#videosEditor'),
  news: document.querySelector('#newsEditor'), socials: document.querySelector('#socialsEditor')
};
const toast = document.querySelector('#toast');
const saveButton = document.querySelector('#saveButton');

const showToast = (message, error = false) => {
  toast.textContent = message;
  toast.className = `toast show${error ? ' error' : ''}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.className = 'toast'; }, 3200);
};

const renderEditor = (type) => {
  const target = editors[type];
  target.replaceChildren();
  if (!state[type].length) {
    const empty = document.createElement('div');
    empty.className = 'empty-editor';
    empty.textContent = 'No items yet. Add one when you are ready.';
    target.append(empty);
    return;
  }
  state[type].forEach((item, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'repeater-item';
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = String(index + 1).padStart(2, '0');
    const fields = document.createElement('div');
    fields.className = 'item-fields';
    schemas[type].forEach(([key, labelText, placeholder, wide]) => {
      const label = document.createElement('label');
      if (wide || schemas[type].length % 2 === 1 && key === schemas[type].at(-1)[0]) label.className = 'wide';
      const caption = document.createElement('span');
      caption.textContent = labelText;
      const input = wide ? document.createElement('textarea') : document.createElement('input');
      if (wide) input.rows = 3;
      input.placeholder = placeholder;
      input.maxLength = wide ? 500 : 240;
      input.value = item[key] || '';
      input.addEventListener('input', () => { state[type][index][key] = input.value; });
      label.append(caption, input);
      fields.append(label);
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-button';
    remove.setAttribute('aria-label', `Remove item ${index + 1}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => { state[type].splice(index, 1); renderEditor(type); });
    wrapper.append(handle, fields, remove);
    target.append(wrapper);
  });
};

const addItem = (type) => {
  const blank = Object.fromEntries(schemas[type].map(([key]) => [key, '']));
  state[type].push(blank);
  renderEditor(type);
  editors[type].lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addItem(button.dataset.add)));

const populate = (content) => {
  state.general = content.general || {};
  ['seoTitle', 'seoDescription', 'heroEyebrow', 'heroTagline', 'aboutHeading', 'aboutPrimary', 'aboutSecondary'].forEach(key => {
    const input = document.querySelector(`#${key}`);
    input.value = state.general[key] || '';
    input.addEventListener('input', () => { state.general[key] = input.value; });
  });
  ['schedule', 'videos', 'news', 'socials'].forEach(type => {
    state[type] = Array.isArray(content[type]) ? content[type].map(item => ({ ...item })) : [];
    renderEditor(type);
  });
  document.querySelector('#ownerEmail').textContent = content.owner || 'haruto.ginrou@gmail.com';
};

const load = async () => {
  try {
    const response = await fetch('/api/admin/content', { cache: 'no-store' });
    if (response.status === 401) { location.href = '/signin-with-chatgpt'; return; }
    if (response.status === 403) throw new Error('This ChatGPT account is not authorized for the admin panel.');
    if (!response.ok) throw new Error('Could not load the control panel.');
    populate(await response.json());
  } catch (error) {
    showToast(error.message, true);
  }
};

const save = async () => {
  saveButton.disabled = true;
  saveButton.textContent = 'Saving…';
  try {
    const response = await fetch('/api/admin/content', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ general: state.general, schedule: state.schedule, videos: state.videos, news: state.news, socials: state.socials })
    });
    if (response.status === 401) { location.href = '/signin-with-chatgpt'; return; }
    if (response.status === 403) throw new Error('This account is not authorized to save changes.');
    if (!response.ok) throw new Error('Your changes could not be saved.');
    showToast('Website content updated.');
  } catch (error) {
    showToast(error.message, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save changes';
  }
};

saveButton.addEventListener('click', save);
load();
