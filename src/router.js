import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './store/useAuthStore'

// Import pages
import Auth from './pages/Auth.vue'
import Workouts from './pages/Workouts.vue'
import Profile from './pages/Profile.vue'

const routes = [
  {
    path: '/',
    redirect: '/workouts'
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
    meta: { requiresGuest: true }
  },
  {
    path: '/workouts',
    name: 'Workouts',
    component: Workouts,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.user) {
    next('/auth')
  } else if (to.meta.requiresGuest && authStore.user) {
    next('/workouts')
  } else {
    next()
  }
})

export default router 