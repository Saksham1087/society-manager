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
    expenseList.innerHTML = records.slice().reverse().map(function (r, idx) {
      var i = records.length - 1 - idx;
      return '<div class="flex justify-between items-center bg-gray-50 rounded-lg p-3">' +
        '<div><span class="font-semibold text-gray-800">' + esc(r.category) + '</span> ' +
        '<span class="text-gray-600">' + esc(r.vendor) + '</span></div>' +
        '<div class="text-right"><span class="font-bold text-green-700">\u20B9' + Number(r.amount).toFixed(2) + '</span>' +
        '<br><span class="text-xs text-gray-400">' + esc(r.date) + '</span>' +
        '<br><button class="btn-voucher text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition mt-1" data-id="' + i + '">\uD83D\uDDA8\uFE0F Voucher</button></div></div>';
    }).join('');
    [].slice.call(expenseList.querySelectorAll('.btn-voucher')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        printExpenseVoucher(parseInt(this.dataset.id));
      });
    });
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

  document.getElementById('btn-export-csv').addEventListener('click', function () {
    var records = JSON.parse(localStorage.getItem('sms_maintenance')) || [];
    if (!records.length) { alert('No maintenance records to export.'); return; }
    alert('Preparing CSV export...');
    var csv = 'Date,Flat,Name,Mobile,Category,Mode,Amount\n';
    records.forEach(function (r) {
      var row = [r.date, r.flat, r.member, r.mobile, r.category, r.mode, r.amount].map(function (v) {
        var str = String(v == null ? '' : v);
        return '"' + str.replace(/"/g, '""') + '"';
      }).join(',');
      csv += row + '\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'society_maintenance_ledger.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('CSV export downloaded successfully!');
  });

  document.getElementById('btn-export-json').addEventListener('click', function () {
    alert('Preparing JSON backup...');
    var masterData = {
      maintenance: JSON.parse(localStorage.getItem('sms_maintenance')) || [],
      expenses: JSON.parse(localStorage.getItem('sms_expenses')) || [],
      defaulters: JSON.parse(localStorage.getItem('sms_defaulters')) || [],
      members: JSON.parse(localStorage.getItem('sms_members')) || []
    };
    var jsonStr = JSON.stringify(masterData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'society_master_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('JSON backup downloaded successfully!');
  });

  document.getElementById('btnExportBackup').addEventListener('click', function () {
    alert('Preparing JSON backup...');
    var masterData = {
      maintenance: JSON.parse(localStorage.getItem('sms_maintenance')) || [],
      expenses: JSON.parse(localStorage.getItem('sms_expenses')) || [],
      defaulters: JSON.parse(localStorage.getItem('sms_defaulters')) || [],
      members: JSON.parse(localStorage.getItem('sms_members')) || []
    };
    var jsonStr = JSON.stringify(masterData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'society_master_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('JSON backup downloaded successfully!');
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

  function renderWebsiteHeader() {
    var branding = document.getElementById('header-branding');
    if (!branding) return;
    var legalHeader = localStorage.getItem('sms_legal_header');
    branding.style.backgroundImage = 'none';
    branding.style.height = 'auto';
    branding.style.padding = '';
    if (legalHeader) {
      try {
        var h = JSON.parse(legalHeader);
        branding.innerHTML =
          '<div class="px-4 py-6 text-center">' +
            '<h1 class="text-2xl font-bold">' + esc(h.buildingName) + '</h1>' +
            '<p class="text-sm mt-1 opacity-80">Reg No: ' + esc(h.regNumber) + ' | Survey No: ' + esc(h.surveyNumber) +
            (h.hissaNumber ? ' | Hissa No: ' + esc(h.hissaNumber) : '') + '</p>' +
            '<hr class="border-white/30 my-2 max-w-xl mx-auto">' +
            '<p class="text-sm opacity-90">' + esc(h.address).replace(/\n/g, '<br>') + '</p>' +
          '</div>';
      } catch (e) {
        branding.innerHTML = '<div class="px-4 py-6 text-center"><h1 class="text-xl font-bold">Society Management System</h1></div>';
      }
    } else {
      branding.innerHTML = '<div class="px-4 py-6 text-center"><h1 class="text-xl font-bold">Society Management System</h1></div>';
    }
  }

  document.getElementById('btnToggleBranding').addEventListener('click', function () {
    var panel = document.getElementById('brandingPanel');
    panel.classList.toggle('hidden');
  });

  document.getElementById('form-branding').addEventListener('submit', function (e) {
    e.preventDefault();
    var buildingName = document.getElementById('brand-building').value.trim();
    var regNumber = document.getElementById('brand-reg').value.trim();
    var surveyNumber = document.getElementById('brand-survey').value.trim();
    var hissaNumber = document.getElementById('brand-hissa').value.trim();
    var address = document.getElementById('brand-address').value.trim();
    if (!buildingName || !regNumber || !surveyNumber || !address) {
      alert('Please fill all required fields.');
      return;
    }
    var data = { buildingName: buildingName, regNumber: regNumber, surveyNumber: surveyNumber, address: address };
    if (hissaNumber) data.hissaNumber = hissaNumber;
    localStorage.setItem('sms_legal_header', JSON.stringify(data));
    alert('Legal header generated successfully!');
    renderWebsiteHeader();
  });

  var voucherExpenseId = null;
  var _currentVoucherExpense = null;

  function printExpenseVoucher(id) {
    voucherExpenseId = id;
    var modal = document.getElementById('voucherModal');
    var setup = document.getElementById('voucher-setup');
    var printArea = document.getElementById('voucher-print-area');
    var logo = localStorage.getItem('sms_voucher_logo');
    var header = localStorage.getItem('sms_legal_header');
    if (logo || header) {
      setup.classList.add('hidden');
      printArea.classList.remove('hidden');
      renderVoucherPrint(id, logo, header);
    } else {
      setup.classList.remove('hidden');
      printArea.classList.add('hidden');
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function renderVoucherPrint(id, logo, header) {
    var records = getExpenseRecords();
    var exp = records[id];
    if (!exp) return;
    _currentVoucherExpense = exp;
    var html = '<div class="p-6" style="font-family: Arial, sans-serif; color: #000;">';
    if (logo) {
      html += '<div class="text-center mb-4"><img src="' + logo + '" style="max-height:100px; max-width:100%;" alt="Logo"></div>';
    } else if (header) {
      try {
        var h = JSON.parse(header);
        html += '<div class="text-center mb-4">' +
          '<h2 style="font-size:20px; font-weight:bold; margin:0;">' + esc(h.buildingName) + '</h2>' +
          '<p style="font-size:12px; margin:2px 0;">Reg No: ' + esc(h.regNumber) + ' | Survey No: ' + esc(h.surveyNumber) +
          (h.hissaNumber ? ' | Hissa No: ' + esc(h.hissaNumber) : '') + '</p>' +
          '<hr style="border: none; border-top: 1px solid #333; margin: 8px auto; max-width: 80%;">' +
          '<p style="font-size:11px; margin:2px 0;">' + esc(h.address).replace(/\n/g, '<br>') + '</p>' +
          '</div>';
      } catch (e) {}
    }
    html += '<h3 style="text-align:center; font-size:16px; margin:16px 0 12px; border-bottom:2px solid #333; padding-bottom:8px;">Expense Voucher</h3>';
    html += '<table style="width:100%; border-collapse: collapse; font-size:13px;">';
    html += '<tr><td style="padding:6px 8px; font-weight:bold; border:1px solid #999; width:35%;">Date</td><td style="padding:6px 8px; border:1px solid #999;">' + esc(exp.date) + '</td></tr>';
    html += '<tr><td style="padding:6px 8px; font-weight:bold; border:1px solid #999;">Category</td><td style="padding:6px 8px; border:1px solid #999;">' + esc(exp.category) + '</td></tr>';
    html += '<tr><td style="padding:6px 8px; font-weight:bold; border:1px solid #999;">Amount</td><td style="padding:6px 8px; border:1px solid #999;">\u20B9' + Number(exp.amount).toFixed(2) + '</td></tr>';
    html += '<tr><td style="padding:6px 8px; font-weight:bold; border:1px solid #999;">Payment Mode</td><td style="padding:6px 8px; border:1px solid #999;">' + esc(exp.mode) + '</td></tr>';
    html += '<tr><td style="padding:6px 8px; font-weight:bold; border:1px solid #999;">Vendor</td><td style="padding:6px 8px; border:1px solid #999;">' + esc(exp.vendor) + '</td></tr>';
    if (exp.billNo) html += '<tr><td style="padding:6px 8px; font-weight:bold; border:1px solid #999;">Bill / Ref No.</td><td style="padding:6px 8px; border:1px solid #999;">' + esc(exp.billNo) + '</td></tr>';
    if (exp.description) html += '<tr><td style="padding:6px 8px; font-weight:bold; border:1px solid #999;">Description</td><td style="padding:6px 8px; border:1px solid #999;">' + esc(exp.description) + '</td></tr>';
    html += '</table>';
    html += '<p style="text-align:right; font-size:11px; margin-top:16px; color:#555;">Generated by Society Management System</p>';
    html += '</div>';
    document.getElementById('voucher-content').innerHTML = html;
  }

  document.getElementById('voucher-logo-upload').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) === -1) {
      alert('Only JPEG, PNG, or WebP images are allowed.');
      this.value = ''; return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Error: Image file size must not exceed 5MB!');
      this.value = ''; return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      localStorage.setItem('sms_voucher_logo', e.target.result);
      document.getElementById('voucher-logo-upload').value = '';
      var modal = document.getElementById('voucherModal');
      document.getElementById('voucher-setup').classList.add('hidden');
      document.getElementById('voucher-print-area').classList.remove('hidden');
      renderVoucherPrint(voucherExpenseId, e.target.result, localStorage.getItem('sms_legal_header'));
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-use-header-details').addEventListener('click', function () {
    var header = localStorage.getItem('sms_legal_header');
    if (!header) {
      alert('No society header found. Please set up the branding form first.');
      return;
    }
    document.getElementById('voucher-setup').classList.add('hidden');
    document.getElementById('voucher-print-area').classList.remove('hidden');
    renderVoucherPrint(voucherExpenseId, null, header);
  });

  document.getElementById('btn-voucher-skip').addEventListener('click', function () {
    document.getElementById('voucher-setup').classList.add('hidden');
    document.getElementById('voucher-print-area').classList.remove('hidden');
    renderVoucherPrint(voucherExpenseId, null, null);
  });

  document.getElementById('btn-print-voucher').addEventListener('click', function () {
    window.print();
  });

  function buildVoucherShareMsg(exp) {
    var building = 'Society';
    try {
      var h = JSON.parse(localStorage.getItem('sms_legal_header'));
      if (h && h.buildingName) building = h.buildingName;
    } catch (e) {}
    return 'Expense Voucher Details -\nBuilding: ' + building + '\nDate: ' + exp.date + '\nCategory: ' + exp.category + '\nAmount: \u20B9' + Number(exp.amount).toFixed(2) + '\nPaid to: ' + exp.vendor + '\nMode: ' + exp.mode + '\nRef: ' + (exp.billNo || 'N/A') + '\nNotes: ' + (exp.description || 'N/A');
  }

  document.getElementById('btn-voucher-whatsapp').addEventListener('click', function () {
    if (!_currentVoucherExpense) return;
    var msg = buildVoucherShareMsg(_currentVoucherExpense);
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(msg), '_blank');
  });

  document.getElementById('btn-voucher-sms').addEventListener('click', function () {
    if (!_currentVoucherExpense) return;
    var msg = buildVoucherShareMsg(_currentVoucherExpense);
    window.location.href = 'sms:?body=' + encodeURIComponent(msg);
  });

  document.getElementById('btn-close-voucher').addEventListener('click', function () {
    var modal = document.getElementById('voucherModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  document.getElementById('btn-voucher-close-setup').addEventListener('click', function () {
    var modal = document.getElementById('voucherModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });

  document.getElementById('voucherModal').addEventListener('click', function (e) {
    if (e.target === this) {
      this.classList.add('hidden');
      this.classList.remove('flex');
    }
  });

  // ========== CLOUD SYNC CONFIGURATION ==========
  // Register your apps and replace these values:
  var CLOUD_CONFIG = {
    google: { clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', apiKey: 'YOUR_GOOGLE_API_KEY' },
    dropbox: { appKey: 'YOUR_DROPBOX_APP_KEY' },
    onedrive: { clientId: 'YOUR_ONEDRIVE_CLIENT_ID' }
  };

  // ========== HELPERS ==========
  function getBackupFilename() {
    var now = new Date();
    return 'society_manager_backup_' + now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') + '.json';
  }

  function exportDataPayload() {
    return JSON.stringify({
      sms_maintenance: JSON.parse(localStorage.getItem('sms_maintenance')) || [],
      sms_expenses: JSON.parse(localStorage.getItem('sms_expenses')) || [],
      sms_pending: JSON.parse(localStorage.getItem('sms_pending')) || [],
      sms_members: JSON.parse(localStorage.getItem('sms_members')) || []
    }, null, 2);
  }

  function importDataPayload(jsonStr) {
    try {
      var data = JSON.parse(jsonStr);
      var hasData = false;
      if (data.sms_maintenance) { setRecords(STORAGE_KEYS.MAINTENANCE, data.sms_maintenance); hasData = true; }
      if (data.sms_expenses) { setRecords(STORAGE_KEYS.EXPENSES, data.sms_expenses); hasData = true; }
      if (data.sms_pending) { setRecords(STORAGE_KEYS.PENDING, data.sms_pending); hasData = true; }
      if (data.sms_members) { setRecords(STORAGE_KEYS.MEMBERS, data.sms_members); hasData = true; }
      if (!hasData) { alert('Invalid backup file format.'); return false; }
      renderMaintenanceList(); renderExpenses(); renderPendingList();
      populateMemberDropdown(); renderMembersList(); updateAnalytics();
      return true;
    } catch (e) { alert('Restore error: ' + e.message); return false; }
  }

  function loadScript(url, cb) {
    var s = document.createElement('script'); s.src = url; s.onload = cb;
    document.head.appendChild(s);
  }

  // ========== PANEL TOGGLE ==========
  document.getElementById('btnToggleCloudSync').addEventListener('click', function () {
    document.getElementById('cloudSyncPanel').classList.toggle('hidden');
  });

  // ========== GOOGLE DRIVE ==========
  var gDriveToken = null;

  function initGIS(cb) {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) { if (cb) cb(); return; }
    loadScript('https://accounts.google.com/gsi/client', cb);
  }

  function gDriveAuth(cb) {
    initGIS(function () {
      if (gDriveToken) { if (cb) cb(gDriveToken); return; }
      var client = google.accounts.oauth2.initTokenClient({
        client_id: CLOUD_CONFIG.google.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: function (resp) {
          if (resp.access_token) { gDriveToken = resp.access_token; if (cb) cb(gDriveToken); }
          else { alert('Google Drive authorization failed.'); }
        }
      });
      client.requestAccessToken();
    });
  }

  function gDriveBackup() {
    gDriveAuth(function (token) {
      var payload = exportDataPayload();
      var filename = getBackupFilename();
      var boundary = 'boundary_' + Date.now();
      var body = '';
      body += '--' + boundary + '\r\n';
      body += 'Content-Type: application/json\r\n\r\n';
      body += JSON.stringify({ name: filename, mimeType: 'application/json' }) + '\r\n';
      body += '--' + boundary + '\r\n';
      body += 'Content-Type: application/json\r\n\r\n';
      body += payload + '\r\n';
      body += '--' + boundary + '--';
      fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/related; boundary=' + boundary },
        body: body
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.id) alert('\u2705 Google Drive backup saved as: ' + filename);
        else alert('\u274C Upload failed: ' + (res.error ? res.error.message : 'Unknown'));
      }).catch(function (err) { alert('\u274C Upload error: ' + err.message); });
    });
  }

  function gDriveRestore() {
    gDriveAuth(function (token) {
      fetch('https://www.googleapis.com/drive/v3/files?q=name+contains+%27society_manager_backup%27+and+mimeType%3D%27application%2Fjson%27&orderBy=createdTime+desc&fields=files(id%2Cname%2CcreatedTime)', {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(function (r) { return r.json(); }).then(function (data) {
        var files = data.files || [];
        if (!files.length) { alert('No backup files found in Google Drive.'); return; }
        var file = files[0];
        if (files.length > 1) {
          var choice = prompt('Multiple backups found. Enter the number (1 = most recent):\n' +
            files.map(function (f, i) { return (i + 1) + '. ' + f.name + ' (' + f.createdTime + ')'; }).join('\n'), '1');
          var idx = parseInt(choice) - 1;
          if (idx >= 0 && idx < files.length) file = files[idx];
        }
        return fetch('https://www.googleapis.com/drive/v3/files/' + file.id + '?alt=media', {
          headers: { 'Authorization': 'Bearer ' + token }
        }).then(function (r) { return r.text(); });
      }).then(function (content) {
        if (content && importDataPayload(content)) alert('\u2705 Backup restored from Google Drive successfully!');
      }).catch(function (err) { alert('\u274C Restore error: ' + err.message); });
    });
  }

  // ========== DROPBOX ==========
  var dropboxToken = localStorage.getItem('sms_dropbox_access_token') || null;

  function dropboxRedirect(mode) {
    var redirectUri = window.location.origin + window.location.pathname;
    sessionStorage.setItem('sms_dbx_mode', mode);
    window.location.href = 'https://www.dropbox.com/oauth2/authorize?client_id=' + CLOUD_CONFIG.dropbox.appKey +
      '&response_type=token&redirect_uri=' + encodeURIComponent(redirectUri);
  }

  function doDropboxUpload() {
    var payload = exportDataPayload();
    var filename = getBackupFilename();
    var dbx = new Dropbox.Dropbox({ accessToken: dropboxToken, fetch: fetch });
    dbx.filesUpload({ path: '/' + filename, contents: payload, mode: 'add', autorename: true })
      .then(function () { alert('\u2705 Dropbox backup saved as: ' + filename); })
      .catch(function (err) { alert('\u274C Dropbox upload error: ' + (err.error && err.error.error ? err.error.error.summary : err.message)); });
  }

  function doDropboxDownload(filePath) {
    var dbx = new Dropbox.Dropbox({ accessToken: dropboxToken, fetch: fetch });
    dbx.filesDownload({ path: filePath })
      .then(function (resp) {
        var reader = new FileReader();
        reader.onload = function () { if (importDataPayload(reader.result)) alert('\u2705 Backup restored from Dropbox successfully!'); };
        reader.readAsText(resp.fileBlob);
      })
      .catch(function (err) { alert('\u274C Dropbox download error: ' + (err.error && err.error.error ? err.error.error.summary : err.message)); });
  }

  function dropboxBackup() {
    if (dropboxToken) { doDropboxUpload(); return; }
    loadScript('https://unpkg.com/dropbox@10.34.0/dist/Dropbox-sdk.min.js', function () {
      dropboxRedirect('backup');
    });
  }

  function dropboxRestore() {
    if (!dropboxToken) {
      loadScript('https://unpkg.com/dropbox@10.34.0/dist/Dropbox-sdk.min.js', function () {
        dropboxRedirect('restore');
      });
      return;
    }
    loadScript('https://unpkg.com/dropbox@10.34.0/dist/Dropbox-sdk.min.js', function () {
      var dbx = new Dropbox.Dropbox({ accessToken: dropboxToken, fetch: fetch });
      dbx.filesListFolder({ path: '', query: 'society_manager_backup' })
        .then(function (resp) {
          var entries = resp.entries.filter(function (e) { return e.name.indexOf('society_manager_backup') !== -1; });
          if (!entries.length) { alert('No backup files found in Dropbox.'); return; }
          var entry = entries[0];
          if (entries.length > 1) {
            var choice = prompt('Multiple backups found. Enter the number (1 = most recent):\n' +
              entries.map(function (e, i) { return (i + 1) + '. ' + e.name + ' (' + e.client_modified + ')'; }).join('\n'), '1');
            var idx = parseInt(choice) - 1;
            if (idx >= 0 && idx < entries.length) entry = entries[idx];
          }
          doDropboxDownload(entry.path_lower);
        })
        .catch(function (err) { alert('\u274C Dropbox list error: ' + (err.error && err.error.error ? err.error.error.summary : err.message)); });
    });
  }

  // ========== ONEDRIVE ==========
  var odriveToken = null;

  function odriveRedirect(mode) {
    var redirectUri = window.location.origin + window.location.pathname;
    var nonce = Date.now();
    sessionStorage.setItem('sms_odrive_mode', mode);
    window.location.href = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=' +
      CLOUD_CONFIG.onedrive.clientId + '&response_type=token&scope=Files.ReadWrite%20offline_access&redirect_uri=' +
      encodeURIComponent(redirectUri) + '&nonce=' + nonce;
  }

  function odriveUpload() {
    var payload = exportDataPayload();
    var filename = getBackupFilename();
    fetch('https://graph.microsoft.com/v1.0/me/drive/root:/' + filename + ':/content', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + odriveToken, 'Content-Type': 'application/json' },
      body: payload
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.id) alert('\u2705 OneDrive backup saved as: ' + filename);
      else alert('\u274C OneDrive upload failed: ' + (res.error ? res.error.message : 'Unknown'));
    }).catch(function (err) { alert('\u274C OneDrive upload error: ' + err.message); });
  }

  function odriveRestore() {
    fetch('https://graph.microsoft.com/v1.0/me/drive/root/search(q=%27society_manager_backup%27)?$select=id,name,createdDateTime', {
      headers: { 'Authorization': 'Bearer ' + odriveToken }
    }).then(function (r) { return r.json(); }).then(function (data) {
      var files = data.value || [];
      if (!files.length) { alert('No backup files found in OneDrive.'); return; }
      var file = files[0];
      if (files.length > 1) {
        var choice = prompt('Multiple backups found. Enter number (1 = most recent):\n' +
          files.map(function (f, i) { return (i + 1) + '. ' + f.name + ' (' + f.createdDateTime + ')'; }).join('\n'), '1');
        var idx = parseInt(choice) - 1;
        if (idx >= 0 && idx < files.length) file = files[idx];
      }
      return fetch('https://graph.microsoft.com/v1.0/me/drive/items/' + file.id + '/content', {
        headers: { 'Authorization': 'Bearer ' + odriveToken }
      }).then(function (r) { return r.text(); });
    }).then(function (content) {
      if (content && importDataPayload(content)) alert('\u2705 Backup restored from OneDrive successfully!');
    }).catch(function (err) { alert('\u274C OneDrive restore error: ' + err.message); });
  }

  // ========== BUTTON HANDLERS ==========
  document.getElementById('btn-backup-gdrive').addEventListener('click', gDriveBackup);
  document.getElementById('btn-restore-gdrive').addEventListener('click', gDriveRestore);
  document.getElementById('btn-backup-dropbox').addEventListener('click', dropboxBackup);
  document.getElementById('btn-restore-dropbox').addEventListener('click', dropboxRestore);
  document.getElementById('btn-backup-onedrive').addEventListener('click', function () {
    if (odriveToken) { odriveUpload(); return; }
    odriveRedirect('backup');
  });
  document.getElementById('btn-restore-onedrive').addEventListener('click', function () {
    if (!odriveToken) { odriveRedirect('restore'); return; }
    odriveRestore();
  });

  // ========== OAUTH REDIRECT HANDLER (Dropbox & OneDrive) ==========
  (function handleOAuthRedirect() {
    var hash = window.location.hash;
    if (hash.indexOf('access_token=') !== -1) {
      var params = {};
      hash.replace(/[?&]+([^=&]+)=([^&]*)/g, function (m, k, v) { params[k] = decodeURIComponent(v); });
      if (params.access_token) {
        var dbxMode = sessionStorage.getItem('sms_dbx_mode');
        var odMode = sessionStorage.getItem('sms_odrive_mode');
        if (dbxMode) {
          sessionStorage.removeItem('sms_dbx_mode');
          dropboxToken = params.access_token;
          localStorage.setItem('sms_dropbox_access_token', params.access_token);
          loadScript('https://unpkg.com/dropbox@10.34.0/dist/Dropbox-sdk.min.js', function () {
            if (dbxMode === 'backup') doDropboxUpload();
            else if (dbxMode === 'restore') dropboxRestore();
          });
        } else if (odMode) {
          sessionStorage.removeItem('sms_odrive_mode');
          odriveToken = params.access_token;
          if (odMode === 'backup') odriveUpload();
          else if (odMode === 'restore') odriveRestore();
        }
        // Clean URL
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  })();

  renderWebsiteHeader();
  populateMemberDropdown();
  renderMembersList();
  switchTab('maintenance');
  renderMaintenanceList();
  renderExpenses();
  renderPendingList();
  updateAnalytics();
})();
