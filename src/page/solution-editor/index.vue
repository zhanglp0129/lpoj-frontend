<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SolutionEditor from '@/components/SolutionEditor.vue'
import { addSolutionService } from '@/requests/solution'

const route = useRoute()
const router = useRouter()

const questionId = ref<number>(parseInt(route.params.question_id as string))
const solutionEditorRef = ref<InstanceType<typeof SolutionEditor> | null>(null)
const publishing = ref(false)

const handlePublish = async (solution: { title: string; content: string }) => {
  publishing.value = true
  try {
    const res = await addSolutionService({
      questionId: questionId.value,
      title: solution.title,
      content: solution.content
    })

    if (res.success) {
      ElMessage.success('题解发布成功')
      // 清除草稿
      if (solutionEditorRef.value) {
        solutionEditorRef.value.clearDraft()
      }
      // 跳转到刚发布的题解详情页
      router.push({
        path: `/question/${questionId.value}/solution`,
        query: { solution_id: res.data.id }
      })
    } else {
      ElMessage.error('发布题解失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '发布题解失败')
  } finally {
    publishing.value = false
  }
}

const handleBack = () => {
  router.push(`/question/${questionId.value}`)
}
</script>

<template>
  <div class="solution-editor-page">
    <div class="page-header">
      <el-button @click="handleBack">返回题目</el-button>
      <h2>发布题解</h2>
    </div>
    <div class="editor-container">
      <SolutionEditor
        ref="solutionEditorRef"
        :question-id="questionId"
        :mode="'create'"
        @publish="handlePublish"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.solution-editor-page {
  width: 100%;
  height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .page-header {
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    gap: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }
  }

  .editor-container {
    flex: 1;
    padding: 24px;
    overflow: hidden;
    background: white;
    margin: 16px 24px 24px 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}
</style>
