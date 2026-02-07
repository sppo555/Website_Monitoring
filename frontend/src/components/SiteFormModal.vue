<!-- frontend/src/components/SiteFormModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header-row">
        <h2>{{ isEdit ? t('siteForm.editTitle') : t('siteForm.addTitle') }}</h2>
        <button class="btn-close" @click="$emit('close')" :title="t('common.closeEsc')">&times;</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="domain">{{ t('siteForm.domain') }}</label>
          <input
            id="domain"
            v-model="form.domain"
            type="text"
            placeholder="www.google.com"
            required
          />
          <span class="hint">{{ t('siteForm.domainHint') }}</span>
        </div>
        <div class="form-group">
          <label>{{ t('siteForm.groups') }}</label>
          <div class="group-checkboxes">
            <label v-for="g in groups" :key="g.id" class="cb-label">
              <input type="checkbox" :value="g.id" v-model="form.groupIds" />
              {{ g.name }}
            </label>
          </div>
          <span v-if="groups.length === 0" class="hint">{{ t('siteForm.noGroups') }}</span>
        </div>
        <div class="form-section-label">{{ t('siteForm.protocolMonitoring') }}</div>
        <div class="form-row">
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.checkHttp" />
              HTTP
            </label>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.checkHttps" @change="onHttpsChange" />
              HTTPS
            </label>
          </div>
        </div>
        <div class="form-section-label">{{ t('siteForm.additionalMonitoring') }}</div>
        <div class="form-row">
          <div class="form-group checkbox-group">
            <label :class="{ disabled: form.checkHttps }">
              <input type="checkbox" v-model="form.checkTls" :disabled="form.checkHttps" />
              {{ t('siteForm.tlsExpiry') }}
            </label>
            <span v-if="form.checkHttps" class="auto-hint">{{ t('siteForm.httpsAutoEnabled') }}</span>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="form.checkWhois" />
              {{ t('siteForm.whoisExpiry') }}
            </label>
          </div>
        </div>

        <div class="form-section-label">{{ t('siteForm.intervalAlerts') }}</div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>{{ t('siteForm.httpInterval') }}</label>
            <input v-model.number="form.httpCheckIntervalSeconds" type="number" min="60" placeholder="300" />
            <span class="hint">{{ t('siteForm.minSeconds') }}</span>
          </div>
          <div class="form-group flex-1">
            <label>{{ t('siteForm.failureThreshold') }}</label>
            <input v-model.number="form.failureThreshold" type="number" min="1" placeholder="3" />
            <span class="hint">{{ t('siteForm.consecFailures') }}</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>{{ t('siteForm.tlsInterval') }}</label>
            <input v-model.number="form.tlsCheckIntervalDays" type="number" min="1" placeholder="1" />
            <span class="hint">{{ t('siteForm.minDays') }}</span>
          </div>
          <div class="form-group flex-1">
            <label>{{ t('siteForm.whoisInterval') }}</label>
            <input v-model.number="form.domainCheckIntervalDays" type="number" min="1" placeholder="1" />
            <span class="hint">{{ t('siteForm.minDays') }}</span>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? t('common.processing') : (isEdit ? t('common.update') : t('common.add')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { t } from '../i18n';

interface GroupItem {
  id: string;
  name: string;
}

interface SiteForm {
  domain: string;
  checkHttp: boolean;
  checkHttps: boolean;
  checkTls: boolean;
  checkWhois: boolean;
  httpCheckIntervalSeconds: number;
  tlsCheckIntervalDays: number;
  domainCheckIntervalDays: number;
  failureThreshold: number;
  groupIds: string[];
}

const props = defineProps<{
  isEdit: boolean;
  groups: GroupItem[];
  initialData?: Partial<SiteForm>;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', data: SiteForm): void;
}>();

const submitting = ref(false);

const form = reactive<SiteForm>({
  domain: props.initialData?.domain || '',
  checkHttp: props.initialData?.checkHttp ?? true,
  checkHttps: props.initialData?.checkHttps ?? true,
  checkTls: props.initialData?.checkTls ?? true,
  checkWhois: props.initialData?.checkWhois ?? true,
  httpCheckIntervalSeconds: props.initialData?.httpCheckIntervalSeconds || 300,
  tlsCheckIntervalDays: props.initialData?.tlsCheckIntervalDays || 1,
  domainCheckIntervalDays: props.initialData?.domainCheckIntervalDays || 1,
  failureThreshold: props.initialData?.failureThreshold || 3,
  groupIds: (props.initialData as any)?.groupIds ?? [],
});

function onHttpsChange() {
  if (form.checkHttps) {
    form.checkTls = true;
  }
}

async function handleSubmit() {
  submitting.value = true;
  if (form.checkHttps) form.checkTls = true;
  // 自動去除 http:// https:// 前綴
  form.domain = form.domain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
  emit('submit', { ...form });
}

function resetSubmitting() {
  submitting.value = false;
}

defineExpose({ resetSubmitting });

function onEsc(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}
onMounted(() => window.addEventListener('keydown', onEsc));
onUnmounted(() => window.removeEventListener('keydown', onEsc));
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
  width: 560px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.modal-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.modal-header-row h2 {
  margin: 0;
  font-size: 1.4rem;
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
.form-group input[type="text"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
  background: #fff;
}
.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group select:focus {
  border-color: #4361ee;
  outline: none;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}
.form-section-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}
.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #555;
}
.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4361ee;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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
.btn-primary {
  background: #4361ee;
  color: #fff;
}
.btn-primary:hover { background: #3a56d4; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-cancel {
  background: #f0f0f0;
  color: #555;
}
.btn-cancel:hover { background: #e0e0e0; }
.hint {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  color: #999;
}
.auto-hint {
  font-size: 0.75rem;
  color: #4361ee;
  margin-left: 4px;
}
.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.flex-1 { flex: 1; min-width: 140px; }
.group-checkboxes { display: flex; gap: 12px; flex-wrap: wrap; padding: 8px 0; }
.cb-label { display: flex; align-items: center; gap: 5px; font-size: 0.88rem; color: #555; cursor: pointer; }
.cb-label input[type="checkbox"] { width: 15px; height: 15px; accent-color: #4361ee; }
</style>
