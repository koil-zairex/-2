/** Расчёты, форматирование, сравнение цен — без DOM */
const Logic = (() => {
  function parseNumber(val) {
    const n = parseFloat(String(val).replace(',', '.'));
    return isNaN(n) || n < 0 ? 0 : Math.round(n * 100) / 100;
  }

  function clampPercent(val) {
    const n = parseInt(val, 10);
    if (isNaN(n)) return 0;
    return Math.min(100, Math.max(0, n));
  }

  function trimField(str, max) {
    return String(str || '').trim().slice(0, max);
  }

  function formatMoney(n) {
    return parseNumber(n).toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }) + ' ₽';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** Цена позиции с учётом скидки товара и списка */
  function itemFinalPrice(price, itemDiscountPercent, globalDiscountPercent) {
    const afterItem = price * (1 - clampPercent(itemDiscountPercent) / 100);
    const afterGlobal = afterItem * (1 - clampPercent(globalDiscountPercent) / 100);
    return Math.round(afterGlobal * 100) / 100;
  }

  /** Итоги по списку */
  function listTotals(items, globalDiscountPercent) {
    let total = 0;
    items.forEach(item => {
      total += itemFinalPrice(item.price, item.discountPercent, globalDiscountPercent);
    });
    return {
      total: Math.round(total * 100) / 100,
      count: items.length,
      purchased: items.filter(i => i.purchased).length
    };
  }

  function storeKey(name) {
    return String(name || '').trim().toLowerCase();
  }

  /** Магазин товара: свой или магазин списка */
  function getEffectiveStore(item, list) {
    return Logic.trimField(item.store || list.visitStore || '', 30);
  }

  /** Самая низкая цена товара по всем спискам (для подсказки) */
  function findCheapestOffer(allLists, productName) {
    const q = productName.trim().toLowerCase();
    if (!q) return null;

    let best = null;
    allLists.forEach(list => {
      const global = list.globalDiscountPercent || 0;
      list.items.forEach(item => {
        if (item.name.trim().toLowerCase() !== q) return;
        const final = itemFinalPrice(item.price, item.discountPercent, global);
        const store = getEffectiveStore(item, list) || 'не указан';
        if (!best || final < best.finalPrice) {
          best = { finalPrice: final, rawPrice: item.price, store };
        }
      });
    });
    return best;
  }

  /** Группы магазинов (одинаковые названия объединяются) */
  function buildStoreGroups(allLists) {
    const map = new Map();

    allLists.forEach(list => {
      const global = list.globalDiscountPercent || 0;
      list.items.forEach(item => {
        const store = getEffectiveStore(item, list);
        if (!store) return;

        const key = storeKey(store);
        if (!map.has(key)) {
          map.set(key, { key, name: store, items: [] });
        }

        map.get(key).items.push({
          name: item.name,
          quantity: item.quantity,
          price: itemFinalPrice(item.price, item.discountPercent, global),
          listTitle: list.title,
          purchased: item.purchased
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  /** Сравнение цен одного товара в разных магазинах */
  function buildProductComparison(allLists) {
    const map = new Map();

    allLists.forEach(list => {
      const global = list.globalDiscountPercent || 0;
      list.items.forEach(item => {
        const store = getEffectiveStore(item, list);
        if (!store) return;

        const pKey = item.name.trim().toLowerCase();
        if (!pKey) return;

        if (!map.has(pKey)) {
          map.set(pKey, { name: item.name, offers: [] });
        }

        map.get(pKey).offers.push({
          store,
          storeKey: storeKey(store),
          price: itemFinalPrice(item.price, item.discountPercent, global),
          listTitle: list.title
        });
      });
    });

    return Array.from(map.values())
      .map(row => {
        const cheapest = row.offers.reduce((min, o) => (!min || o.price < min.price ? o : min), null);
        return { ...row, cheapestStore: cheapest?.store || '' };
      })
      .filter(row => row.offers.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  return {
    parseNumber,
    clampPercent,
    trimField,
    formatMoney,
    escapeHtml,
    storeKey,
    getEffectiveStore,
    itemFinalPrice,
    listTotals,
    findCheapestOffer,
    buildStoreGroups,
    buildProductComparison
  };
})();
