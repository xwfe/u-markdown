import { clipboard } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as url from 'url'
import * as crypto from 'crypto'

declare const window: any

const attachmentCacheDir = path.join(window.utools.getPath('temp'), 'utools.notes')
const attachmentExtCache: Record<string, string | undefined> = {}

const imageMimeDic: Record<string, string> = {
  'image/bmp': '.bmp',
  'image/gif': '.gif',
  'image/vnd.microsoft.icon': '.ico',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/svg+xml': '.svg',
  'image/tiff': '.tiff',
  'image/webp': '.webp'
}

function waitTime(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time))
}

function writeNoteFile(
  folder: string | null,
  name: string,
  content: string,
  extraFiles: string[],
  ext: string,
  withFonts = false
): void {
  const isTemp = !folder
  let savePath: string | undefined
  name = name.replace(/[\/\\]/g, '').trim() || Date.now().toString()

  if (extraFiles.length > 0) {
    if (!folder) {
      folder = window.utools.showSaveDialog({
        defaultPath: path.join(window.utools.getPath('downloads') || '', name)
      })
      if (!folder) return
      try {
        if (!fs.existsSync(folder) || !fs.lstatSync(folder).isDirectory()) {
          fs.mkdirSync(folder, { recursive: true })
        }
      } catch (err) {
        throw new Error(`无法创建文件夹 "${folder}" — ${(err as Error).message}`)
      }
    }
    savePath = path.join(folder, `${name}.${ext}`)
    extraFiles.forEach(src => {
      try {
        fs.copyFileSync(src, path.join(folder!, path.basename(src)))
      } catch {
        /* ignore */
      }
    })
    if (ext === 'html' && withFonts) {
      try {
        const fontDir = path.join(__dirname, 'fonts')
        const fonts = fs.readdirSync(fontDir)
        const dest = path.join(folder, 'fonts')
        if (!fs.existsSync(dest)) fs.mkdirSync(dest)
        for (const f of fonts) {
          fs.copyFileSync(path.join(fontDir, f), path.join(dest, f))
        }
      } catch {
        /* ignore */
      }
    }
  } else if (folder) {
    savePath = path.join(folder, `${name}.${ext}`)
  } else {
    const defaultPath = path.join(window.utools.getPath('downloads') || '', `${name}.${ext}`)
    savePath = window.utools.showSaveDialog({
      defaultPath,
      filters: [{ name: ext === 'md' ? 'Markdown' : ext, extensions: [ext] }]
    })
    if (!savePath) return
  }
  try {
    fs.writeFileSync(savePath!, content, 'utf8')
  } catch (err) {
    throw new Error(`内容无法写入文件 "${savePath}" — ${(err as Error).message}`)
  }
  if (isTemp) {
    setTimeout(() => {
      window.utools.hideMainWindow(false)
      window.utools.shellShowItemInFolder(savePath!)
    }, 500)
  }
}

window.IS_MACOS = window.utools.isMacOS()
window.NATIVEID = window.utools.getNativeId()

window.services = {
  getFirstMDFileContent: () => fs.readFileSync(path.join(__dirname, 'first.md'), { encoding: 'utf-8' }),
  readClipboardHtml: () => clipboard.readHTML(),
  readClipboardData: () => ({ text: clipboard.readText(), html: clipboard.readHTML() }),
  writeClipboardData: (data: Electron.Clipboard | null) => { if (data) clipboard.write(data) },
  makeFolder: (dir: string, name: string) => {
    const dest = path.join(dir, name)
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
    return dest
  },
  writeMarkdownFile: (folder: string | null, title: string, content: string, extras: string[]) => {
    writeNoteFile(folder, title, content, extras, 'md')
  },
  writeHtmlFile: (title: string, html: string, style: string, extras: string[], withKatex: boolean) => {
    if (withKatex) extras.push(path.join(__dirname, 'katex.min.css'))
    const page = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>${title || ''}</title>
        ${withKatex ? '<link rel="stylesheet" href="./katex.min.css">' : ''}
        <style>
          html, body { margin: 0; padding: 0; background-color: #ffffff; }
          .markdown-body { box-sizing: border-box; min-width: 200px; max-width: 980px; margin: 0 auto; padding: 45px; }
          @media (max-width: 767px) { .markdown-body { padding: 15px; } }
          ${fs.readFileSync(path.join(__dirname, 'export-file', 'github-markdown.css'), 'utf-8')}
          ${style}
        </style>
      </head>
      <body>
        <article class="markdown-body">
          ${html}
        </article>
      </body>
      </html>`
    writeNoteFile(null, title, page, extras, 'html', withKatex)
  },
  copyHtml: (html: string) => { clipboard.writeHTML(html) },
  exportFile: (type: string, content: string, css: string, cb: (err: Error | null, p?: string) => void) => {
    const win = window.utools.createBrowserWindow('export-file/index.html', { width: 980, height: 600, show: false }, async () => {
      try {
        let data: any
        await waitTime(50)
        if (css) await win.webContents.insertCSS(css)
        await win.webContents.executeJavaScript(`document.querySelector('.markdown-body').innerHTML = ${JSON.stringify(content)}`)
        await win.webContents.executeJavaScript('window.waitAllImageLoaded()')
        await waitTime(50)
        if (type === 'image') {
          const height = await win.webContents.executeJavaScript('document.body.scrollHeight')
          win.setContentSize(980, height + 25)
          await waitTime(50)
          data = await win.webContents.capturePage()
          if ((data as any).toPNG) data = (data as any).toPNG()
        } else {
          data = await win.webContents.printToPDF({ marginsType: 0, printBackground: true, printSelectionOnly: false, landscape: false, pageSize: 'A4', scaleFactor: 100 })
        }
        win.destroy()
        const tmp = path.join(window.utools.getPath('temp'), 'utools_notes_export_' + Date.now() + (type === 'image' ? '.png' : '.pdf'))
        fs.writeFileSync(tmp, data)
        cb(null, tmp)
      } catch (err) {
        win.destroy()
        cb(err as Error)
      }
    })
  },
  dialogSaveExportFile: (tmp: string, title: string, type: string) => {
    title = title.replace(/[\/\\]/g, '').trim() || Date.now().toString()
    const defaultPath = path.join(window.utools.getPath('downloads') || '', title + path.extname(tmp))
    const savePath = window.utools.showSaveDialog({
      defaultPath,
      filters: [{ name: type[0].toUpperCase() + type.substr(1), extensions: [type === 'image' ? 'png' : type] }]
    })
    if (!savePath) return
    try {
      fs.renameSync(tmp, savePath)
      setTimeout(() => { window.utools.hideMainWindow(false); window.utools.shellShowItemInFolder(savePath) }, 1000)
    } catch {
      const rs = fs.createReadStream(tmp)
      const ws = fs.createWriteStream(savePath)
      rs.on('close', function () {
        try { fs.unlinkSync(tmp) } catch {}
        setTimeout(() => { window.utools.hideMainWindow(false); window.utools.shellShowItemInFolder(savePath) }, 1000)
      })
      rs.pipe(ws)
    }
  },
  getImageData: (input: string) => {
    let data: any
    let mime: string
    let name: string
    if (/^(data:(image\/(?:png|jpg|jpeg));base64,)/i.test(input)) {
      data = Buffer.from(input.replace(RegExp.$1, ''), 'base64')
      mime = RegExp.$2.toLowerCase()
      name = 'screen-capture'
    } else {
      if (!fs.existsSync(input)) throw new Error('图片文件不存在')
      const stat = fs.lstatSync(input)
      const ext = path.extname(input).toLowerCase()
      if (!['.png', '.jpe', '.jpg', '.jpeg', '.bmp', '.gif', '.svg', '.ico', '.webp'].includes(ext)) throw new Error('非图片格式文件')
      if (stat.size > 10485760) throw new Error('图片大小超过 10 M')
      data = fs.readFileSync(input)
      mime = 'image/' + ext.replace('.', '')
      name = path.basename(input)
    }
    return { digest: crypto.createHash('md5').update(data).digest('hex'), name, data, contentType: mime }
  },
  getClipboardImage: () => {
    const files = window.utools.getCopyedFiles()
    if (files) {
      if (files.length > 1) throw new Error('存在多个文件，请复制粘贴一个图片文件')
      return window.services.getImageData(files[0].path)
    }
    const formats = clipboard.availableFormats()
    if (formats.length === 0 || formats[0] === 'text/plain') return null
    if (formats[formats.length - 1].startsWith('image/')) {
      const img = clipboard.readImage()
      if (img && !img.isEmpty()) {
        const buf = img.toPNG()
        if (buf.byteLength > 10485760) throw new Error('图片大小超过 10 M')
        return { digest: crypto.createHash('md5').update(buf).digest('hex'), name: '截图', data: buf, contentType: 'image/png' }
      }
    }
    return null
  },
  getAttachmentTempPath: (id: string) => {
    let ext = attachmentExtCache[id]
    if (!ext) {
      const doc = window.utools.db.get('attachment/' + id)
      if (doc) ext = doc._attachments[0].content_type.replace('image/', '.')
      attachmentExtCache[id] = ext
    }
    const file = path.join(attachmentCacheDir, id) + (ext || '')
    if (fs.existsSync(file)) return file
    const data = window.utools.db.getAttachment('attachment/' + id)
    if (!data) return null
    if (!fs.existsSync(attachmentCacheDir)) fs.mkdirSync(attachmentCacheDir)
    try { fs.writeFileSync(file, data) } catch { return null }
    return file
  },
  getFileBaseName: (file: string) => path.basename(file),
  getFileContent: (file: string) => { try { return fs.readFileSync(file, 'utf-8') } catch { return '' } },
  fileUrlToPath: (value: string) => url.fileURLToPath(value),
  saveImgToFileBySrc: async (src: string) => {
    let data: any
    let ext: string
    if (/^data:(image\/[a-z]+?);base64,/i.test(src)) {
      ext = imageMimeDic[RegExp.$1.toLowerCase()]
      if (!ext) return null
      data = Buffer.from(src.replace(/^data:(image\/[a-z]+?);base64,/i, ''), 'base64')
    } else {
      if (!/^https?:\/\//i.test(src)) return null
      const resp = await window.fetch(src)
      const blob = await resp.blob()
      ext = imageMimeDic[blob.type]
      if (!ext) return null
      const arr = await blob.arrayBuffer()
      data = Buffer.from(new Uint8Array(arr))
    }
    const digest = crypto.createHash('md5').update(data).digest('hex')
    const dest = path.join(attachmentCacheDir, digest) + ext
    if (fs.existsSync(dest)) return dest
    if (!fs.existsSync(attachmentCacheDir)) fs.mkdirSync(attachmentCacheDir)
    try { fs.writeFileSync(dest, data) } catch { return null }
    return dest
  },
  shellOpenPath: (file: string) => {
    setTimeout(() => {
      try {
        if (!fs.existsSync(file)) return void window.utools.showNotification('"' + file + '" 路径不存在!')
      } catch {
        return
      }
      window.utools.shellOpenPath(file)
    })
  },
  convertMdFileImageURLToAbsolutePath: (mdFile: string, urlPath: string) => {
    const p = path.join(path.dirname(mdFile), urlPath)
    return fs.existsSync(p) ? p : null
  }
}
