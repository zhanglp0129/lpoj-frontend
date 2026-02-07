<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import math from '@bytemd/plugin-math'
import 'bytemd/dist/index.css'
import { ElMessage } from 'element-plus'
import zhHans from 'bytemd/locales/zh_Hans.json'
import { getAllLanguagesService } from '@/requests/commit'
import { queryQuestionByIdService } from '@/requests/question'

// 直接导入并转换
import * as Bytemd from '@bytemd/vue-next'
const Editor = Bytemd.Editor

interface Language {
  id: number
  name: string
  description: string
}

interface Props {
  questionId: number
  mode?: 'create' | 'edit'
}

interface SolutionDraft {
  title: string
  content: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create'
})

const emit = defineEmits<{
  publish: [solution: { title: string; content: string }]
  cancel: []
}>()

const plugins = [gfm(), highlight(), math()]

const title = ref('')
const content = ref('')
const isPublishing = ref(false)
const languages = ref<Language[]>([])
const questionName = ref('')

// 防抖定时器
let debounceTimer: number | null = null
// 防抖延迟时间（毫秒）
const DEBOUNCE_DELAY = 1000

// 获取默认模板内容
const getDefaultTemplate = () => {
  // 获取最后使用的语言ID
  const lastLanguageId = localStorage.getItem(`lastLanguage_${props.questionId}`)
  let languageName = ''
  let code = ''

  if (lastLanguageId) {
    const languageId = parseInt(lastLanguageId)
    const lang = languages.value.find(l => l.id === languageId)
    if (lang) {
      languageName = lang.name
      // 获取该语言的代码
      const savedCode = localStorage.getItem(`code_${props.questionId}_${languageId}`)
      code = savedCode || ''
    }
  }

  const questionPath = `/question/${props.questionId}`

  return `> 题目: [${questionName.value}](${questionPath})

# 思路

> 你选用何种方法解题？

# 解题过程

> 这些方法具体怎么运用？

# 复杂度

- 时间复杂度: $O(*)$
- 空间复杂度: $O(*)$

# Code
\`\`\`${languageName}
${code}
\`\`\`
`
}

// 保存草稿到 localStorage
const saveDraft = () => {
  const draftKey = `solution_draft_${props.questionId}`
  const draft: SolutionDraft = {
    title: title.value,
    content: content.value
  }
  localStorage.setItem(draftKey, JSON.stringify(draft))
}

// 删除草稿
const clearDraft = () => {
  const draftKey = `solution_draft_${props.questionId}`
  localStorage.removeItem(draftKey)
}

// 防抖自动保存草稿
const debouncedSaveDraft = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = window.setTimeout(() => {
    saveDraft()
  }, DEBOUNCE_DELAY)
}

// 从 localStorage 读取草稿
const loadDraft = async () => {
  const draftKey = `solution_draft_${props.questionId}`
  const draft = localStorage.getItem(draftKey)
  if (draft) {
    try {
      const parsed: SolutionDraft = JSON.parse(draft)
      title.value = parsed.title
      content.value = parsed.content
    } catch (e) {
      console.error('解析草稿失败:', e)
    }
  } else {
    // 如果草稿为空，使用默认模板
    content.value = getDefaultTemplate()
  }
}

// 处理内容变化
const handleContentChange = (v: string) => {
  content.value = v
  debouncedSaveDraft()
}

// 监听标题变化，自动保存
watch(title, () => {
  debouncedSaveDraft()
})

// 计算是否可以发布
const canPublish = computed(() => {
  return title.value.trim() !== '' && content.value.trim() !== ''
})

// 发布题解
const handlePublish = async () => {
  if (!title.value.trim()) {
    ElMessage.warning('请输入题解标题')
    return
  }
  if (!content.value.trim()) {
    ElMessage.warning('请输入题解内容')
    return
  }

  isPublishing.value = true
  try {
    emit('publish', {
      title: title.value.trim(),
      content: content.value.trim()
    })
  } finally {
    isPublishing.value = false
  }
}

// 初始化数据
const initData = async () => {
  try {
    // 并行获取题目详情和语言列表
    const [questionRes, languagesRes] = await Promise.all([
      queryQuestionByIdService(props.questionId),
      getAllLanguagesService()
    ])
    questionName.value = questionRes.data.data.title
    languages.value = languagesRes.data.data.languages || []
    // 加载草稿
    await loadDraft()
  } catch (error) {
    ElMessage.error('获取题目信息失败')
  }
}

onMounted(() => {
  initData()
})

// 组件卸载时清理定时器，避免内存泄漏
onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

// 暴露方法给父组件
defineExpose({
  clearDraft,
  saveDraft
})
</script>

<template>
  <div class="solution-editor">
    <div class="editor-header">
      <input
        v-model="title"
        type="text"
        class="title-input"
        placeholder="请输入题解标题"
      />
      <div class="action-buttons">
        <el-button
          type="primary"
          @click="handlePublish"
          :loading="isPublishing"
          :disabled="!canPublish"
        >
          发布题解
        </el-button>
      </div>
    </div>
    <div class="editor-content">
      <Editor
        :value="content"
        :plugins="plugins"
        :locale="zhHans"
        :placeholder="'请输入题解内容，支持 Markdown 语法'"
        mode="split"
        @change="handleContentChange"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.solution-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .editor-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #e8e8e8;
    background: #fff;

    .title-input {
      flex: 1;
      font-size: 20px;
      font-weight: 600;
      padding: 12px 16px;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      outline: none;
      transition: all 0.3s;

      &::placeholder {
        color: #999;
        font-weight: 400;
      }

      &:focus {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
  }

  .editor-content {
    flex: 1;
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
}
</style>

<style lang="scss">
// ByteMD 全局样式
.bytemd {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;

  .bytemd-toolbar {
    flex-shrink: 0 !important;
  }

  .bytemd-body {
    flex: 1 !important;
    display: flex !important;
    overflow: hidden !important;
    height: 100% !important;

    .bytemd-editor {
      flex: 1 !important;
      border-right: 1px solid #e8e8e8 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      height: 100% !important;

      .cm-editor {
        flex: 1 !important;
        height: 100% !important;
        overflow-y: auto !important;
        overflow-x: auto !important;

        .cm-scroller {
          height: 100% !important;
          overflow: auto !important;

          .cm-content {
            min-height: 100%;
          }
        }
      }
    }

    .bytemd-preview {
      flex: 1 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 16px !important;
      height: 100% !important;

      .markdown-body {
        font-size: 14px;
        line-height: 1.8;

        pre {
          code {
            font-size: 13px;
          }
        }

        code {
          font-size: 13px;
        }
      }
    }
  }
}
</style>
