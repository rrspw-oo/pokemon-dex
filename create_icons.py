#!/usr/bin/env python3
"""
建立PWA圖示的簡單腳本
需要安裝 Pillow: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # 建立圖片
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 背景圓形漸變 (簡化為單色)
    margin = size // 20
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill=(102, 126, 234), outline=(255, 255, 255), width=max(1, size//64))
    
    # 寶貝球設計
    center = size // 2
    ball_radius = size // 3
    
    # 寶貝球上半部 (紅色)
    draw.pieslice([center-ball_radius, center-ball_radius, 
                   center+ball_radius, center+ball_radius], 
                  0, 180, fill=(255, 107, 107))
    
    # 寶貝球下半部 (白色)
    draw.pieslice([center-ball_radius, center-ball_radius, 
                   center+ball_radius, center+ball_radius], 
                  180, 360, fill=(255, 255, 255))
    
    # 中心圓圈
    button_radius = size // 12
    draw.ellipse([center-button_radius, center-button_radius, 
                  center+button_radius, center+button_radius], 
                fill=(255, 255, 255), outline=(51, 51, 51), width=max(1, size//128))
    
    # 內部小圓
    inner_radius = size // 24
    draw.ellipse([center-inner_radius, center-inner_radius, 
                  center+inner_radius, center+inner_radius], 
                fill=(240, 240, 240))
    
    # 文字 (如果圖示夠大)
    if size >= 128:
        try:
            # 嘗試使用系統字體
            font_size = max(size // 16, 12)
            font = ImageFont.load_default()
            text = "圖鑑"
            
            # 計算文字位置
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            text_x = (size - text_width) // 2
            text_y = size - size // 4
            
            draw.text((text_x, text_y), text, fill=(255, 255, 255), font=font)
        except:
            pass
    
    # 添加一些裝飾點
    if size >= 96:
        sparkle_size = max(size // 40, 2)
        sparkles = [
            (size // 4, size // 4),
            (size * 3 // 4, size // 5),
            (size * 4 // 5, size // 3)
        ]
        
        for x, y in sparkles:
            draw.ellipse([x-sparkle_size, y-sparkle_size, 
                         x+sparkle_size, y+sparkle_size], 
                        fill=(255, 255, 255, 160))
    
    # 保存圖片
    img.save(filename, 'PNG')
    print(f"建立圖示: {filename} ({size}x{size})")

def main():
    # 建立icons目錄
    icons_dir = "icons"
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
    
    # 建立不同尺寸的圖示
    sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        filename = f"{icons_dir}/icon-{size}.png"
        create_icon(size, filename)
    
    print(f"完成！建立了 {len(sizes)} 個圖示檔案")
    print("請使用以下指令執行此腳本:")
    print("pip install Pillow")
    print("python3 create_icons.py")

if __name__ == "__main__":
    main()