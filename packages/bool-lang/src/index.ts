import type { AST } from './ast'
import { AND_SYMBOL, NOT_SYMBOL, OR_SYMBOL } from './config'
import { parse } from './parser'

export type { AST as BoolLang } from './ast'
export * from './config'

export const encode = (ast: AST): string => {
  switch (ast.kind) {
    case 'id':
      return ast.value.toString()
    case 'not':
      return `${NOT_SYMBOL}${encode(ast.child)}`
    case 'and':
      return `(${ast.children.map(encode).join(AND_SYMBOL)})`
    case 'or':
      return `(${ast.children.map(encode).join(OR_SYMBOL)})`
  }
}

export const decode = (text: string): AST => {
  const parsedAst = parse(text)

  if (parsedAst.length === 0) {
    throw new Error(`Invalid filter: ${text}`)
  } else if (parsedAst.length > 1) {
    throw new Error(`Invalid filter: ${text}`)
  }

  return parsedAst[0]
}
