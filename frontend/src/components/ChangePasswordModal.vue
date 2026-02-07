<!-- frontend/src/components/ChangePasswordModal.vue -->
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header-row">
        <h2>{{ t('changePw.title') }}</h2>
        <button class="btn-close" @click="$emit('close')" :title="t('common.closeEsc')">&times;</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>{{ t('changePw.oldPassword') }}</label>
          <input v-model="oldPassword" type="password" required />
        </div>
        <div class="form-group">
          <label>{{ t('changePw.newPassword') }}</label>
          <input v-model="newPassword" type="password" required minlength="4" />
        </div>
        <div class="form-group">
          <label>{{ t('changePw.confirmPassword') }}</label>
          <input v-model="confirmPassword" type="password" required />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <div v-if="success" class="success-msg">{{ success }}</div>
        <div class="modal-actions">
          <button type="button" class="btn btn-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn btn-save" :disabled="saving">{{ saving ? t('common.saving') : t('changePw.submit') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { t } from '../i18n';

const emit = defineEmits<{ (e: 'close'): void }>();

const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref('');
const saving = ref(false);

function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') emit('close'); }
onMounted(() => window.addEventListener('keydown', onEsc));
onUnmounted(() => window.removeEventListener('keydown', onEsc));

async function handleSubmit() {
  error.value = '';
  success.value = '';
  if (newPassword.value !== confirmPassword.value) {
    error.value = t('changePw.mismatch');
    return;
  }
  if (newPassword.value.length < 4) {
    error.value = t('changePw.tooShort');
    return;
  }
  saving.value = true;
  try {
    await axios.put('/api/auth/change-password', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    });
    success.value = t('changePw.success');
    oldPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    setTimeout(() => emit('close'), 1500);
  } catch (err: any) {
    error.value = err.response?.data?.message || t('changePw.failed');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: #fff; border-radius: 12px; padding: 28px; width: 400px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.modal-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header-row h2 { margin: 0; font-size: 1.2rem; color: #1a1a2e; }
.btn-close { background: none; border: none; font-size: 1.6rem; color: #999; cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1; transition: all 0.2s; }
.btn-close:hover { background: #f0f0f0; color: #333; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; margin-bottom: 4px; font-size: 0.85rem; color: #555; font-weight: 500; }
.form-group input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box; }
.form-group input:focus { border-color: #4361ee; outline: none; }
.error-msg { color: #e74c3c; font-size: 0.85rem; margin-bottom: 10px; }
.success-msg { color: #2ecc71; font-size: 0.85rem; margin-bottom: 10px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.btn { padding: 8px 18px; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
.btn-cancel { background: #f0f0f0; color: #555; }
.btn-save { background: #4361ee; color: #fff; }
.btn-save:disabled { opacity: 0.6; }
</style>
