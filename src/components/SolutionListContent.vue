<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElSelect, ElOption, ElTable, ElMessage } from 'element-plus'
import { pageSolutionService, type Solution } from '@/requests/solution'
import likeSvg from '@/assets/like.svg'
import likeFilledSvg from '@/assets/like_filled.svg'

type OrderByType = 'update_time' | 'like_num'

interface Props {
  questionId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'view-detail': [solution: Solution]
}>()

const router = useRouter()

const loading = ref(false)
const loadingMore = ref(false)
const solutions = ref<Solution[]>([])
const orderBy = ref<OrderByType>('like_num')

const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const hasMore = ref(true)

const loadSolutions = async (reset = false) => {
  if (reset) {
    pageNum.value = 1
    solutions.value = []
    hasMore.value = true
    loading.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const res = await pageSolutionService({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: orderBy.value,
      questionId: props.questionId
    })

    if (reset) {
      solutions.value = res.data.data.solutions
    } else {
      solutions.value.push(...res.data.data.solutions)
    }

    total.value = res.data.data.total
    hasMore.value = solutions.value.length < total.value
  } catch (error) {
    ElMessage.error('获取题解失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const handleOrderChange = (value: OrderByType) => {
  orderBy.value = value
  loadSolutions(true)
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleScroll = async (event: Event) => {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target

  const isNearBottom = scrollHeight - scrollTop <= clientHeight + 50

  if (isNearBottom && hasMore.value && !loadingMore.value && !loading.value) {
    pageNum.value++
    await loadSolutions(false)
  }
}

const checkAndLoadMore = (container: HTMLElement) => {
  const check = () => {
    const { scrollHeight, clientHeight } = container

    if (scrollHeight <= clientHeight && hasMore.value && !loadingMore.value && !loading.value) {
      pageNum.value++
      loadSolutions(false).then(() => {
        nextTick(() => {
          check()
        })
      })
    }
  }
  check()
}

const goToSolutionEditor = () => {
  router.push(`/question/${props.questionId}/solution-editor`)
}

// 初始化加载数据
loadSolutions(true)

nextTick(() => {
  const container = document.querySelector('.solution-list-container') as HTMLElement
  if (container) {
    container.addEventListener('scroll', handleScroll)
    checkAndLoadMore(container)
  }
})
</script>

<template>
  <div class="solution-list">
    <div class="header">
      <div class="sort-options">
        <span class="sort-label">排序：</span>
        <el-select v-model="orderBy" @change="handleOrderChange" style="width: 120px">
          <el-option label="最热" value="like_num" />
          <el-option label="最新" value="update_time" />
        </el-select>
        <el-button type="primary" @click="goToSolutionEditor" class="publish-btn">
          发布题解
        </el-button>
      </div>
    </div>

    <div class="solution-list-container">
      <div v-show="loading" class="loading-wrapper">
        <div class="loading-icon">🔄</div>
        <p>加载中...</p>
      </div>

      <template v-if="!loading">
        <el-table v-if="solutions.length > 0" :data="solutions" style="width: 100%"
          @row-click="(row) => emit('view-detail', row)" :show-header="true" :border="true">
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="user.username" label="作者" min-width="120" />
          <el-table-column prop="likeNum" label="点赞数" width="100">
            <template #default="{ row }">
              <span class="like-count"><img :src="likeFilledSvg" alt="like" style="width: 16px; height: 16px;" /> {{ row.likeNum }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" min-width="180">
            <template #default="{ row }">
              {{ formatDate(row.updateTime) }}
            </template>
          </el-table-column>
        </el-table>

        <div v-show="loadingMore" class="loading-more">
          <span class="loading-icon spinning">🔄</span>
          <span>加载中...</span>
        </div>

        <div v-show="!loading && !loadingMore && !hasMore && solutions.length === 0"
          class="empty-state">
          <div class="icon">💡</div>
          <p>暂无题解</p>
          <p class="tip">成为第一个分享题解的人吧</p>
        </div>

        <div v-show="!loading && !loadingMore && !hasMore && solutions.length > 0" class="no-more">
          没有更多了
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.solution-list {
  display: flex;
  flex-direction: column;
  height: 100%;

  .header {
    padding: 16px;
    border-bottom: 1px solid #e8e8e8;
    background: #fafafa;

    .sort-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;

      .sort-label {
        font-size: 14px;
        color: #666;
      }

      .publish-btn {
        margin-left: auto;
      }
    }
  }

  .solution-list-container {
    flex: 1;
    overflow-y: auto;
    position: relative;

    .loading-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #999;

      .loading-icon {
        font-size: 32px;
        margin-bottom: 12px;

        &.spinning {
          animation: spin 1s linear infinite;
        }
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      gap: 8px;
      color: #999;
      font-size: 14px;

      .loading-icon {
        font-size: 18px;

        &.spinning {
          animation: spin 1s linear infinite;
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #999;

      .icon {
        font-size: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      p {
        margin: 4px 0;
        font-size: 14px;

        &.tip {
          font-size: 12px;
          opacity: 0.7;
        }
      }
    }

    .no-more {
      text-align: center;
      padding: 16px;
      color: #999;
      font-size: 14px;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
}

:deep(.el-table) {
  cursor: pointer;

  tr:hover {
    background-color: #f5f7fa;
  }
}

.like-count {
  font-weight: 500;
}
</style>
