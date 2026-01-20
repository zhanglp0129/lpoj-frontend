import request from '@/utils/request'

export const questionPageService = (params: {
  pageNum: number
  pageSize: number
  title?: string
  difficulty?: number
}) => request.get('/question/page', { params })

export const queryQuestionByIdService = (id: number) => request.get('/question/query', { params: { id } })
