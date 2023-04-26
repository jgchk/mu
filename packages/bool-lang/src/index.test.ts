import { assert, test } from 'vitest'

import type { BoolLang } from '.'
import { decode, encode } from '.'

const cases: [string, BoolLang][] = [
  ['1', { kind: 'id', value: 1 }],
  ['!1', { kind: 'not', child: { kind: 'id', value: 1 } }],
  [
    '(0.1)',
    {
      kind: 'and',
      children: [
        { kind: 'id', value: 0 },
        { kind: 'id', value: 1 },
      ],
    },
  ],
  [
    '(0,1)',
    {
      kind: 'or',
      children: [
        { kind: 'id', value: 0 },
        { kind: 'id', value: 1 },
      ],
    },
  ],
  [
    '(!0.1)',
    {
      kind: 'and',
      children: [
        { kind: 'not', child: { kind: 'id', value: 0 } },
        { kind: 'id', value: 1 },
      ],
    },
  ],
  [
    '(0,!1)',
    {
      kind: 'or',
      children: [
        { kind: 'id', value: 0 },
        { kind: 'not', child: { kind: 'id', value: 1 } },
      ],
    },
  ],
  [
    '(0.(1,2))',
    {
      kind: 'and',
      children: [
        { kind: 'id', value: 0 },
        {
          kind: 'or',
          children: [
            { kind: 'id', value: 1 },
            { kind: 'id', value: 2 },
          ],
        },
      ],
    },
  ],
  [
    '((0,1).2)',
    {
      kind: 'and',
      children: [
        {
          kind: 'or',
          children: [
            { kind: 'id', value: 0 },
            { kind: 'id', value: 1 },
          ],
        },
        { kind: 'id', value: 2 },
      ],
    },
  ],
  [
    '!(0,1)',
    {
      kind: 'not',
      child: {
        kind: 'or',
        children: [
          { kind: 'id', value: 0 },
          { kind: 'id', value: 1 },
        ],
      },
    },
  ],
  [
    '(0,1,2)',
    {
      kind: 'or',
      children: [
        { kind: 'id', value: 0 },
        { kind: 'id', value: 1 },
        { kind: 'id', value: 2 },
      ],
    },
  ],
  [
    '(0.1.2)',
    {
      kind: 'and',
      children: [
        { kind: 'id', value: 0 },
        { kind: 'id', value: 1 },
        { kind: 'id', value: 2 },
      ],
    },
  ],
  [
    '((0.1),(1,2))',
    {
      kind: 'or',
      children: [
        {
          kind: 'and',
          children: [
            { kind: 'id', value: 0 },
            { kind: 'id', value: 1 },
          ],
        },
        {
          kind: 'or',
          children: [
            { kind: 'id', value: 1 },
            { kind: 'id', value: 2 },
          ],
        },
      ],
    },
  ],
]

test.each(cases)('decode %s', (input, expected) => {
  assert.deepEqual(decode(input), expected)
})

test.each(cases)('encode %s', (expected, input) => {
  assert.deepEqual(encode(input), expected)
})
