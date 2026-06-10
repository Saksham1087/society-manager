const STORAGE_KEYS = {
  MAINTENANCE: 'sms_maintenance',
  EXPENSES: 'sms_expenses'
};

function getRecords(key) {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setRecords(key, records) {
  localStorage.setItem(key, JSON.stringify(records));
}

function addRecord(key, record) {
  const records = getRecords(key);
  records.push(record);
  setRecords(key, records);
  return records;
}

function getMaintenanceRecords() {
  return getRecords(STORAGE_KEYS.MAINTENANCE);
}

function setMaintenanceRecords(records) {
  setRecords(STORAGE_KEYS.MAINTENANCE, records);
}

function addMaintenanceRecord(record) {
  return addRecord(STORAGE_KEYS.MAINTENANCE, record);
}

function getExpenseRecords() {
  return getRecords(STORAGE_KEYS.EXPENSES);
}

function setExpenseRecords(records) {
  setRecords(STORAGE_KEYS.EXPENSES, records);
}

function addExpenseRecord(record) {
  return addRecord(STORAGE_KEYS.EXPENSES, record);
}
