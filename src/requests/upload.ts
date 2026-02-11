import request from '@/utils/request'

export interface UploadFileResponse {
  success: boolean
  data?: {
    filename: string
  }
}

export const uploadFileService = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return request.post<any, UploadFileResponse>('/file/upload', formData)
}
