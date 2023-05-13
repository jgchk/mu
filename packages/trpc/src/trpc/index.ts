import { isLoggedIn } from './middleware'
import { t } from './t'

export const router = t.router

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(isLoggedIn)

export const middleware = t.middleware

export const mergeRouters = t.mergeRouters
