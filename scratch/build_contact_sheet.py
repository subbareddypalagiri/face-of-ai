import os
from PIL import Image, ImageDraw, ImageFont

artifact_dir = os.path.expandvars(r"%USERPROFILE%\.gemini\antigravity\brain\bfb9c975-0c9f-4cc6-941e-731fe103d2b5")
out_path = os.path.join(artifact_dir, "unin_photorealism_11_objects_contact_sheet.png")

items = [
    {
        "num": "01",
        "category": "Furniture",
        "name": "Chair",
        "before": "unin_benchmark_furniture_chair.png",
        "after": "unin_photorealism_chair_after.png",
        "before_desc": "Before: Procedural Assembly (1,936 tris) — Marshmallow blockout",
        "after_desc": "After: Local Catalog GLB (2,248 tris) — Clean CAD, no image textures",
        "before_score": "2.5 / 10",
        "after_score": "6.5 / 10"
    },
    {
        "num": "02",
        "category": "Furniture",
        "name": "Office Desk",
        "before": "unin_benchmark_furniture_desk.png",
        "after": "unin_photorealism_desk_after.png",
        "before_desc": "Before: Procedural Assembly (1,524 tris) — Flat brown box massing",
        "after_desc": "After: Local Catalog GLB (692 tris) — Beveled oak top, steel legs, no grain map",
        "before_score": "4.5 / 10",
        "after_score": "6.5 / 10"
    },
    {
        "num": "03",
        "category": "Electronics",
        "name": "Smartphone",
        "before": "unin_benchmark_electronics_phone.png",
        "after": "unin_photorealism_phone_after.png",
        "before_desc": "Before: Procedural Assembly (1,668 tris) — Camera 1.5m away, 2% pixel speck",
        "after_desc": "After: Local Catalog GLB (1,960 tris) — Macro framing, titanium CAD body",
        "before_score": "3.5 / 10",
        "after_score": "6.5 / 10"
    },
    {
        "num": "04",
        "category": "Electronics",
        "name": "Desktop PC",
        "before": "unin_benchmark_electronics_computer.png",
        "after": "unin_photorealism_computer_after.png",
        "before_desc": "Before: Procedural Assembly (844 tris) — Featureless black monolith",
        "after_desc": "After: Procedural Assembly (844 tris) — Shaded tower, monitor reflection",
        "before_score": "2.5 / 10",
        "after_score": "5.0 / 10"
    },
    {
        "num": "05",
        "category": "Vehicles",
        "name": "Sports Car",
        "before": "unin_benchmark_vehicles_car.png",
        "after": "unin_photorealism_car_after.png",
        "before_desc": "Before: Local Catalog (358,788 tris) — High poly Ferrari, opaque windshield",
        "after_desc": "After: Local Catalog (358,788 tris) — Same Ferrari GLB, studio lighting",
        "before_score": "8.5 / 10",
        "after_score": "8.5 / 10"
    },
    {
        "num": "06",
        "category": "Vehicles",
        "name": "Chopper Motorcycle",
        "before": "unin_benchmark_vehicles_motorcycle.png",
        "after": "unin_photorealism_motorcycle_after.png",
        "before_desc": "Before: Procedural Assembly (37,088 tris) — Blown highlights on floor",
        "after_desc": "After: Procedural Assembly (37,088 tris) — High-CAD mechanical model",
        "before_score": "6.0 / 10",
        "after_score": "7.0 / 10"
    },
    {
        "num": "07",
        "category": "Architecture",
        "name": "Small House",
        "before": "unin_benchmark_architecture_house.png",
        "after": "unin_photorealism_house_after.png",
        "before_desc": "Before: Procedural Assembly (1,344 tris) — Inverted V-trough roof bug",
        "after_desc": "After: Local Catalog GLB (204 tris) — Correct A-frame gable roof CAD",
        "before_score": "2.5 / 10",
        "after_score": "6.0 / 10"
    },
    {
        "num": "08",
        "category": "Vegetation",
        "name": "Tree",
        "before": "unin_benchmark_nature_tree.png",
        "after": "unin_photorealism_tree_after.png",
        "before_desc": "Before: Local Catalog (6,017 tris) — Birch tree with photographic textures",
        "after_desc": "After: Local Catalog (6,017 tris) — Same tree.glb, scale-aware lighting",
        "before_score": "8.5 / 10",
        "after_score": "8.5 / 10"
    },
    {
        "num": "09",
        "category": "Creatures",
        "name": "Dragon",
        "before": "unin_benchmark_creatures_dragon.png",
        "after": "unin_photorealism_dragon_after.png",
        "before_desc": "Before: Procedural Assembly (3,434 tris) — Sausage/cylinder balloon animal",
        "after_desc": "After: Procedural Assembly (3,434 tris) — PREVIEW ONLY (Unsculpted scaffold)",
        "before_score": "2.0 / 10",
        "after_score": "2.5 / 10"
    },
    {
        "num": "10",
        "category": "Transport",
        "name": "Commercial Airplane",
        "before": "unin_benchmark_transport_airplane.png",
        "after": "unin_photorealism_airplane_after.png",
        "before_desc": "Before: Procedural Assembly (3,780 tris) — 40m jet in unlit black void",
        "after_desc": "After: Procedural Assembly (3,780 tris) — Fully lit airframe, no panel maps",
        "before_score": "2.0 / 10",
        "after_score": "5.5 / 10"
    },
    {
        "num": "11",
        "category": "Sci-Fi",
        "name": "Spaceship",
        "before": "unin_benchmark_scifi_spaceship.png",
        "after": "unin_photorealism_spaceship_after.png",
        "before_desc": "Before: Procedural Assembly (1,882 tris) — Lost in harsh black shadows",
        "after_desc": "After: Procedural Assembly (1,882 tris) — Shaded stealth interceptor CAD",
        "before_score": "2.5 / 10",
        "after_score": "6.0 / 10"
    }
]

# Layout dimensions
thumb_w = 640
thumb_h = 360
card_pad = 20
banner_h = 60
row_h = banner_h + thumb_h + 40
sheet_w = (thumb_w * 2) + (card_pad * 3)
header_h = 100
total_h = header_h + (len(items) * row_h) + card_pad

# Create canvas
canvas = Image.new("RGB", (sheet_w, total_h), color=(18, 20, 24))
draw = ImageDraw.Draw(canvas)

# Fonts
try:
    font_title = ImageFont.truetype("arial.ttf", 28)
    font_header = ImageFont.truetype("arial.ttf", 20)
    font_label = ImageFont.truetype("arial.ttf", 15)
    font_bold = ImageFont.truetype("arialbd.ttf", 16)
except:
    font_title = ImageFont.load_default()
    font_header = ImageFont.load_default()
    font_label = ImageFont.load_default()
    font_bold = ImageFont.load_default()

# Main Header
draw.rectangle([(0, 0), (sheet_w, header_h)], fill=(28, 32, 40))
draw.text((card_pad, 16), "UNIN 3D BENCHMARK — COMPREHENSIVE BEFORE / AFTER CONTACT SHEET", fill=(255, 255, 255), font=font_title)
draw.text((card_pad, 54), "11 Benchmark Categories | Objective Visual Realism Audit & Technical Evidence | Engine: Blender 5.1", fill=(170, 180, 200), font=font_label)

y_offset = header_h + card_pad

for item in items:
    # Row banner
    banner_rect = [(card_pad, y_offset), (sheet_w - card_pad, y_offset + banner_h - 10)]
    draw.rectangle(banner_rect, fill=(35, 40, 50))
    title_text = f"#{item['num']}  [{item['category'].upper()}]  {item['name'].upper()}"
    draw.text((card_pad + 15, y_offset + 12), title_text, fill=(240, 245, 255), font=font_header)
    
    # Scores pill on right
    score_pill = f"Before: {item['before_score']}   -->   After: {item['after_score']}"
    draw.text((sheet_w - card_pad - 320, y_offset + 15), score_pill, fill=(100, 210, 255), font=font_bold)
    
    img_y = y_offset + banner_h
    
    # Left: Before
    b_path = os.path.join(artifact_dir, item["before"])
    if os.path.exists(b_path):
        b_img = Image.open(b_path).convert("RGB")
        b_img = b_img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        canvas.paste(b_img, (card_pad, img_y))
    else:
        draw.rectangle([(card_pad, img_y), (card_pad + thumb_w, img_y + thumb_h)], fill=(40, 20, 20))
        draw.text((card_pad + 40, img_y + 150), f"MISSING: {item['before']}", fill=(255, 100, 100), font=font_header)
        
    # Label under Before
    draw.text((card_pad + 5, img_y + thumb_h + 8), item["before_desc"], fill=(220, 120, 120), font=font_label)
    
    # Right: After
    a_path = os.path.join(artifact_dir, item["after"])
    if os.path.exists(a_path):
        a_img = Image.open(a_path).convert("RGB")
        a_img = a_img.resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
        canvas.paste(a_img, (card_pad * 2 + thumb_w, img_y))
    else:
        draw.rectangle([(card_pad * 2 + thumb_w, img_y), (sheet_w - card_pad, img_y + thumb_h)], fill=(40, 20, 20))
        draw.text((card_pad * 2 + thumb_w + 40, img_y + 150), f"MISSING: {item['after']}", fill=(255, 100, 100), font=font_header)
        
    # Label under After
    draw.text((card_pad * 2 + thumb_w + 5, img_y + thumb_h + 8), item["after_desc"], fill=(120, 220, 140), font=font_label)
    
    y_offset += row_h

canvas.save(out_path, format="PNG", quality=95)
print(f"[SUCCESS] Contact sheet generated: {out_path} ({os.path.getsize(out_path):,} bytes)")
