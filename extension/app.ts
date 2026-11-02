// The extension's page: Chrome's own window.spellbook first, then the very same book as the
// Windows app. The order matters: the book asks window.spellbook for its data straight away.
import './bridge'
import '../src/renderer/src/main'
