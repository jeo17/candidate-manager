import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/candidatures' },
    {
      path: '/candidatures',
      name: 'candidates',
      component: () => import('@/pages/CandidatesPage.vue'),
    },
    {
      path: '/candidatures/nouvelle',
      name: 'candidate-create',
      component: () => import('@/pages/CandidateEditorPage.vue'),
    },
    {
      path: '/candidatures/:id/modifier',
      name: 'candidate-edit',
      component: () => import('@/pages/CandidateEditorPage.vue'),
      props: true,
    },
    {
      path: '/candidatures/:id',
      name: 'candidate-detail',
      component: () => import('@/pages/CandidateDetailPage.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
