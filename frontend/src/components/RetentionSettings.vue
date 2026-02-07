<!-- frontend/src/components/RetentionSettings.vue -->
<template>
  <div class="retention-page">
    <h2>{{ t('retention.title') }}</h2>

    <div class="setting-card">
      <h3>{{ t('retention.auditCleanup') }}</h3>
      <div class="setting-row">
        <label class="toggle-label">
          <input type="checkbox" v-model="form.auditLogEnabled" />
          {{ t('retention.enableAuditCleanup') }}
        </label>
      </div>
      <div v-if="form.auditLogEnabled" class="setting-row">
        <label>{{ t('retention.retentionDays') }}</label>
        <input type="number" v-model.number="form.auditLogRetentionDays" min="1" max="365" class="num-input" />
        <span class="hint">{{ t('retention.auditHint') }}</span>
      </div>
    </div>

    <div class="setting-card">
      <h3>{{ t('retention.checkResultCleanup') }}</h3>
      <div class="setting-row">
        <label class="toggle-label">
          <input type="checkbox" v-model="form.checkResultEnabled" />
          {{ t('retention.enableCheckCleanup') }}
        </label>
      </div>
      <div v-if="form.checkResultEnabled" class="setting-row">
        <label>{{ t('retention.retentionDays') }}</label>
        <input type="number" v-model.number="form.checkResultRetentionDays" min="1" max="365" class="num-input" />
        <span class="hint">{{ t('retention.checkHint') }}</span>
      </div>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
    <div v-if="success" class="success-msg">{{ success }}</div>

    <div class="actions">
      <button class="btn btn-save" @click="save" :disabled="saving">{{ saving ? t('common.saving') : t('retention.saveBtn') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { t } from '../i18n';

const form = reactive({
  auditLogEnabled: false,
  auditLogRetentionDays: 30,
  checkResultEnabled: false,
  checkResultRetentionDays: 14,
});

const saving = ref(false);
const error = ref('');
const success = ref('');

async function fetchConfig() {
  try {
    const { data } = await axios.get('/api/retention/config');
    form.auditLogEnabled = data.auditLogEnabled ?? false;
    form.auditLogRetentionDays = data.auditLogRetentionDays ?? 30;
    form.checkResultEnabled = data.checkResultEnabled ?? false;
    form.checkResultRetentionDays = data.checkResultRetentionDays ?? 14;
  } catch {
    // defaults
  }
}

async function save() {
  error.value = '';
  success.value = '';
  saving.value = true;
  try {
    await axios.put('/api/retention/config', { ...form });
    success.value = t('retention.saved');
    setTimeout(() => { success.value = ''; }, 3000);
  } catch (err: any) {
    error.value = err.response?.data?.message || t('retention.saveFailed');
  } finally {
    saving.value = false;
  }
}

onMounted(fetchConfig);
</script>

<style scoped>
.retention-page h2 { margin: 0 0 24px 0; font-size: 1.4rem; color: #1a1a2e; }
.setting-card { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
.setting-card h3 { margin: 0 0 16px 0; font-size: 1.1rem; color: #333; }
.setting-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.setting-row label { font-size: 0.9rem; color: #555; font-weight: 500; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.92rem; }
.toggle-label input[type="checkbox"] { width: 18px; height: 18px; accent-color: #4361ee; }
.num-input { width: 80px; padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; text-align: center; }
.num-input:focus { border-color: #4361ee; outline: none; }
.hint { font-size: 0.8rem; color: #999; }
.error-msg { color: #e74c3c; font-size: 0.88rem; margin-bottom: 12px; }
.success-msg { color: #2ecc71; font-size: 0.88rem; margin-bottom: 12px; }
.actions { margin-top: 8px; }
.btn { padding: 10px 24px; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 500; cursor: pointer; }
.btn-save { background: #4361ee; color: #fff; }
.btn-save:hover { background: #3a56d4; }
.btn-save:disabled { opacity: 0.6; }
</style>
