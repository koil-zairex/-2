/** Состояние и localStorage */
const Data = (() => {
  const KEY = 'smartShoppingData';
  const THEME_KEY = 'shoppingTheme';

  let lists = [];
  let activeId = null;

  function demoLists() {
    return [
      {
        id: 'list1',
        title: 'Продукты',
        visitStore: 'Пятёрочка',
        globalDiscountPercent: 0,
        items: [
          { id: 'i1', name: 'Молоко', quantity: '1 л', price: 89, discountPercent: 0, store: 'Пятёрочка', purchased: false },
          { id: 'i2', name: 'Сыр', quantity: '200 г', price: 250, discountPercent: 10, store: 'Магнит', purchased: false },
          { id: 'i3', name: 'Яблоки', quantity: '1 кг', price: 120, discountPercent: 0, store: 'Рынок', purchased: true }
        ]
      },
      {
        id: 'list2',
        title: 'Бытовая химия',
        visitStore: 'Лента',
        globalDiscountPercent: 5,
        items: [
          { id: 'i4', name: 'Порошок', quantity: '1 уп.', price: 450, discountPercent: 0, store: 'Лента', purchased: false },
          { id: 'i5', name: 'Средство для мытья', quantity: '500 мл', price: 320, discountPercent: 15, store: 'Пятёрочка', purchased: false }
        ]
      }
    ];
  }

  function normalizeItem(raw) {
    return {
      id: raw.id,
      name: raw.name || '',
      quantity: raw.quantity || '',
      price: Logic.parseNumber(raw.price),
      discountPercent: Logic.clampPercent(raw.discountPercent),
      store: raw.store || '',
      purchased: !!raw.purchased
    };
  }

  function normalizeList(raw) {
    return {
      id: raw.id,
      title: raw.title || 'Список',
      visitStore: raw.visitStore || '',
      globalDiscountPercent: Logic.clampPercent(raw.globalDiscountPercent),
      items: (raw.items || []).map(normalizeItem)
    };
  }

  function load() {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data.lists) && data.lists.length) {
          lists = data.lists.map(normalizeList);
          activeId = data.activeId;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    if (!lists.length) {
      lists = demoLists();
      activeId = lists[0].id;
    }
    if (!lists.some(l => l.id === activeId)) {
      activeId = lists[0].id;
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify({ lists, activeId }));
  }

  function getActive() {
    return lists.find(l => l.id === activeId) || null;
  }

  function setActive(id) {
    activeId = id;
    save();
  }

  function createList() {
    const list = {
      id: 'list_' + Date.now(),
      title: 'Список ' + (lists.length + 1),
      visitStore: '',
      globalDiscountPercent: 0,
      items: []
    };
    lists.push(list);
    activeId = list.id;
    save();
    return list;
  }

  function deleteActiveList() {
    if (lists.length <= 1) return false;
    lists = lists.filter(l => l.id !== activeId);
    activeId = lists[0].id;
    save();
    return true;
  }

  function updateTitle(title) {
    const list = getActive();
    if (!list) return;
    list.title = Logic.trimField(title, 40) || list.title;
    save();
  }

  function updateGlobalDiscount(value) {
    const list = getActive();
    if (!list) return;
    list.globalDiscountPercent = Logic.clampPercent(value);
    save();
  }

  function updateVisitStore(value) {
    const list = getActive();
    if (!list) return;
    list.visitStore = Logic.trimField(value, 30);
    save();
  }

  function addItem(fields) {
    const list = getActive();
    if (!list) return null;
    const store = Logic.trimField(fields.store, 30) || list.visitStore || '';
    const item = {
      id: Date.now() + Math.random(),
      name: Logic.trimField(fields.name, 60),
      quantity: Logic.trimField(fields.quantity, 40),
      price: Logic.parseNumber(fields.price),
      discountPercent: Logic.clampPercent(fields.discount),
      store,
      purchased: false
    };
    list.items.push(item);
    save();
    return item;
  }

  function togglePurchased(itemId) {
    const list = getActive();
    const item = list?.items.find(i => i.id == itemId);
    if (item) {
      item.purchased = !item.purchased;
      save();
    }
  }

  function deleteItem(itemId) {
    const list = getActive();
    if (!list) return;
    list.items = list.items.filter(i => i.id != itemId);
    save();
  }

  function loadTheme() {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  }

  function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
  }

  return {
    get lists() { return lists; },
    get activeId() { return activeId; },
    load,
    save,
    getActive,
    setActive,
    createList,
    deleteActiveList,
    updateTitle,
    updateVisitStore,
    updateGlobalDiscount,
    addItem,
    togglePurchased,
    deleteItem,
    loadTheme,
    saveTheme
  };
})();
