export {};
declare const ace: any;
declare var window: Window & { editorKey: string };
interface RpcMessage<T=any> { key: unknown; type: string; payload: T }
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = isDark ? 'ace/theme/monokai' : 'ace/theme/textmate'
const isMacOs = window.navigator.platform.toLowerCase().includes('mac')
const modelist = ace.require("ace/ext/modelist")
const rpcCall = <T>(type: string, payload?: T): void => {
  const message = { key: window.editorKey, type, payload }
  window.parent.postMessage(message, '*')
}

const editor = ace.edit("editor")
editor.setOptions({
  autoScrollEditorIntoView: false,
  highlightActiveLine: false,
  highlightSelectedWord: false,
  showLineNumbers: false,
  showGutter: false,
  showFoldWidgets: false,
  showPrintMargin: false,
  highlightGutterLine: false,
  dragEnabled: false,
  tooltipFollowsMouse: false,
  enableMultiselect: false,
  foldStyle: 'manual',
  fontSize: '14px',
  tabSize: 2,
  cursorStyle: 'slim',
  theme,
  maxLines: 999999999
})

let lineCount = 1
const setHeight = (): void => {
  const l = editor.session.getScreenLength()
  if (l === lineCount) return
  lineCount = l
  rpcCall("setHeight", lineCount * editor.renderer.lineHeight + 16)
}
let changeSilent = false
editor.on('change', (e) => {
  if (changeSilent) return
  rpcCall('onChange', editor.getValue())
  setHeight()
})

editor.on('blur', () => { rpcCall('hideLang'); editor.clearSelection() })
editor.on('focus', () => { rpcCall('showLang') })
editor.commands.removeCommand('find')
editor.container.style.lineHeight = 1.42
editor.renderer.updateFontSize()

window.onfocus = () => {
  setTimeout(()=>{
    if (!document.hasFocus() || editor.isFocused()) return
    editor.focus()
  })
}

window.onmousedown = () => {
  if (document.hasFocus()) return
  editor.focus()
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' || e.code === 'Tab' || e.code === 'NumpadEnter') {
    if (!document.hasFocus()) {
      e.preventDefault()
      e.stopPropagation()
      window.parent.window.dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
    }
    return
  }
  if (e.code === 'Backspace') {
   if (lineCount === 1 && !editor.getValue()) {
    rpcCall('removeEditor')
   }
   return 
  }
  if (e.code === 'ArrowDown') {
    e.preventDefault()
    if (!document.hasFocus()) {
      window.parent.window.dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
      return
    }
    const cursorPos = editor.getCursorPosition()
    if (cursorPos.row === lineCount - 1) {
      e.stopPropagation()
      editor.blur()
      rpcCall('moveDown', cursorPos.column)
    }
    return
  }
  if (e.code === 'ArrowUp') {
    e.preventDefault()
    if (!document.hasFocus()) {
      window.parent.window.dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
      return
    }
    const cursorPos = editor.getCursorPosition()
    if (cursorPos.row === 0) {
      e.stopPropagation()
      editor.blur()
      rpcCall('moveUp', cursorPos.column)
    }
    return
  }
  if (e.code === 'Escape') {
    e.preventDefault()
    editor.blur()
    window.parent.window.dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
    return
  }
  if (isMacOs ? e.metaKey : e.ctrlKey) {
    if (['KeyZ', 'KeyN', 'KeyF', 'ArrowLeft', 'ArrowRight', 'Slash'].indexOf(e.code) >= 0) {
      if (e.code === 'Slash' && !e.altKey) return
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'KeyZ') {
        window.parent.document.querySelector('.editor-body').dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
      } else {
        window.parent.window.dispatchEvent(new window.parent.window.KeyboardEvent('keydown', e))
      }
    }
  }
}, true)

const services = {
  init: ({ key, lang, content, autoFocus, isReadOnly }) => {
    window.editorKey = key
    editor.session.setMode((lang in modelist.modesByName) ? modelist.modesByName[lang].mode : 'ace/mode/text')
    changeSilent = true
    editor.session.setValue(content || '')
    changeSilent = false
    setHeight()
    if (autoFocus) window.focus()
    if (isReadOnly) editor.setReadOnly(true)
  },
  changeLang: (lang) => {
    editor.session.setMode((lang in modelist.modesByName) ? modelist.modesByName[lang].mode : 'ace/mode/text')
    editor.focus()
  },
  setFocus: ({ direction, offset }) => {
    if (editor.isFocused()) return
    editor.focus()
    if (direction > 0) {
      editor.navigateTo(0, offset) 
    } else {
      editor.navigateTo(lineCount - 1, offset)
    }
  },
  insertText: (text) => {
    editor.focus()
    editor.navigateFileStart()
    editor.insert(text)
  },
  appendText: (text) => {
    editor.focus()
    editor.navigateFileEnd()
    if (!text) return
    const cursorPos = editor.getCursorPosition()
    editor.insert(text)
    editor.navigateTo(cursorPos.row, cursorPos.column)
  },
  setValue: (value) => {
    changeSilent = true
    editor.session.setValue(value || '')
    changeSilent = false
    setHeight()
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
