export const AND_SYMBOL = '.'
export const OR_SYMBOL = ','

export type TrackTagsFilter =
  | number
  | {
      kind: 'and'
      tags: TrackTagsFilter[]
    }
  | {
      kind: 'or'
      tags: TrackTagsFilter[]
    }

export const encodeTagsFilterUrl = (filter: TrackTagsFilter): string => {
  if (typeof filter === 'number') {
    return filter.toString()
  } else if (filter.kind === 'and') {
    return `(${filter.tags.join(AND_SYMBOL)})`
  } else if (filter.kind === 'or') {
    return `(${filter.tags.join(OR_SYMBOL)})`
  } else {
    throw new Error(`Invalid filter: ${JSON.stringify(filter)}}`)
  }
}

export const decodeTagsFilterUrl = (filter: string): TrackTagsFilter => {
  const parsedAst = parse(filter)

  if (parsedAst.length === 0) {
    throw new Error(`Invalid filter: ${filter}`)
  } else if (parsedAst.length > 1) {
    throw new Error(`Invalid filter: ${filter}`)
  }

  return convertASTNode(parsedAst[0])
}

const convertASTNode = (node: AST): TrackTagsFilter => {
  if (node.kind === 'id') {
    return node.value
  } else if (node.kind === 'and') {
    return {
      kind: 'and',
      tags: node.children.map(convertASTNode),
    }
  } else if (node.kind === 'or') {
    return {
      kind: 'or',
      tags: node.children.map(convertASTNode),
    }
  } else {
    throw new Error(`Invalid node: ${JSON.stringify(node)}`)
  }
}

type AST = Filter
type Filter = FilterId | FilterAnd | FilterOr
type FilterId = {
  kind: 'id'
  value: number
}
type FilterAnd = {
  kind: 'and'
  children: Filter[]
}
type FilterOr = {
  kind: 'or'
  children: Filter[]
}

const parse = (text: string): AST[] => {
  const foundASTs: AST[] = []
  let index = 0

  let previousIndex: number | undefined
  while (index < text.length && previousIndex !== index) {
    previousIndex = index

    index = consumeWhitespace(text, index)

    const parseResult = ast(text, index)
    if (parseResult !== undefined) {
      index = parseResult.newIndex
      foundASTs.push(parseResult.parsed)
    }
  }

  if (index < text.length) {
    throw new Error(`Invalid filter: ${text}`)
  }

  return foundASTs
}

const ast: ParseFunction<AST> = (code, index) => filter(code, index)

const filter: ParseFunction<Filter> = (code, index) =>
  filterId(code, index) ?? filterAnd(code, index) ?? filterOr(code, index)

const filterId: ParseFunction<FilterId> = (code, index) =>
  given(
    consumeWhile(code, index, (ch) => /[0-9]/.test(ch)),
    ({ parsed: frontOfNumber, newIndex: index }) => ({
      parsed: {
        kind: 'id',
        value: Number(frontOfNumber),
      },
      newIndex: index,
    })
  )

const filterAnd: ParseFunction<FilterAnd> = (code, index) =>
  given(consume(code, index, '('), ({ newIndex: index }) =>
    given(series(code, index, filter, AND_SYMBOL), ({ parsed: children, newIndex: index }) =>
      given(consume(code, index, ')'), ({ newIndex: index }) => ({
        parsed: {
          kind: 'and',
          children,
        },
        newIndex: index,
      }))
    )
  )

const filterOr: ParseFunction<FilterOr> = (code, index) =>
  given(consume(code, index, '('), ({ newIndex: index }) =>
    given(series(code, index, filter, OR_SYMBOL), ({ parsed: children, newIndex: index }) =>
      given(consume(code, index, ')'), ({ newIndex: index }) => ({
        parsed: {
          kind: 'or',
          children,
        },
        newIndex: index,
      }))
    )
  )

type ParseResult<T> =
  | undefined
  | {
      parsed: T
      newIndex: number
    }

type ParseFunction<T> = (code: string, index: number) => ParseResult<T>

function given<T, R>(val: T | undefined, fn: (val: T) => R): R | undefined {
  if (val !== undefined) {
    return fn(val)
  } else {
    return val as undefined
  }
}

function consume(code: string, index: number, segment: string): ParseResult<string> {
  for (let i = 0; i < segment.length; i++) {
    if (code[index + i] !== segment[i]) {
      return undefined
    }
  }

  return {
    parsed: segment,
    newIndex: index + segment.length,
  }
}

function consumeWhile(
  code: string,
  index: number,
  fn: (ch: string, index: number) => boolean
): ParseResult<string> {
  let newIndex = index

  while (code[newIndex] != null && fn(code[newIndex], newIndex)) {
    newIndex++
  }

  if (newIndex > index) {
    return {
      parsed: code.substring(index, newIndex),
      newIndex,
    }
  }
}

function consumeWhitespace(code: string, index: number): number {
  return consumeWhile(code, index, (ch) => /[\s]/.test(ch))?.newIndex ?? index
}

function series<T>(
  code: string,
  index: number,
  itemParseFn: ParseFunction<T>,
  delimiter?: string
): { parsed: T[]; newIndex: number } {
  const items: T[] = []

  index = consumeWhitespace(code, index)
  let itemResult = itemParseFn(code, index)
  while (itemResult != null && index < code.length) {
    index = itemResult.newIndex
    items.push(itemResult.parsed)

    itemResult =
      delimiter !== undefined
        ? given(consumeWhitespace(code, index), (index) =>
            given(consume(code, index, delimiter), ({ newIndex: index }) =>
              given(consumeWhitespace(code, index), (index) => itemParseFn(code, index))
            )
          )
        : given(consumeWhitespace(code, index), (index) => itemParseFn(code, index))
  }

  return { parsed: items, newIndex: index }
}
