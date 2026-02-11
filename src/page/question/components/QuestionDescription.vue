<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import breaks from '@bytemd/plugin-breaks'
import math from '@bytemd/plugin-math'
import * as Bytemd from '@bytemd/vue-next'
import 'bytemd/dist/index.css'
import 'juejin-markdown-themes/dist/juejin.min.css'
import 'katex/dist/katex.min.css'

const Viewer = (Bytemd as any).Viewer
const plugins = [gfm(), highlight(), breaks(), math()]

const props = defineProps<{
  title: string
  content: string
  difficulty: number
}>()

const contentEl = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null

const getDifficultyLabel = (difficulty: number) => {
  const map: Record<number, string> = {
    1: '简单',
    2: '中等',
    3: '困难'
  }
  return map[difficulty] || '未知'
}

const getDifficultyTagType = (difficulty: number) => {
  const map: Record<number, any> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return map[difficulty] || 'info'
}

const setupCopyButtons = () => {
  if (!contentEl.value) return

  const preBlocks = contentEl.value.querySelectorAll('pre')
  preBlocks.forEach(pre => {
    if (pre.parentElement?.classList.contains('code-block-wrapper')) return
    const codeEl = pre.querySelector('code')
    if (!codeEl) return

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block-wrapper'
    pre.parentNode?.insertBefore(wrapper, pre)
    wrapper.appendChild(pre)

    const button = document.createElement('button')
    button.className = 'copy-button'
    button.textContent = '复制'

    button.addEventListener('click', async () => {
      const code = codeEl.textContent || ''
      try {
        await navigator.clipboard.writeText(code)
        ElMessage.success('复制成功')
      } catch (err) {
        ElMessage.error('复制失败')
      }
    })

    wrapper.appendChild(button)
  })
}

onMounted(async () => {
  await nextTick()
  setupCopyButtons()

  if (!contentEl.value) return
  observer = new MutationObserver(() => {
    setupCopyButtons()
  })
  observer.observe(contentEl.value, { childList: true, subtree: true })
})

watch(() => props.content, async () => {
  await nextTick()
  setupCopyButtons()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="question-description">
    <div class="header">
      <h1>{{ title }}</h1>
      <el-tag :type="getDifficultyTagType(difficulty)">
        {{ getDifficultyLabel(difficulty) }}
      </el-tag>
    </div>
    <div ref="contentEl" class="markdown-content">
      <Viewer :value="content" :plugins="plugins" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.question-description {
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: 100%;
  overflow-y: auto;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      font-size: 24px;
      color: #333;
      margin: 0;
      font-weight: 600;
    }
  }

  .markdown-content {
    :deep(.markdown-body) {
      padding: 0;
      background: transparent;
      color: #333;
    }

    :deep(p) {
      margin-bottom: 16px;
      line-height: 1.6;
      color: #333;
    }

    :deep(.code-block-wrapper) {
      position: relative;
      margin-bottom: 16px;
    }

    :deep(.copy-button) {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 12px;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;

      &:hover {
        background: rgba(0, 0, 0, 0.9);
      }
    }

    :deep(.code-block-wrapper:hover .copy-button) {
      opacity: 1;
    }

    :deep(pre) {
      background: #f6f8fa;
      color: #24292e;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      line-height: 1.5;
    }

    :deep(code) {
      background: #f6f8fa;
      color: #24292e;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
    }

    :deep(pre code) {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      color: #24292e;
    }

    :deep(h1) {
      font-size: 24px;
    }

    :deep(h2) {
      font-size: 20px;
    }

    :deep(h3) {
      font-size: 18px;
    }

    :deep(h4) {
      font-size: 16px;
    }

    :deep(h5),
    :deep(h6) {
      font-size: 14px;
    }

    :deep(ul),
    :deep(ol) {
      margin-bottom: 16px;
      padding-left: 24px;
    }

    :deep(li) {
      margin-bottom: 8px;
      line-height: 1.6;
    }

    :deep(blockquote) {
      border-left: 4px solid #dfe2e5;
      padding-left: 16px;
      margin: 16px 0;
      color: #6a737d;
    }

    :deep(table) {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }

    :deep(th),
    :deep(td) {
      border: 1px solid #dfe2e5;
      padding: 8px 12px;
      text-align: left;
    }

    :deep(th) {
      background: #f6f8fa;
      font-weight: 600;
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
    }

    :deep(hr) {
      border: none;
      border-top: 1px solid #e8e8e8;
      margin: 24px 0;
    }

    :deep(.katex-display) {
      overflow-x: auto;
      overflow-y: hidden;
    }
  }
}
</style>
