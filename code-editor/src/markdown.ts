export {};
declare const ace: any;
declare var window: Window & { editorKey: string };
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = isDark ? 'ace/theme/monokai' : 'ace/theme/textmate'
const backgroundColor = isDark ? '#303133' : '#FFFFFF'
// document.getElementById('editor').style.backgroundColor = backgroundColor
const isMacOs = window.navigator.platform.toLowerCase().includes('mac')
if (!isMacOs) {
  const styleDOM = document.createElement('style')
  styleDOM.innerText = `
    ::-webkit-scrollbar-track-piece{ background-color: ${backgroundColor}; }
    ::-webkit-scrollbar{ width:8px; height:8px; }
    ::-webkit-scrollbar-thumb{ background-color: ${isDark ? '#666666' : '#e2e2e2'}; -webkit-border-radius: 4px; border: 2px solid ${backgroundColor}; }
    ::-webkit-scrollbar-thumb:hover{ background-color: #9f9f9f; }`
  document.head.appendChild(styleDOM)
}

const rpcCall = <T>(type: string, payload?: T): void => {
  const message = { key: window.editorKey, type, payload }
  window.parent.postMessage(message, '*')
}

const editor = ace.edit("editor")
editor.setOptions({
  // highlightSelectedWord: false,
  // showLineNumbers: false,
  // showGutter: false,
  // showFoldWidgets: false,
  showPrintMargin: false,
  highlightActiveLine: false,
  // highlightGutterLine: false,
  autoScrollEditorIntoView: true,
  dragEnabled: false,
  tooltipFollowsMouse: false,
  enableMultiselect: false,
  foldStyle: 'manual',
  fontSize: '14px',
  tabSize: 2,
  cursorStyle: 'slim',
  mode: 'ace/mode/markdown',
  theme
})

editor.on('change', () => {
  rpcCall('onChange', editor.getValue())
})

editor.container.style.lineHeight = 1.42
editor.renderer.updateFontSize()

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    e.preventDefault()
    editor.blur()
    window.parent.window.dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
    return
  }
  if (isMacOs ? e.metaKey : e.ctrlKey) {
    if (['KeyN', 'ArrowLeft', 'ArrowRight', 'Slash'].indexOf(e.code) >= 0) {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Slash' && !e.altKey) return
      window.parent.window.dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
    }
  }
}, true)

const services = {
  init: ({ key, content, isReadOnly }) => {
    window.editorKey = key
    editor.session.setValue(content || '')
    editor.setReadOnly(isReadOnly)
  },
  focus: () => {
    if (editor.isFocused()) return
    editor.focus()
  },
  setReadOnly: (readOnly) => {
    editor.setReadOnly(readOnly)
  }
}

window.addEventListener('message', (e) => {
  const { method, payload } = e.data
  if (!(method in services)) return
  services[method](payload)
})
