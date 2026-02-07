<!-- frontend/src/components/HistoryModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📊 檢查歷史 — {{ domain }}</h2>
        <span class="sub">最近 24 小時內共 {{ records.length }} 筆紀錄</span>
      </div>

      <div v-if="loading" class="loading-sm">載入中...</div>
      <div v-else-if="records.length === 0" class="empty">尚無檢查紀錄</div>
      <div v-else class="history-table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>檢查時間</th>
              <th>健康</th>
              <th>HTTP 狀態</th>
              <th>TLS 剩餘</th>
              <th>域名剩餘</th>
              <th>錯誤</th>
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
                {{ r.tlsDaysLeft != null ? r.tlsDaysLeft + ' 天' : '—' }}
              </td>
              <td :class="whoisClass(r.domainDaysLeft)">
                {{ r.domainDaysLeft != null ? r.domainDaysLeft + ' 天' : '—' }}
              </td>
              <td class="col-err">{{ r.errorDetails || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" @click="$emit('close')">關閉</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

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

defineEmits<{ (e: 'close'): void }>();

const loading = ref(true);
const records = ref<CheckRecord[]>([]);

async function fetchHistory() {
  try {
    const { data } = await axios.get<CheckRecord[]>(`/api/sites/${props.siteId}/history`);
    records.value = data;
  } catch (err) {
    console.error('獲取歷史失敗:', err);
  } finally {
    loading.value = false;
  }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
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
.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1a1a2e;
}
.sub {
  font-size: 0.82rem;
  color: #888;
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
