<!-- frontend/src/components/BulkEditModal.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <h2>批量修改監控項目 ({{ siteIds.length }} 個域名)</h2>
      <p class="hint">僅勾選的項目會被修改，未勾選的保持原值</p>

      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkHttp.enabled" /> HTTP 監控</label>
        <select v-if="fields.checkHttp.enabled" v-model="fields.checkHttp.value"><option :value="true">啟用</option><option :value="false">停用</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkHttps.enabled" /> HTTPS 監控</label>
        <select v-if="fields.checkHttps.enabled" v-model="fields.checkHttps.value"><option :value="true">啟用</option><option :value="false">停用</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkTls.enabled" /> TLS 檢查</label>
        <select v-if="fields.checkTls.enabled" v-model="fields.checkTls.value"><option :value="true">啟用</option><option :value="false">停用</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkWhois.enabled" /> WHOIS 檢查</label>
        <select v-if="fields.checkWhois.enabled" v-model="fields.checkWhois.value"><option :value="true">啟用</option><option :value="false">停用</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.httpInterval.enabled" /> HTTP 間隔 (秒)</label>
        <input v-if="fields.httpInterval.enabled" type="number" v-model.number="fields.httpInterval.value" min="60" />
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.failureThreshold.enabled" /> 失敗門檻</label>
        <input v-if="fields.failureThreshold.enabled" type="number" v-model.number="fields.failureThreshold.value" min="1" />
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="modal-actions">
        <button class="btn btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn btn-save" @click="save" :disabled="saving">{{ saving ? '儲存中...' : '套用修改' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import axios from 'axios';

const props = defineProps<{ siteIds: string[] }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const saving = ref(false);
const error = ref('');
const fields = reactive({
  checkHttp: { enabled: false, value: true },
  checkHttps: { enabled: false, value: true },
  checkTls: { enabled: false, value: true },
  checkWhois: { enabled: false, value: true },
  httpInterval: { enabled: false, value: 300 },
  failureThreshold: { enabled: false, value: 3 },
});

async function save() {
  error.value = '';
  const body: any = { siteIds: props.siteIds };
  if (fields.checkHttp.enabled) body.checkHttp = fields.checkHttp.value;
  if (fields.checkHttps.enabled) body.checkHttps = fields.checkHttps.value;
  if (fields.checkTls.enabled) body.checkTls = fields.checkTls.value;
  if (fields.checkWhois.enabled) body.checkWhois = fields.checkWhois.value;
  if (fields.httpInterval.enabled) body.httpCheckIntervalSeconds = fields.httpInterval.value;
  if (fields.failureThreshold.enabled) body.failureThreshold = fields.failureThreshold.value;

  saving.value = true;
  try {
    await axios.put('/api/sites/bulk', body);
    emit('saved');
  } catch (err: any) {
    error.value = err.response?.data?.message || '批量修改失敗';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #fff; border-radius: 12px; padding: 28px; width: 480px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-content h2 { margin: 0 0 8px 0; font-size: 1.2rem; color: #1a1a2e; }
.hint { font-size: 0.82rem; color: #888; margin: 0 0 20px 0; }
.bulk-field { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.bulk-field label { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; min-width: 150px; cursor: pointer; }
.bulk-field select, .bulk-field input[type="number"] { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; }
.error-msg { color: #e74c3c; font-size: 0.85rem; margin: 8px 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn { padding: 8px 18px; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
.btn-cancel { background: #f0f0f0; color: #555; }
.btn-save { background: #4361ee; color: #fff; }
.btn-save:disabled { opacity: 0.6; }
</style>
