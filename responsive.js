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
      .single-allocation-variance{color:red!important;font-weight:400!important}
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
        value: item => Array.isArray(splitsByItem?.[item.id]) && splitsByItem[item.id].length > 1 ? 'Split' : item.status
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

  /* Simplify the Bulk Department Change popup. */
  const bulkModal = document.getElementById('bulkModal');
  const bulkChecks = bulkModal?.querySelector('.checks');
  if (bulkChecks) bulkChecks.remove();

  const applyBulkButton = document.getElementById('applyBulk');
  if (applyBulkButton) applyBulkButton.textContent = 'Confirm';

  /* Ensure bulk department changes also update saved split-allocation lines. */
  if (
    applyBulkButton &&
    typeof items !== 'undefined' &&
    typeof selected !== 'undefined' &&
    typeof splitsByItem !== 'undefined'
  ) {
    applyBulkButton.onclick = () => {
      const department = document.getElementById('bulkDepartment').value;
      let updatedCount = 0;

      items.forEach(item => {
        if (!selected.has(item.id)) return;

        item.dept = department;
        updatedDepartments.add(item.id);
        updatedCount += 1;

        if (Array.isArray(splitsByItem[item.id]) && splitsByItem[item.id].length) {
          splitsByItem[item.id] = splitsByItem[item.id].map(line => ({
            ...line,
            dept: department
          }));
        }
      });

      try {
        localStorage.setItem(
          'cycleCountItemDepartments',
          JSON.stringify(Object.fromEntries(items.map(item => [item.id, item.dept])))
        );
        localStorage.setItem('cycleCountSplitAllocations', JSON.stringify(splitsByItem));
      } catch (error) {
        console.warn('Unable to save department changes.', error);
      }

      renderItems();
      closeModal('bulkModal');
      showToast(`Department changed to ${deptLabel(department)} for ${updatedCount} selected item(s).`);
    };
  }

  /* A single allocation line is not a split. Always render it as a normal variance row. */
  function normalizeSingleAllocationRows() {
    const rows = document.querySelectorAll('#itemRows tr');
    rows.forEach(row => {
      const status = row.querySelector('.status');
      if (!status || status.textContent.trim() !== 'Split 1/1') return;

      status.textContent = 'Variance';
      status.classList.remove('splitstatus');
      status.classList.add('variance');

      row.classList.remove('split-row', 'first-split');
      const differenceCell = row.querySelector('.split-qty');
      if (differenceCell) {
        differenceCell.classList.remove('split-qty');
        differenceCell.classList.add('red', 'single-allocation-variance');
      }
    });
  }

  if (reconciliationRows) {
    normalizeSingleAllocationRows();
    const rowObserver = new MutationObserver(normalizeSingleAllocationRows);
    rowObserver.observe(reconciliationRows, { childList: true, subtree: true });
  }
})();
