package io.github.mimimifan.boobo;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.view.View;
import android.view.WindowInsets;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private String pendingSave;
    private static final String HOME = "https://appassets.androidplatform.net/assets/www/index.html";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        if (android.os.Build.VERSION.SDK_INT >= 35) {
            web.setOnApplyWindowInsetsListener((v, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder().addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) { return loader.shouldInterceptRequest(r.getUrl()); }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                return !("https".equals(u.getScheme()) && "appassets.androidplatform.net".equals(u.getHost()) && u.getPath().startsWith("/assets/www/"));
            }
        });
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface public void exportSave(String text) {
                if (text == null || text.length() > 1048576) return;
                runOnUiThread(() -> {
                    if (pendingSave != null || !HOME.equals(web.getUrl())) return;
                    pendingSave = text;
                    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE, "boobo-save-" + System.currentTimeMillis() + ".json");
                    try { startActivityForResult(intent, 2); } catch (Exception e) { pendingSave = null; toast("无法打开文件选择器，请使用文本迁移。"); }
                });
            }
        }, "BooboAndroid");
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try { startActivityForResult(intent, 1); } catch (Exception e) { chooser.onReceiveValue(null); chooser = null; toast("请使用文本迁移。"); }
                return true;
            }
        });
        web.loadUrl(HOME);
    }
    private void toast(String text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
        if (request == 1 && chooser != null) { chooser.onReceiveValue(uri == null ? null : new Uri[]{uri}); chooser = null; }
        if (request == 2) {
            String text = pendingSave; pendingSave = null;
            if (uri == null || text == null) return;
            try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new java.io.IOException();
                out.write(text.getBytes(StandardCharsets.UTF_8)); toast("存档已保存。");
            } catch (Exception e) { toast("保存失败，请重试或使用文本迁移。"); }
        }
    }
    @Override public void onBackPressed() {
        new AlertDialog.Builder(this).setMessage("要离开啵啵吗？当前进度会保存在本机。")
            .setNegativeButton("继续玩", null).setPositiveButton("离开", (d, w) -> finish()).show();
    }
    @Override protected void onPause() {
        web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'));", null);
        web.onPause(); super.onPause();
    }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
    @Override protected void onDestroy() {
        if (chooser != null) chooser.onReceiveValue(null);
        web.removeJavascriptInterface("BooboAndroid"); web.destroy(); super.onDestroy();
    }
}
