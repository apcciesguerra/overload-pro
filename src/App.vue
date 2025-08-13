<template>
  <div id="app">
    <nav v-if="authStore.user" class="navbar">
      <div class="nav-brand">
        <h1>Overload Pro</h1>
      </div>
      <div class="nav-links">
        <router-link to="/workouts">Workouts</router-link>
        <router-link to="/profile">Profile</router-link>
        <button @click="authStore.signOut" class="logout-btn">Logout</button>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { useAuthStore } from './store/useAuthStore'

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore()
    return { authStore }
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #1a1a1a;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #3b82f6;
}

.logout-btn {
  background: none;
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background-color: #ef4444;
  color: white;
}

.main-content {
  min-height: calc(100vh - 80px);
  padding: 2rem;
}
</style> 