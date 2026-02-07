<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SolutionListContent from './SolutionListContent.vue'
import SolutionDetail from './SolutionDetail.vue'
import type { Solution } from '@/requests/solution'

interface Props {
  questionId: number
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

// 从 URL 查询参数获取 solutionId
const solutionId = computed(() => {
  const id = route.query.solution_id as string
  return id ? parseInt(id) : null
})

// 查看题解详情
const viewDetail = (solution: Solution) => {
  router.push({
    query: { solution_id: solution.id }
  })
}
</script>

<template>
  <div class="solution-list">
    <!-- 题解列表 -->
    <SolutionListContent
      v-if="!solutionId"
      :question-id="questionId"
      @view-detail="viewDetail"
    />

    <!-- 题解详情 -->
    <SolutionDetail
      v-else-if="solutionId"
      :solution-id="solutionId"
    />
  </div>
</template>

<style lang="scss" scoped>
.solution-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>

