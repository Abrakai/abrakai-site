"""官網上線檢查：各頁面狀態、網域與 www、實際跑一次 AI 去背與其他工具"""
import io, sys, time, zipfile
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright
import urllib.request

BASE = "https://abrakai-studio.com"
out = []
ok = lambda c, m: out.append(("✅" if c else "❌") + " " + m)

def status(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 site-check"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, url
    except Exception as e:
        return str(e)[:60], url

for path in ["/", "/tools/", "/tools/qr.html", "/tools/compress.html", "/tools/sticker.html", "/tools/remove-bg.html", "/assets/style.css", "/assets/hero.jpg"]:
    s, _ = status(BASE + path); ok(s == 200, f"{path} → {s}")
s, final = status(BASE + "/no-such-page"); ok(s == 404, f"不存在的頁面顯示 404 頁 → {s}")
s, final = status("https://www.abrakai-studio.com/"); ok(s == 200, f"www.abrakai-studio.com → {s}（{final}）")
s, final = status("http://abrakai-studio.com/"); ok(s == 200 and final.startswith("https://"), f"http 自動轉 https → {s}（{final}）")

# 測試圖：彩色背景上的人形
img = Image.new("RGB", (640, 640), (90, 160, 210)); d = ImageDraw.Draw(img)
d.ellipse((250, 120, 390, 260), fill=(240, 200, 170)); d.rounded_rectangle((200, 270, 440, 600), 60, fill=(200, 40, 40))
img.save("/tmp/person.jpg", quality=92)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(accept_downloads=True); pg = ctx.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)[:120]))
    pg.goto(BASE + "/"); pg.wait_for_timeout(1500)
    ok("懂技術" in pg.inner_text("h1"), "首頁標題正常")
    fonts = pg.evaluate("document.fonts.check('16px \"Noto Sans TC\"')"); ok(fonts, "Google 字型已載入")
    link = pg.get_attribute("text=加入好友", "href"); ok("669snuew" in (link or ""), f"股市小幫手加入好友 → {link}")
    pg.screenshot(path="home.png")
    # 去背：真的下載模型並處理
    pg.goto(BASE + "/tools/remove-bg.html"); pg.wait_for_timeout(800)
    t0 = time.time(); pg.set_input_files("#file", "/tmp/person.jpg")
    try:
        pg.wait_for_function("document.getElementById('msg').textContent.includes('完成') || document.getElementById('msg').className.includes('err')", timeout=240000)
        msg = pg.inner_text("#msg"); ok("完成" in msg, f"AI 去背：{msg}（含首次下載模型，共 {time.time()-t0:.0f} 秒）")
        with pg.expect_download() as dl: pg.click("#dl")
        res = Image.open(dl.value.path()); px = res.convert("RGBA").getpixel((10, 10))
        ok(res.mode == "RGBA" and px[3] < 20, f"去背結果：背景變透明（左上角透明度 {px[3]}）")
        pg.screenshot(path="removebg.png", full_page=True)
    except Exception as e:
        ok(False, f"AI 去背失敗：{str(e)[:150]}")
    ok(not errs, "沒有 JavaScript 錯誤" + ("：" + "；".join(errs[:2]) if errs else ""))
    b.close()

text = "\n".join(out); print(text); open("result.txt", "w", encoding="utf-8").write(text)
