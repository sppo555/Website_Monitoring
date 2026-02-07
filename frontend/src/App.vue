<!-- frontend/src/App.vue -->
<template>
  <LoginPage v-if="!isLoggedIn()" @logged-in="onLoggedIn" />
  <template v-else>
    <header>
      <div class="header-inner">
        <div class="header-top">
          <h1>🖥 {{ t('app.title') }}</h1>
          <div class="header-user">
            <span>{{ authState.user?.username }} ({{ authState.user?.role }})</span>
            <button class="btn-header btn-lang" @click="toggleLocale">{{ currentLocale === 'zh-TW' ? 'EN' : '中' }}</button>
            <button class="btn-header" @click="showChangePw = true">{{ t('app.changePassword') }}</button>
            <button class="btn-header" @click="handleLogout">{{ t('app.logout') }}</button>
          </div>
        </div>
        <nav class="nav-bar">
          <button class="nav-btn" :class="{ active: currentPage === 'dashboard' }" @click="currentPage = 'dashboard'">{{ t('nav.dashboard') }}</button>
          <button v-if="userIsAdmin" class="nav-btn" :class="{ active: currentPage === 'users' }" @click="currentPage = 'users'">{{ t('nav.users') }}</button>
          <button class="nav-btn" :class="{ active: currentPage === 'audit' }" @click="currentPage = 'audit'">{{ t('nav.audit') }}</button>
          <button v-if="userIsAdmin" class="nav-btn" :class="{ active: currentPage === 'telegram' }" @click="currentPage = 'telegram'">{{ t('nav.telegram') }}</button>
          <button v-if="userIsAdmin" class="nav-btn" :class="{ active: currentPage === 'retention' }" @click="currentPage = 'retention'">{{ t('nav.settings') }}</button>
        </nav>
      </div>
    </header>
    <main>
      <SiteList v-if="currentPage === 'dashboard'" />
      <UserManagement v-else-if="currentPage === 'users'" />
      <AuditLogPage v-else-if="currentPage === 'audit'" />
      <TelegramSettings v-else-if="currentPage === 'telegram'" />
      <RetentionSettings v-else-if="currentPage === 'retention'" />
    </main>
    <ChangePasswordModal v-if="showChangePw" @close="showChangePw = false" />
  </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SiteList from './components/SiteList.vue';
import TelegramSettings from './components/TelegramSettings.vue';
import LoginPage from './components/LoginPage.vue';
import UserManagement from './components/UserManagement.vue';
import AuditLogPage from './components/AuditLogPage.vue';
import RetentionSettings from './components/RetentionSettings.vue';
import ChangePasswordModal from './components/ChangePasswordModal.vue';
import { authState, isLoggedIn, logout, isAdmin } from './auth';
import { t, currentLocale, setLocale } from './i18n';

function toggleLocale() {
  setLocale(currentLocale.value === 'zh-TW' ? 'en' : 'zh-TW');
}

const loggedIn = ref(isLoggedIn());
const showChangePw = ref(false);
const currentPage = ref<'dashboard' | 'users' | 'audit' | 'telegram' | 'retention'>('dashboard');
const userIsAdmin = computed(() => isAdmin());

function onLoggedIn() {
  loggedIn.value = true;
}

function handleLogout() {
  logout();
  loggedIn.value = false;
}
</script>

<style scoped>
header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 16px 20px 0;
  color: #fff;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
}
h1 {
  font-weight: 700;
  font-size: 1.5rem;
  margin: 0;
}
.header-user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.82rem;
  opacity: 0.9;
}
.btn-header {
  padding: 4px 14px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s;
}
.btn-header:hover { background: rgba(255,255,255,0.25); }
.btn-lang { font-weight: 700; min-width: 32px; text-align: center; }
.nav-bar {
  display: flex;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.nav-btn {
  padding: 10px 18px;
  background: transparent;
  color: rgba(255,255,255,0.7);
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
.nav-btn.active {
  color: #fff;
  border-bottom-color: #4361ee;
  background: rgba(255,255,255,0.08);
}
main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}
</style>
