<!-- frontend/src/components/AuditLogPanel.vue -->
<template>
  <div class="audit-panel">
    <details>
      <summary class="section-toggle">📋 操作紀錄</summary>
      <div class="section-body">
        <div class="audit-toolbar" v-if="isAdminUser">
          <button class="tab-btn" :class="{ active: viewMode === 'mine' }" @click="viewMode = 'mine'; fetchLogs()">我的紀錄</button>
          <button class="tab-btn" :class="{ active: viewMode === 'all' }" @click="viewMode = 'all'; fetchLogs()">全部紀錄</button>
        </div>
        <div v-if="loading" class="loading-sm">載入中...</div>
        <table v-else-if="logs.length > 0" class="audit-table">
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
            <tr v-for="log in logs" :key="log.id">
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
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
.audit-panel { margin-bottom: 20px; }
.section-toggle { cursor: pointer; font-size: 1.1rem; font-weight: 600; color: #1a1a2e; padding: 12px 0; user-select: none; }
.section-body { padding: 16px 0; }
.audit-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.tab-btn { padding: 6px 16px; border: 1px solid #ddd; border-radius: 20px; background: #fff; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.tab-btn:hover { border-color: #4361ee; color: #4361ee; }
.tab-btn.active { background: #4361ee; color: #fff; border-color: #4361ee; }
.loading-sm { color: #888; font-size: 0.9rem; padding: 12px 0; }
.audit-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.audit-table th { text-align: left; padding: 8px; border-bottom: 2px solid #e8e8e8; color: #555; font-weight: 600; }
.audit-table td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
.col-time { white-space: nowrap; font-size: 0.8rem; color: #888; }
.col-details { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8rem; color: #888; }
.action-badge { padding: 2px 8px; background: #e8eaf6; color: #3949ab; border-radius: 4px; font-size: 0.78rem; font-weight: 500; }
.no-data { color: #bbb; font-size: 0.9rem; padding: 16px 0; }
</style>
