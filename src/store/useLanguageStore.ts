import { defineStore } from "pinia"
import { ref } from "vue"
import type { Language } from "@/requests/commit"
import { getAllLanguagesService } from "@/requests/commit"

export default defineStore('language', () => {
  const languages = ref<Language[]>([])
  const loading = ref(false)

  const loadLanguages = async () => {
    if (languages.value.length > 0) {
      return
    }

    loading.value = true
    try {
      const res = await getAllLanguagesService()
      languages.value = res.data.data?.languages || []
    } catch (error) {
      console.error('加载语言列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const getLanguageById = (id: number): Language | undefined => {
    return languages.value.find(lang => lang.id === id)
  }

  const getLanguageName = (id: number): string => {
    const lang = getLanguageById(id)
    return lang?.name || '-'
  }

  return {
    languages,
    loading,
    loadLanguages,
    getLanguageById,
    getLanguageName
  }
}, {
  persist: {
    key: 'language-store',
    pick: ['languages'],
  }
})
