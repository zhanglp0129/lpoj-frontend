import request from '@/utils/request'

export interface TestCaseItem {
  id: number
  questionId: number
  inputBase64: string
  outputBase64: string
  inputSize: number
  outputSize: number
  success: boolean
}

export const queryAllTestCasesService = (questionId: number) =>
  request.get('/admin/test_case/all', { params: { questionId } })

export const addTestCaseService = (data: {
  questionId: number
  inputBase64: string
  outputBase64: string
}) => request.post('/admin/test_case/add', data)

export const deleteTestCaseService = (id: number) =>
  request.delete('/admin/test_case/del', { params: { id } })

