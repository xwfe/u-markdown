# 欢迎使用 Markdown 笔记

这是首次使用 **Markdown 笔记** 自动生成的内容，包含 Markdown 语法和应用介绍

## 表格 & 文本样式

|样式|语法|示例|
|:--:|--|--|
|加粗|前后 `**` 或  `__`|**加粗1** __加粗2__|
|斜体|前后 `*` 或  `_`|*斜体1* _斜体2_|
|删除线|前后 `~~`|~~删除线~~|
|内联代码|前后 `|`code`|
|下划线|前 `<u>`  后 `</u>`|<u>下划线</u>|
|高亮|前后 `==`|==高亮文本==|

## 引用

> uTools 新一代效率工具平台

## 链接

*鼠标右击* 或 *Ctrl 键 + 点击* 系统默认浏览器打开链接

[uTools 官网](https://u.tools)  [猿料社区][猿料]

[猿料]: https://yuanliao.info

## 图片

拖放图片文件、粘贴截图可直接将图片源数据存储到笔记中

![LOGO](https://res.u-tools.cn/website/logo.png)

*图片可拖动为文件到任意窗口使用*

## 无序列表

- 项目
  - 项目 1
    - 项目 A
    - 项目 B
  - 项目 2

## 有序列表

1. 项目 1
   1. 项目 A
   2. 项目 B
2. 项目 2

## 任务列表

- [x] A 计划
  - [x] A1 计划
  - [ ] A2 计划
- [ ] B 计划

## 代码块

代码块支持 168 种编程语言

```javascript
// javascript 冒泡排序
function bubbleSort(array) {
  let swapped = true;
  do {
    swapped = false;
    for (let j = 0; j < array.length; j++) {
      if (array[j] > array[j + 1]) {
        let temp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = temp;
        swapped = true;
      }
    }
  } while (swapped);
  return array;
}
```

## [KaTeX](https://katex.org) 数学公式

### 内联公式

质能方程 $E=mc^2$ 

### 公式块

$$
\displaystyle \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
$$

# 应用介绍

## 特性

1. 极佳的 Markdown 编辑体验，实时预览、存储
2. 与传统富文本编辑方式结合，支持通用快捷键
3. 导出 MD、html、PDF、图片
4. 可快速搜索全部笔记(内容和标题)
5. 笔记名称可设置为 uTools 关键字，外部快速打开笔记

## 使用技巧

1. 侧边栏文件夹或笔记，**拖拽调整位置**，_鼠标右击_ 显示操作菜单
2. 当焦点未在编辑器，键盘上下方向键、 `Tab` 键切换笔记
3. 当焦点未在编辑器，`Enter` 进入编辑
4. `Command/Ctrl+F` 焦点切换到搜索
5. 编辑器中列表编辑时，按 `Tab` 变子项，`Shift + Tab` 恢复

