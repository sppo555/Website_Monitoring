<!-- frontend/src/components/TelegramSettings.vue -->
<template>
  <div class="tg-settings">
    <div class="tg-header" @click="expanded = !expanded">
      <h3>{{ t('tg.title') }}</h3>
      <span class="toggle-icon">{{ expanded ? '▲' : '▼' }}</span>
    </div>

    <div v-if="expanded" class="tg-body">
      <div v-if="loading" class="loading-sm">{{ t('common.loading') }}</div>
      <template v-else>
        <div class="form-row-inline">
          <div class="form-group flex-1">
            <label>Bot Token</label>
            <input
              v-model="config.telegramBotToken"
              type="text"
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
            />
          </div>
          <div class="form-group flex-1">
            <label>Chat ID / Channel ID</label>
            <input
              v-model="config.telegramChatId"
              type="text"
              placeholder="-1001234567890"
            />
          </div>
        </div>

        <div class="form-row-inline">
          <div class="form-group">
            <label>{{ t('tg.tlsAlertDays') }}</label>
            <input v-model.number="config.tlsAlertDays" type="number" min="1" />
            <span class="hint">{{ t('tg.tlsAlertHint') }}</span>
          </div>
          <div class="form-group">
            <label>{{ t('tg.domainAlertDays') }}</label>
            <input v-model.number="config.domainAlertDays" type="number" min="1" />
            <span class="hint">{{ t('tg.domainAlertHint') }}</span>
          </div>
          <div class="form-group checkbox-group-tg">
            <label>
              <input type="checkbox" v-model="config.enabled" />
              {{ t('tg.enable') }}
            </label>
          </div>
        </div>

        <div class="tg-actions">
          <div v-if="statusMsg" class="status-msg" :class="statusOk ? 'status-ok' : 'status-err'">
            {{ statusMsg }}
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-sm" @click="testTelegram" :disabled="testing">
              {{ testing ? t('tg.testing') : t('tg.sendTest') }}
            </button>
            <button class="btn btn-primary-sm" @click="saveConfig" :disabled="saving">
              {{ saving ? t('common.saving') : t('tg.saveSettings') }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { t } from '../i18n';

const ALERT_API = '/api/alert';

const expanded = ref(false);
const loading = ref(true);
const saving = ref(false);
const testing = ref(false);
const statusMsg = ref('');
const statusOk = ref(false);

const config = reactive({
  telegramBotToken: '',
  telegramChatId: '',
  tlsAlertDays: 14,
  domainAlertDays: 30,
  enabled: false,
});

async function fetchConfig() {
  try {
    const { data } = await axios.get(`${ALERT_API}/config`);
    Object.assign(config, {
      telegramBotToken: data.telegramBotToken || '',
      telegramChatId: data.telegramChatId || '',
      tlsAlertDays: data.tlsAlertDays ?? 14,
      domainAlertDays: data.domainAlertDays ?? 30,
      enabled: data.enabled ?? false,
    });
  } catch (err) {
    console.error('獲取告警設定失敗:', err);
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  saving.value = true;
  statusMsg.value = '';
  try {
    await axios.put(`${ALERT_API}/config`, { ...config });
    statusMsg.value = t('tg.saved');
    statusOk.value = true;
  } catch (err) {
    statusMsg.value = t('tg.saveFailed');
    statusOk.value = false;
  } finally {
    saving.value = false;
    setTimeout(() => { statusMsg.value = ''; }, 3000);
  }
}

async function testTelegram() {
  testing.value = true;
  statusMsg.value = '';
  try {
    // 先儲存再測試
    await axios.put(`${ALERT_API}/config`, { ...config });
    const { data } = await axios.post(`${ALERT_API}/test`);
    statusMsg.value = data.success ? '✅ ' + data.message : '❌ ' + data.message;
    statusOk.value = data.success;
  } catch (err: any) {
    statusMsg.value = t('tg.testFailed');
    statusOk.value = false;
  } finally {
    testing.value = false;
    setTimeout(() => { statusMsg.value = ''; }, 5000);
  }
}

onMounted(fetchConfig);
</script>

<style scoped>
.tg-settings {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
}
.tg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}
.tg-header:hover { background: #f8f9fa; }
.tg-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1a1a2e;
}
.toggle-icon {
  font-size: 0.8rem;
  color: #888;
}
.tg-body {
  padding: 0 20px 20px;
  border-top: 1px solid #f0f0f0;
}
.loading-sm {
  padding: 20px;
  text-align: center;
  color: #888;
}
.form-row-inline {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.flex-1 { flex: 1; min-width: 200px; }
.form-group {
  margin-bottom: 8px;
}
.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #555;
  font-size: 0.85rem;
}
.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus {
  border-color: #4361ee;
  outline: none;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}
.hint {
  display: block;
  font-size: 0.72rem;
  color: #999;
  margin-top: 2px;
}
.checkbox-group-tg {
  display: flex;
  align-items: center;
}
.checkbox-group-tg label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
}
.checkbox-group-tg input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #4361ee;
}
.tg-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.btn-group {
  display: flex;
  gap: 8px;
}
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-primary-sm { background: #4361ee; color: #fff; }
.btn-primary-sm:hover { background: #3a56d4; }
.btn-primary-sm:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-outline-sm {
  background: #fff;
  border: 1px solid #ddd;
  color: #555;
}
.btn-outline-sm:hover { border-color: #4361ee; color: #4361ee; }
.btn-outline-sm:disabled { opacity: 0.6; cursor: not-allowed; }
.status-msg {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}
.status-ok { background: #d4edda; color: #155724; }
.status-err { background: #fde8e8; color: #e74c3c; }
</style>
