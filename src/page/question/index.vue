<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { queryQuestionByIdService } from '@/requests/question'
import { ElMessage } from 'element-plus'
import QuestionDescription from '@/components/QuestionDescription.vue'
import QuestionEditor from '@/components/QuestionEditor.vue'

type TabType = 'description' | 'solution' | 'submissions' | 'testcases' | 'testresult'

const route = useRoute()
const router = useRouter()
const questionId = ref<number>(parseInt(route.params.question_id as string))

const loading = ref(false)
const activeTab = ref<TabType>('description')

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

const handleRun = () => {
  ElMessage.info('自测功能开发中')
}

const handleSubmit = () => {
  ElMessage.info('提交功能开发中')
}

// 从 URL 读取初始 tab
onMounted(() => {
  const tabParam = route.query.tab as TabType
  if (tabParam && tabs.some(t => t.value === tabParam)) {
    activeTab.value = tabParam
  }
  loadQuestion()
})

// 监听 tab 变化并更新 URL
watch(activeTab, (newTab) => {
  router.replace({
    query: { tab: newTab }
  })
})
</script>

<template>
  <div class="question-page" v-loading="loading">
    <div v-if="question" class="page-header">
      <el-button @click="router.push('/questionset')">返回题库</el-button>
      <div class="header-actions">
        <el-button type="success" @click="handleRun">自测</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
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
          <div v-else-if="activeTab === 'solution'" class="empty-placeholder">
            题解功能开发中
          </div>
          <div v-else-if="activeTab === 'submissions'" class="empty-placeholder">
            提交记录功能开发中
          </div>
          <div v-else-if="activeTab === 'testcases'" class="empty-placeholder">
            测试用例功能开发中
          </div>
          <div v-else-if="activeTab === 'testresult'" class="empty-placeholder">
            测试结果功能开发中
          </div>
        </div>
      </div>
      <div class="right-panel">
        <QuestionEditor :question-id="questionId" @run="handleRun" @submit="handleSubmit" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question-page {
  width: 100%;
  height: 100vh;
  background: #f5f7fa;
  padding: 0 24px 24px 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

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
