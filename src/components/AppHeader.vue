<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import useLoginStore from '@/store/useLoginStore'

const router = useRouter()
const loginStore = useLoginStore()

const dropdownVisible = ref(false)

const handleLogin = () => {
  router.push('/login')
}

const handleLogout = () => {
  loginStore.token = ''
  loginStore.role = 0
  loginStore.userId = 0
  loginStore.username = ''
  ElMessage.success('退出登录成功')
  router.push('/login')
}

const handleChangePassword = () => {
  router.push('/change-password')
}

const handleAdmin = () => {
  // TODO: 实现管理员功能
  ElMessage.info('管理员功能待实现')
}
</script>

<template>
  <div class="app-header">
    <div class="header-container">
      <div class="header-left">
        <h1 class="logo">LPOJ</h1>
      </div>
      <div class="header-right">
        <template v-if="loginStore.isLogin">
          <el-dropdown
            trigger="click"
            v-model="dropdownVisible"
          >
            <span class="username">
              {{ loginStore.username }}
              <el-icon class="el-icon--right">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleChangePassword">
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item v-if="loginStore.role === 1" @click="handleAdmin">
                  管理员
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout" divided>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template v-else>
          <el-button type="primary" @click="handleLogin">
            请登录
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 16px;

    .header-left {
      .logo {
        font-size: 18px;
        font-weight: 600;
        color: #409eff;
        margin: 0;
        cursor: pointer;
      }
    }

    .header-right {
      .username {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 13px;
        color: #333;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.3s;

        &:hover {
          background-color: #f5f7fa;
        }

        .el-icon {
          margin-left: 4px;
        }
      }

      :deep(.el-button) {
        height: 28px;
        font-size: 13px;
        padding: 0 12px;
      }
    }
  }
}
</style>
