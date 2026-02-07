<!-- frontend/src/components/UserManagement.vue -->
<template>
  <div class="user-mgmt" v-if="isAdmin()">
    <details>
      <summary class="section-toggle">👥 使用者管理</summary>
      <div class="section-body">
        <div class="user-form">
          <h3>新增使用者</h3>
          <div class="form-row">
            <input v-model="newUser.username" placeholder="帳號" />
            <input v-model="newUser.password" type="password" placeholder="密碼" />
            <select v-model="newUser.role">
              <option value="admin">admin</option>
              <option value="allread">allread</option>
              <option value="onlyedit">onlyedit</option>
              <option value="onlyread">onlyread</option>
            </select>
            <button class="btn-add" @click="createUser" :disabled="creating">
              {{ creating ? '...' : '+ 新增' }}
            </button>
          </div>
          <div v-if="newUser.role === 'onlyedit' || newUser.role === 'onlyread'" class="group-assign">
            <label>指定群組：</label>
            <div class="group-checkboxes">
              <label v-for="g in groups" :key="g.id" class="cb-label">
                <input type="checkbox" :value="g.id" v-model="newUser.assignedGroupIds" />
                {{ g.name }}
              </label>
            </div>
          </div>
          <div v-if="formError" class="error-msg">{{ formError }}</div>
        </div>

        <table class="user-table" v-if="users.length > 0">
          <thead>
            <tr>
              <th>帳號</th>
              <th>角色</th>
              <th>指定群組</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.username }}</td>
              <td>
                <select v-model="u.role" @change="updateRole(u)" :disabled="u.username === 'admin'">
                  <option value="admin">admin</option>
                  <option value="allread">allread</option>
                  <option value="onlyedit">onlyedit</option>
                  <option value="onlyread">onlyread</option>
                </select>
              </td>
              <td>
                <template v-if="u.role === 'onlyedit' || u.role === 'onlyread'">
                  <div class="group-checkboxes-sm">
                    <label v-for="g in groups" :key="g.id" class="cb-label-sm">
                      <input type="checkbox" :value="g.id" v-model="u.assignedGroupIds" @change="updateGroups(u)" />
                      {{ g.name }}
                    </label>
                  </div>
                </template>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <button
                  v-if="u.username !== 'admin'"
                  class="btn-del"
                  @click="deleteUser(u)"
                >刪除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { isAdmin } from '../auth';

interface GroupItem { id: string; name: string; }
interface UserItem {
  id: string;
  username: string;
  role: string;
  assignedGroupIds: string[];
}

const users = ref<UserItem[]>([]);
const groups = ref<GroupItem[]>([]);
const creating = ref(false);
const formError = ref('');
const newUser = ref({
  username: '',
  password: '',
  role: 'onlyread' as string,
  assignedGroupIds: [] as string[],
});

async function fetchUsers() {
  try {
    const { data } = await axios.get('/api/auth/users');
    users.value = data;
  } catch {}
}

async function fetchGroups() {
  try {
    const { data } = await axios.get('/api/groups');
    groups.value = data;
  } catch {}
}

async function createUser() {
  formError.value = '';
  if (!newUser.value.username || !newUser.value.password) {
    formError.value = '帳號和密碼為必填';
    return;
  }
  creating.value = true;
  try {
    await axios.post('/api/auth/users', newUser.value);
    newUser.value = { username: '', password: '', role: 'onlyread', assignedGroupIds: [] };
    await fetchUsers();
  } catch (err: any) {
    formError.value = err.response?.data?.message || '建立失敗';
  } finally {
    creating.value = false;
  }
}

async function updateRole(u: UserItem) {
  try {
    await axios.put(`/api/auth/users/${u.id}`, { role: u.role, assignedGroupIds: u.assignedGroupIds });
  } catch {}
}

async function updateGroups(u: UserItem) {
  try {
    await axios.put(`/api/auth/users/${u.id}`, { assignedGroupIds: u.assignedGroupIds });
  } catch {}
}

async function deleteUser(u: UserItem) {
  if (!confirm(`確定要刪除使用者「${u.username}」嗎？`)) return;
  try {
    await axios.delete(`/api/auth/users/${u.id}`);
    await fetchUsers();
  } catch {}
}

onMounted(() => {
  fetchUsers();
  fetchGroups();
});
</script>

<style scoped>
.user-mgmt {
  margin-bottom: 20px;
}
.section-toggle {
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
  padding: 12px 0;
  user-select: none;
}
.section-body {
  padding: 16px 0;
}
.user-form h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #555;
}
.form-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.form-row input, .form-row select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}
.form-row input { flex: 1; min-width: 120px; }
.btn-add {
  padding: 8px 16px;
  background: #4361ee;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}
.btn-add:disabled { opacity: 0.6; }
.group-assign {
  margin-top: 10px;
}
.group-assign label {
  font-size: 0.85rem;
  color: #555;
}
.group-checkboxes, .group-checkboxes-sm {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.cb-label, .cb-label-sm {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
}
.error-msg {
  color: #e74c3c;
  font-size: 0.85rem;
  margin-top: 8px;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-size: 0.88rem;
}
.user-table th {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 2px solid #e8e8e8;
  color: #555;
  font-weight: 600;
}
.user-table td {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}
.user-table select {
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
}
.text-muted { color: #bbb; }
.btn-del {
  padding: 4px 10px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
}
.btn-del:hover { background: #c0392b; }
</style>
