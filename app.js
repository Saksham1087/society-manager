(function () {
  const tabMain = document.getElementById('tabMaintenance');
  const tabExp = document.getElementById('tabExpenses');
  const moduleMain = document.getElementById('moduleMaintenance');
  const moduleExp = document.getElementById('moduleExpenses');
  const formMain = document.getElementById('formMaintenance');
  const formExp = document.getElementById('formExpenses');
  const maintList = document.getElementById('maintList');
  const expenseList = document.getElementById('expenseList');
  const receiptModal = document.getElementById('receiptModal');
  const receiptBody = document.getElementById('receiptBody').querySelector('tbody');
  const btnPrint = document.getElementById('btnPrintReceipt');
  const btnClose = document.getElementById('btnCloseReceipt');
  const btnViewReceipt = document.getElementById('btnMaintReceipt');
  const maintCategory = document.getElementById('maintCategory');
  const expCategory = document.getElementById('expCategory');
  const maintOtherWrap = document.getElementById('maint-other-wrap');
  const expOtherWrap = document.getElementById('exp-other-wrap');

  const OTHER_CATEGORIES = [
    { select: maintCategory, wrap: maintOtherWrap, inputId: 'maintCategoryOther' },
    { select: expCategory, wrap: expOtherWrap, inputId: 'expCategoryOther' }
  ];

  function switchTab(active) {
    const isMaint = active === 'maintenance';
    tabMain.classList.toggle('bg-blue-700', isMaint);
    tabMain.classList.toggle('text-white', isMaint);
    tabMain.classList.toggle('bg-white', !isMaint);
    tabMain.classList.toggle('text-gray-700', !isMaint);
    tabMain.setAttribute('aria-selected', isMaint);
    tabExp.classList.toggle('bg-green-700', !isMaint);
    tabExp.classList.toggle('text-white', !isMaint);
    tabExp.classList.toggle('bg-white', isMaint);
    tabExp.classList.toggle('text-gray-700', isMaint);
    tabExp.setAttribute('aria-selected', !isMaint);
    moduleMain.classList.toggle('hidden', !isMaint);
    moduleExp.classList.toggle('hidden', isMaint);
  }

  tabMain.addEventListener('click', function () { switchTab('maintenance'); });
  tabExp.addEventListener('click', function () { switchTab('expenses'); });

  function setupOtherCategory(select, wrap, inputId) {
    function toggleOther() {
      wrap.innerHTML = select.value === 'Other'
        ? '<input type="text" id="' + inputId + '" required placeholder="Specify category" class="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">'
        : '';
    }
    select.addEventListener('change', toggleOther);
    toggleOther();
  }

  OTHER_CATEGORIES.forEach(function (c) {
    setupOtherCategory(c.select, c.wrap, c.inputId);
  });

  function getCategoryValue(select, otherInputId) {
    if (select.value !== 'Other') return select.value;
    var input = document.getElementById(otherInputId);
    return input && input.value ? input.value : 'Other';
  }

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderMaintenance() {
    var records = getMaintenanceRecords();
    if (!records.length) {
      maintList.innerHTML = '<p class="text-gray-400">No records yet.</p>';
      return;
    }
    maintList.innerHTML = records.slice().reverse().map(function (r, idx) {
      var i = records.length - 1 - idx;
      return '<div class="flex justify-between items-center bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition" data-index="' + i + '">' +
        '<div><span class="font-semibold text-gray-800">' + esc(r.member) + '</span> ' +
        '<span class="text-gray-600">' + esc(r.flat) + '</span></div>' +
        '<div class="text-right"><span class="font-bold text-blue-700">\u20B9' + Number(r.amount).toFixed(2) + '</span>' +
        '<br><span class="text-xs text-gray-400">' + esc(r.category) + '</span></div></div>';
    }).join('');

    [].slice.call(maintList.children).forEach(function (el) {
      if (el.dataset.index !== undefined) {
        el.addEventListener('click', function () {
          openReceipt(parseInt(el.dataset.index));
        });
      }
    });
  }

  function renderExpenses() {
    var records = getExpenseRecords();
    if (!records.length) {
      expenseList.innerHTML = '<p class="text-gray-400">No records yet.</p>';
      return;
    }
    expenseList.innerHTML = records.slice().reverse().map(function (r) {
      return '<div class="flex justify-between items-center bg-gray-50 rounded-lg p-3">' +
        '<div><span class="font-semibold text-gray-800">' + esc(r.category) + '</span> ' +
        '<span class="text-gray-600">' + esc(r.vendor) + '</span></div>' +
        '<div class="text-right"><span class="font-bold text-green-700">\u20B9' + Number(r.amount).toFixed(2) + '</span>' +
        '<br><span class="text-xs text-gray-400">' + esc(r.date) + '</span></div></div>';
    }).join('');
  }

  function openReceipt(index) {
    var records = getMaintenanceRecords();
    var record = records[index];
    if (!record) return;
    populateReceipt(record);
    receiptModal.classList.remove('hidden');
    receiptModal.classList.add('flex');
  }

  formMain.addEventListener('submit', function (e) {
    e.preventDefault();
    var record = {
      member: document.getElementById('maintMember').value,
      flat: document.getElementById('maintFlat').value,
      category: getCategoryValue(maintCategory, 'maintCategoryOther'),
      amount: parseFloat(document.getElementById('maintAmount').value),
      date: document.getElementById('maintDate').value,
      mode: document.getElementById('maintMode').value,
      timestamp: new Date().toISOString()
    };
    addMaintenanceRecord(record);
    formMain.reset();
    maintOtherWrap.innerHTML = '';
    renderMaintenance();
  });

  formExp.addEventListener('submit', function (e) {
    e.preventDefault();
    var record = {
      category: getCategoryValue(expCategory, 'expCategoryOther'),
      amount: parseFloat(document.getElementById('expAmount').value),
      date: document.getElementById('expDate').value,
      vendor: document.getElementById('expVendor').value,
      mode: document.getElementById('expMode').value,
      billNo: document.getElementById('expBillNo').value,
      description: document.getElementById('expDescription').value,
      timestamp: new Date().toISOString()
    };
    addExpenseRecord(record);
    formExp.reset();
    expOtherWrap.innerHTML = '';
    renderExpenses();
  });

  function populateReceipt(record) {
    var rows = [
      ['Member', record.member],
      ['Flat No', record.flat],
      ['Category', record.category],
      ['Amount', '\u20B9' + Number(record.amount).toFixed(2)],
      ['Date', record.date],
      ['Payment Mode', record.mode]
    ];
    receiptBody.innerHTML = rows.map(function (pair) {
      return '<tr class="border-b border-gray-100"><td class="py-2 pr-4 font-medium text-gray-600">' +
        esc(pair[0]) + '</td><td class="py-2 text-right text-gray-800">' + esc(pair[1]) + '</td></tr>';
    }).join('');
  }

  btnViewReceipt.addEventListener('click', function () {
    var records = getMaintenanceRecords();
    if (!records.length) { alert('No maintenance records available.'); return; }
    openReceipt(records.length - 1);
  });

  btnClose.addEventListener('click', function () {
    receiptModal.classList.add('hidden');
    receiptModal.classList.remove('flex');
  });

  btnPrint.addEventListener('click', function () {
    window.print();
  });

  receiptModal.addEventListener('click', function (e) {
    if (e.target === receiptModal) {
      receiptModal.classList.add('hidden');
      receiptModal.classList.remove('flex');
    }
  });

  switchTab('maintenance');
  renderMaintenance();
  renderExpenses();
})();
