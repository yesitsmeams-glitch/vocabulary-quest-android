package com.vocabularyquest.app;

import android.app.Activity;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.Locale;

/** A small, offline-only native shell for the bundled Vocabulary Quest game. */
public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    private WebView webView;
    private TextToSpeech speaker;
    private boolean speakerReady;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        speaker = new TextToSpeech(this, this);
        webView = new WebView(this);
        webView.setBackgroundColor(0xFFF7F8FF);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(true);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        webView.getSettings().setSupportMultipleWindows(false);
        webView.addJavascriptInterface(new NativeSpeech(), "VocabularyNative");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Never navigate to external or untrusted content while the JS bridge is exposed.
                return !"file".equals(request.getUrl().getScheme());
            }
        });
        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override public void onInit(int status) {
        speakerReady = status == TextToSpeech.SUCCESS;
        if (speakerReady) speaker.setLanguage(Locale.US);
    }

    private class NativeSpeech {
        @JavascriptInterface public void speak(String word) {
            if (word == null || word.length() > 100) return;
            runOnUiThread(() -> {
                if (speakerReady) speaker.speak(word, TextToSpeech.QUEUE_FLUSH, null, "vq-word");
            });
        }

        /** Text-to-speech is local to Android's installed voice engine. */
        @JavascriptInterface public void speakText(String text, float rate) {
            if (text == null || text.isEmpty() || text.length() > 3800) return;
            final float safeRate = Math.max(.55f, Math.min(rate, 1.2f));
            runOnUiThread(() -> {
                if (speakerReady) {
                    speaker.setSpeechRate(safeRate);
                    speaker.speak(text, TextToSpeech.QUEUE_FLUSH, null, "vq-reading");
                }
            });
        }

        @JavascriptInterface public void stopSpeech() {
            runOnUiThread(() -> {
                if (speakerReady) speaker.stop();
            });
        }
    }

    @Override public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("window.VQ && window.VQ.back()", result -> {
                if ("false".equals(result)) finish();
            });
        } else {
            super.onBackPressed();
        }
    }

    @Override protected void onDestroy() {
        if (speaker != null) { speaker.stop(); speaker.shutdown(); }
        if (webView != null) { webView.destroy(); }
        super.onDestroy();
    }
}
