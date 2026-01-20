import { createRouter, createWebHistory } from "vue-router";

// 创建路由器
export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/questionset'
    },
    {
      path: '/login',
      component: () => import('../page/login/index.vue')
    },
    {
      path: '/questionset',
      component: () => import('../page/questionset/index.vue')
    },
    {
      path: '/question/:question_id',
      component: () => import('../page/question/index.vue')
    }
  ]
})