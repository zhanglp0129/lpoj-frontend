<script lang="ts" setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { indentUnit } from '@codemirror/language'

const props = defineProps<{
  languageName: string
  languageId: number
  questionId: number
}>()

const modelValue = defineModel<string>()
const editorContainer = ref<HTMLElement>()
const saveStatus = ref<'none' | 'saving' | 'saved'>('none')
let editorView: EditorView | null = null
let saveTimer: number | null = null

const getStorageKey = () => {
  return `code_${props.questionId}_${props.languageId}`
}

const loadFromStorage = () => {
  const key = getStorageKey()
  const savedCode = localStorage.getItem(key)
  if (savedCode) {
    modelValue.value = savedCode
  }
}

const saveToStorage = () => {
  const key = getStorageKey()
  localStorage.setItem(key, modelValue.value || '')
}

const debouncedSave = () => {
  if (saveTimer !== null) {
    clearTimeout(saveTimer)
  }
  saveStatus.value = 'saving'
  saveTimer = window.setTimeout(() => {
    saveToStorage()
    saveStatus.value = 'saved'
    setTimeout(() => {
      saveStatus.value = 'none'
    }, 2000)
  }, 1000)
}

const getLanguageExtension = async (languageName: string) => {
  switch (languageName) {
    case 'C++':
      const cppModule = await import('@codemirror/lang-cpp')
      return cppModule.cpp()
    case 'Python':
      const pythonModule = await import('@codemirror/lang-python')
      return pythonModule.python()
    case 'Java':
      const javaModule = await import('@codemirror/lang-java')
      return javaModule.java()
    case 'Golang':
      const goModule = await import('@codemirror/lang-go')
      return goModule.go()
    case 'Javascript':
    default:
      const javascriptModule = await import('@codemirror/lang-javascript')
      return javascriptModule.javascript()
  }
}

const createEditor = async () => {
  if (!editorContainer.value) return

  const extension = await getLanguageExtension(props.languageName)

  editorView = new EditorView({
    state: EditorState.create({
      doc: modelValue.value || '',
      extensions: [
        basicSetup,
        extension,
        indentUnit.of('    '),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            modelValue.value = update.state.doc.toString()
          }
        })
      ]
    }),
    parent: editorContainer.value
  })
}

onMounted(async () => {
  loadFromStorage()
  await nextTick()
  await createEditor()
})

watch(
  () => props.languageName,
  async () => {
    if (editorView) {
      editorView.destroy()
    }
    loadFromStorage()
    await nextTick()
    await createEditor()
  }
)

watch(
  () => modelValue.value,
  () => {
    debouncedSave()
  }
)
</script>

<template>
  <div class="code-editor-wrapper">
    <div ref="editorContainer" class="code-editor"></div>
    <div v-if="saveStatus !== 'none'" class="save-status">
      <span v-if="saveStatus === 'saving'" class="saving">保存中...</span>
      <span v-else class="saved">已保存</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.code-editor-wrapper {
  position: relative;
  height: 100%;

  .code-editor {
    height: 100%;

    :deep(.cm-editor) {
      height: 100%;
      font-size: 14px;
    }

    :deep(.cm-scroller) {
      overflow: auto;
    }

    :deep(.cm-focused) {
      outline: none;
    }
  }

  .save-status {
    position: absolute;
    bottom: 8px;
    left: 8px;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    pointer-events: none;

    .saving {
      color: #909399;
    }

    .saved {
      color: #67c23a;
    }
  }
}
</style>
