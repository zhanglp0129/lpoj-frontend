<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { queryQuestionByIdService } from '@/requests/question'
import { selfTestService, commitService } from '@/requests/commit'
import { ElMessage } from 'element-plus'
import QuestionDescription from './components/QuestionDescription.vue'
import QuestionEditor from './components/QuestionEditor.vue'
import TestCaseEditor from './components/TestCaseEditor.vue'
import TestResult from './components/TestResult.vue'
import SubmissionList from './components/SubmissionList.vue'
import SolutionList from './components/SolutionList.vue'
import useQuestionStore from '@/store/useQuestionStore'

type TabType = 'description' | 'solution' | 'submissions' | 'testcases' | 'testresult'

const route = useRoute()
const router = useRouter()
const questionId = ref<number>(parseInt(route.params.question_id as string))

const loading = ref(false)
const activeTab = ref<TabType>('description')
const testResultType = ref<'self' | 'commit'>('self')
const questionStore = useQuestionStore()

const questionEditorRef = ref<InstanceType<typeof QuestionEditor> | null>(null)

const tabs = [
  { label: '题目描述', value: 'description' as TabType },
  { label: '题解', value: 'solution' as TabType },
  { label: '提交记录', value: 'submissions' as TabType },
  { label: '测试用例', value: 'testcases' as TabType },
  { label: '测试结果', value: 'testresult' as TabType }
]

const question = ref<{
  id: number
  title: string
  content: string
  difficulty: number
} | null>(null)

const loadQuestion = async () => {
  loading.value = true
  try {
    const res = await queryQuestionByIdService(questionId.value)
    question.value = res.data.data
  } catch (error) {
    ElMessage.error('获取题目详情失败')
  } finally {
    loading.value = false
  }
}

const getEncodedTestCases = () => {
  const cases = questionStore.getTestCases(questionId.value)

  // 过滤空的测试用例
  const filtered = cases.filter(c => c.input.trim() || c.output.trim())
  const validCases = filtered.length > 0 ? filtered : cases

  const btoaSafe = (str: string) => {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
        return String.fromCharCode(parseInt(p1, 16))
      }))
    } catch (e) {
      return ''
    }
  }

  return validCases.map(c => ({
    inputBase64: btoaSafe(c.input),
    outputBase64: btoaSafe(c.output)
  }))
}

const validateTestCases = (): boolean => {
  const cases = questionStore.getTestCases(questionId.value)
  const MAX_SIZE = 2 * 1024

  const getInputSize = (input: string) => new TextEncoder().encode(input).length
  const getOutputSize = (output: string) => new TextEncoder().encode(output).length
  const formatSize = (bytes: number) => `${bytes} B`

  // 过滤后的用例数
  const filtered = cases.filter(c => c.input.trim() || c.output.trim())
  const validCases = filtered.length > 0 ? filtered : cases

  if (validCases.length === 0) {
    ElMessage.error('请至少添加一个有效的测试用例')
    return false
  }

  for (let i = 0; i < validCases.length; i++) {
    const testCase: any = validCases[i]
    const inputSize = getInputSize(testCase.input)
    const outputSize = getOutputSize(testCase.output)

    if (inputSize > MAX_SIZE) {
      ElMessage.error(`第 ${i + 1} 个测试用例的输入超过 ${formatSize(MAX_SIZE)} 限制`)
      return false
    }

    if (outputSize > MAX_SIZE) {
      ElMessage.error(`第 ${i + 1} 个测试用例的输出超过 ${formatSize(MAX_SIZE)} 限制`)
      return false
    }
  }

  return true
}

const handleRun = async () => {
  if (!questionEditorRef.value) {
    ElMessage.error('组件未初始化')
    return
  }

  const code = questionEditorRef.value.getCode()
  const languageId = questionEditorRef.value.getLanguageId()

  if (!code.trim()) {
    ElMessage.warning('请输入代码')
    return
  }

  if (!languageId) {
    ElMessage.warning('请选择编程语言')
    return
  }

  if (!validateTestCases()) {
    return
  }

  const selfTestCases = getEncodedTestCases()

  if (selfTestCases.length === 0) {
    ElMessage.warning('请添加测试用例')
    return
  }

  questionStore.isSelfTestingMap[questionId.value] = true
  questionStore.selfTestResultMap[questionId.value] = null
  testResultType.value = 'self'
  activeTab.value = 'testresult'

  try {
    await selfTestService(
      {
        questionId: questionId.value,
        code,
        languageId,
        selfTestCases
      },
      (result) => {
        questionStore.selfTestResultMap[questionId.value] = result
      }
    )
    ElMessage.success('自测完成')
  } catch (error: any) {
    ElMessage.error(error.message || '自测失败')
    questionStore.selfTestResultMap[questionId.value] = {
      finish: true,
      judgeCaseNum: 0,
      acceptNum: 0,
      commitResult: 7,
      consumeTime: 0,
      consumeMemory: 0
    }
  } finally {
    questionStore.isSelfTestingMap[questionId.value] = false
  }
}

const handleSubmit = async () => {
  if (!questionEditorRef.value) {
    ElMessage.error('组件未初始化')
    return
  }

  const code = questionEditorRef.value.getCode()
  const languageId = questionEditorRef.value.getLanguageId()

  if (!code.trim()) {
    ElMessage.warning('请输入代码')
    return
  }

  if (!languageId) {
    ElMessage.warning('请选择编程语言')
    return
  }

  questionStore.isCommittingMap[questionId.value] = true
  questionStore.commitResultMap[questionId.value] = null
  testResultType.value = 'commit'
  activeTab.value = 'testresult'

  try {
    await commitService(
      {
        questionId: questionId.value,
        code,
        languageId
      },
      (result) => {
        questionStore.commitResultMap[questionId.value] = result
      }
    )
    ElMessage.success('提交完成')
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
    questionStore.commitResultMap[questionId.value] = {
      finish: true,
      judgeCaseNum: 0,
      acceptNum: 0,
      commitResult: 7,
      consumeTime: 0,
      consumeMemory: 0
    }
  } finally {
    questionStore.isCommittingMap[questionId.value] = false
  }
}

const handleCopyToEditor = (code: string, languageId: number) => {
  if (!questionEditorRef.value) return

  questionEditorRef.value.setCode(code)
  questionEditorRef.value.setLanguage(languageId)
  activeTab.value = 'description'
}

// 从 URL 读取初始 tab
onMounted(() => {
  const tabParam = route.params.tab as TabType
  if (tabParam && tabs.some(t => t.value === tabParam)) {
    activeTab.value = tabParam
  } else {
    // 默认显示 description，如果不是 tab 路径
    if (route.params.tab === undefined) {
      activeTab.value = 'description'
    }
  }
  loadQuestion()
})

// 监听 tab 变化并更新 URL
watch(activeTab, (newTab) => {
  // 使用路径参数而不是查询参数
  if (newTab === 'description') {
    router.replace(`/question/${questionId.value}`)
  } else {
    router.replace(`/question/${questionId.value}/${newTab}`)
  }
})
</script>

<template>
  <div class="question-page" v-loading="loading">
    <div v-if="question" class="page-header">
      <el-button @click="router.push('/questionset')">返回题库</el-button>
      <div class="header-actions">
        <el-button type="success" @click="handleRun" :loading="questionStore.isSelfTestingMap[questionId]" :disabled="questionStore.isSelfTestingMap[questionId] || questionStore.isCommittingMap[questionId]">自测</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="questionStore.isCommittingMap[questionId]" :disabled="questionStore.isSelfTestingMap[questionId] || questionStore.isCommittingMap[questionId]">提交</el-button>
      </div>
    </div>
    <div v-if="question" class="question-container">
      <div class="left-panel">
        <div class="tabs">
          <div
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab-item', { active: activeTab === tab.value }]"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </div>
        </div>
        <div class="tab-content">
          <QuestionDescription
            v-if="activeTab === 'description'"
            :title="question.title"
            :content="question.content"
            :difficulty="question.difficulty"
          />
          <SolutionList
            v-else-if="activeTab === 'solution'"
            :question-id="questionId"
          />
          <SubmissionList
            v-else-if="activeTab === 'submissions'"
            :question-id="questionId"
            @copy-to-editor="handleCopyToEditor"
          />
          <TestCaseEditor v-else-if="activeTab === 'testcases'" :question-id="questionId" />
          <TestResult
            v-else-if="activeTab === 'testresult'"
            :question-id="questionId"
            :type="testResultType"
          />
        </div>
      </div>
      <div class="right-panel">
        <QuestionEditor :question-id="questionId" ref="questionEditorRef" @run="handleRun" @submit="handleSubmit" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question-page {
  width: 100%;
  height: calc(100vh - 48px);
  background: #f5f7fa;
  padding: 0 24px 24px 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .page-header {
    padding: 2px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .question-container {
    display: flex;
    gap: 24px;
    flex: 1;
    overflow: hidden;
  }

  .left-panel {
    flex: 0 0 50%;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;

    .tabs {
      display: flex;
      border-bottom: 1px solid #e8e8e8;
      background: #fafafa;
      flex-shrink: 0;

      .tab-item {
        padding: 12px 20px;
        cursor: pointer;
        font-size: 14px;
        color: #666;
        border-bottom: 2px solid transparent;
        transition: all 0.3s;
        height: 48px;
        display: flex;
        align-items: center;

        &:hover {
          color: #1890ff;
        }

        &.active {
          color: #1890ff;
          border-bottom-color: #1890ff;
          background: white;
        }
      }
    }

    .tab-content {
      flex: 1;
      overflow: auto;

      .empty-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #999;
        font-size: 14px;
      }
    }
  }

  .right-panel {
    flex: 1;
    height: 100%;
  }
}
</style>
