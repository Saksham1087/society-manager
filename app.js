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

  function renderMaintenance() {
    const records = getMaintenanceRecords();
    if (!records.length) {
      maintList.innerHTML = '<p class="text-gray-400">No records yet.</p>';
      return;
    }
    maintList.innerHTML = records.slice().reverse().map(function (r) {
      return '<div class="flex justify-between items-center bg-gray-50 rounded-lg p-3">' +
        '<div><span class="font-semibold text-gray-800">' + esc(r.wing) + '-' + esc(r.unit) + '</span> ' +
        '<span class="text-gray-600">' + esc(r.name) + '</span></div>' +
        '<div class="text-right"><span class="font-bold text-blue-700">₹' + Number(r.amount).toFixed(2) + '</span>' +
        '<br><span class="text-xs text-gray-400">' + esc(r.month) + ' ' + esc(r.year) + '</span></div></div>';
    }).join('');
  }

  function renderExpenses() {
    const records = getExpenseRecords();
    if (!records.length) {
      expenseList.innerHTML = '<p class="text-gray-400">No records yet.</p>';
      return;
    }
    expenseList.innerHTML = records.slice().reverse().map(function (r) {
      return '<div class="flex justify-between items-center bg-gray-50 rounded-lg p-3">' +
        '<div><span class="font-semibold text-gray-800">' + esc(r.category) + '</span> ' +
        '<span class="text-gray-600">' + esc(r.vendor) + '</span></div>' +
        '<div class="text-right"><span class="font-bold text-green-700">₹' + Number(r.amount).toFixed(2) + '</span>' +
        '<br><span class="text-xs text-gray-400">' + esc(r.date) + '</span></div></div>';
    }).join('');
  }

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  formMain.addEventListener('submit', function (e) {
    e.preventDefault();
    var record = {
      wing: document.getElementById('maintWing').value,
      unit: document.getElementById('maintUnit').value,
      name: document.getElementById('maintName').value,
      amount: parseFloat(document.getElementById('maintAmount').value),
      month: document.getElementById('maintMonth').value,
      year: document.getElementById('maintYear').value,
      mode: document.getElementById('maintMode').value,
      receipt: document.getElementById('maintReceipt').value,
      timestamp: new Date().toISOString()
    };
    addMaintenanceRecord(record);
    formMain.reset();
    renderMaintenance();
  });

  formExp.addEventListener('submit', function (e) {
    e.preventDefault();
    var record = {
      category: document.getElementById('expCategory').value,
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
    renderExpenses();
  });

  function populateReceipt(record) {
    var rows = [
      ['Wing', record.wing],
      ['Unit', record.unit],
      ['Owner', record.name],
      ['Amount', '₹' + Number(record.amount).toFixed(2)],
      ['Month', record.month],
      ['Year', record.year],
      ['Payment Mode', record.mode],
      ['Receipt No.', record.receipt]
    ];
    receiptBody.innerHTML = rows.map(function (pair) {
      return '<tr class="border-b border-gray-100"><td class="py-2 pr-4 font-medium text-gray-600">' +
        esc(pair[0]) + '</td><td class="py-2 text-right text-gray-800">' + esc(pair[1]) + '</td></tr>';
    }).join('');
  }

  btnViewReceipt.addEventListener('click', function () {
    var records = getMaintenanceRecords();
    if (!records.length) { alert('No maintenance records available.'); return; }
    populateReceipt(records[records.length - 1]);
    receiptModal.classList.remove('hidden');
    receiptModal.classList.add('flex');
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
