import { defineStore } from "pinia";
import { ref, computed } from "vue";

// 登录相关仓库
export default defineStore('login', () => {
  // 存储登录token
  const token = ref('')
  const role = ref(0)
  const userId = ref(0)
  const isLogin = computed(() => token.value.length > 0)
  return { token, role, userId, isLogin }
}, {
  // 持久化相关配置
  persist: {
    pick: ['token', 'role', 'userId'],
  }
})