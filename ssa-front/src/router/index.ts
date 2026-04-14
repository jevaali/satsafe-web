import DashboardView from '@/views/DashboardView.vue'
import SatelliteView from '@/views/SatelliteView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/satellites/:id',
    name: 'Satellite',
    component: SatelliteView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresGuest: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const isAuth = auth.isAuthenticated

  if (to.meta.requiresAuth && !isAuth) {
    return '/login'
  }

  if (to.meta.requiresGuest && isAuth) {
    return '/'
  }
})

export default router
