<!-- frontend/src/components/BatchImportModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header-row">
        <h2>{{ t('batch.title') }}</h2>
        <button class="btn-close" @click="$emit('close')" :title="t('common.closeEsc')">&times;</button>
      </div>
      <p class="hint">{{ t('batch.hint') }}</p>
      <div class="field-reference">
        <strong>{{ t('batch.fieldRef') }}</strong>
        <table class="ref-table">
          <tr><td><b>domain</b> *</td><td>{{ t('batch.fieldDomain') }}</td></tr>
          <tr><td>checkHttp</td><td>{{ t('batch.fieldCheckHttp') }}</td></tr>
          <tr><td>checkHttps</td><td>{{ t('batch.fieldCheckHttps') }}</td></tr>
          <tr><td>checkTls</td><td>{{ t('batch.fieldCheckTls') }}</td></tr>
          <tr><td>checkWhois</td><td>{{ t('batch.fieldCheckWhois') }}</td></tr>
          <tr><td>httpCheckIntervalSeconds</td><td>{{ t('batch.fieldHttpInterval') }}</td></tr>
          <tr><td>tlsCheckIntervalDays</td><td>{{ t('batch.fieldTlsInterval') }}</td></tr>
          <tr><td>domainCheckIntervalDays</td><td>{{ t('batch.fieldDomainInterval') }}</td></tr>
          <tr><td>failureThreshold</td><td>{{ t('batch.fieldFailureThreshold') }}</td></tr>
          <tr><td>groupIds</td><td>{{ t('batch.fieldGroupIds') }}</td></tr>
        </table>
      </div>
      <div class="format-example">
        <strong>{{ t('batch.exampleTitle') }}</strong>
        <pre>{{ exampleJson }}</pre>
      </div>
      <div class="form-group">
        <label for="groupId">{{ t('batch.groupLabel') }}</label>
        <select id="groupId" v-model="selectedGroupId">
          <option :value="null">{{ t('batch.noGroup') }}</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="json">{{ t('batch.jsonLabel') }}</label>
        <textarea
          id="json"
          v-model="jsonText"
          rows="12"
          placeholder='[{"domain":"www.google.com"}]'
        ></textarea>
      </div>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div class="form-actions">
        <button type="button" class="btn btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
        <button class="btn btn-primary" :disabled="submitting" @click="handleImport">
          {{ submitting ? t('batch.importing') : t('batch.import') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { t } from '../i18n';

interface GroupItem {
  id: string;
  name: string;
}

const props = defineProps<{
  groups: GroupItem[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported'): void;
}>();

const jsonText = ref('');
const selectedGroupId = ref<string | null>(null);
const submitting = ref(false);
const errorMsg = ref('');

function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') emit('close'); }
onMounted(() => window.addEventListener('keydown', onEsc));
onUnmounted(() => window.removeEventListener('keydown', onEsc));

const exampleJson = `[
  {
    "domain": "www.google.com",
    "checkHttp": true,
    "checkHttps": true,
    "checkTls": true,
    "checkWhois": true,
    "httpCheckIntervalSeconds": 300,
    "tlsCheckIntervalDays": 1,
    "domainCheckIntervalDays": 1,
    "failureThreshold": 3,
    "groupIds": []
  },
  {
    "domain": "github.com",
    "checkHttp": true,
    "checkHttps": true,
    "checkTls": true,
    "checkWhois": false,
    "httpCheckIntervalSeconds": 600,
    "failureThreshold": 5
  }
]`;

const VALID_FIELDS = new Set([
  'domain', 'checkHttp', 'checkHttps', 'checkTls', 'checkWhois',
  'httpCheckIntervalSeconds', 'tlsCheckIntervalDays', 'domainCheckIntervalDays',
  'failureThreshold', 'groupIds',
]);

function validateSites(sites: any[]): string | null {
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i];
    const idx = `第 ${i + 1} 筆`;
    if (typeof s !== 'object' || s === null || Array.isArray(s)) return `${idx}：必須是物件`;
    if (!s.domain || typeof s.domain !== 'string') return `${idx}：缺少 domain 欄位或型別錯誤`;
    // 域名格式驗證 (RFC 952/1123)
    const dom = s.domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
    if (/[^a-zA-Z0-9.\-]/.test(dom)) return `${idx}：域名 "${s.domain}" 格式錯誤，僅允許英文字母、數字、連字號 (-) 和點 (.)`;
    if (!dom.includes('.')) return `${idx}：域名 "${s.domain}" 必須包含至少一個點 (.)`;
    const labels = dom.split('.');
    for (const lb of labels) {
      if (lb.length === 0) return `${idx}：域名 "${s.domain}" 不可有連續的點 (..)`;
      if (lb.startsWith('-') || lb.endsWith('-')) return `${idx}：域名 "${s.domain}" 不可以連字號開頭或結尾`;
      if (lb.length > 63) return `${idx}：域名 "${s.domain}" 每段最多 63 字元`;
    }
    if (dom.length > 253) return `${idx}：域名 "${s.domain}" 總長度不可超過 253 字元`;
    const unknownKeys = Object.keys(s).filter(k => !VALID_FIELDS.has(k));
    if (unknownKeys.length > 0) return `${idx}：不明欄位 ${unknownKeys.join(', ')}`;
    if (s.checkHttp !== undefined && typeof s.checkHttp !== 'boolean') return `${idx}：checkHttp 必須是 boolean`;
    if (s.checkHttps !== undefined && typeof s.checkHttps !== 'boolean') return `${idx}：checkHttps 必須是 boolean`;
    if (s.checkTls !== undefined && typeof s.checkTls !== 'boolean') return `${idx}：checkTls 必須是 boolean`;
    if (s.checkWhois !== undefined && typeof s.checkWhois !== 'boolean') return `${idx}：checkWhois 必須是 boolean`;
    if (s.httpCheckIntervalSeconds !== undefined) {
      if (typeof s.httpCheckIntervalSeconds !== 'number' || s.httpCheckIntervalSeconds < 60) return `${idx}：httpCheckIntervalSeconds 最低 60`;
    }
    if (s.tlsCheckIntervalDays !== undefined) {
      if (typeof s.tlsCheckIntervalDays !== 'number' || s.tlsCheckIntervalDays < 1) return `${idx}：tlsCheckIntervalDays 最低 1`;
    }
    if (s.domainCheckIntervalDays !== undefined) {
      if (typeof s.domainCheckIntervalDays !== 'number' || s.domainCheckIntervalDays < 1) return `${idx}：domainCheckIntervalDays 最低 1`;
    }
    if (s.failureThreshold !== undefined) {
      if (typeof s.failureThreshold !== 'number' || s.failureThreshold < 1) return `${idx}：failureThreshold 最低 1`;
    }
    if (s.groupIds !== undefined && !Array.isArray(s.groupIds)) return `${idx}：groupIds 必須是陣列`;
  }
  return null;
}

async function handleImport() {
  errorMsg.value = '';
  submitting.value = true;

  try {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText.value);
    } catch {
      throw new Error('JSON 解析失敗，請確認格式是否正確（檢查逗號、括號、引號）');
    }

    let sites: any[];
    let groupIds: string[] | undefined = selectedGroupId.value ? [selectedGroupId.value] : undefined;

    if (Array.isArray(parsed)) {
      sites = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sites)) {
      sites = parsed.sites;
      if (parsed.groupIds) groupIds = parsed.groupIds;
      else if (parsed.groupId) groupIds = [parsed.groupId];
    } else {
      throw new Error('JSON 格式錯誤：需為陣列 [...] 或物件 { sites: [...] }');
    }

    if (sites.length === 0) throw new Error('網站陣列不可為空');

    const vErr = validateSites(sites);
    if (vErr) throw new Error(vErr);

    const payload = { groupIds, sites };
    const { default: axios } = await import('axios');
    await axios.post('/api/sites/batch', payload);
    emit('imported');
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || err.message || '匯入失敗';
  } finally {
    submitting.value = false;
  }
}
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
  padding: 32px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.modal-header-row h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #1a1a2e;
}
.btn-close {
  background: none; border: none; font-size: 1.6rem; color: #999;
  cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1; transition: all 0.2s;
}
.btn-close:hover { background: #f0f0f0; color: #333; }
.hint {
  margin: 0 0 16px 0;
  color: #888;
  font-size: 0.85rem;
}
.field-reference {
  background: #f0f4ff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  font-size: 0.78rem;
}
.field-reference strong {
  display: block;
  margin-bottom: 6px;
  color: #555;
}
.ref-table {
  width: 100%;
  border-collapse: collapse;
}
.ref-table td {
  padding: 2px 8px;
  border-bottom: 1px solid #e0e6f0;
  color: #444;
  font-size: 0.76rem;
}
.ref-table td:first-child {
  font-family: 'SF Mono', 'Fira Code', monospace;
  white-space: nowrap;
  width: 200px;
  color: #4361ee;
}
.format-example {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.8rem;
}
.format-example strong {
  display: block;
  margin-bottom: 6px;
  color: #555;
}
.format-example pre {
  margin: 0;
  white-space: pre-wrap;
  color: #333;
  font-size: 0.8rem;
  line-height: 1.4;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  box-sizing: border-box;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: #fff;
  resize: vertical;
}
.form-group select:focus,
.form-group textarea:focus {
  border-color: #4361ee;
  outline: none;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}
.error-msg {
  background: #fde8e8;
  color: #e74c3c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 12px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-primary { background: #4361ee; color: #fff; }
.btn-primary:hover { background: #3a56d4; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel { background: #f0f0f0; color: #555; }
.btn-cancel:hover { background: #e0e0e0; }
</style>
