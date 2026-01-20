<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getAllLanguagesService } from '@/requests/commit'
import { ElMessage } from 'element-plus'
import { RefreshLeft } from '@element-plus/icons-vue'
import CodeEditor from './CodeEditor.vue'

interface Language {
  id: number
  name: string
  description: string
}

const props = defineProps<{
  questionId: number
}>()

const emit = defineEmits<{
  run: []
  submit: []
}>()

const languages = ref<Language[]>([])
const selectedLanguageId = ref<number>()
const code = ref('')
const codeEditorRef = ref<InstanceType<typeof CodeEditor> | null>(null)

const selectedLanguageName = computed(() => {
  if (!selectedLanguageId.value) return ''
  const lang = languages.value.find(l => l.id === selectedLanguageId.value)
  return lang?.name ?? ''
})

const getLanguageStorageKey = () => {
  return `lastLanguage_${props.questionId}`
}

const loadLastLanguage = () => {
  const key = getLanguageStorageKey()
  const savedLanguageId = localStorage.getItem(key)
  return savedLanguageId ? parseInt(savedLanguageId) : null
}

const saveLastLanguage = (languageId: number) => {
  const key = getLanguageStorageKey()
  localStorage.setItem(key, languageId.toString())
}

onMounted(async () => {
  try {
    const res = await getAllLanguagesService()
    languages.value = res.data.data.languages || []
    if (languages.value.length > 0) {
      const lastLanguageId = loadLastLanguage()
      const isValidLanguage = languages.value.some(l => l.id === lastLanguageId)
      selectedLanguageId.value = isValidLanguage ? lastLanguageId! : languages.value[0]?.id
    }
  } catch (error) {
    ElMessage.error('获取语言列表失败')
  }
})

watch(
  () => selectedLanguageId.value,
  (newId) => {
    if (newId) {
      saveLastLanguage(newId)
    }
  }
)

const handleResetCode = () => {
  if (selectedLanguageId.value) {
    const storageKey = `code_${props.questionId}_${selectedLanguageId.value}`
    localStorage.removeItem(storageKey)
    if (codeEditorRef.value) {
      codeEditorRef.value.resetCode()
    }
    ElMessage.success('已还原为默认代码')
  }
}

const getCode = () => {
  return code.value || ''
}

const getLanguageId = () => {
  return selectedLanguageId.value
}

defineExpose({
  getCode,
  getLanguageId
})
</script>

<template>
  <div class="question-editor">
    <div class="editor-header">
      <el-select v-model="selectedLanguageId" placeholder="选择语言" style="width: 200px">
        <el-option
          v-for="lang in languages"
          :key="lang.id"
          :label="lang.name"
          :value="lang.id"
        />
      </el-select>
      <el-tooltip content="还原默认代码" placement="top">
        <el-icon class="reset-icon" @click="handleResetCode">
          <RefreshLeft />
        </el-icon>
      </el-tooltip>
    </div>
    <div class="editor-content">
      <CodeEditor
        v-if="selectedLanguageName && selectedLanguageId"
        ref="codeEditorRef"
        :question-id="questionId"
        :language-id="selectedLanguageId"
        :language-name="selectedLanguageName"
        v-model="code"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 20px;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;

    .reset-icon {
      font-size: 18px;
      cursor: pointer;
      color: #666;
      transition: color 0.2s;

      &:hover {
        color: #409eff;
      }
    }
  }

  .editor-content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
