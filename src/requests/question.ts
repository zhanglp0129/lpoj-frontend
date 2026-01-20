import request from "../utils/request.ts";

export const questionPageService = (params: {
  pageNum: number
  pageSize: number
  difficulty?: number
  title?: string
}) => request.get('/question/page', { params })
