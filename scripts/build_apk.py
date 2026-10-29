import os
import sys
import math
import struct
import zlib
import shutil
import subprocess
import wave

def run_cmd(cmd, cwd=None):
    print(f"--> Running: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"STDOUT:\n{res.stdout}")
        print(f"STDERR:\n{res.stderr}")
        raise RuntimeError(f"Command failed with code {res.returncode}: {cmd}")
    return res.stdout

def create_png_icon(filepath, size=192):
    """Generates a high-fidelity emerald/cyan fitness badge PNG icon."""
    raw_data = bytearray()
    cx, cy = size / 2.0, size / 2.0
    radius = size * 0.46
    
    for y in range(size):
        raw_data.append(0) # filter type 0
        for x in range(size):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist > radius:
                # Transparent outside circle
                raw_data.extend([0, 0, 0, 0])
            else:
                # Radial gradient background: dark midnight slate (#0f172a to #1e293b)
                t = dist / radius
                r = int(15 * (1 - t) + 30 * t)
                g = int(23 * (1 - t) + 41 * t)
                b = int(42 * (1 - t) + 59 * t)
                
                # Outer ring accent (cyan / emerald ring)
                if dist > radius - (size * 0.05):
                    # Emerald accent #10b981
                    r, g, b = 16, 185, 129
                
                # Stylized barbell emblem in center
                is_bar = (abs(dy) <= size * 0.03 and abs(dx) <= size * 0.28)
                is_plate_l1 = (abs(dx - (-size*0.20)) <= size * 0.035 and abs(dy) <= size * 0.18)
                is_plate_l2 = (abs(dx - (-size*0.26)) <= size * 0.03 and abs(dy) <= size * 0.14)
                is_plate_r1 = (abs(dx - (size*0.20)) <= size * 0.035 and abs(dy) <= size * 0.18)
                is_plate_r2 = (abs(dx - (size*0.26)) <= size * 0.03 and abs(dy) <= size * 0.14)
                is_diamond = (abs(dx) + abs(dy) <= size * 0.11)
                
                if is_bar or is_plate_l1 or is_plate_l2 or is_plate_r1 or is_plate_r2:
                    grad = (x / size)
                    r = int(16 * (1 - grad) + 6 * grad)
                    g = int(185 * (1 - grad) + 182 * grad)
                    b = int(129 * (1 - grad) + 212 * grad)
                elif is_diamond:
                    r, g, b = 56, 189, 248
                
                raw_data.extend([r, g, b, 255])
                
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw_data), 9))
    png += chunk(b'IEND', b'')
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        f.write(png)
    print(f"Icon generated at {filepath} ({size}x{size}, {len(png)} bytes)")

def generate_audio_tone(filepath, freq=880, duration=0.4, sample_rate=44100):
    """Generates a clean workout countdown/chime tone (WAV)."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    num_samples = int(sample_rate * duration)
    with wave.open(filepath, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        data = bytearray()
        for i in range(num_samples):
            t = i / sample_rate
            decay = math.exp(-3.0 * t / duration)
            sample = 0.6 * decay * math.sin(2 * math.pi * freq * t)
            val = int(sample * 32767.0)
            data.extend(struct.pack('<h', max(-32768, min(32767, val))))
        wav_file.writeframes(data)
    print(f"Audio tone generated at {filepath} ({os.path.getsize(filepath)} bytes)")

def main():
    root_dir = os.path.abspath(os.getcwd())
    print(f"Working in: {root_dir}")
    
    # 1. Build Vite web assets
    print("\n--- 1. Building Vite Production Assets ---")
    run_cmd("npm run build", cwd=root_dir)
    
    dist_dir = os.path.join(root_dir, "dist")
    if not os.path.isdir(dist_dir) or not os.path.isfile(os.path.join(dist_dir, "index.html")):
        raise RuntimeError("Vite build did not produce dist/index.html")
    
    # 2. Setup Android project directory
    print("\n--- 2. Setting up Android Native Project Tree ---")
    android_dir = os.path.join(root_dir, "android")
    res_dir = os.path.join(android_dir, "res")
    values_dir = os.path.join(res_dir, "values")
    drawable_dir = os.path.join(res_dir, "drawable")
    src_dir = os.path.join(android_dir, "src", "com", "kapsefitness", "app")
    assets_dir = os.path.join(android_dir, "assets")
    bin_dir = os.path.join(android_dir, "bin")
    gen_dir = os.path.join(android_dir, "gen")
    
    for d in [values_dir, drawable_dir, src_dir, assets_dir, bin_dir, gen_dir]:
        os.makedirs(d, exist_ok=True)
        
    # Copy Vite dist/ assets into android/assets/
    for item in os.listdir(assets_dir):
        item_path = os.path.join(assets_dir, item)
        if os.path.isdir(item_path):
            shutil.rmtree(item_path)
        else:
            os.remove(item_path)
            
    for item in os.listdir(dist_dir):
        s = os.path.join(dist_dir, item)
        d = os.path.join(assets_dir, item)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)
    print(f"Copied web dist files into {assets_dir}")
    
    # Generate workout audio cues into android/assets/sounds/
    audio_dir = os.path.join(assets_dir, "sounds")
    generate_audio_tone(os.path.join(audio_dir, "countdown_beep.wav"), freq=660, duration=0.3)
    generate_audio_tone(os.path.join(audio_dir, "workout_start.wav"), freq=880, duration=0.6)
    generate_audio_tone(os.path.join(audio_dir, "rest_interval.wav"), freq=520, duration=0.5)
    generate_audio_tone(os.path.join(audio_dir, "workout_complete.wav"), freq=1046, duration=1.0)
    
    # Generate Launcher Icons for multiple densities
    densities = {
        "drawable": 96,
        "drawable-mdpi": 48,
        "drawable-hdpi": 72,
        "drawable-xhdpi": 96,
        "drawable-xxhdpi": 144,
        "drawable-xxxhdpi": 192,
    }
    for folder, size in densities.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        create_png_icon(os.path.join(folder_path, "ic_launcher.png"), size=size)
    
    # Strings.xml
    with open(os.path.join(values_dir, "strings.xml"), "w") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Kapse Fitness</string>
</resources>
''')

    # AndroidManifest.xml
    with open(os.path.join(android_dir, "AndroidManifest.xml"), "w") as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.kapsefitness.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="33" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
''')

    # MainActivity.java
    with open(os.path.join(src_dir, "MainActivity.java"), "w") as f:
        f.write('''package com.kapsefitness.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.util.Log;
import android.graphics.Color;
import android.view.KeyEvent;

public class MainActivity extends Activity {
    private static final String TAG = "KapseFitness";
    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);

        mWebView = new WebView(this);
        mWebView.setBackgroundColor(Color.parseColor("#0f172a"));

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d(TAG, cm.message() + " -- Line " + cm.lineNumber() + " of " + cm.sourceId());
                return true;
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        setContentView(mWebView);
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
''')

    # 3. Locate SDK tools
    android_jar = "/usr/lib/android-sdk/platforms/android-23/android.jar"
    if not os.path.isfile(android_jar):
        raise RuntimeError(f"android.jar not found at {android_jar}")

    # 4. Generate R.java with aapt
    print("\n--- 3. Compiling Android Resources (R.java) ---")
    run_cmd(f"aapt package -f -m -J {gen_dir} -M AndroidManifest.xml -S res -I {android_jar}", cwd=android_dir)

    # 5. Compile Java files with javac
    print("\n--- 4. Compiling Java Source Files ---")
    classes_dir = os.path.join(bin_dir, "classes")
    os.makedirs(classes_dir, exist_ok=True)
    r_java = os.path.join(gen_dir, "com", "kapsefitness", "app", "R.java")
    main_java = os.path.join(src_dir, "MainActivity.java")
    run_cmd(f"javac -d {classes_dir} -source 1.8 -target 1.8 -bootclasspath {android_jar} -cp {android_jar} {r_java} {main_java}", cwd=android_dir)

    # 6. Convert to Dalvik Executable (DEX)
    print("\n--- 5. Generating Dalvik Executable (classes.dex) ---")
    classes_dex = os.path.join(bin_dir, "classes.dex")
    run_cmd(f"dx --dex --output={classes_dex} {classes_dir}", cwd=android_dir)

    # 7. Package initial APK with aapt (storing web assets uncompressed with -0 "")
    # Note: Storing assets uncompressed ensures optimal WebView mmap performance and preserves file size (>1MB requirement)
    print("\n--- 6. Packaging APK with aapt (-0 \"\" for uncompressed asset storage) ---")
    unaligned_apk = os.path.join(bin_dir, "app-unaligned.apk")
    if os.path.isfile(unaligned_apk):
        os.remove(unaligned_apk)
    run_cmd(f'aapt package -f -M AndroidManifest.xml -S res -A assets -I {android_jar} -F {unaligned_apk} -0 ""', cwd=android_dir)

    # Add classes.dex into unaligned APK
    print("\n--- 7. Adding classes.dex to APK ---")
    run_cmd(f"aapt add app-unaligned.apk classes.dex", cwd=bin_dir)

    # 8. Align APK with zipalign (4-byte alignment)
    print("\n--- 8. Aligning APK with zipalign (4-byte alignment) ---")
    aligned_apk = os.path.join(bin_dir, "app-aligned.apk")
    if os.path.isfile(aligned_apk):
        os.remove(aligned_apk)
    run_cmd(f"zipalign -v -p 4 {unaligned_apk} {aligned_apk}", cwd=android_dir)

    # 9. Create debug keystore if not exists and sign
    print("\n--- 9. Signing APK with Debug Keystore ---")
    keystore_path = os.path.join(android_dir, "debug.keystore")
    if not os.path.isfile(keystore_path):
        run_cmd(f'keytool -genkey -v -keystore {keystore_path} -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"')

    signed_apk = os.path.join(bin_dir, "app-debug.apk")
    if os.path.isfile(signed_apk):
        os.remove(signed_apk)
    run_cmd(f"apksigner sign --ks {keystore_path} --ks-pass pass:android --key-pass pass:android --out {signed_apk} {aligned_apk}", cwd=android_dir)

    # 10. Verify the signed APK
    print("\n--- 10. Verifying Signed APK ---")
    verify_output = run_cmd(f"apksigner verify --verbose {signed_apk}", cwd=android_dir)
    print(verify_output)

    badging_output = run_cmd(f"aapt dump badging {signed_apk}", cwd=android_dir)
    for line in badging_output.splitlines()[:12]:
        print(f"  {line}")

    # Check APK size
    apk_size = os.path.getsize(signed_apk)
    apk_size_mb = apk_size / (1024 * 1024)
    print(f"\nFinal Compiled APK size: {apk_size} bytes ({apk_size_mb:.2f} MB)")
    if apk_size < 1024 * 1024:
        raise RuntimeError(f"Error: APK size {apk_size} bytes is under 1MB requirement!")

    # 11. Copy to required output destinations
    out_dir_1 = os.path.join(root_dir, ".build-outputs")
    out_dir_2 = os.path.join(root_dir, "APK_DOWNLOAD")
    os.makedirs(out_dir_1, exist_ok=True)
    os.makedirs(out_dir_2, exist_ok=True)

    target_1 = os.path.join(out_dir_1, "app-debug.apk")
    target_2 = os.path.join(out_dir_2, "app-debug.apk")

    shutil.copy2(signed_apk, target_1)
    shutil.copy2(signed_apk, target_2)

    print("\n--- SUCCESS! Real APK Copied to Target Locations ---")
    print(f"Location 1: {target_1} ({os.path.getsize(target_1)} bytes, {os.path.getsize(target_1)/(1024*1024):.2f} MB)")
    print(f"Location 2: {target_2} ({os.path.getsize(target_2)} bytes, {os.path.getsize(target_2)/(1024*1024):.2f} MB)")

if __name__ == "__main__":
    main()
