<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElTooltip } from 'element-plus'
import { getSolutionByIdService, querySolutionLikeService, likeSolutionService, type Solution } from '@/requests/solution'
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

interface Props {
  solutionId: number
}

const props = defineProps<Props>()
const router = useRouter()

const loading = ref(false)
const currentSolution = ref<Solution | null>(null)
const isLiked = ref(false)
const isLiking = ref(false)

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

const loadSolution = async () => {
  loading.value = true
  try {
    const [solutionRes, likeRes] = await Promise.all([
      getSolutionByIdService(props.solutionId),
      querySolutionLikeService(props.solutionId)
    ])
    currentSolution.value = solutionRes.data.data
    isLiked.value = likeRes.data.data.liked
  } catch (error) {
    ElMessage.error('获取题解详情失败')
  } finally {
    loading.value = false
  }
}

const backToList = () => {
  router.push(`/question/${currentSolution.value?.questionId}/solution`)
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

// 加载题解详情
loadSolution()
</script>

<template>
  <div class="solution-detail">
    <div v-show="loading" class="loading-wrapper">
      <div class="loading-icon">🔄</div>
      <p>加载中...</p>
    </div>

    <div v-if="!loading && currentSolution" class="detail-content">
      <div class="detail-header">
        <div class="back-nav">
          <span class="back-icon" @click="backToList">←</span>
          <span class="back-text" @click="backToList">全部题解</span>
        </div>
        <h3>{{ currentSolution?.title }}</h3>
        <div class="author-badge">
          <span class="author-label">作者：</span>
          <span class="author-name">{{ currentSolution?.user?.username }}</span>
        </div>
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

<style lang="scss" scoped>
.solution-detail {
  height: 100%;
  overflow-y: auto;
  padding: 16px;

  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
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
}

.detail-content {
  .detail-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e8e8e8;

    .back-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      margin-bottom: 16px;

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

    h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .author-badge {
      margin-bottom: 12px;
      font-size: 14px;
      color: #666;

      .author-label {
        font-weight: 500;
      }

      .author-name {
        color: #1890ff;
        font-weight: 500;
      }
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
</style>
