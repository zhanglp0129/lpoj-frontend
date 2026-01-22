import request from '../utils/request'

export interface Solution {
  id: number
  userId: number
  questionId: number
  title: string
  content: string
  likeNum: number
  createTime: number
  updateTime: number
}

export interface SolutionPageResponse {
  data: any
  total: number
  solutions: Solution[]
}

export interface QueryLikeResponse {
  data: any
  liked: boolean
}

export interface LikeSolutionResponse {
  data: any
  solutionLikeNum: number
  authorLikeNum: number
}

export const pageSolutionService = async (
  params: {
    pageNum?: number
    pageSize?: number
    orderBy: 'like_num' | 'update_time'
    questionId?: number
    authorId?: number
  }
) => {
  return request<any, SolutionPageResponse>({
    url: '/solution/page',
    method: 'GET',
    params
  })
}

export const getSolutionByIdService = async (id: number) => {
  return request.get('/solution/query', { params: { id } })
}

export const querySolutionLikeService = async (solutionId: number) => {
  return request.get('/solution/like/query', { params: { solutionId } })
}

export const likeSolutionService = async (solutionId: number, cancel: boolean) => {
  return request.post('/solution/like', null, { params: { solutionId, cancel } })
}
