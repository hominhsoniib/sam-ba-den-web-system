import urllib.request
import os

IMAGES_TO_DOWNLOAD = {
    # Logo (Save to frontend public images)
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/logo.jpg": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\web-public\public\images\logo.jpg",
        "description": "Logo Ba Den Farm"
    },
    # Products (Save to backend files/images)
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/z7731274544460_aec1583af7d3ff816d8287e02068225d-300x300.jpg": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\files\images\sam_bo_chinh_tuoi.jpg",
        "description": "Sam Bo Chinh Tuoi"
    },
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/z7731456154209_df7435da8eadccf0eca56d49da929620-300x300.jpg": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\files\images\tra_sam_bo_chinh.jpg",
        "description": "Tra Sam Bo Chinh"
    },
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/z7731274562998_54f9f361fc67ac8b2d77df3923fbb1a0-300x300.jpg": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\files\images\sam_bo_chinh_kho.jpg",
        "description": "Sam Bo Chinh Kho"
    },
    # Farm (Vùng trồng)
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/Vuon_SBC2-scaled.jpg": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\files\images\vuon_sam_1.jpg",
        "description": "Vuon sam Bo Chinh 1"
    },
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/Vuon_sam.jpg": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\files\images\vuon_sam_2.jpg",
        "description": "Vuon sam Bo Chinh 2"
    },
    # Blog / News
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/1-16940780449192040454200-710x400.jpg": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\files\images\blog_kien_thuc_sam.jpg",
        "description": "Blog kien thuc sam"
    },
    "https://badenfarm.com.vn/wp-content/uploads/2026/04/IMG-7649-9762-1688179158-600x400.webp": {
        "dest": r"D:\App_Claude_Antigravity\Web_Landipage\files\images\blog_ruou_sam.jpg",
        "description": "Blog ruou sam"
    }
}

def main():
    print("Starting download of images from badenfarm.com.vn...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    success_count = 0
    for url, info in IMAGES_TO_DOWNLOAD.items():
        dest_path = info["dest"]
        desc = info["description"]
        print(f"Downloading: {desc}")
        
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response:
                with open(dest_path, "wb") as f:
                    f.write(response.read())
            print(f"  Saved to: {dest_path}")
            success_count += 1
        except Exception as e:
            print(f"  Error downloading {desc}: {e}")
            
    print(f"Finished. Successfully downloaded {success_count}/{len(IMAGES_TO_DOWNLOAD)} images.")

if __name__ == '__main__':
    main()
