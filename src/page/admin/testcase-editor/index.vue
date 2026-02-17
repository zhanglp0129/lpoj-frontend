<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addTestCaseService, deleteTestCaseService, queryAllTestCasesService } from '@/requests/testcase'

const route = useRoute()
const router = useRouter()

const questionId = computed(() => {
  const id = Number(route.params.id)
  return Number.isNaN(id) ? 0 : id
})

interface TestCaseRow {
  id: number
  inputSize: number
  outputSize: number
  inputPreview: string
  outputPreview: string
}

const loading = ref(false)
const testCases = ref<TestCaseRow[]>([])
const addDialogVisible = ref(false)
const addLoading = ref(false)
const inputRaw = ref('')
const outputRaw = ref('')

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const toBase64 = (text: string) => {
  return btoa(
    encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
}

const fromBase64 = (base64: string) => {
  if (!base64) return ''
  try {
    const binary = atob(base64)
    const percentEncoded = Array.from(binary)
      .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('')
    return decodeURIComponent(percentEncoded)
  } catch (e) {
    return ''
  }
}

const previewTextByBytes = (text: string, maxBytes = 20) => {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  if (bytes.length <= maxBytes) {
    return text
  }

  const decoder = new TextDecoder('utf-8', { fatal: true })
  for (let end = maxBytes; end > 0; end--) {
    try {
      return `${decoder.decode(bytes.slice(0, end))}...`
    } catch (e) {
      // 回退到更短字节数，避免截断 UTF-8 多字节字符
    }
  }

  return '...'
}

const loadTestCases = async () => {
  if (!questionId.value) {
    testCases.value = []
    return
  }

  loading.value = true
  try {
    const res: any = await queryAllTestCasesService(questionId.value)
    const rows = res.data?.data?.testCases || []
    testCases.value = rows.map((item: any) => ({
      id: item.id,
      inputSize: item.inputSize || 0,
      outputSize: item.outputSize || 0,
      inputPreview: previewTextByBytes(fromBase64(item.inputBase64 || '')),
      outputPreview: previewTextByBytes(fromBase64(item.outputBase64 || ''))
    }))
  } catch (error: any) {
    ElMessage.error(error?.message || '查询测试用例失败')
  } finally {
    loading.value = false
  }
}

const handleAddTestCase = () => {
  if (!questionId.value) {
    ElMessage.error('题目 ID 无效')
    return
  }
  inputRaw.value = ''
  outputRaw.value = ''
  addDialogVisible.value = true
}

const addNewTestCase = async () => {
  addLoading.value = true
  try {
    await addTestCaseService({
      questionId: questionId.value,
      inputBase64: toBase64(inputRaw.value),
      outputBase64: toBase64(outputRaw.value)
    })
    ElMessage.success('添加测试用例成功')
    addDialogVisible.value = false
    loadTestCases()
  } catch (error: any) {
    ElMessage.error(error?.message || '添加测试用例失败')
  } finally {
    addLoading.value = false
  }
}

const handleDeleteTestCase = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      `确认删除测试用例 #${id} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteTestCaseService(id)
    ElMessage.success('删除测试用例成功')
    loadTestCases()
  } catch (error: any) {
    if (error === 'cancel') return
    ElMessage.error(error?.message || '删除测试用例失败')
  }
}

const handleBack = () => {
  router.push('/admin')
}

onMounted(() => {
  loadTestCases()
})
</script>

<template>
  <div class="admin-testcase-editor-page">
    <div class="page-header">
      <el-button @click="handleBack">返回管理员页面</el-button>
      <h2>测试用例管理</h2>
    </div>
    <div class="content-card">
      <div class="toolbar">
        <div class="title-wrap">
          <p class="title">题目 ID：{{ questionId }}</p>
          <p class="subtitle">所有测试用例</p>
        </div>
        <el-button type="primary" @click="handleAddTestCase">
          添加测试用例
        </el-button>
      </div>

      <el-table :data="testCases" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="测试用例 ID" width="140" />
        <el-table-column label="输入内容" min-width="220">
          <template #default="{ row }">
            {{ row.inputPreview || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="输入大小" width="180">
          <template #default="{ row }">
            {{ formatSize(row.inputSize) }}
          </template>
        </el-table-column>
        <el-table-column label="输出内容" min-width="220">
          <template #default="{ row }">
            {{ row.outputPreview || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="输出大小" width="180">
          <template #default="{ row }">
            {{ formatSize(row.outputSize) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="danger"
              @click="handleDeleteTestCase(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="addDialogVisible"
      title="添加测试用例"
      width="640px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="输入原文">
          <el-input
            v-model="inputRaw"
            type="textarea"
            :rows="6"
            placeholder="请输入输入原文"
          />
        </el-form-item>
        <el-form-item label="输出原文">
          <el-input
            v-model="outputRaw"
            type="textarea"
            :rows="6"
            placeholder="请输入输出原文"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="addNewTestCase">
          确认添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.admin-testcase-editor-page {
  width: 100%;
  padding: 24px;
  height: calc(100vh - 48px - 48px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #303133;
  }
}

.content-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
  box-sizing: border-box;

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .title-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .title {
    margin: 0;
    color: #303133;
    font-size: 16px;
    font-weight: 500;
  }

  .subtitle {
    margin: 0;
    color: #909399;
    font-size: 14px;
  }
}
</style>
