<!-- frontend/src/App.vue -->
<template>
  <LoginPage v-if="!isLoggedIn()" @logged-in="onLoggedIn" />
  <template v-else>
    <header>
      <div class="header-inner">
        <h1>🖥 Alexander 網站監控系統</h1>
        <p class="subtitle">即時監控 HTTP 狀態 · TLS 證書 · 域名到期</p>
        <div class="header-user">
          <span>{{ authState.user?.username }} ({{ authState.user?.role }})</span>
          <button class="btn-header" @click="showChangePw = true">改密碼</button>
          <button class="btn-header btn-logout" @click="handleLogout">登出</button>
        </div>
      </div>
    </header>
    <main>
      <UserManagement />
      <AuditLogPanel />
      <TelegramSettings v-if="isAdmin()" />
      <SiteList />
    </main>
    <ChangePasswordModal v-if="showChangePw" @close="showChangePw = false" />
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SiteList from './components/SiteList.vue';
import TelegramSettings from './components/TelegramSettings.vue';
import LoginPage from './components/LoginPage.vue';
import UserManagement from './components/UserManagement.vue';
import AuditLogPanel from './components/AuditLogPanel.vue';
import ChangePasswordModal from './components/ChangePasswordModal.vue';
import { authState, isLoggedIn, logout, isAdmin } from './auth';

const loggedIn = ref(isLoggedIn());
const showChangePw = ref(false);

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
  padding: 28px 20px;
  text-align: center;
  color: #fff;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
}
h1 {
  font-weight: 700;
  font-size: 1.8rem;
  margin: 0;
}
.subtitle {
  margin: 6px 0 0 0;
  font-size: 0.9rem;
  opacity: 0.7;
}
.header-user {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 0.85rem;
  opacity: 0.9;
}
.btn-header {
  padding: 4px 14px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  transition: background 0.2s;
}
.btn-header:hover { background: rgba(255,255,255,0.25); }
main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px;
}
</style>
