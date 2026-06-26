# 天津大学职业价值观取舍互动 H5

这是一个“静态 H5 网页 + Supabase 云端数据库”的课堂互动工具，适用于《从书信谈选择——职业价值观》10分钟教学展示。

## 功能

- 学生端：12选5 → 5选4 → 4选3 → 3留1
- 学生端：提交最终职业价值关键词，并可选填写“给未来自己的回信”
- 教师端：实时显示参与人数、词云、柱状统计、提交明细
- 教师端：支持复制学生端链接、生成二维码、导出 CSV、清空本场数据
- 不需要 Node.js；部署后任何设备打开网址即可使用

## 文件结构

```text
index.html                 学生端页面
teacher.html               教师端页面
config.js                  Supabase 配置文件
supabase-schema.sql        Supabase 建表脚本
assets/styles.css          样式文件
assets/app.js              公共逻辑
assets/student.js          学生端逻辑
assets/teacher.js          教师端逻辑
```

## 第一步：创建 Supabase 数据库

1. 打开 Supabase 官网并创建一个新项目。
2. 进入项目后，打开 **SQL Editor**。
3. 新建 Query，把 `supabase-schema.sql` 中的全部内容复制进去并运行。
4. 运行成功后，数据库中会生成表：`career_value_responses`。

> 这个表不会收集学生姓名、学号、手机号等隐私信息，只保存匿名设备ID和选择结果。

## 第二步：填写 config.js

打开 `config.js`，替换下面两个字段：

```js
SUPABASE_URL: "请替换为你的 Supabase Project URL",
SUPABASE_ANON_KEY: "请替换为你的 Supabase anon public key",
```

在 Supabase 后台可按以下路径找到：

- Project URL：Project Settings → API → Project URL
- anon public key：Project Settings → API → Project API keys → anon public

也可以修改默认场次：

```js
DEFAULT_CLASS_ID: "tju-career-values-demo"
```

## 第三步：部署到网页空间

任选一种方式部署整个文件夹即可：

### 方式一：GitHub Pages

1. 新建 GitHub 仓库。
2. 上传本文件夹全部内容。
3. Settings → Pages → Deploy from branch。
4. 打开生成的网址，例如：

```text
https://你的用户名.github.io/仓库名/teacher.html
```

### 方式二：Netlify / Vercel

1. 新建项目。
2. 上传整个文件夹或连接 GitHub 仓库。
3. 不需要构建命令。
4. 发布目录填写根目录即可。

### 方式三：腾讯云静态网站托管 / 学校服务器

把整个文件夹上传到静态网站空间即可。

## 第四步：课堂使用

教师端打开：

```text
https://你的域名/teacher.html
```

学生端由教师端自动生成二维码和链接，例如：

```text
https://你的域名/index.html?class=tju-2026-final
```

建议每次展示使用独立场次 ID，例如：

```text
tju-2026-final
```

## 课堂展示建议

在讲稿中可这样表述：

> 请大家扫码进入“职业价值取舍”互动页面，从12个职业因素中选择自己最看重的5项。系统会模拟真实择业情境：岗位只能满足4项、3项，最后只能保留1项。提交后，教师端将实时生成班级职业价值观词云。我们通过这张词云，观察同学们在职业选择中最重视的价值因子。

## 注意事项

1. 比赛前务必提前测试：教师电脑、学生手机、比赛场地网络。
2. 如果二维码无法显示，可直接复制学生链接。
3. 如果教师端没有数据，优先检查：
   - config.js 是否填写正确；
   - Supabase SQL 是否运行成功；
   - Supabase 项目是否暂停；
   - 浏览器控制台是否有报错。
4. `supabase-schema.sql` 为了课堂使用方便，允许匿名提交、读取和清空本场数据。请不要在该表中收集敏感个人信息。
5. 正式比赛前，可设置一个测试场次先演练，展示时切换到正式场次。

## 本地预览

如果只是查看页面样式，可直接双击打开 `index.html` 或 `teacher.html`。未配置 Supabase 时，页面会进入单机预览模式；但单机模式不能跨设备汇总数据。
