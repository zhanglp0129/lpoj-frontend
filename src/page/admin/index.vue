<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { deleteQuestionService, questionPageService } from '@/requests/question'

interface QuestionItem {
  id: number
  title: string
  difficulty: number
}

const router = useRouter()

const loading = ref(false)
const questions = ref<QuestionItem[]>([])
const total = ref(0)
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  title: '',
  difficulty: undefined as number | undefined
})

const difficultyOptions = [
  { label: '全部', value: undefined },
  { label: '简单', value: 1 },
  { label: '中等', value: 2 },
  { label: '困难', value: 3 }
]

const difficultyTagTypeMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
  1: 'success',
  2: 'warning',
  3: 'danger'
}

const getDifficultyLabel = (difficulty: number) => {
  const option = difficultyOptions.find((item) => item.value === difficulty)
  return option?.label || '未知'
}

const getDifficultyTagType = (difficulty: number) => {
  return difficultyTagTypeMap[difficulty] || 'info'
}

const loadQuestions = async () => {
  loading.value = true
  try {
    const res = await questionPageService({
      pageNum: queryParams.value.pageNum,
      pageSize: queryParams.value.pageSize,
      title: queryParams.value.title || undefined,
      difficulty: queryParams.value.difficulty
    })
    const data = res.data.data
    questions.value = data.questions || []
    total.value = data.total || 0
  } catch (error) {
    ElMessage.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.value.pageNum = 1
  loadQuestions()
}

const handleReset = () => {
  queryParams.value.title = ''
  queryParams.value.difficulty = undefined
  queryParams.value.pageNum = 1
  loadQuestions()
}

const handlePageChange = (page: number) => {
  queryParams.value.pageNum = page
  loadQuestions()
}

const handleSizeChange = (size: number) => {
  queryParams.value.pageSize = size
  queryParams.value.pageNum = 1
  loadQuestions()
}

const handleEditQuestion = (row: QuestionItem) => {
  router.push(`/admin/question/edit/${row.id}`)
}

const handleEditTestCase = (row: QuestionItem) => {
  router.push(`/admin/question/${row.id}/testcases`)
}

const handleRowClick = (row: QuestionItem) => {
  router.push(`/question/${row.id}`)
}

const handleDeleteQuestion = async (row: QuestionItem) => {
  try {
    await ElMessageBox.confirm(
      `确认删除题目「${row.title}」吗？`,
      '删除确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res: any = await deleteQuestionService(row.id)
    if (!res.data?.success) {
      ElMessage.error('删除失败')
      return
    }

    ElMessage.success('删除成功')

    if (questions.value.length === 1 && queryParams.value.pageNum > 1) {
      queryParams.value.pageNum -= 1
    }
    loadQuestions()
  } catch (error: any) {
    if (error === 'cancel') {
      return
    }
    ElMessage.error(error?.message || '删除失败')
  }
}

const handleAddQuestion = () => {
  router.push('/admin/question/create')
}

onMounted(() => {
  loadQuestions()
})
</script>

<template>
  <div class="admin-page">
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <el-menu
          default-active="question-manage"
          class="admin-menu"
        >
          <el-menu-item index="question-manage">题目管理</el-menu-item>
        </el-menu>
      </aside>

      <main class="admin-content">
        <div class="toolbar-card">
          <div class="search-bar">
            <el-input
              v-model="queryParams.title"
              placeholder="按标题搜索题目"
              :prefix-icon="Search"
              clearable
              style="width: 280px"
              @keyup.enter="handleSearch"
            />
            <el-select
              v-model="queryParams.difficulty"
              placeholder="选择难度"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in difficultyOptions"
                :key="item.label"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
            <el-button :icon="Refresh" @click="handleReset">
              重置
            </el-button>
          </div>
          <el-button type="primary" :icon="Plus" @click="handleAddQuestion">
            添加题目
          </el-button>
        </div>

        <div class="table-card" v-loading="loading">
          <el-table
            :data="questions"
            stripe
            style="width: 100%"
            @row-click="handleRowClick"
          >
            <el-table-column prop="id" label="题目ID" width="100" />
            <el-table-column prop="title" label="标题" min-width="320" />
            <el-table-column label="难度" width="120">
              <template #default="{ row }">
                <el-tag :type="getDifficultyTagType(row.difficulty)">
                  {{ getDifficultyLabel(row.difficulty) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="340" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  @click.stop="handleEditQuestion(row)"
                >
                  修改
                </el-button>
                <el-button
                  link
                  type="primary"
                  @click.stop="handleEditTestCase(row)"
                >
                  编辑测试用例
                </el-button>
                <el-button
                  link
                  type="danger"
                  @click.stop="handleDeleteQuestion(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="queryParams.pageNum"
              v-model:page-size="queryParams.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.admin-page {
  width: 75%;
  margin: 24px auto;
  height: calc(100vh - 48px - 48px);
  box-sizing: border-box;
}

.admin-layout {
  display: flex;
  gap: 16px;
  height: 100%;
}

.admin-sidebar {
  width: 220px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.admin-menu {
  border-right: none;
  border-radius: 8px;
}

.admin-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .search-bar {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.table-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 20px;
  overflow: auto;
  box-sizing: border-box;

  :deep(.el-table__body tr) {
    cursor: pointer;
  }

  :deep(.el-table__body tr:hover > td) {
    background-color: #f5f7fa;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
