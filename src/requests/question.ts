import request from '@/utils/request'

export const questionPageService = (params: {
  pageNum: number
  pageSize: number
  title?: string
  difficulty?: number
}) => request.get('/question/page', { params })

export const queryQuestionByIdService = (id: number) => request.get('/question/query', { params: { id } })

export const createQuestionService = (data: {
  title: string
  content: string
  difficulty: number
}) => request.post('/admin/question/create', data)

export const deleteQuestionService = (id: number) => request.delete('/admin/question', { params: { id } })

export const updateQuestionService = (data: {
  id: number
  title: string
  content: string
  difficulty: number
}) => request.put('/admin/question/update', data)
