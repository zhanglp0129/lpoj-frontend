import request from '@/utils/request'

export const getAllLanguagesService = () => request.get('/commit/language/all')
