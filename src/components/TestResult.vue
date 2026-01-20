<script lang="ts" setup>
import { computed } from 'vue'
import { ElProgress, ElTag } from 'element-plus'
import { CommitResultMap, CommitResultTypeMap } from '@/requests/commit'
import useQuestionStore from '@/store/useQuestionStore'

interface Props {
  questionId: number
}

const props = defineProps<Props>()

const questionStore = useQuestionStore()

const isRunning = computed(() => {
  return questionStore.isSelfTestingMap[props.questionId] || false
})
const result = computed(() => {
  return questionStore.selfTestResultMap[props.questionId] || null
})

const progress = computed(() => {
  if (!result.value || result.value.judgeCaseNum === 0) return 0
  return Math.round((result.value.acceptNum / result.value.judgeCaseNum) * 100)
})

const resultType = computed(() => {
  if (!result.value) return 'info'
  return CommitResultTypeMap[result.value.commitResult] || 'info'
})

const resultLabel = computed(() => {
  if (!result.value) return '等待自测...'
  return CommitResultMap[result.value.commitResult] || '未知'
})

const formatTime = (ms: number) => {
  return `${ms} ms`
}

const formatMemory = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const statusIcon = computed(() => {
  if (isRunning.value) {
    return {
      type: 'info',
      icon: '⏳',
      text: '正在自测中...'
    }
  }

  if (!result.value) {
    return {
      type: 'info',
      icon: '📋',
      text: '等待自测'
    }
  }

  const isPassing = result.value.commitResult === 1

  return {
    type: isPassing ? 'success' : 'danger',
    icon: isPassing ? '✅' : '❌',
    text: isPassing ? '自测完成' : '自测失败'
  }
})
</script>

<template>
  <div class="test-result">
    <div class="result-header">
      <div class="status-banner" :class="isRunning ? 'running' : result ? 'finished' : 'idle'">
        <span class="icon">{{ statusIcon.icon }}</span>
        <span class="text">{{ statusIcon.text }}</span>
      </div>
    </div>

    <div class="result-content">
      <div class="progress-section">
        <div class="progress-info">
          <span class="label">测试进度</span>
          <span class="detail" v-if="result">
            {{ result.acceptNum }} / {{ result.judgeCaseNum }} 通过
          </span>
          <span class="detail" v-else>0 / 0 通过</span>
        </div>
        <el-progress :percentage="progress"
          :format="(percentage) => (`${percentage}%`)"
          :stroke-width="10" />
      </div>

      <div class="result-details" v-if="result || isRunning">
        <div class="detail-row">
          <span class="label">测试结果</span>
          <el-tag v-if="result" :type="resultType" size="large">
            {{ resultLabel }}
          </el-tag>
          <span v-else class="value">-</span>
        </div>

        <div class="detail-row">
          <span class="label">执行时间</span>
          <span class="value">{{ formatTime(result?.consumeTime || 0) }}</span>
        </div>

        <div class="detail-row">
          <span class="label">内存消耗</span>
          <span class="value">{{ formatMemory(result?.consumeMemory || 0) }}</span>
        </div>
      </div>

      <div class="empty-state" v-else>
        <div class="icon">📊</div>
        <p>点击"自测"按钮开始测试</p>
        <p class="tip">测试结果将在此处显示</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.test-result {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;

  .result-header {
    margin-bottom: 24px;

    .status-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border-radius: 8px;
      background: #f5f7fa;

      &.running {
        background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);

        .icon {
          animation: pulse 1.5s ease-in-out infinite;
        }
      }

      &.finished {
        background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
      }

      &.idle {
        background: #f5f7fa;
      }

      .icon {
        font-size: 32px;
        margin-right: 12px;
      }

      .text {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .result-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .progress-section {
    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .label {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .detail {
        font-size: 14px;
        color: #666;
      }
    }
  }

  .result-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: #fafafa;
    border-radius: 8px;
    border: 1px solid #e8e8e8;

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .label {
        font-size: 14px;
        color: #666;
      }

      .value {
        font-size: 14px;
        color: #333;
        font-weight: 500;
      }
    }
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background: #fafafa;
    border-radius: 8px;
    border: 1px dashed #d9d9d9;

    .icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      margin: 4px 0;
      color: #999;
      font-size: 14px;

      &.tip {
        font-size: 12px;
        opacity: 0.7;
      }
    }
  }

  @keyframes pulse {

    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }
}
</style>
