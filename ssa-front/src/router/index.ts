import LoginView from '@/views/Login-View.vue'
import MainView from '@/views/Main-View.vue'
import RegisterView from '@/views/Register-View.vue'
import NotFoundView from '@/views/NotFound-View.vue'

import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth-store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: MainView,
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
  routes: routes,
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
