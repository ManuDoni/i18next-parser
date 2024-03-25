import { assert } from 'chai'
import HandlebarsLexer from '../../src/lexers/handlebars-lexer.js'

describe('HandlebarsLexer', () => {
  it('extracts keys from translation components', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{t "first"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
  })

  it('extracts multiple keys on a single line', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{t "first"}} {{t "second"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first' },
      { key: 'second' },
    ])
  })

  it('extracts the second argument as defaultValue', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{t "first" "bla"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'bla' },
    ])
  })

  it('extracts the defaultValue arguments', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{t "first" defaultValue="bla"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'bla' },
    ])
  })

  it('extracts the context arguments', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{t "first" context="bla"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', context: 'bla' },
    ])
  })

  it('extracts keys from translation functions', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{link-to (t "first") "foo"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
  })

  it('supports a `functions` option', async () => {
    const Lexer = new HandlebarsLexer({ functions: ['tt', '_e'] })
    const content = '<p>{{link-to (tt "first") "foo"}}: {{_e "second"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first' },
      { key: 'second' },
    ])
  })

  it('extracts custom options', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{t "first" description="bla"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', description: 'bla' },
    ])
  })

  it('extracts boolean options', async () => {
    const Lexer = new HandlebarsLexer()
    const content = '<p>{{t "first" ordinal="true" custom="false"}}</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', ordinal: true, custom: false },
    ])
  })

  describe('parseArguments()', () => {
    it('matches string arguments', async () => {
      const Lexer = new HandlebarsLexer()
      const args = '"first" "bla"'
      assert.deepEqual(Lexer.parseArguments(args), {
        arguments: ['"first"', '"bla"'],
        options: {},
      })
    })

    it('matches variable arguments', async () => {
      const Lexer = new HandlebarsLexer()
      const args = 'first bla'
      assert.deepEqual(Lexer.parseArguments(args), {
        arguments: ['first', 'bla'],
        options: {},
      })
    })

    it('matches key-value arguments', async () => {
      const Lexer = new HandlebarsLexer()
      const args = 'first="bla"'
      assert.deepEqual(Lexer.parseArguments(args), {
        arguments: ['first="bla"'],
        options: {
          first: 'bla',
        },
      })
    })

    it('skips key-value arguments that are variables', async () => {
      const Lexer = new HandlebarsLexer()
      const args = 'second=bla'
      assert.deepEqual(Lexer.parseArguments(args), {
        arguments: ['second=bla'],
        options: {
          // empty!
        },
      })
    })

    it('matches combinations', async () => {
      const Lexer = new HandlebarsLexer()
      const args =
        '"first" second third-one="bla bla" fourth fifth=\'bla\' "sixth"'
      assert.deepEqual(Lexer.parseArguments(args), {
        arguments: [
          '"first"',
          'second',
          'third-one="bla bla"',
          'fourth',
          "fifth='bla'",
          '"sixth"',
        ],
        options: {
          'third-one': 'bla bla',
          fifth: 'bla',
        },
      })
    })
  })
})
