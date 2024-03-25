import { assert } from 'chai'
import HTMLLexer from '../../src/lexers/html-lexer.js'

describe('HTMLLexer', () => {
  it('extracts keys from html attributes', async () => {
    const Lexer = new HTMLLexer()
    const content = '<p data-i18n="first;second"></p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first' },
      { key: 'second' },
    ])
  })

  it('ignores leading [] of the key', async () => {
    const Lexer = new HTMLLexer()
    const content = '<p data-i18n="[title]first;[prepend]second"></p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first' },
      { key: 'second' },
    ])
  })

  it('supports the defaultValue option', async () => {
    const Lexer = new HTMLLexer()
    const content =
      '<p data-i18n="first" data-i18n-options=\'{"defaultValue": "bla"}\'>first</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'bla' },
    ])
  })

  it('grabs the default from innerHTML if missing', async () => {
    const Lexer = new HTMLLexer()
    const content = '<p data-i18n>first</p>'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
  })

  it('supports multiline', async () => {
    const Lexer = new HTMLLexer()
    const content =
      '<p data-i18n="[title]third;fourth">Fourth</p>' +
      '<p\n title=""\n bla\n data-i18n="first"\n data-i18n-options=\'{"defaultValue": "bar"}\'></p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'third' },
      { key: 'fourth' },
      { key: 'first', defaultValue: 'bar' },
    ])
  })

  it('skip if no key is found', async () => {
    const Lexer = new HTMLLexer()
    const content = '<p data-i18n></p>'
    assert.deepEqual(await Lexer.extract(content), [])
  })

  it('supports a `attr` option', async () => {
    const Lexer = new HTMLLexer({ attr: 'data-other' })
    const content = '<p data-other="first;second"></p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first' },
      { key: 'second' },
    ])
  })

  it('supports a `optionAttr` option', async () => {
    const Lexer = new HTMLLexer({ optionAttr: 'data-other-options' })
    const content =
      '<p data-i18n="first" data-other-options=\'{"defaultValue": "bar"}\'></p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'bar' },
    ])
  })

  it('extracts custom options', async () => {
    const Lexer = new HTMLLexer()
    const content =
      '<p data-i18n="first" data-i18n-options=\'{"description": "bla"}\'>first</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', description: 'bla' },
    ])
  })

  it('extracts boolean options', async () => {
    const Lexer = new HTMLLexer()
    const content =
      '<p data-i18n="first" data-i18n-options=\'{"ordinal": true, "custom": false}\'>first</p>'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', ordinal: true, custom: false },
    ])
  })
})
