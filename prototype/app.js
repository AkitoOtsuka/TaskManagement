// =====================================================================
// マイTODOボード プロトタイプ
// データはこの変数（メモリ）上のみで保持する。リロードで初期状態に戻る。
// =====================================================================

// ----- リスト（ステータス）の定義 -----
const LISTS = [
  { status: 'todo',  title: '未着手' },
  { status: 'doing', title: '作業中' },
  { status: 'done',  title: '完了' },
];

// ----- 優先度の表示用設定（並び替えの重みも持たせる） -----
const PRIORITY = {
  high: { label: '高', badge: '🔴', rank: 0 },
  mid:  { label: '中', badge: '🟡', rank: 1 },
  low:  { label: '低', badge: '🔵', rank: 2 },
};

// ----- 初期サンプルデータ -----
let cards = [
  { id: 1, title: '買い物に行く',     note: '牛乳と卵',      due: '2026-06-10', priority: 'high', status: 'todo' },
  { id: 2, title: '部屋の掃除',       note: '',              due: '2026-06-25', priority: 'low',  status: 'todo' },
  { id: 3, title: '資料作成',         note: '会議用スライド', due: '2026-06-09', priority: 'mid',  status: 'doing' },
  { id: 4, title: '読書（30分）',     note: '',              due: '2026-06-15', priority: 'low',  status: 'done' },
];
let nextId = 5; // 新規カードに振る ID

// 各リストの並び替え基準
//   'manual'   = 自由（手動・ドラッグした位置のまま。Trello のような並び）
//   'due'      = 期限順
//   'priority' = 優先度順
// カードの並び順そのものは cards 配列の順番で表現する。'manual' のときは
// 配列順をそのまま使い、'due'/'priority' のときは一時的に並べ替えて表示する。
const sortBy = { todo: 'manual', doing: 'manual', done: 'manual' };

// ----- DOM参照 -----
const board = document.getElementById('board');

// 編集モーダル
const editOverlay   = document.getElementById('editOverlay');
const editTitle     = document.getElementById('editTitle');
const editNote      = document.getElementById('editNote');
const editDue       = document.getElementById('editDue');
const editError     = document.getElementById('editError');
const editSaveBtn   = document.getElementById('editSaveBtn');
const editCloseBtn  = document.getElementById('editCloseBtn');
const editDeleteBtn = document.getElementById('editDeleteBtn');

// 削除確認ダイアログ
const confirmOverlay   = document.getElementById('confirmOverlay');
const confirmText      = document.getElementById('confirmText');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

let editingId = null;   // 編集中カードのID
let deletingId = null;  // 削除確認中カードのID

// =====================================================================
// 描画
// =====================================================================
function render() {
  board.innerHTML = '';

  LISTS.forEach(list => {
    // 該当ステータスのカードを取り出す。
    // 'manual'（自由）のときは配列順のまま、それ以外は基準で並べ替える。
    let items = cards.filter(c => c.status === list.status);
    if (sortBy[list.status] !== 'manual') {
      items = items.sort(compareBy(sortBy[list.status]));
    }

    // リスト要素
    const listEl = document.createElement('section');
    listEl.className = 'list';
    listEl.dataset.status = list.status;

    // ヘッダー（タイトル＋件数＋並び替え）
    const header = document.createElement('div');
    header.className = 'list-header';
    header.innerHTML = `
      <div>
        <span class="list-title">${escapeHtml(list.title)}</span>
        <span class="list-count">${items.length}</span>
      </div>
    `;
    const sortSelect = document.createElement('select');
    sortSelect.className = 'sort-select';
    sortSelect.innerHTML = `
      <option value="manual" disabled>並び替え</option>
      <option value="due">期限順</option>
      <option value="priority">優先度順</option>
    `;
    sortSelect.value = sortBy[list.status];
    sortSelect.addEventListener('change', () => {
      sortBy[list.status] = sortSelect.value;
      render();
    });
    header.appendChild(sortSelect);
    listEl.appendChild(header);

    // カード一覧（ドロップ先）
    const cardsEl = document.createElement('div');
    cardsEl.className = 'cards';
    items.forEach(card => cardsEl.appendChild(createCardEl(card)));
    listEl.appendChild(cardsEl);

    // ドラッグ＆ドロップ（リスト全体をドロップ先にする）
    listEl.addEventListener('dragover', e => {
      e.preventDefault();
      listEl.classList.add('drag-over');
    });
    listEl.addEventListener('dragleave', () => listEl.classList.remove('drag-over'));
    listEl.addEventListener('drop', e => {
      e.preventDefault();
      listEl.classList.remove('drag-over');
      const id = Number(e.dataTransfer.getData('text/plain'));
      const card = cards.find(c => c.id === id);
      if (!card) return;

      // 移動先リストへ。並びは「自由（手動）」に切り替え、落とした位置に差し込む。
      card.status = list.status;
      sortBy[list.status] = 'manual';

      // カーソルの位置から「どのカードの前に入れるか」を求める
      const afterEl = getDropTarget(cardsEl, e.clientY);

      // いったん配列から取り除いてから、目的の位置へ入れ直す
      cards = cards.filter(c => c.id !== id);
      if (afterEl === null) {
        cards.push(card); // リストの最後へ
      } else {
        const afterId = Number(afterEl.dataset.id);
        const idx = cards.findIndex(c => c.id === afterId);
        cards.splice(idx, 0, card); // そのカードの直前へ
      }
      render();
    });

    // 追加フォーム
    listEl.appendChild(createAddForm(list.status));

    board.appendChild(listEl);
  });
}

// カード要素を作る
function createCardEl(card) {
  const el = document.createElement('div');
  el.className = 'card';
  el.draggable = true;
  el.dataset.id = card.id; // ドロップ位置の計算に使う

  const p = PRIORITY[card.priority];
  el.innerHTML = `
    <button class="card-close" title="削除">×</button>
    <div class="card-title">${escapeHtml(card.title)}</div>
    <div class="card-meta">
      <span class="badge">${p.badge}${p.label}</span>
      <span>📅 ${formatDate(card.due)}</span>
    </div>
  `;

  // カードクリックで編集モーダル
  el.addEventListener('click', () => openEdit(card.id));

  // ×ボタンで削除確認（カードクリックへは伝播させない）
  el.querySelector('.card-close').addEventListener('click', e => {
    e.stopPropagation();
    openConfirm(card.id);
  });

  // ドラッグ
  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', String(card.id));
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));

  return el;
}

// 追加フォームを作る
function createAddForm(status) {
  const wrap = document.createElement('div');

  const addBtn = document.createElement('button');
  addBtn.className = 'add-card';
  addBtn.textContent = '＋ カードを追加';

  const form = document.createElement('div');
  form.className = 'add-form';
  form.innerHTML = `
    <input type="text" class="add-title" placeholder="タイトル（必須）">
    <input type="date" class="add-due">
    <select class="add-priority">
      <option value="">優先度（必須）</option>
      <option value="high">🔴 高</option>
      <option value="mid">🟡 中</option>
      <option value="low">🔵 低</option>
    </select>
    <div class="add-form-actions">
      <button class="btn-primary add-submit">追加</button>
      <button class="btn-ghost add-cancel">キャンセル</button>
    </div>
  `;

  addBtn.addEventListener('click', () => {
    form.classList.add('open');
    addBtn.style.display = 'none';
    form.querySelector('.add-title').focus();
  });

  const closeForm = () => {
    form.classList.remove('open');
    addBtn.style.display = '';
    form.querySelector('.add-title').value = '';
    form.querySelector('.add-due').value = '';
    form.querySelector('.add-priority').value = '';
  };

  form.querySelector('.add-cancel').addEventListener('click', closeForm);
  form.querySelector('.add-submit').addEventListener('click', () => {
    const title = form.querySelector('.add-title').value.trim();
    const due = form.querySelector('.add-due').value;
    const priority = form.querySelector('.add-priority').value;
    // タイトル・期限・優先度すべて入力時のみ追加
    if (!title || !due || !priority) {
      alert('タイトル・期限・優先度は必須です。');
      return;
    }
    cards.push({ id: nextId++, title, note: '', due, priority, status });
    render();
  });

  wrap.appendChild(addBtn);
  wrap.appendChild(form);
  return wrap;
}

// =====================================================================
// 並び替え
// =====================================================================
// ドロップしたカーソルの縦位置(y)から、「どのカードの直前に差し込むか」を返す。
// カーソルより下にある最も近いカードを探す。最後尾なら null を返す。
function getDropTarget(container, y) {
  const others = [...container.querySelectorAll('.card:not(.dragging)')];
  let closest = null;
  let closestOffset = -Infinity;
  others.forEach(el => {
    const box = el.getBoundingClientRect();
    const offset = y - box.top - box.height / 2; // 中心より上か下か
    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closest = el;
    }
  });
  return closest;
}

function compareBy(key) {
  if (key === 'priority') {
    return (a, b) => PRIORITY[a.priority].rank - PRIORITY[b.priority].rank;
  }
  // 期限順（早い順）
  return (a, b) => a.due.localeCompare(b.due);
}

// =====================================================================
// 編集モーダル
// =====================================================================
function openEdit(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;
  editingId = id;
  editTitle.value = card.title;
  editNote.value = card.note;
  editDue.value = card.due;
  setRadio('editPriority', card.priority);
  editError.hidden = true;
  editOverlay.hidden = false;
}

function closeEdit() {
  editOverlay.hidden = true;
  editingId = null;
}

editSaveBtn.addEventListener('click', () => {
  const card = cards.find(c => c.id === editingId);
  if (!card) return;
  const title = editTitle.value.trim();
  const due = editDue.value;
  const priority = getRadio('editPriority');
  if (!title || !due || !priority) {
    editError.hidden = false;
    return;
  }
  card.title = title;
  card.note = editNote.value;
  card.due = due;
  card.priority = priority;
  closeEdit();
  render();
});

editCloseBtn.addEventListener('click', closeEdit);
// 背景クリックで閉じる
editOverlay.addEventListener('click', e => { if (e.target === editOverlay) closeEdit(); });
// モーダル内の削除ボタン → 削除確認へ
editDeleteBtn.addEventListener('click', () => openConfirm(editingId));

// =====================================================================
// 削除確認ダイアログ（×・モーダル削除の共通処理）
// =====================================================================
function openConfirm(id) {
  const card = cards.find(c => c.id === id);
  if (!card) return;
  deletingId = id;
  confirmText.textContent = `「${card.title}」を削除してもよろしいですか？`;
  confirmOverlay.hidden = false;
}

function closeConfirm() {
  confirmOverlay.hidden = true;
  deletingId = null;
}

confirmDeleteBtn.addEventListener('click', () => {
  cards = cards.filter(c => c.id !== deletingId);
  closeConfirm();
  closeEdit(); // モーダル経由の削除なら一緒に閉じる
  render();
});
confirmCancelBtn.addEventListener('click', closeConfirm);
confirmOverlay.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });

// =====================================================================
// ユーティリティ
// =====================================================================
function setRadio(name, value) {
  document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
    r.checked = (r.value === value);
  });
}
function getRadio(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}
function formatDate(iso) {
  // 2026-06-10 -> 6/10
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// ----- 起動 -----
render();
