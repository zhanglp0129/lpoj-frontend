<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { questionPageService } from '@/requests/question'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const questions = ref([])
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

const getDifficultyLabel = (difficulty: number) => {
  const option = difficultyOptions.find(opt => opt.value === difficulty)
  return option?.label || '未知'
}

const getDifficultyTagType = (difficulty: number) => {
  const map: Record<number, any> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return map[difficulty] || 'info'
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
    questions.value = data.questions
    total.value = data.total
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

const viewQuestion = (id: number) => {
  ElMessage.info(`查看题目详情: ${id}`)
  // TODO: 跳转到题目详情页
}

onMounted(() => {
  loadQuestions()
})
</script>

<template>
  <div class="questionset-container">
    <div class="header">
      <h2>题库</h2>
      <div class="search-bar">
        <el-input
          v-model="queryParams.title"
          placeholder="搜索题目"
          :prefix-icon="Search"
          clearable
          style="width: 300px; margin-right: 12px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="queryParams.difficulty"
          placeholder="选择难度"
          clearable
          style="width: 120px; margin-right: 12px"
        >
          <el-option
            v-for="item in difficultyOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button type="primary" :icon="Search" @click="handleSearch">
          搜索
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <div class="question-list" v-loading="loading">
      <el-table :data="questions" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="300" />
        <el-table-column label="难度" width="120">
          <template #default="{ row }">
            <el-tag :type="getDifficultyTagType(row.difficulty)">
              {{ getDifficultyLabel(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewQuestion(row.id)">
              查看
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
  </div>
</template>

<style lang="scss" scoped>
.questionset-container {
  width: 75%;
  margin: 24px auto;
  padding: 24px;
  background: #f5f7fa;
  min-height: calc(100vh - 48px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  h2 {
    font-size: 24px;
    color: #333;
    margin: 0;
  }

  .search-bar {
    display: flex;
    align-items: center;
  }
}

.question-list {
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  :deep(.el-table__body tr:hover > td) {
    background-color: #f5f7fa;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
}
</style>
