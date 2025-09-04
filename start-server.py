#!/usr/bin/env python3
"""
簡單的HTTP伺服器來測試PWA功能
"""
import http.server
import socketserver
import webbrowser
import threading
import time
import os

PORT = 8080

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加PWA所需的MIME類型
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def guess_type(self, path):
        # 確保正確的MIME類型
        result = super().guess_type(path)
        if isinstance(result, tuple):
            mimetype, encoding = result
        else:
            mimetype, encoding = result, None
            
        if path.endswith('.js'):
            return 'text/javascript'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.png'):
            return 'image/png'
        return mimetype or 'text/html'

def start_server():
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            print(f"🚀 寶可夢圖鑑PWA伺服器啟動中...")
            print(f"📱 網址: http://localhost:{PORT}/pokemon-search.html")
            print(f"🔧 按 Ctrl+C 停止伺服器")
            print()
            print("PWA 測試步驟:")
            print("1. 在瀏覽器中開啟上述網址")
            print("2. 檢查開發者工具 > Application > Service Workers")
            print("3. 檢查 Application > Manifest")
            print("4. 在地址欄看到安裝圖示（在Chrome中）")
            print("5. 測試離線模式（Network tab > Offline）")
            print()
            
            # 自動開啟瀏覽器
            def open_browser():
                time.sleep(1)
                webbrowser.open(f'http://localhost:{PORT}/pokemon-search.html')
            
            threading.Thread(target=open_browser, daemon=True).start()
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 伺服器已停止")
    except OSError as e:
        if e.errno == 48:
            print(f"❌ 埠號 {PORT} 已被佔用，請嘗試其他埠號")
        else:
            print(f"❌ 伺服器啟動失敗: {e}")

if __name__ == "__main__":
    # 切換到正確的目錄
    os.chdir('/Users/r_r/Downloads/pokemon')
    start_server()