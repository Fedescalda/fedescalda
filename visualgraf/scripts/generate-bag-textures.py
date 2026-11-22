"""
Genera texturas PROPIAS de plástico arrugado (sin fotos de terceros) para el simulador.
Superficie "abollada": celdas de Voronoi con planos inclinados al azar (pliegues filosos)
+ ondas suaves; se ilumina con difusa + especular (plástico brillante).
Uso: python3 scripts/generate-bag-textures.py   → public/img/bags/<color>.webp
"""
import os, sys
import numpy as np
from PIL import Image
import cv2

W, H = 900, 1300
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "img", "bags")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def smooth_noise(shape, scale, seed):
    r = np.random.default_rng(seed)
    gh, gw = shape[0] // scale + 2, shape[1] // scale + 2
    g = r.random((gh, gw)).astype(np.float32)
    img = Image.fromarray((g * 255).astype(np.uint8)).resize((shape[1], shape[0]), Image.BICUBIC)
    return np.asarray(img, np.float32) / 255.0

def aniso_noise(scale_x, scale_y, seed):
    r = np.random.default_rng(seed)
    g = r.random((H // scale_y + 2, W // scale_x + 2)).astype(np.float32)
    out = cv2.resize(g, (W, H), interpolation=cv2.INTER_CUBIC)
    return cv2.GaussianBlur(out, (0, 0), max(scale_x, scale_y) * 0.12)

def crumple_height():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    # 1) pliegues grandes: pocas celdas con planos suaves
    n = 34
    pts = np.stack([rng.random(n) * W, rng.random(n) * H], 1)
    slopes = rng.normal(0, 0.03, (n, 2))
    idx = np.zeros((H, W), np.int32); best = np.full((H, W), 1e12, np.float32)
    for i, (px, py) in enumerate(pts):
        d = (xx - px) ** 2 + ((yy - py) ** 2) * 0.45
        m = d < best; best[m] = d[m]; idx[m] = i
    cells = slopes[idx, 0] * (xx - pts[idx, 0]) + slopes[idx, 1] * (yy - pts[idx, 1])
    cells = cv2.GaussianBlur(cells.astype(np.float32), (0, 0), 11) * 0.8
    # 2) ondas amplias + arrugas alargadas (diagonales y horizontales)
    waves = smooth_noise((H, W), 300, 1) * 26 + smooth_noise((H, W), 120, 2) * 7
    streaks = aniso_noise(220, 40, 4) * 1.6 + aniso_noise(50, 180, 5) * 0.7
    # 3) fruncido cerca de los sellos (arriba y abajo)
    edge = np.exp(-yy / 60) + np.exp(-(H - yy) / 60)
    ripples = np.sin(xx / 14 + aniso_noise(60, 200, 6) * 8) * 0.9 * edge
    h = cells + waves + streaks + ripples
    return cv2.GaussianBlur(h.astype(np.float32), (0, 0), 2.2)

def shade(h, spec_pow=28):
    gy, gx = np.gradient(h)
    nz = np.ones_like(h)
    n = np.stack([-gx, -gy, nz], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    l = np.array([-0.45, -0.55, 0.7]); l /= np.linalg.norm(l)
    v = np.array([0, 0, 1.0]); hv = (l + v); hv /= np.linalg.norm(hv)
    diff = np.clip(n @ l, 0, 1)
    spec = np.clip(n @ hv, 0, 1) ** spec_pow
    # segunda luz (relleno) para brillos largos del otro lado
    l2 = np.array([0.5, -0.2, 0.84]); l2 /= np.linalg.norm(l2); h2 = l2 + v; h2 /= np.linalg.norm(h2)
    spec = np.clip(spec + 0.6 * np.clip(n @ h2, 0, 1) ** (spec_pow * 1.6), 0, 1)
    # brillo amplio (reflejo de softbox)
    yy, xx = np.mgrid[0:H, 0:W]
    soft = np.exp(-(((xx - W * 0.3) / (W * 0.35)) ** 2 + ((yy - H * 0.25) / (H * 0.5)) ** 2))
    return diff, spec, soft

h = crumple_height()
diff, spec, soft = shade(h)
d = (diff - diff.mean()) / (diff.std() + 1e-6)

def save(name, rgb, alpha=None):
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    if alpha is None:
        Image.fromarray(rgb, "RGB").save(f"{OUT}/{name}.webp", quality=88, method=6)
    else:
        a = np.clip(alpha, 0, 255).astype(np.uint8)
        Image.fromarray(np.dstack([rgb, a]), "RGBA").save(f"{OUT}/{name}.webp", quality=90, method=6)
    print("ok", name)

def opaque(base, k_diff, k_spec, k_soft):
    base = np.array(base, np.float32)
    lum = 1 + d[..., None] * k_diff
    rgb = base * lum + spec[..., None] * 255 * k_spec + soft[..., None] * 255 * k_soft
    return rgb

save("blanco", opaque([226, 229, 234], 0.085, 0.3, 0.04))
# Negro: base profunda; el brillo solo en crestas (especular concentrado), sin velo gris general
neg = np.array([14, 14, 17], np.float32) * (1 + d[..., None] * 0.22)
neg += (spec[..., None] ** 1.5) * 255 * 0.62 + soft[..., None] * 255 * 0.03
save("negro", neg)
save("lila", opaque([201, 168, 240], 0.05, 0.32, 0.05))
save("rosa", opaque([232, 62, 150], 0.06, 0.3, 0.04))
# Cristal: casi transparente, con brillos y bordes de pliegues visibles
edge = np.clip(np.abs(d) * 0.3, 0, 1)
alpha = 78 + edge * 60 + spec * 190 + soft * 45
rgb = np.full((H, W, 3), 245, np.float32) - (1 - spec[..., None]) * 15
save("cristal", rgb, alpha)
