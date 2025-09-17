# papercode
papercode是一款用纸带写代码的游戏，就像计算机发明后不久，人们使用纸带写代码一样。

在papercode里，你有一条无限长的纸带，你可以点击纸带上面的指针来截断纸条，不过这是可复原的，开头前面5格是占位符，不会出现在你的代码中。

在papercode里一定要养成截断的好习惯，不然你的代码就会报错
# 快捷键
papercode不仅支持按钮，同时也支持快捷键，下面是快捷键与其功能的对照表
```
t截断
a/←向左移动纸条
d/→向右移动纸条
space 打孔(把方格改为黑色)
c查看纸带内容
b查看二进制编码
p打开插件菜单
esc关闭对应窗口，同一个键再按一次效果一样
```
# 插件(plugin)
在papercode中，你无法运行你的程序，和现实情况一样，通过纸带编写代码也是有不同的语言，你还可以写不同的工具和编译器来满足你的需要。

当你的程序要依赖多个插件时，建议把他们打包到一起，方便使用
## 写插件
### manifest
manifest在代码的开头，是一段json文本，用于告诉papercode你插件的相关信息
manifest格式如下：
```
"manifest": {
    "name": "十六进制转换器",
    "packname": "com.papercode.hexconverter.v2",
    "description": "添加一个Hex按钮，用于将纸带二进制数据转换为十六进制值",
    "lib": [],
    "incompatible": []
}
```
其中manifest表明你是这个描述文件，确保它不会被加载到papercode里

neme就是你插件的名字，这个必须填

packname是你插件的包名，命名时要是xxx.xxx.xxx，当然这个数量还可以更多，比如xxx.xxx.xxx.xxx，但是不可以少于三个，这个也是必填

description是插件的描述，可以不写

lib是插件的依赖，如果你的插件需要依赖其他插件则在[]里面加入这个插件的包名，如`"lib":["xxx.xxx.xxx","xxx.xxx.abc"]"

如果你的插件与别的插件有冲突，则把插件的包名加入incompatible，填写形式和lib差不多
### 插件主体js
在插件开头写完manifest后就可以写js了，js就是html使用的js，所以你才可以去添加按钮之类，不过添加按钮之类要通过js添加，学习一下js就可以掌握开发技巧

papercode还有一个函数叫getTapeBinary()，用它可以获取纸带内容转换为二进制的信息，适用于制作编译器

项目还会提供一个js插件示例，是个hex查看器，之后的内容自行探索
