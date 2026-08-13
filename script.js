'use strict';

const form = document.getElementById('dateForm');
const baseDateInput = document.getElementById('baseDate');
const baseDatePicker = document.getElementById('baseDatePicker');
const baseDateError = document.getElementById('baseDateError');
const amountInput = document.getElementById('amount');
const unitInput = document.getElementById('unit');
const amountError = document.getElementById('amountError');
const resultDate = document.getElementById('resultDate');
const resultDescription = document.getElementById('resultDescription');
const yearPicker = document.getElementById('yearPicker');
const monthPicker = document.getElementById('monthPicker');
const dayPicker = document.getElementById('dayPicker');
const clearButton = document.getElementById('clearButton');
const firstDayInputs = document.querySelectorAll('input[name="firstDay"]');

const labels = { day: '日', week: '週間', month: 'カ月', year: '年' };
const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

const pad = n => String(n).padStart(2, '0');
const inputDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function updateFirstDayState() {
  const isDay = unitInput.value === 'day';
  firstDayInputs.forEach(input => {
    input.disabled = !isDay;
  });
}

function parseDate(v) {
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
  for (let y = 1900; y <= 2100; y++) addOption(yearPicker, y, `${y}年`);
  for (let m = 1; m <= 12; m++) addOption(monthPicker, m, `${m}月`);
  syncPickersFromText();
}

function rebuildDays(selectedDay) {
  const y = Number(yearPicker.value);
  const m = Number(monthPicker.value);
  const last = daysInMonth(y, m);
  dayPicker.replaceChildren();
  for (let d = 1; d <= last; d++) addOption(dayPicker, d, `${d}日`);
  dayPicker.value = Math.min(Number(selectedDay) || 1, last);
}

function syncPickersFromText() {
  const d = parseDate(baseDateInput.value) || new Date();
  const formattedDate = inputDate(d);
  yearPicker.value = d.getFullYear();
  monthPicker.value = d.getMonth() + 1;
  rebuildDays(d.getDate());
  baseDatePicker.value = formattedDate;
}

function updateDateFromPickers() {
  const previousDay = Number(dayPicker.value) || 1;
  rebuildDays(previousDay);
  const formattedDate = `${yearPicker.value}-${pad(monthPicker.value)}-${pad(dayPicker.value)}`;
  baseDateInput.value = formattedDate;
  baseDatePicker.value = formattedDate;
  baseDateError.textContent = '';
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

function calculate(base, n, unit, sign, includeFirstDay) {
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

function showResult() {
  baseDateError.textContent = '';
  amountError.textContent = '';
  const base = parseDate(baseDateInput.value);
  const value = amountInput.value.trim();
  const n = Number(value);

  if (!base) {
    baseDateError.textContent = baseDateInput.value.trim() === '' ? '基準日を入力してください。' : '実在する日付をYYYY-MM-DD形式で入力してください。';
    resultDate.textContent = '－';
    resultDescription.textContent = '入力内容を確認してください';
    return;
  }
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
  const answer = calculate(base, n, unitInput.value, sign, includeFirstDay);

  resultDate.textContent = format(answer);
  resultDescription.textContent = `${format(base)}の${n}${labels[unitInput.value]}${direction === 'past' ? '前' : '後'}${includeFirstDay ? '（初日含める）' : ''}`;
}

// イベントリスナーの設定
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
  baseDateInput.value = todayStr;
  baseDatePicker.value = todayStr;
  syncPickersFromText();
  amountInput.value = '';
  unitInput.value = 'day';
  document.querySelector('input[name="direction"][value="past"]').checked = true;
  document.querySelector('input[name="firstDay"][value="exclude"]').checked = true;
  updateFirstDayState();
  baseDateError.textContent = '';
  amountError.textContent = '';
  resultDate.textContent = '－';
  resultDescription.textContent = '条件を入力してください';
});

yearPicker.addEventListener('change', updateDateFromPickers);
monthPicker.addEventListener('change', updateDateFromPickers);
dayPicker.addEventListener('change', updateDateFromPickers);

baseDatePicker.addEventListener('change', e => {
  if (e.target.value) {
    baseDateInput.value = e.target.value;
    syncPickersFromText();
    baseDateError.textContent = '';
  }
});

baseDatePicker.addEventListener('click', e => {
  if (typeof e.target.showPicker === 'function') {
    try {
      e.target.showPicker();
    } catch (err) {
      // ignore
    }
  }
});

baseDateInput.addEventListener('change', syncPickersFromText);

// 初期化処理
const today = inputDate(new Date());
baseDateInput.value = today;
baseDatePicker.value = today;
buildMobilePickers();
updateFirstDayState();
resultDate.textContent = '－';
resultDescription.textContent = '条件を入力してください';
baseDateError.textContent = '';
amountError.textContent = '';