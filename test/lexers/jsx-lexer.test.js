import { assert } from 'chai'
import sinon from 'sinon'
import JsxLexer from '../../src/lexers/jsx-lexer.js'

describe('JsxLexer', () => {
  describe('<Interpolate>', () => {
    it('extracts keys from i18nKey attributes', async () => {
      const Lexer = new JsxLexer()
      const content = '<Interpolate i18nKey="first" />'
      assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
    })
  })

  describe('<Translation>', () => {
    it('extracts keys from render prop', async () => {
      const Lexer = new JsxLexer()
      const content = `<Translation>{(t) => <>{t("first", "Main")}{t("second")}</>}</Translation>`
      assert.deepEqual(await Lexer.extract(content), [
        { defaultValue: 'Main', key: 'first' },
        { key: 'second' },
      ])
    })

    it('sets ns (namespace) for expressions within render prop', async () => {
      const Lexer = new JsxLexer()
      const content = `<Translation ns="foo">{(t) => t("first")}</Translation>`
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'first', namespace: 'foo' },
      ])
    })
  })

  describe('<Trans>', () => {
    it('extracts keys from i18nKey attributes from closing tags', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans i18nKey="first" count={count}>Yo</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'first', defaultValue: 'Yo', count: '{count}' },
      ])
    })

    it('extracts default value from string literal `defaults` prop', async () => {
      const Lexer = new JsxLexer()
      const content =
        '<Trans i18nKey="first" defaults="test-value">should be ignored</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'first', defaultValue: 'test-value' },
      ])
    })

    it('extracts default value from interpolated expression statement `defaults` prop', async () => {
      const Lexer = new JsxLexer()
      const content =
        '<Trans i18nKey="first" defaults={"test-value"}>should be ignored</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'first', defaultValue: 'test-value' },
      ])
    })

    it('extracts keys from user-defined key attributes from closing tags', async () => {
      const Lexer = new JsxLexer({ attr: 'myIntlKey' })
      const content = '<Trans myIntlKey="first" count={count}>Yo</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'first', defaultValue: 'Yo', count: '{count}' },
      ])
    })

    it('extracts keys from i18nKey attributes from self-closing tags', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans i18nKey="first" count={count} />'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'first', count: '{count}' },
      ])
    })

    it('extracts keys from user-defined key attributes from self-closing tags', async () => {
      const Lexer = new JsxLexer({ attr: 'myIntlKey' })
      const content = '<Trans myIntlKey="first" count={count} />'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'first', count: '{count}' },
      ])
    })

    it('extracts custom attributes', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans customAttribute="Youpi">Yo</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'Yo', defaultValue: 'Yo', customAttribute: 'Youpi' },
      ])
    })

    it('extracts boolean attributes', async () => {
      const Lexer = new JsxLexer()
      const content =
        '<Trans ordinal customTrue={true} customFalse={false}>Yo</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        {
          key: 'Yo',
          defaultValue: 'Yo',
          ordinal: true,
          customTrue: true,
          customFalse: false,
        },
      ])
    })

    it('extracts keys from Trans elements without an i18nKey', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans count={count}>Yo</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'Yo', defaultValue: 'Yo', count: '{count}' },
      ])
    })

    it('extracts keys from Trans elements without an i18nKey, but with a defaults prop', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans defaults="Steve">{{ name }}</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: '{{name}}', defaultValue: 'Steve' },
      ])
    })

    it('extracts keys from Trans elements without an i18nKey, with defaults, and without children', async () => {
      const Lexer = new JsxLexer()
      // Based on https://react.i18next.com/latest/trans-component#alternative-usage-components-array
      const content = `
<Trans
  defaults="hello <0>{{what}}</0>"
  values={{
    what: "world"
  }}
  components={[<strong />]}
/>
`.trim()
      assert.deepEqual(await Lexer.extract(content), [
        {
          key: 'hello <0>{{what}}</0>',
          defaultValue: 'hello <0>{{what}}</0>',
          components: '{[<strong />]}',
          values: '{{ what: "world" }}',
        },
      ])
    })

    it('extracts keys from Trans elements and ignores values of expressions and spaces', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans count={count}>{{ key: property }}</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: '{{key}}', defaultValue: '{{key}}', count: '{count}' },
      ])
    })

    it('extracts formatted interpolations correctly', async () => {
      const Lexer = new JsxLexer()
      const content =
        '<Trans count={count}>{{ key: property, format: "number" }}</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        {
          key: '{{key, number}}',
          defaultValue: '{{key, number}}',
          count: '{count}',
        },
      ])
    })

    it('extracts keys from user-defined components', async () => {
      const Lexer = new JsxLexer({
        componentFunctions: [
          'Translate',
          'FooBar',
          'Namespace.A',
          'Double.Namespace.B',
        ],
      })
      const content = `<div>
      <Translate i18nKey="something">Something to translate.</Translate>
      <NotSupported i18nKey="jkl">asdf</NotSupported>
      <NotSupported.Translate i18nKey="jkl">asdf</NotSupported.Translate>
      <FooBar i18nKey="asdf">Lorum Ipsum</FooBar>
      <Namespace.A i18nKey="namespaced">Namespaced</Namespace.A>
      <Double.Namespace.B i18nKey="namespaced2">Namespaced2</Double.Namespace.B>
      </div>
      `
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'something', defaultValue: 'Something to translate.' },
        { key: 'asdf', defaultValue: 'Lorum Ipsum' },
        { key: 'namespaced', defaultValue: 'Namespaced' },
        { key: 'namespaced2', defaultValue: 'Namespaced2' },
      ])
    })

    it('extracts keys from single line comments', async () => {
      const Lexer = new JsxLexer()
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
      const Lexer = new JsxLexer()
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

    it('invalid interpolation gets stripped', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans count={count}>before{{ key1, key2 }}after</Trans>'
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'beforeafter', defaultValue: 'beforeafter', count: '{count}' },
      ])
    })

    it("doesn't add a blank key for self-closing or empty tags", async () => {
      const Lexer = new JsxLexer()

      const emptyTag = '<Trans count={count}></Trans>'
      assert.deepEqual(await Lexer.extract(emptyTag), [])

      const selfClosing = '<Trans count={count}/>'
      assert.deepEqual(await Lexer.extract(selfClosing), [])
    })

    it('erases tags from content', async () => {
      const Lexer = new JsxLexer()
      const content =
        '<Trans>a<b test={"</b>"}>c<c>z</c></b>{d}<br stuff={y}/></Trans>'
      assert.equal(
        (await Lexer.extract(content))[0].defaultValue,
        'a<1>c<1>z</1></1>{d}<3></3>'
      )
    })

    it('skips dynamic children', async () => {
      const Lexer = new JsxLexer()
      const content =
        '<Trans>My dogs are named: <ul i18nIsDynamicList>{["rupert", "max"].map(dog => (<li>{dog}</li>))}</ul></Trans>'
      assert.equal(
        (await Lexer.extract(content))[0].defaultValue,
        'My dogs are named: <1></1>'
      )
    })

    it('handles spread attributes', async () => {
      const Lexer = new JsxLexer()
      const content =
        '<Trans>My dog is named: <span {...styles}>Spot</span></Trans>'
      assert.equal(
        (await Lexer.extract(content))[0].defaultValue,
        'My dog is named: <1>Spot</1>'
      )
    })

    it('erases comment expressions', async () => {
      const Lexer = new JsxLexer()
      const content = '<Trans>{/* some comment */}Some Content</Trans>'
      assert.equal(
        (await Lexer.extract(content))[0].defaultValue,
        'Some Content'
      )
    })

    it('handles jsx fragments', async () => {
      const Lexer = new JsxLexer()
      const content = '<><Trans i18nKey="first" /></>'
      assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
    })

    it('interpolates literal string values', async () => {
      const Lexer = new JsxLexer()
      const content = `<Trans>Some{' '}Interpolated {'Content'}</Trans>`
      assert.equal(
        (await Lexer.extract(content))[0].defaultValue,
        'Some Interpolated Content'
      )
    })

    it('uses the ns (namespace) prop', async () => {
      const Lexer = new JsxLexer()
      const content = `<Trans ns="foo">bar</Trans>`
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'bar', defaultValue: 'bar', namespace: 'foo' },
      ])
    })

    it('uses the ns (namespace) prop with curly braces syntax', async () => {
      const Lexer = new JsxLexer()
      const content = `<Trans ns={'foo'}>bar</Trans>`
      assert.deepEqual(await Lexer.extract(content), [
        { key: 'bar', defaultValue: 'bar', namespace: 'foo' },
      ])
    })

    it('emits a `warning` event if the component attribute is a JSX spread attribute', async (done) => {
      const Lexer = new JsxLexer()
      const content = '<Trans defaults="bar" {...spread} />'
      Lexer.on('warning', (message) => {
        assert.equal(
          message,
          'Component attribute is a JSX spread attribute : spread'
        )
        done()
      })
      assert.deepEqual(await Lexer.extract(content), [{ defaultValue: 'bar' }])
    })
  })

  describe('supports TypeScript', () => {
    it('supports basic tsx syntax', async () => {
      const Lexer = new JsxLexer()
      const content = '<Interpolate i18nKey="first" someVar={foo() as bar} />'
      assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
    })

    describe('<Interpolate>', () => {
      it('extracts keys from i18nKey attributes', async () => {
        const Lexer = new JsxLexer()
        const content = '<Interpolate i18nKey="first" />'
        assert.deepEqual(await Lexer.extract(content), [{ key: 'first' }])
      })
    })

    describe('<Trans>', () => {
      it('extracts keys from i18nKey attributes from closing tags', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans i18nKey="first" count={count}>Yo</Trans>'
        assert.deepEqual(await Lexer.extract(content), [
          { key: 'first', defaultValue: 'Yo', count: '{count}' },
        ])
      })

      it('extracts keys from user-defined key attributes from closing tags', async () => {
        const Lexer = new JsxLexer({ attr: 'myIntlKey' })
        const content = '<Trans myIntlKey="first" count={count}>Yo</Trans>'
        assert.deepEqual(await Lexer.extract(content), [
          { key: 'first', defaultValue: 'Yo', count: '{count}' },
        ])
      })

      it('extracts keys from i18nKey attributes from self-closing tags', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans i18nKey="first" count={count} />'
        assert.deepEqual(await Lexer.extract(content), [
          { key: 'first', count: '{count}' },
        ])
      })

      it('does not extract variable identifier from i18nKey as key', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans i18nKey={variable} />'
        assert.deepEqual(await Lexer.extract(content), [])
      })

      it('extracts keys from user-defined key attributes from self-closing tags', async () => {
        const Lexer = new JsxLexer({ attr: 'myIntlKey' })
        const content = '<Trans myIntlKey="first" count={count} />'
        assert.deepEqual(await Lexer.extract(content), [
          { key: 'first', count: '{count}' },
        ])
      })

      it('extracts keys from Trans elements without an i18nKey', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans count={count}>Yo</Trans>'
        assert.deepEqual(await Lexer.extract(content), [
          { key: 'Yo', defaultValue: 'Yo', count: '{count}' },
        ])
      })

      it('extracts keys from Trans elements and ignores values of expressions and spaces', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans count={count}>{{ key: property }}</Trans>'
        assert.deepEqual(await Lexer.extract(content), [
          { key: '{{key}}', defaultValue: '{{key}}', count: '{count}' },
        ])
      })

      it('strips invalid interpolation', async () => {
        const Lexer = new JsxLexer()
        const content =
          '<Trans count={count}>before{{ key1, key2 }}after</Trans>'
        assert.deepEqual(await Lexer.extract(content), [
          { key: 'beforeafter', defaultValue: 'beforeafter', count: '{count}' },
        ])
      })

      it("doesn't add a blank key for self-closing or empty tags", async () => {
        const Lexer = new JsxLexer()

        const emptyTag = '<Trans count={count}></Trans>'
        assert.deepEqual(await Lexer.extract(emptyTag), [])

        const selfClosing = '<Trans count={count}/>'
        assert.deepEqual(await Lexer.extract(selfClosing), [])
      })

      it('erases tags from content', async () => {
        const Lexer = new JsxLexer()
        const content =
          '<Trans>a<b test={"</b>"}>c<c>z</c></b>{d}<br stuff={y}/></Trans>'
        assert.equal(
          (await Lexer.extract(content))[0].defaultValue,
          'a<1>c<1>z</1></1>{d}<3></3>'
        )
      })

      it('erases comment expressions', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans>{/* some comment */}Some Content</Trans>'
        assert.equal(
          (await Lexer.extract(content))[0].defaultValue,
          'Some Content'
        )
      })

      it('erases typecasts', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans>{{ key: property } as any}</Trans>'
        assert.deepEqual(await Lexer.extract(content), [
          { key: '{{key}}', defaultValue: '{{key}}' },
        ])
      })

      it('keeps self-closing tags untouched when transSupportBasicHtmlNodes is true', async () => {
        const Lexer = new JsxLexer({ transSupportBasicHtmlNodes: true })
        const content = '<Trans>a<br />b</Trans>'
        assert.equal((await Lexer.extract(content))[0].defaultValue, 'a<br />b')
      })

      it('keeps empty tag untouched when transSupportBasicHtmlNodes is true', async () => {
        const Lexer = new JsxLexer({ transSupportBasicHtmlNodes: true })
        const content = '<Trans>a<strong></strong>b</Trans>'
        assert.equal(
          (await Lexer.extract(content))[0].defaultValue,
          'a<strong></strong>b'
        )
      })

      it('does not unescape i18nKey', async () => {
        const Lexer = new JsxLexer()
        const content =
          '<Trans i18nKey="I&apos;m testing">I&apos;m Cielquan</Trans>'
        assert.equal((await Lexer.extract(content))[0].key, 'I&apos;m testing')
      })

      it('unescapes key when i18nKey is not provided', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans>I&apos;m Cielquan</Trans>'
        assert.equal((await Lexer.extract(content))[0].key, "I'm Cielquan")
      })

      it('supports the shouldUnescape options', async () => {
        const Lexer = new JsxLexer()
        const content = '<Trans shouldUnescape>I&apos;m Cielquan</Trans>'
        assert.equal((await Lexer.extract(content))[0].key, "I'm Cielquan")
        assert.equal(
          (await Lexer.extract(content))[0].defaultValue,
          'I&apos;m Cielquan'
        )
      })

      it('supports multi-step casts', async () => {
        const Lexer = new JsxLexer()
        const content =
          '<Trans>Hi, {{ name: "John" } as unknown as string}</Trans>'
        assert.equal(
          (await Lexer.extract(content))[0].defaultValue,
          'Hi, {{name}}'
        )
      })

      it('supports variables in identity functions', async () => {
        const Lexer = new JsxLexer({
          transIdentityFunctionsToIgnore: ['funcCall'],
        })
        const content = '<Trans>Hi, {funcCall({ name: "John" })}</Trans>'
        assert.equal(
          (await Lexer.extract(content))[0].defaultValue,
          'Hi, {{name}}'
        )
      })

      it('emits warning on non-literal child', async (done) => {
        const Lexer = new JsxLexer({
          transIdentityFunctionsToIgnore: ['funcCall'],
        })
        const content = '<Trans>Hi, {anotherFuncCall({ name: "John" })}</Trans>'
        Lexer.on('warning', (message) => {
          assert.equal(
            message,
            'Child is not literal: anotherFuncCall({ name: "John" })'
          )
          done()
        })
        assert.equal(
          (await Lexer.extract(content))[0].defaultValue,
          'Hi, {anotherFuncCall({ name: "John" })}'
        )
      })

      it('does not emit a warning about non-literal child when defaults and i18nKey are specified', async () => {
        const Lexer = new JsxLexer({
          transIdentityFunctionsToIgnore: ['funcCall'],
        })
        const content =
          '<Trans i18nKey="testkey" defaults="test">{anotherFuncCall({ name: "John" })}</Trans>'
        const spy = sinon.spy()
        Lexer.on('warning', spy)
        assert.equal((await Lexer.extract(content))[0].defaultValue, 'test')
        assert.isFalse(spy.called)
      })
    })
  })
})
