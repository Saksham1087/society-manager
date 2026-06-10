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

  const modalSmsBtn = document.getElementById('modal-sms-btn');
  const modalWaBtn = document.getElementById('modal-wa-btn');
  var _currentId = null;
  var _currentRecord = null;

  const OTHER_CATEGORIES = [
    { select: maintCategory, wrap: maintOtherWrap, inputId: 'maintCategoryOther' },
    { select: expCategory, wrap: expOtherWrap, inputId: 'expCategoryOther' }
  ];

  function updateAnalytics() {
    var maintRecords = getMaintenanceRecords();
    var expRecords = getExpenseRecords();
    var totalColl = 0, totalExp = 0;
    for (var i = 0; i < maintRecords.length; i++) totalColl += Number(maintRecords[i].amount) || 0;
    for (var i = 0; i < expRecords.length; i++) totalExp += Number(expRecords[i].amount) || 0;
    document.getElementById('totalCollections').textContent = totalColl.toFixed(2);
    document.getElementById('totalExpenses').textContent = totalExp.toFixed(2);
    document.getElementById('netBalance').textContent = (totalColl - totalExp).toFixed(2);
  }

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

  function renderMaintenanceList() {
    var records = getMaintenanceRecords();
    var query = (document.getElementById('maint-search').value || '').toLowerCase().trim();
    if (query) records = records.filter(function (r) { return r.flat.toLowerCase().indexOf(query) !== -1; });
    if (!records.length) {
      maintList.innerHTML = '<p class="text-gray-400">' + (query ? 'No matching records.' : 'No records yet.') + '</p>';
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
          launchReceipt(parseInt(el.dataset.index));
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

  function launchReceipt(index) {
    var records = getMaintenanceRecords();
    var record = records[index];
    if (!record) return;
    _currentId = index;
    _currentRecord = record;
    populateReceipt(record);

    var phone = record.mobile.replace(/\D/g, '');
    var msg = buildMsg(record);
    modalSmsBtn.onclick = function () {
      window.location.href = 'sms:' + phone + '?body=' + encodeURIComponent(msg);
    };
    modalWaBtn.onclick = function () {
      window.open('https://wa.me/91' + phone + '?text=' + encodeURIComponent(msg), '_blank');
    };

    receiptModal.classList.remove('hidden');
    receiptModal.classList.add('flex');
  }

  function buildMsg(record) {
    return 'Maintenance Receipt\n'
      + 'Member: ' + record.member + '\n'
      + 'Flat: ' + record.flat + '\n'
      + 'Amount: \u20B9' + Number(record.amount).toFixed(2) + '\n'
      + 'Date: ' + record.date + '\n'
      + 'Category: ' + record.category + '\n'
      + 'Mode: ' + record.mode;
  }

  formMain.addEventListener('submit', function (e) {
    e.preventDefault();
    var record = {
      member: document.getElementById('maintMember').value,
      flat: document.getElementById('maintFlat').value,
      mobile: document.getElementById('maintMobile').value,
      category: getCategoryValue(maintCategory, 'maintCategoryOther'),
      amount: parseFloat(document.getElementById('maintAmount').value),
      date: document.getElementById('maintDate').value,
      mode: document.getElementById('maintMode').value,
      timestamp: new Date().toISOString()
    };
    var records = addMaintenanceRecord(record);
    formMain.reset();
    maintOtherWrap.innerHTML = '';
    renderMaintenanceList();
    updateAnalytics();

    var newMaint = { id: records.length - 1 };
    launchReceipt(newMaint.id);

    var phone = record.mobile.replace(/\D/g, '');
    var msg = buildMsg(record);
    var waUri = 'https://api.whatsapp.com/send?phone=91' + phone + '&text=' + encodeURIComponent(msg);
    window.open(waUri, '_blank');
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
    updateAnalytics();
  });

  function populateReceipt(record) {
    var rows = [
      ['Member', record.member],
      ['Flat No', record.flat],
      ['Mobile No', record.mobile],
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
    launchReceipt(records.length - 1);
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

  document.getElementById('maint-search').addEventListener('input', renderMaintenanceList);

  document.getElementById('btnExportBackup').addEventListener('click', function () {
    var data = {
      sms_maintenance: getMaintenanceRecords(),
      sms_expenses: getExpenseRecords()
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'society_ledger_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.getElementById('btnImportBackup').addEventListener('click', function () {
    document.getElementById('fileImportBackup').click();
  });

  document.getElementById('fileImportBackup').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        if (data.sms_maintenance) setRecords(STORAGE_KEYS.MAINTENANCE, data.sms_maintenance);
        if (data.sms_expenses) setRecords(STORAGE_KEYS.EXPENSES, data.sms_expenses);
        renderMaintenanceList();
        renderExpenses();
        updateAnalytics();
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    this.value = '';
  });

  switchTab('maintenance');
  renderMaintenanceList();
  renderExpenses();
  updateAnalytics();
})();
