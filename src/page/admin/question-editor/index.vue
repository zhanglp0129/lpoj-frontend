<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import QuestionEsitor from '../components/QuestionEsitor.vue'
import { createQuestionService, queryQuestionByIdService, updateQuestionService } from '@/requests/question'

const route = useRoute()
const router = useRouter()
const creating = ref(false)
const loadingInitialData = ref(false)
const questionData = ref<{
  title: string
  content: string
  difficulty: number
} | null>(null)

const questionId = computed(() => {
  const id = Number(route.params.id)
  return Number.isNaN(id) ? 0 : id
})

const isEditMode = computed(() => {
  return questionId.value > 0
})

const loadQuestionDetail = async () => {
  if (!isEditMode.value) return
  loadingInitialData.value = true
  try {
    const res: any = await queryQuestionByIdService(questionId.value)
    const data = res.data?.data
    if (!data) {
      ElMessage.error('获取题目详情失败')
      router.push('/admin')
      return
    }
    questionData.value = {
      title: data.title,
      content: data.content,
      difficulty: data.difficulty
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '获取题目详情失败')
    router.push('/admin')
  } finally {
    loadingInitialData.value = false
  }
}

const handleCreateQuestion = async (payload: {
  title: string
  content: string
  difficulty: number
}) => {
  if (creating.value) return
  creating.value = true
  try {
    const res: any = isEditMode.value
      ? await updateQuestionService({
          id: questionId.value,
          ...payload
        })
      : await createQuestionService(payload)
    const data = res.data
    if (data.success) {
      ElMessage.success(isEditMode.value ? '题目修改成功' : '题目创建成功')
      router.push('/admin')
      return
    }
    ElMessage.error(isEditMode.value ? '题目修改失败' : '题目创建失败')
  } catch (error: any) {
    ElMessage.error(error?.message || (isEditMode.value ? '题目修改失败' : '题目创建失败'))
  } finally {
    creating.value = false
  }
}

const handleBack = () => {
  router.push('/admin')
}

onMounted(() => {
  loadQuestionDetail()
})
</script>

<template>
  <div class="admin-question-editor-page">
    <div class="page-header">
      <el-button @click="handleBack">返回管理员页面</el-button>
      <h2>{{ isEditMode ? '修改题目' : '添加题目' }}</h2>
    </div>
    <div class="editor-wrapper" v-loading="creating || loadingInitialData">
      <QuestionEsitor
        :mode="isEditMode ? 'edit' : 'create'"
        :initial-data="questionData"
        @submit="handleCreateQuestion"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-question-editor-page {
  width: 100%;
  height: calc(100vh - 48px);
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  gap: 16px;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #303133;
  }
}

.editor-wrapper {
  flex: 1;
  min-height: 0;
  margin: 16px 24px 24px;
  padding: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
</style>
