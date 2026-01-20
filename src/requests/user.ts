import request from "../utils/request.ts";

export const userRegisterService = (registerForm: any) => request.post('/user/register', registerForm)

export const userLoginService = (loginForm: any) => request.post('/user/login', loginForm)

export const userChangePasswordService = (changePasswordForm: any) => request.post('/user/change_password', changePasswordForm)
