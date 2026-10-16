# 啵啵安卓测试版

应用名：啵啵。包名：io.github.mimimifan.boobo。最低 Android 8.0。

游戏资源随安装包提供，核心玩法不依赖在线网站。节假日数据仍按游戏原逻辑联网获取。
安卓外壳使用 WebViewAssetLoader 加载本地资源，提供系统文件选择器导入及保存 JSON 存档。
网页版与应用的存档互相独立，迁移时请先导出 JSON。卸载应用会删除本机进度。

构建要求：JDK 17、Android SDK 35、Build Tools 35.0.0、Gradle 8.11.1。
在 android 目录运行 `gradle :app:assembleDebug`，产物位于 app/build/outputs/apk/debug/。
当前为测试构建，尚未完成真机验收，不作为正式发布签名版本。
正式发布前须配置私有且持久保存的签名密钥；不要向仓库上传密钥或密码。
打包时自动复制根目录游戏文件，仅在 APK 内的副本加入存档导出桥接，网页版代码不变。
