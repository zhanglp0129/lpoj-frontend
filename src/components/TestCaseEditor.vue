<script lang="ts" setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import useQuestionStore from '@/store/useQuestionStore'

const props = defineProps<{
  questionId: number
}>()

const MAX_CASES = 10
const MAX_SIZE = 2 * 1024 // 2KB

const questionStore = useQuestionStore()

const testCases = computed(() => questionStore.getTestCases(props.questionId))

const isValidInputSize = computed(() => {
  return (input: string) => new TextEncoder().encode(input).length <= MAX_SIZE
})

const isValidOutputSize = computed(() => {
  return (output: string) => new TextEncoder().encode(output).length <= MAX_SIZE
})

const getInputSize = (input: string) => {
  return new TextEncoder().encode(input).length
}

const getOutputSize = (output: string) => {
  return new TextEncoder().encode(output).length
}

const formatSize = (bytes: number) => {
  return `${bytes} B`
}

const addTestCase = () => {
  if (testCases.value.length >= MAX_CASES) {
    ElMessage.warning(`最多只能添加 ${MAX_CASES} 个测试用例`)
    return
  }
  const newId = Math.max(...testCases.value.map(c => c.id), 0) + 1
  questionStore.addTestCase(props.questionId, { id: newId, input: '', output: '' })
}

const removeTestCase = (id: number) => {
  if (testCases.value.length <= 1) {
    ElMessage.warning('至少需要保留一个测试用例')
    return
  }
  questionStore.removeTestCase(props.questionId, id)
}

const updateInput = (id: number, value: string) => {
  questionStore.updateTestCase(props.questionId, id, { input: value })
}

const updateOutput = (id: number, value: string) => {
  questionStore.updateTestCase(props.questionId, id, { output: value })
}

const clearEmptyCases = () => {
  const filtered = testCases.value.filter(c => c.input.trim() || c.output.trim())
  questionStore.setTestCases(props.questionId, filtered.length > 0 ? filtered : [{ id: 1, input: '', output: '' }])
}

const getEncodedTestCases = () => {
  const cases = testCases.value
  clearEmptyCases()

  const btoaSafe = (str: string) => {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
        return String.fromCharCode(parseInt(p1, 16))
      }))
    } catch (e) {
      return ''
    }
  }

  return cases.map(c => ({
    inputBase64: btoaSafe(c.input),
    outputBase64: btoaSafe(c.output)
  }))
}

const validate = (): boolean => {
  clearEmptyCases()

  const cases = questionStore.getTestCases(props.questionId)
  if (cases.length === 0) {
    ElMessage.error('请至少添加一个有效的测试用例')
    return false
  }

  for (let i = 0; i < cases.length; i++) {
    const testCase = cases[i]
    if (!testCase) continue
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

defineExpose({
  getEncodedTestCases,
  validate
})
</script>

<template>
  <div class="test-case-editor">
    <div class="editor-header">
      <h3>自测用例</h3>
      <el-button type="primary" size="small" @click="addTestCase" :disabled="testCases.length >= MAX_CASES">
        添加用例
      </el-button>
    </div>
    <div class="test-cases-list">
      <div v-for="(testCase, index) in testCases" :key="testCase.id" class="test-case-item">
        <div class="test-case-header">
          <span class="case-index">用例 {{ index + 1 }}</span>
          <el-button
            type="danger"
            size="small"
            text
            @click="removeTestCase(testCase.id)"
            :disabled="testCases.length <= 1"
          >
            删除
          </el-button>
        </div>
        <div class="case-input-output">
          <div class="io-section">
            <div class="io-label">
              输入
              <span class="size-info">({{ formatSize(getInputSize(testCase.input)) }} / {{ formatSize(MAX_SIZE) }})</span>
            </div>
            <el-input
              :model-value="testCase.input"
              @update:model-value="(val: string) => updateInput(testCase.id, val)"
              type="textarea"
              :rows="4"
              placeholder="输入测试数据"
              :class="{ 'error': !isValidInputSize(testCase.input) && testCase.input }"
            />
          </div>
          <div class="io-section">
            <div class="io-label">
              输出
              <span class="size-info">({{ formatSize(getOutputSize(testCase.output)) }} / {{ formatSize(MAX_SIZE) }})</span>
            </div>
            <el-input
              :model-value="testCase.output"
              @update:model-value="(val: string) => updateOutput(testCase.id, val)"
              type="textarea"
              :rows="4"
              placeholder="期望输出"
              :class="{ 'error': !isValidOutputSize(testCase.output) && testCase.output }"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="editor-footer">
      <span class="info-text">最多 {{ MAX_CASES }} 个用例，每个用例输入输出各最多 {{ formatSize(MAX_SIZE) }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.test-case-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }
  }

  .test-cases-list {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .test-case-item {
    background: #fafafa;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;

    .test-case-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .case-index {
        font-weight: 600;
        color: #333;
        font-size: 14px;
      }
    }

    .case-input-output {
      display: flex;
      gap: 16px;

      .io-section {
        flex: 1;

        .io-label {
          font-size: 13px;
          color: #666;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;

          .size-info {
            font-size: 12px;
            color: #999;
          }
        }

        :deep(.el-textarea) {
          .el-textarea__inner {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
          }

          &.error .el-textarea__inner {
            border-color: #f56c6c;
          }
        }
      }
    }
  }

  .editor-footer {
    padding-top: 12px;
    border-top: 1px solid #e8e8e8;

    .info-text {
      font-size: 12px;
      color: #999;
    }
  }
}
</style>
