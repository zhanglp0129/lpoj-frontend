<script lang="ts" setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElSelect, ElOption, ElTable, ElMessage, ElTooltip } from 'element-plus'
import { pageSolutionService, getSolutionByIdService, querySolutionLikeService, likeSolutionService, type Solution } from '@/requests/solution'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import cpp from 'highlight.js/lib/languages/cpp'
import c from 'highlight.js/lib/languages/c'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import likeSvg from '@/assets/like.svg'
import likeFilledSvg from '@/assets/like_filled.svg'

hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', c)
hljs.registerLanguage('java', java)
hljs.registerLanguage('python', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)

type OrderByType = 'update_time' | 'like_num'

interface Props {
  questionId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const loadingMore = ref(false)
const solutions = ref<Solution[]>([])
const orderBy = ref<OrderByType>('like_num')

const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const hasMore = ref(true)

const isDetailView = ref(false)
const scrollPosition = ref(0)
const currentSolution = ref<Solution | null>(null)
const isLiked = ref(false)
const isLiking = ref(false)
const loadingDetail = ref(false)

const renderMarkdownWithMath = (markdown: string) => {
  const renderMath = (expression: string, displayMode: boolean) => {
    try {
      return katex.renderToString(expression, {
        displayMode,
        throwOnError: false
      })
    } catch (e) {
      return expression
    }
  }

  let rendered = markdown

  rendered = rendered.replace(/\$\$([^$]+)\$\$/g, (_, expr) => {
    return renderMath(expr.trim(), true)
  })

  rendered = rendered.replace(/\$([^$]+)\$/g, (_, expr) => {
    return renderMath(expr.trim(), false)
  })

  return marked.parse(rendered)
}

const renderedContent = computed(() => {
  if (!currentSolution.value?.content) return ''
  return renderMarkdownWithMath(currentSolution.value.content)
})

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

const showDetail = async (solution: Solution) => {
  const container = document.querySelector('.solution-list-container') as HTMLElement
  if (container) {
    scrollPosition.value = container.scrollTop
  }
  isDetailView.value = true
  loadingDetail.value = true

  try {
    const [solutionRes, likeRes] = await Promise.all([
      getSolutionByIdService(solution.id),
      querySolutionLikeService(solution.id)
    ])
    currentSolution.value = solutionRes.data.data
    isLiked.value = likeRes.data.data.liked
  } catch (error) {
    ElMessage.error('获取题解详情失败')
  } finally {
    loadingDetail.value = false
  }
}

const backToList = () => {
  isDetailView.value = false
  nextTick(() => {
    const container = document.querySelector('.solution-list-container') as HTMLElement
    if (container) {
      container.scrollTop = scrollPosition.value
    }
  })
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

const handleLike = async () => {
  if (!currentSolution.value || isLiking.value) return

  isLiking.value = true
  try {
    const cancel = isLiked.value
    const res = await likeSolutionService(currentSolution.value.id, cancel)

    if (currentSolution.value) {
      currentSolution.value.likeNum = res.data.data.solutionLikeNum
    }

    isLiked.value = !cancel
    ElMessage.success(cancel ? '已取消点赞' : '点赞成功')
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    isLiking.value = false
  }
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

onMounted(() => {
  loadSolutions(true)

  nextTick(() => {
    const container = document.querySelector('.solution-list-container') as HTMLElement
    if (container) {
      container.addEventListener('scroll', handleScroll)
      checkAndLoadMore(container)
    }
  })
})

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
</script>

<template>
  <div class="solution-list">
    <div class="header">
      <div v-show="!isDetailView" class="sort-options">
        <span class="sort-label">排序：</span>
        <el-select v-model="orderBy" @change="handleOrderChange" style="width: 120px">
          <el-option label="最热" value="like_num" />
          <el-option label="最新" value="update_time" />
        </el-select>
      </div>
      <div v-show="isDetailView" class="back-nav">
        <span class="back-icon" @click="backToList">←</span>
        <span class="back-text" @click="backToList">全部题解</span>
      </div>
    </div>

    <div class="solution-list-container">
      <div v-show="loading" class="loading-wrapper">
        <div class="loading-icon">🔄</div>
        <p>加载中...</p>
      </div>

      <template v-if="!loading && !loadingDetail">
        <el-table v-show="!isDetailView && solutions.length > 0" :data="solutions" style="width: 100%"
          @row-click="showDetail" :show-header="true" :border="true">
          <el-table-column prop="id" label="题解ID" width="80" />
          <el-table-column prop="title" label="标题" min-width="200" />
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

        <div v-show="loadingMore && !isDetailView" class="loading-more">
          <span class="loading-icon spinning">🔄</span>
          <span>加载中...</span>
        </div>

        <div v-show="!loading && !loadingMore && !hasMore && solutions.length === 0 && !isDetailView"
          class="empty-state">
          <div class="icon">💡</div>
          <p>暂无题解</p>
          <p class="tip">成为第一个分享题解的人吧</p>
        </div>

        <div v-show="!loading && !loadingMore && !hasMore && solutions.length > 0 && !isDetailView" class="no-more">
          没有更多了
        </div>

        <div v-if="loadingDetail" class="loading-wrapper">
          <div class="loading-icon">🔄</div>
          <p>加载中...</p>
        </div>

        <div v-show="isDetailView && currentSolution" class="solution-detail">
          <div class="detail-content">
            <div class="detail-header">
              <h3>{{ currentSolution?.title }}</h3>
              <div class="meta-info">
                <el-tooltip :content="isLiked ? '取消点赞' : '点赞'" placement="top">
                  <div class="like-icon" @click="handleLike" :class="{ 'liking': isLiking }">
                    <img :src="isLiked ? likeFilledSvg : likeSvg" alt="like" />
                    <span class="like-count">{{ currentSolution?.likeNum }}</span>
                  </div>
                </el-tooltip>
                <span class="time-badge">{{ formatDate(currentSolution?.updateTime || 0) }}</span>
              </div>
            </div>
            <div class="content-wrapper">
              <div class="markdown-content" v-html="renderedContent"></div>
            </div>
          </div>
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
      gap: 12px;

      .sort-label {
        font-size: 14px;
        color: #666;
      }
    }

    .back-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .back-icon {
        font-size: 18px;
        color: #1890ff;
        padding: 4px;
      }

      .back-text {
        font-size: 14px;
        color: #1890ff;
      }

      &:hover .back-icon,
      &:hover .back-text {
        color: #40a9ff;
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

  .solution-detail {
    padding: 16px;
    overflow-y: auto;
    flex: 1;
  }

  .detail-content {
    .detail-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e8e8e8;

      h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
      }

      .meta-info {
        display: flex;
        gap: 16px;
        align-items: center;

        .like-badge,
        .time-badge {
          display: inline-flex;
          align-items: center;
          font-size: 14px;
          color: #666;
        }

        .like-icon {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          background: #f5f7fa;
          user-select: none;

          &:hover {
            background: #e6f7ff;
          }

          &.liking {
            opacity: 0.6;
            cursor: not-allowed;
          }

          img {
            width: 20px;
            height: 20px;
          }

          .like-count {
            font-size: 14px;
            color: #666;
            font-weight: 500;
          }
        }
      }
    }

    .content-wrapper {
      .markdown-content {
        line-height: 1.8;
        color: #333;

        :deep(p) {
          margin: 12px 0;
        }

        :deep(pre) {
          margin: 12px 0;
          padding: 16px;
          background: #f6f8fa;
          border-radius: 6px;
          overflow-x: auto;

          code {
            font-family: 'Fira Code', 'Courier New', Courier, monospace;
            font-size: 13px;
          }
        }

        :deep(code) {
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          font-size: 13px;
        }

        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4) {
          margin: 20px 0 12px 0;
          font-weight: 600;
          color: #333;
        }

        :deep(ul),
        :deep(ol) {
          margin: 12px 0;
          padding-left: 24px;
        }

        :deep(li) {
          margin: 6px 0;
        }

        :deep(blockquote) {
          margin: 12px 0;
          padding: 8px 16px;
          background: #f5f7fa;
          border-left: 4px solid #1890ff;
          color: #666;
        }
      }
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
