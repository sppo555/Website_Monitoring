<!-- frontend/src/components/SiteList.vue -->
<template>
  <div class="site-list">
    <!-- 群組管理列 -->
    <div class="group-bar">
      <div class="group-tabs">
        <button class="group-tab" :class="{ active: selectedGroupId === null }" @click="selectedGroupId = null">{{ t('common.all') }}</button>
        <button v-for="g in groups" :key="g.id" class="group-tab" :class="{ active: selectedGroupId === g.id }" @click="selectedGroupId = g.id">
          {{ g.name }}
          <span class="group-count">{{ countByGroup(g.id) }}</span>
        </button>
      </div>
      <div class="group-actions" v-if="userIsAdmin">
        <input v-model="newGroupName" class="group-input" :placeholder="t('site.newGroupPlaceholder')" @keyup.enter="createGroup" />
        <button class="btn-sm btn-outline" @click="createGroup" :disabled="!newGroupName.trim()">+</button>
        <button v-if="selectedGroupId" class="btn-sm btn-outline btn-danger-outline" @click="deleteGroup" :title="t('site.deleteGroup')">{{ t('site.deleteGroup') }}</button>
      </div>
    </div>

    <!-- 工具列 -->
    <div class="toolbar">
      <h2>
        {{ selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : t('common.all') }}
        <span class="site-count">({{ searchedSites.length }})</span>
      </h2>
      <div class="toolbar-actions">
        <input v-model="searchQuery" class="search-input" :placeholder="t('site.searchPlaceholder')" />
        <template v-if="userCanEdit">
          <button v-if="selectedIds.length > 0" class="btn btn-warning" @click="showBulkEdit = true">{{ t('site.bulkEdit') }} ({{ selectedIds.length }})</button>
          <button class="btn btn-secondary" @click="showBatchModal = true">{{ t('site.batchImport') }}</button>
          <button class="btn btn-primary" @click="openAddModal">{{ t('site.addSite') }}</button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <div v-else-if="searchedSites.length === 0" class="empty-state">
      <p>{{ t('site.empty') }}</p>
      <p>{{ t('site.emptyHint') }}</p>
    </div>

    <div v-else class="site-cards">
      <div v-for="site in searchedSites" :key="site.id" class="site-card" :class="{ 'card-paused': site.status === 'paused', 'card-selected': selectedIds.includes(site.id) }">
        <div class="card-header">
          <div class="card-url">
            <input v-if="userCanEdit" type="checkbox" :checked="selectedIds.includes(site.id)" @change="toggleSelect(site.id)" class="site-checkbox" />
            <span class="status-dot" :class="getHealthClass(site)"></span>
            <a :href="'https://' + site.domain" target="_blank" rel="noopener">{{ site.domain }}</a>
          </div>
          <div class="card-badges">
            <span v-for="g in (site.groups || [])" :key="g.id" class="badge badge-group">{{ g.name }}</span>
            <span class="badge" :class="site.status === 'active' ? 'badge-active' : 'badge-paused'">
              {{ site.status === 'active' ? t('site.active') : t('site.paused') }}
            </span>
          </div>
        </div>

        <div class="check-flags">
          <span :class="site.checkHttp ? 'flag-on' : 'flag-off'">HTTP</span>
          <span :class="site.checkHttps ? 'flag-on' : 'flag-off'">HTTPS</span>
          <span :class="(site.checkTls || site.checkHttps) ? 'flag-on' : 'flag-off'">TLS</span>
          <span :class="site.checkWhois ? 'flag-on' : 'flag-off'">WHOIS</span>
        </div>

        <div class="card-metrics">
          <div class="metric" v-if="site.checkHttp || site.checkHttps">
            <span class="metric-label">{{ t('site.httpStatus') }}</span>
            <span class="metric-value" :class="getHttpClass(site)">{{ site.latestResult?.httpStatus ?? '—' }}</span>
          </div>
          <div class="metric" v-if="site.checkTls || site.checkHttps">
            <span class="metric-label">{{ t('site.tlsCert') }}</span>
            <span class="metric-value" :class="getTlsClass(site)">{{ site.latestResult?.tlsDaysLeft != null ? site.latestResult.tlsDaysLeft + ' ' + t('common.days') : '—' }}</span>
          </div>
          <div class="metric" v-if="site.checkWhois">
            <span class="metric-label">{{ t('site.domainExpiry') }}</span>
            <span class="metric-value" :class="getWhoisClass(site)">{{ site.latestResult?.domainDaysLeft != null ? site.latestResult.domainDaysLeft + ' ' + t('common.days') : '—' }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">{{ t('site.httpInterval') }}</span>
            <span class="metric-value">{{ site.httpCheckIntervalSeconds }}s</span>
          </div>
          <div class="metric" v-if="site.consecutiveFailures > 0">
            <span class="metric-label">{{ t('site.consecFails') }}</span>
            <span class="metric-value text-red">{{ site.consecutiveFailures }}/{{ site.failureThreshold }}</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="check-time" v-if="site.latestResult?.checkedAt">{{ t('site.lastCheck') }} {{ formatTime(site.latestResult.checkedAt) }}</span>
          <span class="check-time" v-else>{{ t('site.notChecked') }}</span>
          <div class="card-actions">
            <button class="btn-icon" :title="t('site.historyTitle')" @click="openHistory(site)">📊</button>
            <button v-if="userCanEdit" class="btn-icon" :title="t('site.editTitle')" @click="openEditModal(site)">&#9998;</button>
            <button v-if="userCanEdit" class="btn-icon" :title="site.status === 'active' ? t('site.pauseTitle') : t('site.resumeTitle')" @click="toggleStatus(site)">{{ site.status === 'active' ? '⏸' : '▶' }}</button>
            <button v-if="userIsAdmin" class="btn-icon btn-danger" :title="t('site.deleteTitle')" @click="deleteSite(site)">&#10005;</button>
          </div>
        </div>
      </div>
    </div>

    <SiteFormModal v-if="showModal" :is-edit="!!editingSite" :groups="groups" :initial-data="editingFormData" @close="closeModal" @submit="handleFormSubmit" />
    <BatchImportModal v-if="showBatchModal" :groups="groups" @close="showBatchModal = false" @imported="onBatchImported" />
    <HistoryModal v-if="historySite" :site-id="historySite.id" :domain="historySite.domain" @close="historySite = null" />
    <BulkEditModal v-if="showBulkEdit" :site-ids="selectedIds" @close="showBulkEdit = false" @saved="onBulkSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import SiteFormModal from './SiteFormModal.vue';
import BatchImportModal from './BatchImportModal.vue';
import HistoryModal from './HistoryModal.vue';
import BulkEditModal from './BulkEditModal.vue';
import { authState, isAdmin, canEdit } from '../auth';
import { t, getDateLocale } from '../i18n';

const userIsAdmin = computed(() => isAdmin());
const userCanEdit = computed(() => {
  const r = authState.user?.role;
  return r === 'admin' || r === 'onlyedit';
});

interface GroupItem { id: string; name: string; }
interface CheckResult { httpStatus: number | null; tlsDaysLeft: number | null; domainDaysLeft: number | null; isHealthy: boolean; checkedAt: string; }
interface Site {
  id: string; domain: string;
  checkHttp: boolean; checkHttps: boolean; checkTls: boolean; checkWhois: boolean;
  httpCheckIntervalSeconds: number; tlsCheckIntervalDays: number; domainCheckIntervalDays: number;
  failureThreshold: number; consecutiveFailures: number;
  status: 'active' | 'paused';
  groups: GroupItem[];
  latestResult?: CheckResult;
}

const API_BASE = '/api/sites';
const GROUP_API = '/api/groups';

const sites = ref<Site[]>([]);
const groups = ref<GroupItem[]>([]);
const loading = ref(true);
const showModal = ref(false);
const showBatchModal = ref(false);
const showBulkEdit = ref(false);
const editingSite = ref<Site | null>(null);
const selectedGroupId = ref<string | null>(null);
const newGroupName = ref('');
const historySite = ref<Site | null>(null);
const searchQuery = ref('');
const selectedIds = ref<string[]>([]);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const visibleSites = computed(() => {
  const role = authState.user?.role;
  if (role === 'admin' || role === 'allread') return sites.value;
  const allowed = authState.user?.assignedGroupIds || [];
  return sites.value.filter(s => s.groups?.some(g => allowed.includes(g.id)));
});

const filteredSites = computed(() => {
  if (selectedGroupId.value === null) return visibleSites.value;
  return visibleSites.value.filter(s => s.groups?.some(g => g.id === selectedGroupId.value));
});

const searchedSites = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return filteredSites.value;
  return filteredSites.value.filter(s => s.domain.toLowerCase().includes(q));
});

const editingFormData = computed(() => {
  if (!editingSite.value) return undefined;
  return {
    domain: editingSite.value.domain,
    checkHttp: editingSite.value.checkHttp,
    checkHttps: editingSite.value.checkHttps,
    checkTls: editingSite.value.checkTls,
    checkWhois: editingSite.value.checkWhois,
    httpCheckIntervalSeconds: editingSite.value.httpCheckIntervalSeconds,
    tlsCheckIntervalDays: editingSite.value.tlsCheckIntervalDays,
    domainCheckIntervalDays: editingSite.value.domainCheckIntervalDays,
    failureThreshold: editingSite.value.failureThreshold,
    groupIds: editingSite.value.groups?.map(g => g.id) || [],
  };
});

function countByGroup(groupId: string): number {
  return sites.value.filter(s => s.groups?.some(g => g.id === groupId)).length;
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
}

async function fetchGroups() {
  try { const { data } = await axios.get<GroupItem[]>(GROUP_API); groups.value = data; } catch (err) { console.error('獲取群組失敗:', err); }
}

async function fetchSites() {
  try { const { data } = await axios.get<Site[]>(API_BASE); sites.value = data; } catch (err) { console.error('獲取網站列表失敗:', err); } finally { loading.value = false; }
}

async function createGroup() {
  const name = newGroupName.value.trim();
  if (!name) return;
  try { await axios.post(GROUP_API, { name }); newGroupName.value = ''; await fetchGroups(); } catch (err) { console.error('建立群組失敗:', err); alert('建立群組失敗'); }
}

async function deleteGroup() {
  if (!selectedGroupId.value) return;
  const group = groups.value.find(g => g.id === selectedGroupId.value);
  if (!confirm(t('site.confirmDeleteGroup', { name: group?.name || '' }))) return;
  try { await axios.delete(`${GROUP_API}/${selectedGroupId.value}`); selectedGroupId.value = null; await Promise.all([fetchGroups(), fetchSites()]); } catch (err) { console.error('刪除群組失敗:', err); }
}

function openHistory(site: Site) { historySite.value = site; }
function openAddModal() { editingSite.value = null; showModal.value = true; }
function openEditModal(site: Site) { editingSite.value = site; showModal.value = true; }
function closeModal() { showModal.value = false; editingSite.value = null; }

async function handleFormSubmit(formData: any) {
  try {
    if (editingSite.value) { await axios.put(`${API_BASE}/${editingSite.value.id}`, formData); }
    else { await axios.post(API_BASE, formData); }
    closeModal(); await fetchSites();
  } catch (err: any) { console.error('操作失敗:', err); alert(err.response?.data?.message || '操作失敗'); }
}

async function onBatchImported() { showBatchModal.value = false; await Promise.all([fetchGroups(), fetchSites()]); }
async function onBulkSaved() { showBulkEdit.value = false; selectedIds.value = []; await fetchSites(); }

async function toggleStatus(site: Site) {
  const newStatus = site.status === 'active' ? 'paused' : 'active';
  try { await axios.put(`${API_BASE}/${site.id}/status/${newStatus}`); await fetchSites(); } catch (err) { console.error('狀態切換失敗:', err); }
}

async function deleteSite(site: Site) {
  if (!confirm(t('site.confirmDelete', { domain: site.domain }))) return;
  try { await axios.delete(`${API_BASE}/${site.id}`); await fetchSites(); } catch (err) { console.error('刪除失敗:', err); }
}

function formatTime(dateStr: string): string { return new Date(dateStr).toLocaleString(getDateLocale()); }
function getHealthClass(site: Site) { if (site.status === 'paused') return 'dot-gray'; if (!site.latestResult) return 'dot-gray'; return site.latestResult.isHealthy ? 'dot-green' : 'dot-red'; }
function getHttpClass(site: Site) { const s = site.latestResult?.httpStatus; if (!s) return ''; if (s < 300) return 'text-green'; if (s < 400) return 'text-yellow'; return 'text-red'; }
function getTlsClass(site: Site) { const d = site.latestResult?.tlsDaysLeft; if (d == null) return ''; if (d > 30) return 'text-green'; if (d > 7) return 'text-yellow'; return 'text-red'; }
function getWhoisClass(site: Site) { const d = site.latestResult?.domainDaysLeft; if (d == null) return ''; if (d > 60) return 'text-green'; if (d > 30) return 'text-yellow'; return 'text-red'; }

onMounted(async () => { await Promise.all([fetchGroups(), fetchSites()]); refreshTimer = setInterval(fetchSites, 30000); });
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer); });
</script>

<style scoped>
.site-list { padding: 24px; }
.group-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding: 12px 16px; background: #f8f9fa; border-radius: 10px; }
.group-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.group-tab { padding: 6px 14px; border: 1px solid #ddd; border-radius: 20px; background: #fff; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
.group-tab:hover { border-color: #4361ee; color: #4361ee; }
.group-tab.active { background: #4361ee; color: #fff; border-color: #4361ee; }
.group-count { font-size: 0.7rem; opacity: 0.8; }
.group-actions { display: flex; gap: 6px; align-items: center; }
.group-input { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.85rem; width: 130px; }
.group-input:focus { border-color: #4361ee; outline: none; }
.btn-sm { padding: 6px 12px; border: 1px solid #ddd; border-radius: 6px; background: #fff; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { border-color: #4361ee; color: #4361ee; }
.btn-danger-outline { color: #e74c3c; border-color: #e74c3c; }
.btn-danger-outline:hover { background: #fde8e8; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
.toolbar h2 { margin: 0; font-size: 1.3rem; color: #1a1a2e; }
.site-count { font-weight: 400; font-size: 0.9rem; color: #888; }
.toolbar-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.search-input { padding: 8px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem; width: 200px; }
.search-input:focus { border-color: #4361ee; outline: none; }
.btn { padding: 10px 18px; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-primary { background: #4361ee; color: #fff; }
.btn-primary:hover { background: #3a56d4; }
.btn-secondary { background: #e8e8e8; color: #333; }
.btn-secondary:hover { background: #d8d8d8; }
.btn-warning { background: #f39c12; color: #fff; }
.btn-warning:hover { background: #e08e0b; }
.loading, .empty-state { text-align: center; padding: 60px 20px; color: #888; font-size: 1.1rem; }
.empty-state p { margin: 4px 0; }
.site-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 16px; }
.site-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s; }
.site-card:hover { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
.site-card.card-selected { border-color: #4361ee; box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2); }
.card-paused { opacity: 0.65; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-url { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
.card-url a { color: #1a1a2e; text-decoration: none; font-weight: 600; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-url a:hover { color: #4361ee; }
.site-checkbox { width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; }
.card-badges { display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-green { background: #2ecc71; }
.dot-red { background: #e74c3c; }
.dot-gray { background: #bbb; }
.badge { padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
.badge-active { background: #d4edda; color: #155724; }
.badge-paused { background: #f8d7da; color: #721c24; }
.badge-group { background: #e8eaf6; color: #3949ab; }
.check-flags { display: flex; gap: 6px; margin-bottom: 10px; }
.check-flags span { padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
.flag-on { background: #d4edda; color: #155724; }
.flag-off { background: #f0f0f0; color: #aaa; text-decoration: line-through; }
.card-metrics { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; padding: 10px 12px; background: #f8f9fa; border-radius: 8px; }
.metric { display: flex; flex-direction: column; gap: 2px; }
.metric-label { font-size: 0.72rem; color: #888; text-transform: uppercase; }
.metric-value { font-size: 1rem; font-weight: 600; color: #333; }
.text-green { color: #2ecc71; }
.text-yellow { color: #f39c12; }
.text-red { color: #e74c3c; }
.card-footer { display: flex; justify-content: space-between; align-items: center; }
.check-time { font-size: 0.8rem; color: #999; }
.card-actions { display: flex; gap: 4px; }
.btn-icon { width: 32px; height: 32px; border: none; border-radius: 6px; background: #f0f0f0; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.btn-icon:hover { background: #e0e0e0; }
.btn-danger:hover { background: #fde8e8; color: #e74c3c; }
</style>
