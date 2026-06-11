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

  const tabPend = document.getElementById('tabPending');
  const modulePend = document.getElementById('modulePending');
  const formPend = document.getElementById('formPending');
  const pendCategory = document.getElementById('pendCategory');
  const pendOtherWrap = document.getElementById('pend-other-wrap');

  const tabMembers = document.getElementById('tabMembers');
  const moduleMembers = document.getElementById('moduleMembers');
  const formMember = document.getElementById('form-member');
  const maintFlat = document.getElementById('maint-flat');

  const modalSmsBtn = document.getElementById('modal-sms-btn');
  const modalWaBtn = document.getElementById('modal-wa-btn');
  var _currentId = null;
  var _currentRecord = null;

  var themeToggle = document.getElementById('btnThemeToggle');
  var htmlEl = document.documentElement;
  function setTheme(theme) {
    if (theme === 'dark') { htmlEl.classList.add('dark'); themeToggle.textContent = '\u2600\uFE0F'; }
    else { htmlEl.classList.remove('dark'); themeToggle.textContent = '\uD83C\uDF19'; }
    localStorage.setItem('sms_theme', theme);
  }
  setTheme(localStorage.getItem('sms_theme') || 'light');
  themeToggle.addEventListener('click', function () { setTheme(htmlEl.classList.contains('dark') ? 'light' : 'dark'); });

  const OTHER_CATEGORIES = [
    { select: maintCategory, wrap: maintOtherWrap, inputId: 'maintCategoryOther' },
    { select: expCategory, wrap: expOtherWrap, inputId: 'expCategoryOther' },
    { select: pendCategory, wrap: pendOtherWrap, inputId: 'pendCategoryOther' }
  ];

  function getOpeningBalance() {
    return parseFloat(localStorage.getItem('sms_opening_balance')) || 0;
  }

  function updateAnalytics() {
    var maintRecords = getMaintenanceRecords();
    var expRecords = getExpenseRecords();
    var totalColl = 0, totalExp = 0;
    for (var i = 0; i < maintRecords.length; i++) totalColl += Number(maintRecords[i].amount) || 0;
    for (var i = 0; i < expRecords.length; i++) totalExp += Number(expRecords[i].amount) || 0;
    var opening = getOpeningBalance();
    document.getElementById('totalCollections').textContent = totalColl.toFixed(2);
    document.getElementById('totalExpenses').textContent = totalExp.toFixed(2);
    document.getElementById('netBalance').textContent = (opening + totalColl - totalExp).toFixed(2);
  }

  function switchTab(active) {
    var isMaint = active === 'maintenance';
    var isExp = active === 'expenses';
    var isPend = active === 'pending';
    var isMem = active === 'members';
    tabMain.classList.toggle('bg-blue-700', isMaint);
    tabMain.classList.toggle('text-white', isMaint);
    tabMain.classList.toggle('bg-white', !isMaint);
    tabMain.classList.toggle('text-gray-700', !isMaint);
    tabMain.setAttribute('aria-selected', isMaint);
    tabExp.classList.toggle('bg-green-700', isExp);
    tabExp.classList.toggle('text-white', isExp);
    tabExp.classList.toggle('bg-white', !isExp);
    tabExp.classList.toggle('text-gray-700', !isExp);
    tabExp.setAttribute('aria-selected', isExp);
    tabPend.classList.toggle('bg-amber-600', isPend);
    tabPend.classList.toggle('text-white', isPend);
    tabPend.classList.toggle('bg-white', !isPend);
    tabPend.classList.toggle('text-gray-700', !isPend);
    tabPend.setAttribute('aria-selected', isPend);
    tabMembers.classList.toggle('bg-purple-600', isMem);
    tabMembers.classList.toggle('text-white', isMem);
    tabMembers.classList.toggle('bg-white', !isMem);
    tabMembers.classList.toggle('text-gray-700', !isMem);
    tabMembers.setAttribute('aria-selected', isMem);
    moduleMain.classList.toggle('hidden', !isMaint);
    moduleExp.classList.toggle('hidden', !isExp);
    modulePend.classList.toggle('hidden', !isPend);
    moduleMembers.classList.toggle('hidden', !isMem);
  }

  tabMain.addEventListener('click', function () { switchTab('maintenance'); });
  tabExp.addEventListener('click', function () { switchTab('expenses'); });
  tabPend.addEventListener('click', function () { switchTab('pending'); });
  tabMembers.addEventListener('click', function () { switchTab('members'); });

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

  var maintFilter = 'all';
  var expFilter = 'all';

  function applyDateFilter(records, filter) {
    if (filter === 'all') return records;
    var now = new Date();
    if (filter === 'today') {
      var y = now.getFullYear();
      var m = String(now.getMonth() + 1).padStart(2, '0');
      var d = String(now.getDate()).padStart(2, '0');
      var todayStr = y + '-' + m + '-' + d;
      return records.filter(function (r) { return r.date === todayStr; });
    }
    if (filter === 'month') {
      var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      return records.filter(function (r) { return r.date && r.date.indexOf(ym) === 0; });
    }
    return records;
  }

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderMaintenanceList() {
    var records = getMaintenanceRecords();
    records = applyDateFilter(records, maintFilter);
    var query = (document.getElementById('maint-search').value || '').toLowerCase().trim();
    if (query) records = records.filter(function (r) {
      var readableDate = r.date ? new Date(r.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toLowerCase() : '';
      return (r.flat || '').toLowerCase().indexOf(query) !== -1
        || (r.member || '').toLowerCase().indexOf(query) !== -1
        || (r.mobile || '').toLowerCase().indexOf(query) !== -1
        || (r.category || '').toLowerCase().indexOf(query) !== -1
        || (r.mode || '').toLowerCase().indexOf(query) !== -1
        || (r.date || '').indexOf(query) !== -1
        || readableDate.indexOf(query) !== -1
        || String(r.amount || '').indexOf(query) !== -1;
    });
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
    records = applyDateFilter(records, expFilter);
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

  function renderPendingList() {
    var records = getPendingRecords();
    var total = 0;
    for (var i = 0; i < records.length; i++) total += Number(records[i].amount) || 0;
    document.getElementById('totalPending').textContent = 'Total: \u20B9' + total.toFixed(2);
    if (!records.length) {
      document.getElementById('list-pending').innerHTML = '<p class="text-gray-400">No records yet.</p>';
      return;
    }
    document.getElementById('list-pending').innerHTML = records.slice().reverse().map(function (r, idx) {
      var i = records.length - 1 - idx;
      return '<div class="flex justify-between items-center bg-gray-50 rounded-lg p-3">' +
        '<div><span class="font-semibold text-gray-800">' + esc(r.member) + '</span> ' +
        '<span class="text-gray-600">' + esc(r.flat) + '</span>' +
        '<br><span class="text-xs text-gray-400">Due: ' + esc(r.date) + ' | ' + esc(r.category) + '</span></div>' +
        '<div class="text-right"><span class="font-bold text-red-600">\u20B9' + Number(r.amount).toFixed(2) + '</span>' +
        '<br><button class="btn-send-reminder text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition mt-1" data-index="' + i + '">\uD83D\uDD14 Send Reminder</button></div></div>';
    }).join('');
    [].slice.call(document.querySelectorAll('.btn-send-reminder')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(this.dataset.index);
        var recs = getPendingRecords();
        var r = recs[idx];
        if (!r) return;
        var msg = 'Reminder: Dear Resident, an outstanding balance of Rs. ' + Number(r.amount).toFixed(2) + ' is pending against your unit for ' + r.category + '. Kindly clear it at your earliest convenience. Thank you.';
        var phone = (r.mobile || '').replace(/\D/g, '');
        window.open('https://wa.me/91' + phone + '?text=' + encodeURIComponent(msg), '_blank');
      });
    });
  }

  function populateMemberDropdown() {
    var members = JSON.parse(localStorage.getItem('sms_members')) || [];
    maintFlat.innerHTML = '<option value="">Select Flat</option>';
    members.forEach(function (m) {
      var opt = document.createElement('option');
      opt.value = m.flat;
      opt.textContent = m.flat + (m.name ? ' - ' + m.name : '');
      maintFlat.appendChild(opt);
    });
  }

  function removeMember(id) {
    var members = JSON.parse(localStorage.getItem('sms_members')) || [];
    members = members.filter(function (m) { return m.id !== id; });
    localStorage.setItem('sms_members', JSON.stringify(members));
    populateMemberDropdown();
    renderMembersList();
  }

  function renderMembersList() {
    var members = JSON.parse(localStorage.getItem('sms_members')) || [];
    var el = document.getElementById('list-members');
    if (!el) return;
    if (!members.length) {
      el.innerHTML = '<p class="text-sm text-gray-400 italic text-center py-4">No members registered yet.</p>';
      return;
    }
    el.innerHTML = '';
    members.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3';
      row.innerHTML =
        '<div>' +
          '<span class="font-semibold text-gray-800 dark:text-white">' + esc(m.name) + '</span> ' +
          '<span class="text-gray-600 dark:text-gray-300">' + esc(m.flat) + '</span>' +
          '<br><span class="text-xs text-gray-400 dark:text-gray-400">' + esc(m.phone) + '</span>' +
        '</div>' +
        '<button class="btn-delete-member text-xs bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-700 dark:text-red-300 px-3 py-1.5 rounded transition font-medium">Delete</button>';
      var delBtn = row.querySelector('.btn-delete-member');
      delBtn.addEventListener('click', function () {
        if (confirm('Remove ' + m.name + ' from the member list?')) {
          removeMember(m.id);
        }
      });
      el.appendChild(row);
    });
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

  document.getElementById('maint-flat').addEventListener('change', function () {
    var members = JSON.parse(localStorage.getItem('sms_members')) || [];
    var selected = null;
    for (var i = 0; i < members.length; i++) {
      if (members[i].flat === this.value) { selected = members[i]; break; }
    }
    document.getElementById('maint-name').value = selected ? selected.name : '';
    document.getElementById('maint-phone').value = selected ? selected.phone : '';
  });

  formMain.addEventListener('submit', function (e) {
    e.preventDefault();
    var record = {
      member: document.getElementById('maint-name').value,
      flat: document.getElementById('maint-flat').value,
      mobile: document.getElementById('maint-phone').value,
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

  formPend.addEventListener('submit', function (e) {
    e.preventDefault();
    var record = {
      flat: document.getElementById('pendFlat').value,
      member: document.getElementById('pendMember').value,
      mobile: document.getElementById('pendMobile').value,
      category: getCategoryValue(pendCategory, 'pendCategoryOther'),
      amount: parseFloat(document.getElementById('pendAmount').value),
      date: document.getElementById('pendDate').value,
      timestamp: new Date().toISOString()
    };
    addPendingRecord(record);
    formPend.reset();
    pendOtherWrap.innerHTML = '';
    renderPendingList();
  });

  if (formMember) {
    formMember.addEventListener("submit", function(e) {
      e.preventDefault();
      var name = document.getElementById("member-name").value.trim();
      var flat = document.getElementById("member-flat").value.trim().toUpperCase();
      var phone = document.getElementById("member-phone").value.trim();
      if (!name || !flat || !phone) {
        alert("Please fill all member fields!");
        return;
      }
      var members = JSON.parse(localStorage.getItem("sms_members")) || [];
      if (members.some(function(m) { return m.flat === flat; })) {
        alert("This Flat Number is already registered!");
        return;
      }
      members.push({ id: Date.now(), name: name, flat: flat, phone: phone });
      localStorage.setItem("sms_members", JSON.stringify(members));
      formMember.reset();
      renderMembersList();
      if (typeof populateMemberDropdown === "function") populateMemberDropdown();
    });
  }

  function populateReceipt(record) {
    document.getElementById('rcpt-name').textContent = record.member;
    document.getElementById('rcpt-flat').textContent = record.flat;
    document.getElementById('rcpt-mobile').textContent = record.mobile;
    document.getElementById('rcpt-category').textContent = record.category;
    document.getElementById('rcpt-amount').textContent = '\u20B9' + Number(record.amount).toFixed(2);
    document.getElementById('rcpt-date').textContent = record.date;
    document.getElementById('rcpt-mode').textContent = record.mode;
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

  document.getElementById('maint-date-picker').addEventListener('change', function () {
    if (this.value) {
      document.getElementById('maint-search').value = this.value;
      renderMaintenanceList();
    }
  });

  var currentExportType = null;

  function downloadJson(data, filename) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadCsv(csv, filename) {
    if (!csv) { alert('No data to export.'); return; }
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toCsvRow(values) {
    return values.map(function (v) {
      var str = String(v == null ? '' : v);
      return '"' + str.replace(/"/g, '""') + '"';
    }).join(',') + '\n';
  }

  function showExportModal(type) {
    currentExportType = type;
    var modal = document.getElementById('export-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function hideExportModal() {
    var modal = document.getElementById('export-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentExportType = null;
  }

  function performExport(btnId) {
    var type = currentExportType;
    hideExportModal();
    if (!type) return;

    var isAll = btnId === 'btn-exp-all';

    if (type === 'json') {
      var data, filename;
      if (isAll) {
        data = {
          sms_maintenance: getMaintenanceRecords(),
          sms_expenses: getExpenseRecords(),
          sms_pending: getPendingRecords(),
          sms_members: getMemberRecords()
        };
        filename = 'society_complete_master_backup.json';
      } else {
        var jsonMap = {
          'btn-exp-maint': { key: 'sms_maintenance', getter: getMaintenanceRecords, label: 'maintenance' },
          'btn-exp-exp':   { key: 'sms_expenses',   getter: getExpenseRecords,   label: 'expenses' },
          'btn-exp-def':   { key: 'sms_pending',     getter: getPendingRecords,   label: 'defaulters' },
          'btn-exp-mem':   { key: 'sms_members',     getter: getMemberRecords,    label: 'members' }
        };
        var cfg = jsonMap[btnId];
        if (!cfg) return;
        data = {};
        data[cfg.key] = cfg.getter();
        filename = 'society_' + cfg.label + '_backup.json';
      }
      downloadJson(data, filename);

    } else if (type === 'csv') {
      var csvMap = {
        'btn-exp-maint': {
          getter: getMaintenanceRecords,
          headers: ['Date', 'Flat', 'Name', 'Mobile', 'Category', 'Mode', 'Amount'],
          fields: ['date', 'flat', 'member', 'mobile', 'category', 'mode', 'amount'],
          filename: 'society_maintenance_ledger.csv'
        },
        'btn-exp-exp': {
          getter: getExpenseRecords,
          headers: ['Date', 'Category', 'Amount', 'Vendor', 'Mode', 'Bill No', 'Description'],
          fields: ['date', 'category', 'amount', 'vendor', 'mode', 'billNo', 'description'],
          filename: 'society_expenses_ledger.csv'
        },
        'btn-exp-def': {
          getter: getPendingRecords,
          headers: ['Date', 'Flat', 'Name', 'Mobile', 'Category', 'Amount'],
          fields: ['date', 'flat', 'member', 'mobile', 'category', 'amount'],
          filename: 'society_defaulters_ledger.csv'
        },
        'btn-exp-mem': {
          getter: function () { return JSON.parse(localStorage.getItem('sms_members')) || []; },
          headers: ['Name', 'Flat', 'Mobile No'],
          fields: ['name', 'flat', 'phone'],
          filename: 'society_members_directory.csv'
        },
        'btn-exp-all': {
          getter: getMaintenanceRecords,
          headers: ['Date', 'Flat', 'Name', 'Mobile', 'Category', 'Mode', 'Amount'],
          fields: ['date', 'flat', 'member', 'mobile', 'category', 'mode', 'amount'],
          filename: 'society_complete_ledger.csv'
        }
      };
      var cfg = csvMap[btnId];
      if (!cfg) return;
      var records = cfg.getter();
      if (!records.length) { alert('No records to export.'); return; }
      var csv = toCsvRow(cfg.headers);
      records.forEach(function (r) {
        var values = cfg.fields.map(function (f) { return r[f]; });
        csv += toCsvRow(values);
      });
      downloadCsv(csv, cfg.filename);
    }
  }

  document.getElementById('btnExportCsv').addEventListener('click', function () {
    showExportModal('csv');
  });

  document.getElementById('btnBackupJson').addEventListener('click', function () {
    showExportModal('json');
  });

  document.getElementById('btnExportBackup').addEventListener('click', function () {
    showExportModal('json');
  });

  document.getElementById('btn-exp-maint').addEventListener('click', function () { performExport('btn-exp-maint'); });
  document.getElementById('btn-exp-exp').addEventListener('click', function () { performExport('btn-exp-exp'); });
  document.getElementById('btn-exp-def').addEventListener('click', function () { performExport('btn-exp-def'); });
  document.getElementById('btn-exp-mem').addEventListener('click', function () { performExport('btn-exp-mem'); });
  document.getElementById('btn-exp-all').addEventListener('click', function () { performExport('btn-exp-all'); });
  document.getElementById('btn-exp-cancel').addEventListener('click', hideExportModal);

  document.getElementById('export-modal').addEventListener('click', function (e) {
    if (e.target === this) hideExportModal();
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
        if (data.sms_pending) setRecords(STORAGE_KEYS.PENDING, data.sms_pending);
        if (data.sms_members) setRecords(STORAGE_KEYS.MEMBERS, data.sms_members);
        renderMaintenanceList();
        renderExpenses();
        renderPendingList();
        populateMemberDropdown();
        renderMembersList();
        updateAnalytics();
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    this.value = '';
  });

  document.getElementById('btnRestoreBackup').addEventListener('click', function () {
    document.getElementById('fileImportBackup').click();
  });

  var openingInput = document.getElementById('previous-closing-balance');
  openingInput.value = getOpeningBalance().toFixed(2);

  document.getElementById('btnToggleSettings').addEventListener('click', function () {
    var panel = document.getElementById('settingsPanel');
    panel.classList.toggle('hidden');
  });

  document.getElementById('btnSaveOpeningBalance').addEventListener('click', function () {
    var val = parseFloat(openingInput.value);
    if (isNaN(val)) { alert('Enter a valid number.'); return; }
    localStorage.setItem('sms_opening_balance', val);
    openingInput.value = val.toFixed(2);
    updateAnalytics();
  });

  document.getElementById('btnResetCache').addEventListener('click', function () {
    if (confirm('⚠️ Are you sure you want to reset all app data? This will permanently delete all records.')) {
      localStorage.clear();
      location.reload();
    }
  });

  function setActiveFilter(btnGroup, activeId) {
    var btns = document.querySelectorAll('.' + btnGroup);
    btns.forEach(function (b) { b.classList.remove('bg-blue-700', 'bg-green-700', 'text-white'); b.classList.add('bg-gray-200', 'text-gray-700'); });
    var active = document.getElementById(activeId);
    if (active) { active.classList.remove('bg-gray-200', 'text-gray-700'); active.classList.add(activeId.indexOf('Maint') !== -1 ? 'bg-blue-700' : 'bg-green-700', 'text-white'); }
  }

  document.getElementById('btnMaintFilterAll').addEventListener('click', function () { maintFilter = 'all'; setActiveFilter('maint-filter', 'btnMaintFilterAll'); renderMaintenanceList(); });
  document.getElementById('btnMaintFilterToday').addEventListener('click', function () { maintFilter = 'today'; setActiveFilter('maint-filter', 'btnMaintFilterToday'); renderMaintenanceList(); });
  document.getElementById('btnMaintFilterMonth').addEventListener('click', function () { maintFilter = 'month'; setActiveFilter('maint-filter', 'btnMaintFilterMonth'); renderMaintenanceList(); });
  document.getElementById('btnExpFilterAll').addEventListener('click', function () { expFilter = 'all'; setActiveFilter('exp-filter', 'btnExpFilterAll'); renderExpenses(); });
  document.getElementById('btnExpFilterToday').addEventListener('click', function () { expFilter = 'today'; setActiveFilter('exp-filter', 'btnExpFilterToday'); renderExpenses(); });
  document.getElementById('btnExpFilterMonth').addEventListener('click', function () { expFilter = 'month'; setActiveFilter('exp-filter', 'btnExpFilterMonth'); renderExpenses(); });

  populateMemberDropdown();
  renderMembersList();
  switchTab('maintenance');
  renderMaintenanceList();
  renderExpenses();
  renderPendingList();
  updateAnalytics();
})();
