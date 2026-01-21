import useLoginStore from '@/store/useLoginStore'
import request from '@/utils/request'

export const getAllLanguagesService = () => request.get('/commit/language/all')

export interface TestCase {
  inputBase64: string
  outputBase64: string
}

export interface SelfTestRequest {
  questionId: number
  code: string
  languageId: number
  selfTestCases: TestCase[]
}

export interface JudgeResult {
  finish: boolean
  judgeCaseNum: number
  acceptNum: number
  commitResult: number
  consumeTime: number
  consumeMemory: number
}

export const CommitResultMap: Record<number, string> = {
  0: '未知',
  1: '通过',
  2: '结果错误',
  3: '超时',
  4: '超内存',
  5: '运行错误',
  6: '编译错误',
  7: '系统错误'
}

export const CommitResultTypeMap: Record<number, any> = {
  0: 'info',
  1: 'success',
  2: 'danger',
  3: 'warning',
  4: 'warning',
  5: 'danger',
  6: 'danger',
  7: 'danger'
}

export interface Language {
  id: number
  name: string
  description: string
  saveFilename: string
  compileCommand: string
  runCommand: string
  timeLimit: number
  memoryLimit: number
}

export interface Question {
  id: number
  title: string
  content: string
  difficulty: number
}

export interface Commit {
  id: number
  userId: number
  questionId: number
  question?: Question
  code: string
  languageId: number
  language?: Language
  consumeTime: number
  consumeMemory: number
  result: number
  commitTime: number
}

export interface QuestionAllCommitsResponse {
  commits: Commit[]
}

export const getQuestionAllCommitsService = (questionId: number) =>
  request.get<{ data: QuestionAllCommitsResponse }>(`/commit/question_all?questionId=${questionId}`)

export const getCommitByIdService = (id: number) =>
  request.get<{ data: Commit }>(`/commit/query?id=${id}`)

export interface ComplexityResponse {
  timeComplexity: string
  spaceComplexity: string
}

export const getComplexityService = (id: number) =>
  request.get<{ data: ComplexityResponse }>(`/commit/complexity?id=${id}`)

export interface CommitRequest {
  questionId: number
  code: string
  languageId: number
}

export const commitService = async (params: CommitRequest, onProgress: (result: JudgeResult) => void) => {
  const {token} = useLoginStore()
  const response = await fetch('/api/commit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    if (response.status !== 400) {
      const txt = await response.text()
      throw new Error(txt || '提交失败')
    } else {
      const error = await response.json()
      throw new Error(error.msg || '提交失败')
    }
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const result: JudgeResult = JSON.parse(data)
              onProgress(result)
              if (result.finish) {
                return result
              }
            } catch (e) {
              console.error('解析 SSE 数据失败:', e)
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return null
}

export const selfTestService = async (params: SelfTestRequest, onProgress: (result: JudgeResult) => void) => {
  const {token} = useLoginStore()
  const response = await fetch('/api/commit/self_test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify(params)
  })

  if (!response.ok) {
    if (response.status !== 400) {
      const txt = await response.text()
      throw new Error(txt || '自测失败')
    } else {
      const error = await response.json()
      throw new Error(error.msg || '自测失败')
    }
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const result: JudgeResult = JSON.parse(data)
              onProgress(result)
              if (result.finish) {
                return result
              }
            } catch (e) {
              console.error('解析 SSE 数据失败:', e)
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return null
}
