<!-- frontend/src/App.vue -->
<template>
  <header>
    <h1>Alexander 網站監控系統</h1>
  </header>
  <main>
    <SiteList />
  </main>
</template>

<script setup lang="ts">
import SiteList from './components/SiteList.vue';
// 這裡可以加入狀態或邏輯
</script>

<style scoped>
header {
  line-height: 1.5;
  background-color: #f5f5f5;
  padding: 20px;
  text-align: center;
}
h1 {
  font-weight: 500;
  font-size: 2.6rem;
}
main {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
