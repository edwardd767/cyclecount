(() => {
  const body = document.body;
  const sidebar = document.querySelector('.sidebar');
  const menuButtons = document.querySelectorAll('#menu, #menuButton, .hamburger, .menu-button');

  menuButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (window.innerWidth <= 768 && sidebar) {
        event.preventDefault();
        event.stopPropagation();
        body.classList.toggle('mobile-menu-open');
      }
    }, true);
  });

  document.addEventListener('click', event => {
    if (window.innerWidth <= 768 && body.classList.contains('mobile-menu-open')) {
      const clickedSidebar = event.target.closest('.sidebar');
      const clickedMenu = event.target.closest('#menu, #menuButton, .hamburger, .menu-button');
      if (!clickedSidebar && !clickedMenu) body.classList.remove('mobile-menu-open');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) body.classList.remove('mobile-menu-open');
  });

  /* Cycle Count reconciliation column sorting */
  const reconciliationTable = document.querySelector('.table');
  const reconciliationRows = document.getElementById('itemRows');

  if (reconciliationTable && reconciliationRows && typeof visibleItems === 'function' && typeof renderItems === 'function') {
    const style = document.createElement('style');
    style.textContent = `
      .sort-button{width:100%;display:flex;align-items:center;gap:5px;padding:0;border:0;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer;text-align:inherit;white-space:nowrap}
      .table th:nth-child(4) .sort-button,.table th:nth-child(5) .sort-button,.table th:nth-child(6) .sort-button{justify-content:flex-end}
      .table th:nth-child(7) .sort-button{justify-content:center}
      .sort-indicator{display:inline-flex;min-width:14px;color:#8a8a8a;font-size:11px;line-height:1}
      .sort-button.active .sort-indicator{color:var(--orange,#ff8700)}
      .sort-button:focus-visible{outline:2px solid var(--orange,#ff8700);outline-offset:3px;border-radius:2px}
    `;
    document.head.appendChild(style);

    const columnDefinitions = [
      { index: 1, key: 'name', label: 'Item Name', type: 'text', value: item => item.name },
      { index: 2, key: 'category', label: 'Category', type: 'text', value: item => item.cat },
      { index: 3, key: 'onHand', label: 'On Hand', type: 'number', value: item => item.on },
      { index: 4, key: 'count', label: 'Count', type: 'number', value: item => item.count },
      { index: 5, key: 'difference', label: 'Difference', type: 'number', value: item => item.diff },
      {
        index: 6,
        key: 'status',
        label: 'Status',
        type: 'text',
        value: item => Array.isArray(splitsByItem?.[item.id]) && splitsByItem[item.id].length ? 'Split' : item.status
      },
      {
        index: 7,
        key: 'department',
        label: 'Department',
        type: 'text',
        value: item => {
          const split = Array.isArray(splitsByItem?.[item.id]) ? splitsByItem[item.id][0] : null;
          return typeof deptLabel === 'function' ? deptLabel(split?.dept || item.dept) : (split?.dept || item.dept || '');
        }
      }
    ];

    const originalVisibleItems = visibleItems;
    let sortKey = null;
    let sortDirection = 'asc';

    visibleItems = function sortedVisibleItems() {
      const result = originalVisibleItems();
      if (!sortKey) return result;

      const definition = columnDefinitions.find(column => column.key === sortKey);
      if (!definition) return result;

      return [...result].sort((left, right) => {
        const leftValue = definition.value(left);
        const rightValue = definition.value(right);
        let comparison = 0;

        if (definition.type === 'number') {
          comparison = Number(leftValue || 0) - Number(rightValue || 0);
        } else {
          comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        }

        if (comparison === 0) comparison = left.id - right.id;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    };

    const headerCells = reconciliationTable.querySelectorAll('thead th');

    function refreshSortHeaders() {
      columnDefinitions.forEach(definition => {
        const button = headerCells[definition.index]?.querySelector('.sort-button');
        if (!button) return;

        const active = sortKey === definition.key;
        button.classList.toggle('active', active);
        button.setAttribute('aria-sort', active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
        button.title = active
          ? `Sorted ${sortDirection === 'asc' ? 'ascending' : 'descending'}. Click to reverse.`
          : `Sort ${definition.label} ascending`;

        const indicator = button.querySelector('.sort-indicator');
        if (indicator) indicator.textContent = active ? (sortDirection === 'asc' ? '▲' : '▼') : '↕';
      });
    }

    columnDefinitions.forEach(definition => {
      const cell = headerCells[definition.index];
      if (!cell) return;

      cell.innerHTML = `
        <button class="sort-button" type="button" data-sort-key="${definition.key}" aria-sort="none">
          <span>${definition.label}</span>
          <span class="sort-indicator" aria-hidden="true">↕</span>
        </button>
      `;

      cell.querySelector('.sort-button').addEventListener('click', () => {
        if (sortKey === definition.key) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortKey = definition.key;
          sortDirection = 'asc';
        }

        refreshSortHeaders();
        renderItems();
      });
    });

    refreshSortHeaders();
  }
})();
