package com.sharib.onemoredoor;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;

public class MainActivity extends Activity {
    private WebView web;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        web.setBackgroundColor(0xff080b12);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!"game.local".equals(request.getUrl().getHost())) return null;
                String path=request.getUrl().getPath();
                if(path == null || path.equals("/")) path="/index.html";
                if(path.contains("..")) return new WebResourceResponse("text/plain","UTF-8",404,"Not found",java.util.Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));
                try {
                    InputStream data=getAssets().open(path.substring(1));
                    String mime=path.endsWith(".js")?"text/javascript":path.endsWith(".css")?"text/css":path.endsWith(".html")?"text/html":path.endsWith(".woff2")?"font/woff2":path.endsWith(".woff")?"font/woff":"application/octet-stream";
                    return new WebResourceResponse(mime,"UTF-8",data);
                } catch(Exception ex) {
                    return new WebResourceResponse("text/plain","UTF-8",404,"Not found",java.util.Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));
                }
            }
        });
        setContentView(web);
        web.loadUrl("https://game.local/index.html");
    }
    @Override protected void onDestroy() { if(web!=null) web.destroy(); super.onDestroy(); }
}
