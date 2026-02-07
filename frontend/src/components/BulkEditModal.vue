<!-- frontend/src/components/BulkEditModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header-row">
        <h2>{{ t('bulk.title', { count: siteIds.length }) }}</h2>
        <button class="btn-close" @click="$emit('close')" :title="t('common.closeEsc')">&times;</button>
      </div>
      <p class="hint">{{ t('bulk.hint') }}</p>

      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkHttp.enabled" /> {{ t('bulk.httpMonitoring') }}</label>
        <select v-if="fields.checkHttp.enabled" v-model="fields.checkHttp.value"><option :value="true">{{ t('common.enable') }}</option><option :value="false">{{ t('common.disable') }}</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkHttps.enabled" /> {{ t('bulk.httpsMonitoring') }}</label>
        <select v-if="fields.checkHttps.enabled" v-model="fields.checkHttps.value"><option :value="true">{{ t('common.enable') }}</option><option :value="false">{{ t('common.disable') }}</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkTls.enabled" /> {{ t('bulk.tlsCheck') }}</label>
        <select v-if="fields.checkTls.enabled" v-model="fields.checkTls.value"><option :value="true">{{ t('common.enable') }}</option><option :value="false">{{ t('common.disable') }}</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.checkWhois.enabled" /> {{ t('bulk.whoisCheck') }}</label>
        <select v-if="fields.checkWhois.enabled" v-model="fields.checkWhois.value"><option :value="true">{{ t('common.enable') }}</option><option :value="false">{{ t('common.disable') }}</option></select>
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.httpInterval.enabled" /> {{ t('bulk.httpIntervalSec') }}</label>
        <input v-if="fields.httpInterval.enabled" type="number" v-model.number="fields.httpInterval.value" min="60" />
      </div>
      <div class="bulk-field">
        <label><input type="checkbox" v-model="fields.failureThreshold.enabled" /> {{ t('bulk.failureThreshold') }}</label>
        <input v-if="fields.failureThreshold.enabled" type="number" v-model.number="fields.failureThreshold.value" min="1" />
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="modal-actions">
        <button class="btn btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
        <button class="btn btn-save" @click="save" :disabled="saving">{{ saving ? t('common.saving') : t('bulk.apply') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { t } from '../i18n';

const props = defineProps<{ siteIds: string[] }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>();

const saving = ref(false);
const error = ref('');

function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') emit('close'); }
onMounted(() => window.addEventListener('keydown', onEsc));
onUnmounted(() => window.removeEventListener('keydown', onEsc));
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
    error.value = err.response?.data?.message || t('bulk.failed');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #fff; border-radius: 12px; padding: 28px; width: 480px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.modal-header-row h2 { margin: 0; font-size: 1.2rem; color: #1a1a2e; }
.btn-close { background: none; border: none; font-size: 1.6rem; color: #999; cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1; transition: all 0.2s; }
.btn-close:hover { background: #f0f0f0; color: #333; }
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
