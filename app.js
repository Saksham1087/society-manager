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
    var customBanner = localStorage.getItem('sms_custom_banner');
    var legalHeader = localStorage.getItem('sms_legal_header');
    if (customBanner) {
      branding.innerHTML = '';
      branding.style.backgroundImage = 'url(' + customBanner + ')';
      branding.style.backgroundSize = 'cover';
      branding.style.backgroundPosition = 'center';
      branding.style.backgroundRepeat = 'no-repeat';
      branding.style.height = '400px';
      branding.style.padding = '0';
    } else if (legalHeader) {
      try {
        var h = JSON.parse(legalHeader);
        branding.style.backgroundImage = 'none';
        branding.style.height = 'auto';
        branding.style.padding = '';
        branding.innerHTML =
          '<div class="px-4 py-6 text-center">' +
            '<h1 class="text-2xl font-bold">' + esc(h.buildingName) + '</h1>' +
            '<p class="text-sm mt-1 opacity-80">Reg No: ' + esc(h.regNumber) + ' | Survey No: ' + esc(h.surveyNumber) +
            (h.hissaNumber ? ' | Hissa No: ' + esc(h.hissaNumber) : '') + '</p>' +
            '<hr class="border-white/30 my-2 max-w-xl mx-auto">' +
            '<p class="text-sm opacity-90">' + esc(h.address).replace(/\n/g, '<br>') + '</p>' +
          '</div>';
      } catch (e) {
        branding.innerHTML = '';
        branding.style.backgroundImage = 'none';
        branding.style.height = 'auto';
      }
    } else {
      branding.innerHTML = '';
      branding.style.backgroundImage = 'none';
      branding.style.height = 'auto';
      branding.style.padding = '';
    }
  }

  function switchBrandTab(tab) {
    var imgPanel = document.getElementById('brand-tab-img');
    var formPanel = document.getElementById('brand-tab-form');
    var imgBtn = document.getElementById('btn-brand-tab-img');
    var formBtn = document.getElementById('btn-brand-tab-form');
    if (!imgPanel || !formPanel) return;
    imgPanel.classList.toggle('hidden', tab !== 'img');
    formPanel.classList.toggle('hidden', tab !== 'form');
    [imgBtn, formBtn].forEach(function (btn) {
      btn.classList.remove('bg-blue-600', 'text-white', 'bg-gray-200', 'dark:bg-slate-600', 'text-gray-700', 'dark:text-gray-200');
    });
    if (tab === 'img') {
      imgBtn.classList.add('bg-blue-600', 'text-white');
      formBtn.classList.add('bg-gray-200', 'dark:bg-slate-600', 'text-gray-700', 'dark:text-gray-200');
    } else {
      formBtn.classList.add('bg-blue-600', 'text-white');
      imgBtn.classList.add('bg-gray-200', 'dark:bg-slate-600', 'text-gray-700', 'dark:text-gray-200');
    }
  }

  document.getElementById('btnToggleBranding').addEventListener('click', function () {
    var panel = document.getElementById('brandingPanel');
    panel.classList.toggle('hidden');
  });

  document.getElementById('btn-brand-tab-img').addEventListener('click', function () { switchBrandTab('img'); });
  document.getElementById('btn-brand-tab-form').addEventListener('click', function () { switchBrandTab('form'); });

  document.getElementById('banner-upload').addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB. Please upload a smaller image.');
      this.value = ''; return;
    }
    if (['image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) === -1) {
      alert('Only JPEG, PNG, or WebP images are allowed.');
      this.value = ''; return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var ratio = img.width / img.height;
        if (Math.abs(ratio - 4.8) > 0.1) {
          alert('Invalid dimensions. Image must be 1920x400px (4.8:1 ratio). Got ' + img.width + 'x' + img.height + '.');
          document.getElementById('banner-upload').value = ''; return;
        }
        localStorage.setItem('sms_custom_banner', e.target.result);
        localStorage.removeItem('sms_legal_header');
        alert('Banner uploaded successfully!');
        document.getElementById('banner-upload').value = '';
        renderWebsiteHeader();
      };
      img.onerror = function () {
        alert('Failed to load image. Please try another file.');
        document.getElementById('banner-upload').value = '';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
    localStorage.removeItem('sms_custom_banner');
    alert('Legal header generated successfully!');
    renderWebsiteHeader();
  });

  renderWebsiteHeader();
  populateMemberDropdown();
  renderMembersList();
  switchTab('maintenance');
  renderMaintenanceList();
  renderExpenses();
  renderPendingList();
  updateAnalytics();
})();
