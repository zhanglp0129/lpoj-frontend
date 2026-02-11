<script setup lang="ts">
import gfm from '@bytemd/plugin-gfm'
import gemoji from '@bytemd/plugin-gemoji'
import highlight from '@bytemd/plugin-highlight' // 代码高亮
import frontmatter from '@bytemd/plugin-frontmatter' // 解析前题
import mediumZoom from '@bytemd/plugin-medium-zoom' // 缩放图片
import breaks from '@bytemd/plugin-breaks'
import math from '@bytemd/plugin-math'
import zhHans from 'bytemd/locales/zh_Hans.json'
import 'bytemd/dist/index.css'
import 'juejin-markdown-themes/dist/juejin.min.css' // 掘金同款样式
import { uploadFileService } from '@/requests/upload'
import * as Bytemd from '@bytemd/vue-next'
const Editor = (Bytemd as any).Editor

interface Props {
  placeholder?: string
  mode?: 'split' | 'tab'
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入 Markdown 内容',
  mode: 'split'
})

const model = defineModel<string>({
  default: ''
})

const plugins = [
  gfm(),
  gemoji(),
  highlight(),
  frontmatter(),
  mediumZoom(),
  breaks(),
  math()
]

const handleChange = (val: string) => {
  model.value = val
}

// 文件上传
const handleUploadFile = async (files: File[]) => {
  // 上传全部图片
  let res = []
  for (let i = 0; i < files.length; i++) {
    const resp = await uploadFileService(files[i] as File) as any
    console.log(resp)
    res.push({
      title: files[i]?.name,
      url: '/api/asset/' + resp.data.data.filename
    })
  }
  return res
}

</script>

<template>
  <div class="markdow-page">
    <Editor :locale="zhHans" :upload-images="handleUploadFile" :value="model" :plugins="plugins"
      :placeholder="props.placeholder" :mode="props.mode" @change="handleChange" />
  </div>
</template>

<style lang="scss" scoped>
.markdow-page {
  height: 100%;
  min-height: 0;

  :deep() {
    .bytemd {
      height: calc(100vh - 300px);
    }
  }
}
</style>
