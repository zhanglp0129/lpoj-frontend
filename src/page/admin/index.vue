<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { questionPageService } from '@/requests/question'

type AdminMenuKey = 'question-manage' | 'testcase-manage'

interface QuestionItem {
  id: number
  title: string
  difficulty: number
}

const activeMenu = ref<AdminMenuKey>('question-manage')

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
  if (activeMenu.value !== 'question-manage') {
    return
  }
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

const handleQuestionAction = (action: '查看' | '修改' | '删除', row: QuestionItem) => {
  ElMessage.info(`${action}题目：${row.id} - ${row.title}`)
}

const handleMenuChange = (index: string) => {
  activeMenu.value = index as AdminMenuKey
  if (activeMenu.value === 'question-manage') {
    loadQuestions()
  }
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
          :default-active="activeMenu"
          class="admin-menu"
          @select="handleMenuChange"
        >
          <el-menu-item index="question-manage">题目管理</el-menu-item>
          <el-menu-item index="testcase-manage">测试用例管理</el-menu-item>
        </el-menu>
      </aside>

      <main class="admin-content">
        <template v-if="activeMenu === 'question-manage'">
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
            <el-button type="primary" :icon="Plus">
              添加题目
            </el-button>
          </div>

          <div class="table-card" v-loading="loading">
            <el-table :data="questions" stripe style="width: 100%">
              <el-table-column prop="id" label="题目ID" width="100" />
              <el-table-column prop="title" label="标题" min-width="320" />
              <el-table-column label="难度" width="120">
                <template #default="{ row }">
                  <el-tag :type="getDifficultyTagType(row.difficulty)">
                    {{ getDifficultyLabel(row.difficulty) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="{ row }">
                  <el-button
                    link
                    type="primary"
                    @click="handleQuestionAction('查看', row)"
                  >
                    查看
                  </el-button>
                  <el-button
                    link
                    type="primary"
                    @click="handleQuestionAction('修改', row)"
                  >
                    修改
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    @click="handleQuestionAction('删除', row)"
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
        </template>

        <div v-else class="todo-card">
          <h2>测试用例管理</h2>
          <p>TODO</p>
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

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.todo-card {
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 24px;
  box-sizing: border-box;

  h2 {
    margin: 0 0 12px;
    font-size: 20px;
    color: #303133;
  }

  p {
    margin: 0;
    color: #909399;
    font-size: 16px;
  }
}
</style>
