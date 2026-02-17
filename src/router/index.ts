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
      path: '/change-password',
      component: () => import('../page/change-password/index.vue')
    },
    {
      path: '/questionset',
      component: () => import('../page/questionset/index.vue')
    },
    {
      path: '/question/:question_id',
      component: () => import('../page/question/index.vue')
    },
    {
      path: '/question/:question_id/:tab',
      component: () => import('../page/question/index.vue')
    },
    {
      path: '/question/:question_id/solution-editor',
      component: () => import('../page/solution-editor/index.vue')
    },
    {
      path: '/admin',
      component: () => import('../page/admin/index.vue')
    },
    {
      path: '/admin/question/create',
      component: () => import('../page/admin/question-editor/index.vue')
    },
    {
      path: '/admin/question/edit/:id',
      component: () => import('../page/admin/question-editor/index.vue')
    },
    {
      path: '/admin/question/:id/testcases',
      component: () => import('../page/admin/testcase-editor/index.vue')
    }
  ]
})
