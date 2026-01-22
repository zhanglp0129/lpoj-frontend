<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { ElTable, ElTag, ElDialog, ElMessage, ElButton, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { getQuestionAllCommitsService, getCommitByIdService, getComplexityService, CommitResultMap, CommitResultTypeMap, type Commit } from '@/requests/commit'
import useLanguageStore from '@/store/useLanguageStore'
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

hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('c', c)
hljs.registerLanguage('java', java)
hljs.registerLanguage('python', python)
hljs.registerLanguage('go', go)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)

interface Props {
  questionId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  copyToEditor: [code: string, languageId: number]
}>()

const languageStore = useLanguageStore()

const loading = ref(false)
const commits = ref<Commit[]>([])

const dialogVisible = ref(false)
const detailLoading = ref(false)
const currentCommit = ref<Commit | null>(null)

const complexityDialogVisible = ref(false)
const complexityLoading = ref(false)
const timeComplexity = ref('')
const spaceComplexity = ref('')

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

const renderedTimeComplexity = computed(() => {
  return timeComplexity.value ? renderMarkdownWithMath(timeComplexity.value) : ''
})

const renderedSpaceComplexity = computed(() => {
  return spaceComplexity.value ? renderMarkdownWithMath(spaceComplexity.value) : ''
})

const loadCommits = async () => {
  loading.value = true
  try {
    await languageStore.loadLanguages()
    const res = await getQuestionAllCommitsService(props.questionId)
    commits.value = res.data.data.commits
  } catch (error) {
    ElMessage.error('获取提交记录失败')
  } finally {
    loading.value = false
  }
}

const showDetail = async (commit: Commit) => {
  detailLoading.value = true
  dialogVisible.value = true
  currentCommit.value = commit

  try {
    if (!commit.code || !commit.question || !commit.language) {
      const res = await getCommitByIdService(commit.id)
      currentCommit.value = res.data.data
    }
  } catch (error) {
    ElMessage.error('获取提交详情失败')
  } finally {
    detailLoading.value = false
  }
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatTime = (ms: number) => `${ms} ms`

const formatMemory = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const analyzeComplexity = async () => {
  if (!currentCommit.value) return

  complexityLoading.value = true
  complexityDialogVisible.value = true
  timeComplexity.value = ''
  spaceComplexity.value = ''

  try {
    const res = await getComplexityService(currentCommit.value.id)
    timeComplexity.value = res.data.data.timeComplexity
    spaceComplexity.value = res.data.data.spaceComplexity
  } catch (error) {
    ElMessage.error('获取复杂度失败')
    complexityDialogVisible.value = false
  } finally {
    complexityLoading.value = false
  }
}

const handleCopyToClipboard = async () => {
  if (!currentCommit.value?.code) return

  try {
    await navigator.clipboard.writeText(currentCommit.value.code)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const handleCopyToEditor = () => {
  if (!currentCommit.value?.code || !currentCommit.value.languageId) return

  emit('copyToEditor', currentCommit.value.code, currentCommit.value.languageId)
  ElMessage.success('已复制到编辑器')
  dialogVisible.value = false
}

const highlightedCode = computed(() => {
  if (!currentCommit.value?.code) return ''
  let lang = languageStore.getLanguageName(currentCommit.value.languageId)
  
  let language = 'plaintext'

  // 语言映射
  const langMap: Record<string, string> = {
    'C++': 'cpp',
    'C': 'c',
    'Java': 'java',
    'Python': 'python',
    'Python3': 'python',
    'Golang': 'go',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript'
  }

  language = langMap[lang] || lang.toLowerCase()
  try {
    return hljs.highlight(currentCommit.value.code, { language }).value
  } catch (e) {
    try {
      return hljs.highlightAuto(currentCommit.value.code).value
    } catch {
      return currentCommit.value.code
    }
  }
})

onMounted(() => {
  loadCommits()
})
</script>

<template>
  <div class="submission-list">
    <el-table
      v-if="commits.length > 0"
      v-loading="loading"
      :data="commits"
      style="width: 100%"
      @row-click="showDetail"
      :show-header="true"
      :border="true"
    >
      <el-table-column prop="id" label="提交ID" width="80" />
      <el-table-column prop="result" label="结果" width="100">
        <template #default="{ row }">
          <el-tag :type="CommitResultTypeMap[row.result]">
            {{ CommitResultMap[row.result] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="languageId" label="语言" width="100">
        <template #default="{ row }">
          {{ languageStore.getLanguageName(row.languageId) }}
        </template>
      </el-table-column>
      <el-table-column prop="consumeTime" label="用时" width="100">
        <template #default="{ row }">
          {{ formatTime(row.consumeTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="consumeMemory" label="内存" width="100">
        <template #default="{ row }">
          {{ formatMemory(row.consumeMemory) }}
        </template>
      </el-table-column>
      <el-table-column prop="commitTime" label="提交时间" min-width="180">
        <template #default="{ row }">
          {{ formatDate(row.commitTime) }}
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      title="提交详情"
      width="60%"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="commit-detail">
        <div v-if="currentCommit" class="detail-content">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">提交ID:</span>
                <span class="value">{{ currentCommit.id }}</span>
              </div>
              <div class="info-item">
                <span class="label">结果:</span>
                <el-tag :type="CommitResultTypeMap[currentCommit.result]">
                  {{ CommitResultMap[currentCommit.result] }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">语言:</span>
                <span class="value">{{ languageStore.getLanguageName(currentCommit.languageId) }}</span>
              </div>
              <div class="info-item">
                <span class="label">用时:</span>
                <span class="value">{{ formatTime(currentCommit.consumeTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">内存:</span>
                <span class="value">{{ formatMemory(currentCommit.consumeMemory) }}</span>
              </div>
              <div class="info-item">
                <span class="label">提交时间:</span>
                <span class="value">{{ formatDate(currentCommit.commitTime) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section code-section">
            <div class="section-header">
              <h4>提交代码</h4>
              <div class="code-actions">
                <el-button size="small" @click="handleCopyToClipboard">
                  复制代码
                </el-button>
                <el-button size="small" type="success" @click="handleCopyToEditor">
                  复制到编辑器
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  @click="analyzeComplexity"
                >
                  分析复杂度
                </el-button>
              </div>
            </div>
            <pre class="code-block"><code v-html="highlightedCode"></code></pre>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="complexityDialogVisible"
      title="复杂度分析"
      width="30%"
      align-center
      :close-on-click-modal="false"
    >
      <div v-loading="complexityLoading" class="complexity-dialog">
        <div v-if="timeComplexity || spaceComplexity" class="complexity-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="时间复杂度">
              <div v-html="renderedTimeComplexity"></div>
            </el-descriptions-item>
            <el-descriptions-item label="空间复杂度">
              <div v-html="renderedSpaceComplexity"></div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <div v-if="!loading && commits.length === 0" v-loading="loading" class="empty-state">
      <div class="icon">📝</div>
      <p>暂无提交记录</p>
      <p class="tip">完成代码后点击"提交"按钮</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.submission-list {
  padding: 16px;

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

  .commit-detail {
    .detail-content {
      .detail-section {
        margin-bottom: 24px;

        h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;

          .info-item {
            display: flex;
            align-items: center;
            gap: 8px;

            .label {
              font-size: 14px;
              color: #666;
              font-weight: 500;
            }

            .value {
              font-size: 14px;
              color: #333;
            }
          }
        }

        &.code-section {
          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .code-actions {
              display: flex;
              gap: 8px;
            }
          }

          .code-block {
            margin: 0;
            padding: 16px;
            background: #f6f8fa;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.6;
            font-family: 'Fira Code', 'Courier New', Courier, monospace;
            max-height: 400px;
            overflow-y: auto;

            code {
              display: block;
              white-space: pre;
            }

            :deep(.hljs) {
              background: transparent;
              padding: 0;
            }
          }
        }
      }
    }
  }

  .complexity-dialog {
    .complexity-content {
      font-size: 14px;
      line-height: 1.6;

      :deep(.katex) {
        font-size: 1.1em;
      }

      :deep(.katex-display) {
        margin: 0.5em 0;
      }

      :deep(.el-descriptions__label) {
        font-weight: 600;
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
</style>
