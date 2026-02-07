<!-- frontend/src/components/BatchImportModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>批量 JSON 匯入</h2>
      <p class="hint">請貼上 JSON 格式的網站陣列，所有監控項目預設全開。</p>
      <div class="format-example">
        <strong>JSON 格式範例：</strong>
        <pre>{{ exampleJson }}</pre>
      </div>
      <div class="form-group">
        <label for="groupId">匯入到群組（可選，個別網站也可覆蓋）</label>
        <select id="groupId" v-model="selectedGroupId">
          <option :value="null">-- 未分組 --</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </div>
      <div class="form-group">
        <label for="json">JSON 內容</label>
        <textarea
          id="json"
          v-model="jsonText"
          rows="12"
          placeholder='[{"domain":"www.google.com"}]'
        ></textarea>
      </div>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      <div class="form-actions">
        <button type="button" class="btn btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" :disabled="submitting" @click="handleImport">
          {{ submitting ? '匯入中...' : '批量匯入' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

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

const exampleJson = `{
  "groupId": null,
  "sites": [
    {
      "domain": "www.google.com",
      "checkHttp": true,
      "checkHttps": true,
      "checkWhois": false,
      "httpCheckIntervalSeconds": 300,
      "failureThreshold": 3
    },
    {
      "domain": "example.com",
      "checkHttps": true,
      "httpCheckIntervalSeconds": 600,
      "tlsCheckIntervalDays": 1,
      "domainCheckIntervalDays": 7
    }
  ]
}`;

async function handleImport() {
  errorMsg.value = '';
  submitting.value = true;

  try {
    let parsed = JSON.parse(jsonText.value);

    // 支援兩種格式：直接陣列 或 { groupId, sites: [...] }
    let sites: any[];
    let groupId: string | null = selectedGroupId.value;

    if (Array.isArray(parsed)) {
      sites = parsed;
    } else if (parsed.sites && Array.isArray(parsed.sites)) {
      sites = parsed.sites;
      if (parsed.groupId) groupId = parsed.groupId;
    } else {
      throw new Error('JSON 格式錯誤：需為陣列或包含 sites 陣列的物件');
    }

    for (const s of sites) {
      if (!s.domain) throw new Error('每個網站都必須有 domain 欄位');
    }

    const { default: axios } = await import('axios');
    await axios.post('/api/sites/batch', { groupId, sites });
    emit('imported');
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      errorMsg.value = 'JSON 解析失敗，請確認格式是否正確';
    } else {
      errorMsg.value = err.message || '匯入失敗';
    }
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
.modal-content h2 {
  margin: 0 0 8px 0;
  font-size: 1.4rem;
  color: #1a1a2e;
}
.hint {
  margin: 0 0 16px 0;
  color: #888;
  font-size: 0.85rem;
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
