import { assert } from 'chai'
import VueLexer from '../../src/lexers/vue-lexer.js'

describe('VueLexer', () => {
  it('extracts keys from template & js', async () => {
    const Lexer = new VueLexer()
    const content =
      "<template><p>{{ $t('first') }}</p><template><script>export default " +
      "{ mounted() { this.$i18n.t('second'); } }</script>"
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'second' },
      { key: 'first' },
    ])
  })

  it('extracts keys with interpolation from template & js', async () => {
    const Lexer = new VueLexer()
    const content =
      "<template><p>{{ $t('first {test}', {test: 'station'}) }}</p><template>" +
      "<script>export default { mounted() { this.$i18n.t('second {test}', " +
      "{test: 'interpol'}); } }</script>"
    assert.deepEqual(await Lexer.extract(content), [
      {
        key: 'second {test}',
        test: 'interpol',
      },
      {
        key: 'first {test}',
        test: 'station',
      },
    ])
  })

  it('extracts keys with plural from template & js', async () => {
    const Lexer = new VueLexer()
    const content =
      "<template><p>{{ $t('first', {count: 5}) }}</p><template><script>export default " +
      "{ mounted() { this.$i18n.t('second', {count: 2}); } }</script>"
    assert.deepEqual(await Lexer.extract(content), [
      {
        key: 'second',
        count: '2',
      },
      {
        key: 'first',
        count: '5',
      },
    ])
  })

  it('extracts custom options', async () => {
    const Lexer = new VueLexer()
    const content =
      "<template><p>{{ $t('first', {description: 'test'}) }}</p><template><script>export default " +
      "{ mounted() { this.$i18n.t('second'); } }</script>"
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'second' },
      { key: 'first', description: 'test' },
    ])
  })

  it('extracts boolean options', async () => {
    const Lexer = new VueLexer()
    const content =
      "<template><p>{{ $t('first', {ordinal: true, custom: false}) }}</p><template><script>export default " +
      "{ mounted() { this.$i18n.t('second'); } }</script>"
    assert.deepEqual(await Lexer.extract(content), [
      { key: 'second' },
      { key: 'first', ordinal: true, custom: false },
    ])
  })
})
