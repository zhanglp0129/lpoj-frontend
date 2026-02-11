<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

interface QuestionFormData {
  title: string
  content: string
  difficulty: number
}

const props = withDefaults(defineProps<{
  mode?: 'create' | 'edit'
  initialData?: QuestionFormData | null
}>(), {
  mode: 'create',
  initialData: null
})

const emit = defineEmits<{
  submit: [payload: { title: string; content: string; difficulty: number }]
}>()

const title = ref('')
const content = ref('')
const difficulty = ref<number | undefined>(undefined)

const difficultyOptions = [
  { label: '简单', value: 1 },
  { label: '中等', value: 2 },
  { label: '困难', value: 3 }
]

const canSubmit = computed(() => {
  return title.value.trim() !== '' && content.value.trim() !== '' && !!difficulty.value
})

const actionText = computed(() => {
  return props.mode === 'edit' ? '保存修改' : '创建题目'
})

watch(
  () => props.initialData,
  (data) => {
    if (!data) return
    title.value = data.title
    content.value = data.content
    difficulty.value = data.difficulty
  },
  { immediate: true }
)

const handleSubmit = () => {
  if (!title.value.trim()) {
    ElMessage.warning('请输入题目标题')
    return
  }
  if (!difficulty.value) {
    ElMessage.warning('请选择题目难度')
    return
  }
  if (!content.value.trim()) {
    ElMessage.warning('请输入题目内容')
    return
  }

  emit('submit', {
    title: title.value.trim(),
    content: content.value.trim(),
    difficulty: difficulty.value
  })
}
</script>

<template>
  <div class="question-editor">
    <div class="editor-header">
      <el-input
        v-model="title"
        placeholder="请输入题目标题"
        clearable
        class="title-input"
      />
      <el-select
        v-model="difficulty"
        placeholder="请选择难度"
        style="width: 140px"
      >
        <el-option
          v-for="item in difficultyOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
        {{ actionText }}
      </el-button>
    </div>

    <div class="editor-content">
      <MarkdownEditor
        v-model="content"
        placeholder="请输入题目内容，支持 Markdown 语法"
        mode="split"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.question-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;

  .title-input {
    flex: 1;
    min-width: 280px;
  }
}

.editor-content {
  flex: 1;
  min-height: 0;
}
</style>
