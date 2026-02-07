<!-- frontend/src/components/HistoryModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title-row">
          <h2>{{ t('history.title', { domain }) }}</h2>
          <button class="btn-close" @click="$emit('close')" :title="t('common.closeEsc')">&times;</button>
        </div>
        <div class="range-bar">
          <button v-for="opt in rangeOptions" :key="opt.value" class="range-btn" :class="{ active: selectedRange === opt.value && !customActive }" @click="customActive = false; changeRange(opt.value)">{{ opt.label }}</button>
          <div class="custom-range">
            <input v-model="customInput" class="custom-input" :placeholder="t('history.customPlaceholder')" @keydown.enter="applyCustom" />
            <button class="range-btn" :class="{ active: customActive }" @click="applyCustom">{{ t('history.custom') }}</button>
          </div>
          <span class="sub">{{ t('history.recordCount', { count: records.length }) }}</span>
        </div>
      </div>

      <div v-if="loading" class="loading-sm">{{ t('common.loading') }}</div>
      <div v-else-if="records.length === 0" class="empty">{{ t('history.empty') }}</div>
      <div v-else class="history-table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>{{ t('history.colTime') }}</th>
              <th>{{ t('history.colHealthy') }}</th>
              <th>{{ t('history.colHttpStatus') }}</th>
              <th>{{ t('history.colTlsLeft') }}</th>
              <th>{{ t('history.colDomainLeft') }}</th>
              <th>{{ t('history.colError') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in records" :key="r.id" :class="{ 'row-err': !r.isHealthy }">
              <td class="col-time">{{ formatTime(r.checkedAt) }}</td>
              <td>
                <span :class="r.isHealthy ? 'tag-ok' : 'tag-err'">
                  {{ r.isHealthy ? '✅' : '❌' }}
                </span>
              </td>
              <td :class="httpClass(r.httpStatus)">{{ r.httpStatus ?? '—' }}</td>
              <td :class="tlsClass(r.tlsDaysLeft)">
                {{ r.tlsDaysLeft != null ? r.tlsDaysLeft + ' ' + t('common.days') : '—' }}
              </td>
              <td :class="whoisClass(r.domainDaysLeft)">
                {{ r.domainDaysLeft != null ? r.domainDaysLeft + ' ' + t('common.days') : '—' }}
              </td>
              <td class="col-err">{{ r.errorDetails || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="$emit('close')">{{ t('common.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { t, getDateLocale } from '../i18n';

interface CheckRecord {
  id: string;
  isHealthy: boolean;
  httpStatus: number | null;
  tlsDaysLeft: number | null;
  domainDaysLeft: number | null;
  errorDetails: string | null;
  checkedAt: string;
}

const props = defineProps<{
  siteId: string;
  domain: string;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const loading = ref(true);
const records = ref<CheckRecord[]>([]);
const selectedRange = ref('24h');
const customInput = ref('');
const customActive = ref(false);

const rangeOptions = [
  { label: '1h', value: '1h' },
  { label: '12h', value: '12h' },
  { label: '24h', value: '24h' },
  { label: '1d', value: '1d' },
  { label: '7d', value: '7d' },
  { label: '14d', value: '14d' },
];

async function fetchHistory() {
  loading.value = true;
  try {
    const { data } = await axios.get<CheckRecord[]>(`/api/sites/${props.siteId}/history?range=${selectedRange.value}`);
    records.value = data;
  } catch (err) {
    console.error('獲取歷史失敗:', err);
  } finally {
    loading.value = false;
  }
}

function changeRange(range: string) {
  selectedRange.value = range;
  fetchHistory();
}

function applyCustom() {
  const v = customInput.value.trim();
  if (!v) return;
  if (!/^\d+(h|d)$/.test(v)) { alert(t('history.customFormatAlert')); return; }
  customActive.value = true;
  selectedRange.value = v;
  fetchHistory();
}

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}
onMounted(() => window.addEventListener('keydown', onEsc));
onUnmounted(() => window.removeEventListener('keydown', onEsc));

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(getDateLocale());
}

function httpClass(status: number | null) {
  if (!status) return '';
  if (status < 300) return 'text-green';
  if (status < 400) return 'text-yellow';
  return 'text-red';
}

function tlsClass(days: number | null) {
  if (days == null) return '';
  if (days > 30) return 'text-green';
  if (days > 7) return 'text-yellow';
  return 'text-red';
}

function whoisClass(days: number | null) {
  if (days == null) return '';
  if (days > 60) return 'text-green';
  if (days > 30) return 'text-yellow';
  return 'text-red';
}

onMounted(fetchHistory);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  width: 820px;
  max-width: 95vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal-header {
  margin-bottom: 16px;
}
.modal-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1a1a2e;
}
.btn-close {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
  transition: all 0.2s;
}
.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}
.custom-range {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
}
.custom-input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 16px;
  font-size: 0.78rem;
  text-align: center;
  outline: none;
}
.custom-input:focus {
  border-color: #4361ee;
}
.range-bar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.range-btn {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: #fff;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
.range-btn:hover { border-color: #4361ee; color: #4361ee; }
.range-btn.active { background: #4361ee; color: #fff; border-color: #4361ee; }
.sub {
  font-size: 0.82rem;
  color: #888;
  margin-left: 8px;
}
.loading-sm, .empty {
  text-align: center;
  padding: 40px 20px;
  color: #888;
  font-size: 1rem;
}
.history-table-wrap {
  overflow-y: auto;
  flex: 1;
  border: 1px solid #eee;
  border-radius: 8px;
}
.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.history-table thead {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 1;
}
.history-table th {
  text-align: left;
  padding: 10px 12px;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e8e8e8;
  white-space: nowrap;
}
.history-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}
.history-table tbody tr:hover {
  background: #f8f9fa;
}
.row-err {
  background: #fff5f5;
}
.col-time {
  white-space: nowrap;
  font-size: 0.8rem;
  color: #666;
}
.col-err {
  font-size: 0.78rem;
  color: #999;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tag-ok {
  font-size: 0.9rem;
}
.tag-err {
  font-size: 0.9rem;
}
.text-green { color: #2ecc71; font-weight: 600; }
.text-yellow { color: #f39c12; font-weight: 600; }
.text-red { color: #e74c3c; font-weight: 600; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.btn {
  padding: 8px 18px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-cancel {
  background: #f0f0f0;
  color: #555;
}
.btn-cancel:hover { background: #e0e0e0; }
</style>
