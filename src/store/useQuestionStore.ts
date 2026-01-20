import { defineStore } from "pinia"
import { ref } from "vue"
import type { JudgeResult } from "@/requests/commit"

interface TestCase {
  id: number
  input: string
  output: string
}

export default defineStore('question', () => {
  // 按题目ID存储测试用例
  const testCasesMap = ref<Record<number, TestCase[]>>({})

  // 按题目ID存储测试结果和自测状态
  const selfTestResultMap = ref<Record<number, JudgeResult | null>>({})
  const isSelfTestingMap = ref<Record<number, boolean>>({})

  // 获取指定题目的测试用例
  const getTestCases = (questionId: number): TestCase[] => {
    return testCasesMap.value[questionId] || [{ id: 1, input: '', output: '' }]
  }

  // 设置指定题目的测试用例
  const setTestCases = (questionId: number, cases: TestCase[]) => {
    testCasesMap.value[questionId] = cases
  }

  // 添加测试用例
  const addTestCase = (questionId: number, testCase: TestCase) => {
    if (!testCasesMap.value[questionId]) {
      testCasesMap.value[questionId] = []
    }
    testCasesMap.value[questionId].push(testCase)
  }

  // 删除测试用例
  const removeTestCase = (questionId: number, caseId: number) => {
    if (testCasesMap.value[questionId]) {
      const index = testCasesMap.value[questionId].findIndex(c => c.id === caseId)
      if (index !== -1) {
        testCasesMap.value[questionId].splice(index, 1)
      }
    }
  }

  // 更新测试用例
  const updateTestCase = (questionId: number, caseId: number, updates: Partial<TestCase>) => {
    if (testCasesMap.value[questionId]) {
      const testCase = testCasesMap.value[questionId].find(c => c.id === caseId)
      if (testCase) {
        Object.assign(testCase, updates)
      }
    }
  }

  // 清除指定题目的测试用例
  const clearTestCases = (questionId: number) => {
    testCasesMap.value[questionId] = []
  }

  return {
    testCasesMap,
    selfTestResultMap,
    isSelfTestingMap,
    getTestCases,
    setTestCases,
    addTestCase,
    removeTestCase,
    updateTestCase,
    clearTestCases
  }
}, {
  persist: {
    key: 'question-store',
    pick: ['testCasesMap'],
  }
})
