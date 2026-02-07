<!-- frontend/src/components/LoginPage.vue -->
<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1>🖥 網站監控系統</h1>
      <p class="subtitle">Website Monitoring System</p>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>帳號</label>
          <input v-model="username" type="text" placeholder="Username" required autofocus />
        </div>
        <div class="form-group">
          <label>密碼</label>
          <input v-model="password" type="password" placeholder="Password" required />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { login } from '../auth';

const emit = defineEmits<{ (e: 'loggedIn'): void }>();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await login(username.value, password.value);
    emit('loggedIn');
  } catch (err: any) {
    error.value = err.response?.data?.message || '登入失敗';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  text-align: center;
}
.login-card h1 {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  color: #1a1a2e;
}
.subtitle {
  color: #888;
  font-size: 0.85rem;
  margin: 0 0 32px 0;
}
.form-group {
  margin-bottom: 18px;
  text-align: left;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}
.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.form-group input:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}
.error-msg {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-bottom: 12px;
}
.btn-login {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;
}
.btn-login:hover { opacity: 0.9; }
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
