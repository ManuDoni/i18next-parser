import BaseLexer from './base-lexer.js'
import JavascriptLexer from './javascript-lexer.js'

export default class VueLexer extends BaseLexer {
  constructor(options = {}) {
    super(options)

    this.functions = options.functions || ['$t']
  }

  async extract(content, filename) {
    let keys = []

    const Lexer = new JavascriptLexer()
    Lexer.on('warning', (warning) => this.emit('warning', warning))
    keys = keys.concat(await Lexer.extract(content))

    // Dynamically import 'vue-template-compiler'
    try {
      const VueTemplateCompiler = await import('vue-template-compiler')
      const compiledTemplate = VueTemplateCompiler.compile(content).render
      const Lexer2 = new JavascriptLexer({ functions: this.functions })
      Lexer2.on('warning', (warning) => this.emit('warning', warning))
      keys = keys.concat(await Lexer2.extract(compiledTemplate))
    } catch (error) {
      throw new Error(
        'vue-template-compiler module is not found. Please ensure it is installed as a peer dependency.'
      )
    }

    return keys
  }
}
