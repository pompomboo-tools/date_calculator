'use strict';

const form = document.getElementById('dateForm');
const baseDateInput = document.getElementById('baseDate');
const baseDatePicker = document.getElementById('baseDatePicker');
const baseDateError = document.getElementById('baseDateError');

const endDateInput = document.getElementById('endDate');
const endDatePicker = document.getElementById('endDatePicker');
const endDateError = document.getElementById('endDateError');

const amountInput = document.getElementById('amount');
const unitInput = document.getElementById('unit');
const amountError = document.getElementById('amountError');
const resultDate = document.getElementById('resultDate');
const resultDescription = document.getElementById('resultDescription');

const yearPicker = document.getElementById('yearPicker');
const monthPicker = document.getElementById('monthPicker');
const dayPicker = document.getElementById('dayPicker');

const endYearPicker = document.getElementById('endYearPicker');
const endMonthPicker = document.getElementById('endMonthPicker');
const endDayPicker = document.getElementById('endDayPicker');

const clearButton = document.getElementById('clearButton');
const firstDayInputs = document.querySelectorAll('input[name="firstDay"]');

let currentMode = 'add';

const labels = { day: '日', week: '週間', month: 'カ月', year: '年' };
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

const pad = n => String(n).padStart(2, '0');
const inputDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function updateFirstDayState() {
  const isDay = currentMode === 'diff' || unitInput.value === 'day';
  firstDayInputs.forEach(input => {
    input.disabled = !isDay;
  });
}

function parseDate(v) {
  if (!v) return null;
  const match = v.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d, 12);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

const format = d => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;

function daysInMonth(y, m) {
  return new Date(y, m, 0, 12).getDate();
}

function addOption(select, value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function buildMobilePickers() {
  for (let y = 1900; y <= 2100; y++) {
    addOption(yearPicker, y, `${y}年`);
    addOption(endYearPicker, y, `${y}年`);
  }
  for (let m = 1; m <= 12; m++) {
    addOption(monthPicker, m, `${m}月`);
    addOption(endMonthPicker, m, `${m}月`);
  }
  syncPickersFromText();
  syncEndPickersFromText();
}

function rebuildDays(selectedDay) {
  const y = Number(yearPicker.value);
  const m = Number(monthPicker.value);
  const last = daysInMonth(y, m);
  dayPicker.replaceChildren();
  for (let d = 1; d <= last; d++) addOption(dayPicker, d, `${d}日`);
  dayPicker.value = Math.min(Number(selectedDay) || 1, last);
}

function rebuildEndDays(selectedDay) {
  const y = Number(endYearPicker.value);
  const m = Number(endMonthPicker.value);
  const last = daysInMonth(y, m);
  endDayPicker.replaceChildren();
  for (let d = 1; d <= last; d++) addOption(endDayPicker, d, `${d}日`);
  endDayPicker.value = Math.min(Number(selectedDay) || 1, last);
}

function syncPickersFromText() {
  const d = parseDate(baseDateInput.value) || new Date();
  const formattedDate = inputDate(d);
  yearPicker.value = d.getFullYear();
  monthPicker.value = d.getMonth() + 1;
  rebuildDays(d.getDate());
  baseDatePicker.value = formattedDate;
}

function syncEndPickersFromText() {
  const d = parseDate(endDateInput.value) || new Date();
  const formattedDate = inputDate(d);
  endYearPicker.value = d.getFullYear();
  endMonthPicker.value = d.getMonth() + 1;
  rebuildEndDays(d.getDate());
  endDatePicker.value = formattedDate;
}

function updateDateFromPickers() {
  const previousDay = Number(dayPicker.value) || 1;
  rebuildDays(previousDay);
  const formattedDate = `${yearPicker.value}-${pad(monthPicker.value)}-${pad(dayPicker.value)}`;
  baseDateInput.value = formattedDate;
  baseDatePicker.value = formattedDate;
  baseDateError.textContent = '';
}

function updateEndDateFromPickers() {
  const previousDay = Number(endDayPicker.value) || 1;
  rebuildEndDays(previousDay);
  const formattedDate = `${endYearPicker.value}-${pad(endMonthPicker.value)}-${pad(endDayPicker.value)}`;
  endDateInput.value = formattedDate;
  endDatePicker.value = formattedDate;
  endDateError.textContent = '';
}

function addMonths(d, m) {
  const r = new Date(d);
  const day = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + m);
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0, 12).getDate();
  r.setDate(Math.min(day, last));
  return r;
}

function calculateAdd(base, n, unit, sign, includeFirstDay) {
  const r = new Date(base);
  if (unit === 'day') {
    let days = n;
    if (includeFirstDay && n > 0) {
      days = n - 1;
    }
    r.setDate(r.getDate() + sign * days);
  }
  if (unit === 'week') r.setDate(r.getDate() + sign * n * 7);
  if (unit === 'month') return addMonths(r, sign * n);
  if (unit === 'year') return addMonths(r, sign * n * 12);
  return r;
}

function calculateDiff(d1, d2, includeFirstDay) {
  const start = d1 < d2 ? d1 : d2;
  const end = d1 < d2 ? d2 : d1;
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  let diffDays = Math.round(diffTime / (1000 * 3600 * 24));
  if (includeFirstDay) {
    diffDays += 1;
  }

  const weeks = Math.floor(diffDays / 7);
  const remDays = diffDays % 7;

  let yDiff = end.getFullYear() - start.getFullYear();
  let mDiff = end.getMonth() - start.getMonth();
  let dayDiff = end.getDate() - start.getDate();

  if (dayDiff < 0) {
    mDiff--;
    const prevMonthLastDay = daysInMonth(end.getFullYear(), end.getMonth());
    dayDiff += prevMonthLastDay;
  }
  if (mDiff < 0) {
    yDiff--;
    mDiff += 12;
  }

  const totalMonths = yDiff * 12 + mDiff;

  const yearsDate = new Date(start);
  yearsDate.setFullYear(yearsDate.getFullYear() + yDiff);
  let remDaysY = Math.round((end.getTime() - yearsDate.getTime()) / (1000 * 3600 * 24));
  if (includeFirstDay && yDiff === 0) {
    remDaysY = diffDays;
  } else if (includeFirstDay) {
    remDaysY += 1;
  }

  return {
    days: diffDays,
    weeks: weeks,
    remDays: remDays,
    years: yDiff,
    months: mDiff,
    remDaysYMD: dayDiff,
    totalMonths: totalMonths,
    remDaysY: remDaysY
  };
}

function showResult() {
  baseDateError.textContent = '';
  amountError.textContent = '';
  endDateError.textContent = '';

  const base = parseDate(baseDateInput.value);

  if (!base) {
    baseDateError.textContent = baseDateInput.value.trim() === '' ? '基準日を入力してください。' : '実在する日付をYYYY-MM-DD形式で入力してください。';
    resultDate.textContent = '－';
    resultDescription.textContent = '入力内容を確認してください';
    return;
  }

  if (currentMode === 'add') {
    const value = amountInput.value.trim();
    const n = Number(value);

    if (value === '' || !Number.isInteger(n) || n < 0) {
      amountError.textContent = value === '' ? '数値を入力してください。' : '0以上の整数を入力してください。';
      resultDate.textContent = '－';
      resultDescription.textContent = '入力内容を確認してください';
      return;
    }

    const direction = document.querySelector('input[name="direction"]:checked').value;
    const firstDayVal = document.querySelector('input[name="firstDay"]:checked').value;
    const includeFirstDay = (unitInput.value === 'day' && firstDayVal === 'include');
    const sign = direction === 'past' ? -1 : 1;
    const answer = calculateAdd(base, n, unitInput.value, sign, includeFirstDay);

    resultDate.textContent = format(answer);
    resultDescription.textContent = `${format(base)}の${n}${labels[unitInput.value]}${direction === 'past' ? '前' : '後'}${includeFirstDay ? '（初日含める）' : ''}`;
  } else {
    const end = parseDate(endDateInput.value);
    if (!end) {
      endDateError.textContent = endDateInput.value.trim() === '' ? '終了日を入力してください。' : '実在する日付をYYYY-MM-DD形式で入力してください。';
      resultDate.textContent = '－';
      resultDescription.textContent = '入力内容を確認してください';
      return;
    }

    const firstDayVal = document.querySelector('input[name="firstDay"]:checked').value;
    const includeFirstDay = (firstDayVal === 'include');
    const diff = calculateDiff(base, end, includeFirstDay);

    resultDate.textContent = `${diff.days.toLocaleString()} 日間`;
    
    let desc = `（${diff.weeks} 週 ${diff.remDays} 日 / ${diff.totalMonths} カ月 ${diff.remDaysYMD} 日 / ${diff.years} 年 ${diff.remDaysY} 日 / ${diff.years} 年 ${diff.months} カ月 ${diff.remDaysYMD} 日）${includeFirstDay ? ' ※初日含む' : ''}`;

    resultDescription.textContent = desc;
  }
}

document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentMode = e.target.dataset.mode;

    const baseLabel = document.getElementById('baseDateLabel');
    if (currentMode === 'add') {
      baseLabel.textContent = '基準日';
      document.querySelectorAll('.mode-add-only').forEach(el => el.style.display = '');
      document.querySelectorAll('.mode-diff-only').forEach(el => el.style.display = 'none');
    } else {
      baseLabel.textContent = '開始日';
      document.querySelectorAll('.mode-add-only').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.mode-diff-only').forEach(el => el.style.display = 'block');
      if (!endDateInput.value) {
        endDateInput.value = inputDate(new Date());
        endDatePicker.value = endDateInput.value;
      }
      syncEndPickersFromText();
    }
    updateFirstDayState();
    resultDate.textContent = '－';
    resultDescription.textContent = '条件を入力してください';
  });
});

unitInput.addEventListener('change', () => {
  updateFirstDayState();
});

document.querySelectorAll('.quick-button').forEach(button => button.addEventListener('click', () => {
  amountInput.value = button.dataset.amount;
  unitInput.value = button.dataset.unit;
  updateFirstDayState();
  document.querySelector('input[name="direction"][value="past"]').checked = true;
  showResult();
}));

form.addEventListener('submit', e => {
  e.preventDefault();
  showResult();
});

clearButton.addEventListener('click', () => {
  const todayStr = inputDate(new Date());
  
  if (currentMode === 'add') {
    baseDateInput.value = todayStr;
    baseDatePicker.value = todayStr;
    syncPickersFromText();
    amountInput.value = '';
    unitInput.value = 'day';
    document.querySelector('input[name="direction"][value="past"]').checked = true;
    document.querySelector('input[name="firstDay"][value="exclude"]').checked = true;
    baseDateError.textContent = '';
    amountError.textContent = '';
  } else {
    baseDateInput.value = todayStr;
    baseDatePicker.value = todayStr;
    endDateInput.value = todayStr;
    endDatePicker.value = todayStr;
    syncPickersFromText();
    syncEndPickersFromText();
    document.querySelector('input[name="firstDay"][value="exclude"]').checked = true;
    baseDateError.textContent = '';
    endDateError.textContent = '';
  }
  
  updateFirstDayState();
  resultDate.textContent = '－';
  resultDescription.textContent = '条件を入力してください';
});

yearPicker.addEventListener('change', updateDateFromPickers);
monthPicker.addEventListener('change', updateDateFromPickers);
dayPicker.addEventListener('change', updateDateFromPickers);

endYearPicker.addEventListener('change', updateEndDateFromPickers);
endMonthPicker.addEventListener('change', updateEndDateFromPickers);
endDayPicker.addEventListener('change', updateEndDateFromPickers);

baseDatePicker.addEventListener('change', e => {
  if (e.target.value) {
    baseDateInput.value = e.target.value;
    syncPickersFromText();
    baseDateError.textContent = '';
  }
});

endDatePicker.addEventListener('change', e => {
  if (e.target.value) {
    endDateInput.value = e.target.value;
    syncEndPickersFromText();
    endDateError.textContent = '';
  }
});

baseDatePicker.addEventListener('click', e => {
  if (typeof e.target.showPicker === 'function') {
    try { e.target.showPicker(); } catch (err) {}
  }
});

endDatePicker.addEventListener('click', e => {
  if (typeof e.target.showPicker === 'function') {
    try { e.target.showPicker(); } catch (err) {}
  }
});

baseDateInput.addEventListener('change', syncPickersFromText);
endDateInput.addEventListener('change', syncEndPickersFromText);

const today = inputDate(new Date());
baseDateInput.value = today;
baseDatePicker.value = today;
endDateInput.value = today;
endDatePicker.value = today;
buildMobilePickers();
updateFirstDayState();
resultDate.textContent = '－';
resultDescription.textContent = '条件を入力してください';
baseDateError.textContent = '';
amountError.textContent = '';
endDateError.textContent = '';

// ダブルタップによるズーム動作を無効化
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// 2本指でのピンチズーム（拡大・縮小）動作を無効化
document.addEventListener('touchstart', (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

// Safari/iOSのジェスチャー（ピンチイン・アウト）を無効化
document.addEventListener('gesturestart', (event) => {
  event.preventDefault();
});