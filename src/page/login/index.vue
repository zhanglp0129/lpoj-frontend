<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { userLoginService, userRegisterService } from '@/requests/user'
import useLoginStore from '@/store/useLoginStore'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginStore = useLoginStore()

const isLogin = ref(true)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const loginFormRef = ref()
const registerFormRef = ref()

const handleLogin = async () => {
  await loginFormRef.value?.validate()
  loading.value = true
  try {
    const res = await userLoginService(loginForm)
    const data = res.data.data
    loginStore.token = data.token
    loginStore.role = data.role
    loginStore.userId = data.userId
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  await registerFormRef.value?.validate()
  loading.value = true
  try {
    await userRegisterService({
      username: registerForm.username,
      password: registerForm.password
    })
    ElMessage.success('注册成功，请登录')
    isLogin.value = true
    // 清空表单
    registerForm.username = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const switchMode = () => {
  isLogin.value = !isLogin.value
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>LPOJ 在线评测系统</h1>
        <p>{{ isLogin ? '欢迎登录' : '创建账号' }}</p>
      </div>

      <div class="login-content">
        <el-form
          v-if="isLogin"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <el-form
          v-else
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码（至少8位）"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loading"
              @click="handleRegister"
            >
              注册
            </el-button>
          </el-form-item>
        </el-form>

        <div class="switch-mode">
          <span v-if="isLogin">还没有账号？</span>
          <span v-else>已有账号？</span>
          <el-link type="primary" @click="switchMode">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    font-size: 28px;
    color: #333;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #999;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    padding: 12px 15px;
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.switch-mode {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #666;

  .el-link {
    margin-left: 4px;
    font-weight: 500;
  }
}
</style>
