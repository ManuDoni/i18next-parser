import { assert } from 'chai'
import JavascriptLexer from '../../src/lexers/javascript-lexer.js'

describe('JavascriptLexer', () => {
  it('extracts keys from translation components', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("first")'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
  })

  it('extracts the second argument string literal as defaultValue', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("first", "bla")'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'bla' },
    ])
  })

  it('extracts the second argument template literal as defaultValue', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("first", `bla`)'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'bla' },
    ])
  })

  it('extracts the second argument string concatenation as defaultValue', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("first", "bla" + "bla" + "bla")'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'blablabla' },
    ])
  })

  it('extracts the defaultValue/context options', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("first", {defaultValue: "foo", context: \'bar\'})'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'foo', context: 'bar' },
    ])
  })

  it('emits a `warning` event if the option argument contains a spread operator', async () => {
    const Lexer = new JavascriptLexer()
    const content = `{t('foo', { defaultValue: 'bar', ...spread })}`
    Lexer.on('warning', (message) => {
      assert.equal(message, 'Options argument is a spread operator : spread')
    })
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'foo', defaultValue: 'bar' },
    ])
  })

  it('extracts the defaultValue/context on multiple lines', async () => {
    const Lexer = new JavascriptLexer()
    const content =
      'i18n.t("first", {\ndefaultValue: "foo",\n context: \'bar\'})'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'foo', context: 'bar' },
    ])
  })

  it('extracts the defaultValue/context options with quotation marks', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("first", {context: "foo", "defaultValue": \'bla\'})'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: 'bla', context: 'foo' },
    ])
  })

  it('extracts the defaultValue/context options with interpolated value', async () => {
    const Lexer = new JavascriptLexer()
    const content =
      'i18n.t("first", {context: "foo", "defaultValue": \'{{var}} bla\'})'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first', defaultValue: '{{var}} bla', context: 'foo' },
    ])
  })

  it('supports multiline and concatenation', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("foo" + \n "bar")'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'foobar' }])
  })

  it('supports multiline template literal keys', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t(`foo\nbar`)'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'foo\nbar' }])
  })

  it('extracts keys from single line comments', async () => {
    const Lexer = new JavascriptLexer()
    const content = `
    // i18n.t('commentKey1')
    i18n.t('commentKey' + i)
    // i18n.t('commentKey2')
    i18n.t(\`commentKey\${i}\`)
    // Irrelevant comment
    // i18n.t('commentKey3')
    `
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'commentKey1' },
      { key: 'commentKey2' },
      { key: 'commentKey3' },
    ])
  })

  it('extracts keys from multiline comments', async () => {
    const Lexer = new JavascriptLexer()
    const content = `
    /*
      i18n.t('commentKey1')
      i18n.t('commentKey2')
    */
    i18n.t(\`commentKey\${i}\`)
    // Irrelevant comment
    /* i18n.t('commentKey3') */
    `
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'commentKey1' },
      { key: 'commentKey2' },
      { key: 'commentKey3' },
    ])
  })

  it('parses namespace from `t` type argument', async () => {
    const Lexer = new JavascriptLexer()
    const content = `
      const content = (t: TFunction<"foo">) => ({
        title: t("bar"),
      })
    `
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'bar', namespace: 'foo' },
    ])
  })

  it("does not parse text with `doesn't` or isolated `t` in it", async () => {
    const Lexer = new JavascriptLexer()
    const js =
      "// FIX this doesn't work and this t is all alone\nt('first')\nt = () => {}"
    assert.deepEqual(await Lexer.extract(js), [{ key: 'first' }])
  })

  it('ignores functions that ends with a t', async () => {
    const Lexer = new JavascriptLexer()
    const js = "ttt('first')"
    assert.deepEqual(await Lexer.extract(js), [])
  })

  it('supports a `functions` option', async () => {
    const Lexer = new JavascriptLexer({ functions: ['tt', '_e', 'f.g'] })
    const content = 'tt("first") + _e("second") + x.tt("third") + f.g("fourth")'
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'first' },
      { key: 'second' },
      { key: 'third' },
      { key: 'fourth' },
    ])
  })

  it('supports async/await', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'const data = async () => await Promise.resolve()'
    await Lexer.extract(content)
  })

  it('supports the spread operator', async () => {
    const Lexer = new JavascriptLexer()
    const content =
      'const data = { text: t("foo"), ...rest }; const { text, ...more } = data;'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'foo' }])
  })

  it('supports dynamic imports', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'import("path/to/some/file").then(doSomethingWithData)'
    await Lexer.extract(content)
  })

  it('supports the es7 syntax', async () => {
    const Lexer = new JavascriptLexer()
    const content = '@decorator() class Test { test() { t("foo") } }'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'foo' }])
  })

  it('supports basic typescript syntax', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t("first") as potato'
    assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
  })

  describe('useTranslation', () => {
    it('extracts default namespace', async () => {
      const Lexer = new JavascriptLexer()
      const content = 'const {t} = useTranslation("foo"); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [
        { namespace: 'foo', key: 'bar' },
      ])
    })

    it('extracts the first valid namespace when it is an array', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const ExtendedComponent = useTranslation([someVariable, "baz"]); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [
        { namespace: 'baz', key: 'bar' },
      ])
    })

    it('emits a `warning` event if the extracted namespace is not a string literal or undefined', async (done) => {
      const Lexer = new JavascriptLexer()
      const content = 'const {t} = useTranslation(someVariable); t("bar");'
      Lexer.on('warning', (message) => {
        assert.equal(
          message,
          'Namespace is not a string literal nor an array containing a string literal: someVariable'
        )
        done()
      })
      assert.deepEqual(await Lexer.extract(content), [{ key: 'bar' }])
    })

    it('leaves the default namespace unchanged if `undefined` is passed', async () => {
      const Lexer = new JavascriptLexer()
      const content = 'const {t} = useTranslation(undefined); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [{ key: 'bar' }])
    })

    it('leaves the default namespace unchanged if `undefined` is passed in an array', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const {t} = useTranslation([someVariable, undefined]); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [{ key: 'bar' }])
    })

    it('uses namespace from t function with priority', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const {t} = useTranslation("foo"); t("bar", {ns: "baz"});'
      assert.deepEqual(await Lexer.extract(content), [
        { namespace: 'baz', key: 'bar', ns: 'baz' },
      ])
    })

    it('extracts namespace with a custom hook', async () => {
      const Lexer = new JavascriptLexer({
        namespaceFunctions: ['useCustomTranslationHook'],
      })
      const content = 'const {t} = useCustomTranslationHook("foo"); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [
        { namespace: 'foo', key: 'bar' },
      ])
    })
  })

  describe('withTranslation', () => {
    it('extracts default namespace when it is a string', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const ExtendedComponent = withTranslation("foo")(MyComponent); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [
        { namespace: 'foo', key: 'bar' },
      ])
    })

    it('extracts first valid namespace when it is an array', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const ExtendedComponent = withTranslation([someVariable, "baz"])(MyComponent); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [
        { namespace: 'baz', key: 'bar' },
      ])
    })

    it('emits a `warning` event if the extracted namespace is not a string literal or undefined', async (done) => {
      const Lexer = new JavascriptLexer()
      const content =
        'const ExtendedComponent = withTranslation(someVariable)(MyComponent); t("bar");'
      Lexer.on('warning', (message) => {
        assert.equal(
          message,
          'Namespace is not a string literal nor an array containing a string literal: someVariable'
        )
        done()
      })
      assert.deepEqual(await Lexer.extract(content), [{ key: 'bar' }])
    })

    it('leaves the default namespace unchanged if `undefined` is passed', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const ExtendedComponent = withTranslation(undefined)(MyComponent); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [{ key: 'bar' }])
    })

    it('leaves the default namespace unchanged if `undefined` is passed in an array', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const ExtendedComponent = withTranslation([someVariable, undefined])(MyComponent); t("bar");'
      assert.deepEqual(await Lexer.extract(content), [{ key: 'bar' }])
    })

    it('uses namespace from t function with priority', async () => {
      const Lexer = new JavascriptLexer()
      const content =
        'const ExtendedComponent = withTranslation("foo")(MyComponent); t("bar", {ns: "baz"});'
      assert.deepEqual(await Lexer.extract(content), [
        { namespace: 'baz', key: 'bar', ns: 'baz' },
      ])
    })
  })

  it('extracts custom options', async () => {
    const Lexer = new JavascriptLexer()

    const content = 'i18n.t("headline", {description: "Fantastic key!"});'
    assert.deepEqual(await Lexer.extract(content), [
      {
        key: 'headline',
        description: 'Fantastic key!',
      },
    ])
  })

  it('extracts boolean options', async () => {
    const Lexer = new JavascriptLexer()

    const content = 'i18n.t("headline", {ordinal: true, custom: false});'
    assert.deepEqual(await Lexer.extract(content), [
      {
        key: 'headline',
        ordinal: true,
        custom: false,
      },
    ])
  })

  it('emits warnings on dynamic keys', async () => {
    const Lexer = new JavascriptLexer()
    const content =
      'const bar = "bar"; i18n.t("foo"); i18n.t(bar); i18n.t(`foo.${bar}`); i18n.t(`babar`);'

    let warningCount = 0
    Lexer.on('warning', (warning) => {
      if (warning.indexOf('Key is not a string literal') === 0) {
        warningCount++
      }
    })

    assert.deepEqual(await Lexer.extract(content), [
      {
        key: 'foo',
      },
      {
        key: 'babar',
      },
    ])
    assert.strictEqual(warningCount, 2)
  })

  it('extracts non-interpolated tagged templates', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t`some-key`'
    assert.deepEqual(await Lexer.extract(content), [
      {
        key: 'some-key',
      },
    ])
  })

  it('emits warnings on interpolated tagged templates', async () => {
    const Lexer = new JavascriptLexer()
    const content = 'i18n.t`some-key${someVar}keykey`'

    let warningCount = 0
    Lexer.on('warning', (warning) => {
      if (
        warning.indexOf(
          'A key that is a template string must not have any interpolations.'
        ) === 0
      ) {
        warningCount++
      }
    })

    await Lexer.extract(content)

    assert.equal(warningCount, 1)
  })

  it('extracts count options', async () => {
    const Lexer = new JavascriptLexer({
      typeMap: { CountType: { count: '' } },
      parseGenerics: true,
    })

    const content = 'i18n.t<{count: number}>("key_count");'
    assert.deepEqual(await Lexer.extract(content, 'file.ts'), [
      {
        key: 'key_count',
        count: '',
      },
    ])

    const content2 = `type CountType = {count : number};
    i18n.t<CountType>("key_count");`
    assert.deepEqual(await Lexer.extract(content2, 'file.ts'), [
      {
        count: '',
        key: 'key_count',
      },
    ])

    const content3 = `type CountType = {count : number};
     i18n.t<CountType & {my_custom: number}>("key_count");`
    assert.deepEqual(await Lexer.extract(content3, 'file.ts'), [
      {
        key: 'key_count',
        count: '',
        my_custom: '',
      },
    ])

    const content4 = `type CountType = {count : number};
     i18n.t<CountType | {my_custom: number}>("key_count");`
    assert.deepEqual(await Lexer.extract(content4, 'file.ts'), [
      {
        key: 'key_count',
        count: '',
        my_custom: '',
      },
    ])
  })
})
