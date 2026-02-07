<!-- frontend/src/components/AuditLogPage.vue -->
<template>
  <div class="audit-page">
    <h2>📋 操作紀錄</h2>
    <div class="audit-toolbar">
      <div class="tab-group">
        <button class="tab-btn" :class="{ active: viewMode === 'mine' }" @click="viewMode = 'mine'; fetchLogs()">我的紀錄</button>
        <button v-if="isAdminUser" class="tab-btn" :class="{ active: viewMode === 'all' }" @click="viewMode = 'all'; fetchLogs()">全部紀錄</button>
      </div>
      <div class="filter-group">
        <input v-model="filterAction" class="filter-input" placeholder="篩選動作..." />
        <input v-model="filterTarget" class="filter-input" placeholder="篩選目標..." />
      </div>
    </div>
    <div v-if="loading" class="loading">載入中...</div>
    <table v-else-if="filteredLogs.length > 0" class="audit-table">
      <thead>
        <tr>
          <th>時間</th>
          <th v-if="viewMode === 'all'">使用者</th>
          <th>動作</th>
          <th>目標</th>
          <th>詳細</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in filteredLogs" :key="log.id">
          <td class="col-time">{{ formatTime(log.createdAt) }}</td>
          <td v-if="viewMode === 'all'">{{ log.username }}</td>
          <td><span class="action-badge">{{ log.action }}</span></td>
          <td>{{ log.target || '—' }}</td>
          <td class="col-details">{{ log.details || '—' }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="no-data">暫無操作紀錄</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { isAdmin } from '../auth';

interface AuditLogItem {
  id: string;
  userId: string;
  username: string;
  action: string;
  target: string | null;
  details: string | null;
  createdAt: string;
}

const isAdminUser = isAdmin();
const viewMode = ref<'mine' | 'all'>(isAdminUser ? 'all' : 'mine');
const logs = ref<AuditLogItem[]>([]);
const loading = ref(false);
const filterAction = ref('');
const filterTarget = ref('');

const filteredLogs = computed(() => {
  let result = logs.value;
  const a = filterAction.value.trim().toLowerCase();
  const t = filterTarget.value.trim().toLowerCase();
  if (a) result = result.filter(l => l.action.toLowerCase().includes(a));
  if (t) result = result.filter(l => (l.target || '').toLowerCase().includes(t));
  return result;
});

async function fetchLogs() {
  loading.value = true;
  try {
    const url = viewMode.value === 'all' ? '/api/audit' : '/api/audit/me';
    const { data } = await axios.get(url);
    logs.value = data;
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-TW');
}

onMounted(fetchLogs);
</script>

<style scoped>
.audit-page h2 { margin: 0 0 20px 0; font-size: 1.4rem; color: #1a1a2e; }
.audit-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.tab-group { display: flex; gap: 8px; }
.tab-btn { padding: 8px 18px; border: 1px solid #ddd; border-radius: 20px; background: #fff; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { border-color: #4361ee; color: #4361ee; }
.tab-btn.active { background: #4361ee; color: #fff; border-color: #4361ee; }
.filter-group { display: flex; gap: 8px; }
.filter-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.85rem; width: 160px; }
.filter-input:focus { border-color: #4361ee; outline: none; }
.loading { color: #888; padding: 40px 0; text-align: center; }
.audit-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.audit-table th { text-align: left; padding: 10px 12px; border-bottom: 2px solid #e8e8e8; color: #555; font-weight: 600; background: #f8f9fa; }
.audit-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
.audit-table tr:hover { background: #f8f9fa; }
.col-time { white-space: nowrap; font-size: 0.82rem; color: #888; }
.col-details { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; color: #888; }
.action-badge { padding: 3px 10px; background: #e8eaf6; color: #3949ab; border-radius: 4px; font-size: 0.8rem; font-weight: 500; }
.no-data { color: #bbb; font-size: 0.95rem; text-align: center; padding: 40px 0; }
</style>
