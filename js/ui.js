/** DOM, события, отображение */
const UI = (() => {
  const els = {
    listSelector: document.getElementById('listSelector'),
    newListBtn: document.getElementById('newListBtn'),
    deleteListBtn: document.getElementById('deleteListBtn'),
    themeToggle: document.getElementById('themeToggle'),
    listTitleInput: document.getElementById('listTitleInput'),
    globalDiscount: document.getElementById('globalDiscount'),
    addItemBtn: document.getElementById('addItemBtn'),
    itemName: document.getElementById('itemName'),
    itemQty: document.getElementById('itemQty'),
    itemPrice: document.getElementById('itemPrice'),
    itemDiscount: document.getElementById('itemDiscount'),
    itemStore: document.getElementById('itemStore'),
    priceHint: document.getElementById('priceHint'),
    shoppingList: document.getElementById('shoppingList'),
    totalItems: document.getElementById('totalItems'),
    purchasedItems: document.getElementById('purchasedItems'),
    totalCostDisplay: document.getElementById('totalCostDisplay')
  };

  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
  }

  function toggleTheme() {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
    Data.saveTheme(next);
  }

  function renderListSelector() {
    els.listSelector.innerHTML = '';
    Data.lists.forEach(list => {
      const opt = document.createElement('option');
      opt.value = list.id;
      opt.textContent = list.title;
      opt.selected = list.id === Data.activeId;
      els.listSelector.appendChild(opt);
    });
    els.deleteListBtn.disabled = Data.lists.length <= 1;
  }

  function renderItemRow(item, list) {
    const global = list.globalDiscountPercent || 0;
    const finalPrice = Logic.itemFinalPrice(item.price, item.discountPercent, global);
    const hasDisc = (item.discountPercent || 0) > 0;
    const hasGlobal = global > 0;
    const storeLabel = item.store
      ? `<span class="store-badge">🏪 ${Logic.escapeHtml(item.store)}</span>`
      : '';

    const li = document.createElement('li');
    li.className = 'list-item' + (item.purchased ? ' purchased' : '');
    li.innerHTML = `
      <div class="item-main">
        <input type="checkbox" class="purchase-checkbox" ${item.purchased ? 'checked' : ''}>
        <div class="item-info">
          <span class="item-name">${Logic.escapeHtml(item.name)}</span>
          <span class="item-meta">
            <span class="item-quantity">${Logic.escapeHtml(item.quantity || '—')}</span>
            ${storeLabel}
          </span>
        </div>
        <div class="price-block">
          ${item.price > 0 ? `<span class="price">${Logic.formatMoney(item.price)}</span>` : ''}
          ${hasDisc ? `<span class="discount-badge">-${item.discountPercent}%</span>` : ''}
          ${hasGlobal ? `<span class="discount-badge">список -${global}%</span>` : ''}
          <span class="final-price"><strong>${Logic.formatMoney(finalPrice)}</strong></span>
        </div>
      </div>
      <div class="item-actions">
        <button type="button" class="delete-item" title="Удалить">🗑️</button>
      </div>`;

    li.querySelector('.purchase-checkbox').addEventListener('change', () => {
      Data.togglePurchased(item.id);
      render();
    });
    li.querySelector('.delete-item').addEventListener('click', () => {
      Data.deleteItem(item.id);
      render();
    });
    return li;
  }

  function renderCurrentList() {
    const list = Data.getActive();
    if (!list) {
      els.shoppingList.innerHTML = '<div class="empty-message">❌ Список не найден</div>';
      return;
    }

    els.listTitleInput.value = list.title;
    els.globalDiscount.value = list.globalDiscountPercent || 0;

    const items = list.items;
    const totals = Logic.listTotals(items, list.globalDiscountPercent);
    els.totalItems.textContent = totals.count;
    els.purchasedItems.textContent = totals.purchased;
    els.totalCostDisplay.textContent = '💰 Итого: ' + Logic.formatMoney(totals.total);

    els.shoppingList.innerHTML = '';
    if (!items.length) {
      els.shoppingList.innerHTML = '<div class="empty-message">🛒 Добавьте первый товар</div>';
      return;
    }
    items.forEach(item => els.shoppingList.appendChild(renderItemRow(item, list)));
  }

  function updatePriceHint() {
    const offer = Logic.findCheapestOffer(Data.lists, els.itemName.value);
    if (!offer) {
      els.priceHint.hidden = true;
      return;
    }
    els.priceHint.hidden = false;
    els.priceHint.textContent =
      `💡 Раньше дешевле всего: ${Logic.formatMoney(offer.finalPrice)} — ${offer.store}`;
  }

  function clearAddForm() {
    els.itemName.value = '';
    els.itemQty.value = '';
    els.itemPrice.value = '';
    els.itemDiscount.value = '0';
    els.itemStore.value = '';
    els.priceHint.hidden = true;
    els.itemName.focus();
  }

  function addItem() {
    const name = els.itemName.value.trim();
    if (!name) {
      alert('Введите название товара');
      return;
    }
    Data.addItem({
      name,
      quantity: els.itemQty.value,
      price: els.itemPrice.value,
      discount: els.itemDiscount.value,
      store: els.itemStore.value
    });
    clearAddForm();
    render();
  }

  function render() {
    renderListSelector();
    renderCurrentList();
  }

  function bindEvents() {
    els.newListBtn.addEventListener('click', () => {
      Data.createList();
      render();
    });

    els.deleteListBtn.addEventListener('click', () => {
      if (!Data.deleteActiveList()) {
        alert('Нельзя удалить последний список');
        return;
      }
      render();
    });

    els.listSelector.addEventListener('change', e => {
      Data.setActive(e.target.value);
      render();
    });

    els.listTitleInput.addEventListener('blur', () => {
      Data.updateTitle(els.listTitleInput.value);
      renderListSelector();
    });
    els.listTitleInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') els.listTitleInput.blur();
    });

    els.globalDiscount.addEventListener('input', () => {
      Data.updateGlobalDiscount(els.globalDiscount.value);
      renderCurrentList();
    });

    els.addItemBtn.addEventListener('click', addItem);
    els.themeToggle.addEventListener('click', toggleTheme);

    els.itemName.addEventListener('input', updatePriceHint);
    [els.itemName, els.itemPrice, els.itemQty, els.itemStore].forEach(inp => {
      inp.addEventListener('keypress', e => {
        if (e.key === 'Enter') addItem();
      });
    });
  }

  function init() {
    Data.load();
    applyTheme(Data.loadTheme());
    bindEvents();
    render();
  }

  return { init };
})();

UI.init();
