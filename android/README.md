# 啵啵安卓应用

应用名：啵啵。包名：io.github.mimimifan.boobo。最低 Android 8.0。

游戏资源随安装包提供，核心玩法不依赖在线网站。节假日数据仍按游戏原逻辑联网获取。
安卓外壳使用 WebViewAssetLoader 加载本地资源，提供系统文件选择器导入及保存 JSON 存档。
网页版与应用的存档互相独立，迁移时请先导出 JSON。卸载应用会删除本机进度。

构建要求：JDK 17、Android SDK 35、Build Tools 35.0.0、Gradle 8.11.1。
在 android 目录运行 `gradle :app:assembleDebug`，产物位于 app/build/outputs/apk/debug/。
正式包使用发布密钥签名，密钥通过 BOOBO_KEYSTORE、BOOBO_STORE_PASSWORD 环境变量提供。
测试包已由作者完成初步真机试玩及清除后台后的进度保留测试；正式包仍需安装确认。
必须私下持久保存发布签名密钥；不要向仓库上传密钥或密码。
打包时自动复制根目录游戏文件，仅在 APK 内的副本加入存档导出桥接，网页版代码不变。
