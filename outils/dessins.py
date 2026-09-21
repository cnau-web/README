"""Primitives de dessin SVG : bonhomme articule + materiel de salle.

Tout est dessine en coordonnees mathematiques (y vers le haut) ; le groupe SVG
applique un scale(1,-1) pour revenir a l'affichage ecran.
"""
import math

# --- proportions du bonhomme (en px) ---
TORSO, NECK, HEAD_R = 36.0, 7.0, 9.0
UARM, FARM = 22.0, 22.0
THIGH, SHIN, FOOT = 28.0, 28.0, 11.0

BODY = "#1f2937"
GHOST = "#b6bec9"
GEAR = "#2563eb"
GEAR_G = "#93b4f5"
FRAME = "#8b97a8"
ARROW = "#dc2626"
FLOOR = "#c7ced8"


def P(o, ang, l):
    a = math.radians(ang)
    return (o[0] + l * math.cos(a), o[1] + l * math.sin(a))


def mid(a, b):
    return ((a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0)


class S:
    """Petit canevas SVG."""

    def __init__(self, w=340, h=250):
        self.w, self.h = w, h
        self.o = []

    def line(self, a, b, color=BODY, width=6, op=1.0, dash=None, cap="round"):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.o.append(
            f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"'
            f' stroke="{color}" stroke-width="{width}" stroke-linecap="{cap}"'
            f' opacity="{op}"{d}/>'
        )

    def poly(self, pts, color=BODY, width=6, op=1.0, fill="none", dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        self.o.append(
            f'<polyline points="{p}" fill="{fill}" stroke="{color}"'
            f' stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"'
            f' opacity="{op}"{d}/>'
        )

    def shape(self, pts, fill=FRAME, stroke="none", width=2, op=1.0):
        p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        self.o.append(
            f'<polygon points="{p}" fill="{fill}" stroke="{stroke}"'
            f' stroke-width="{width}" opacity="{op}"/>'
        )

    def circle(self, c, r, fill="none", stroke=BODY, width=5, op=1.0):
        self.o.append(
            f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="{r:.1f}" fill="{fill}"'
            f' stroke="{stroke}" stroke-width="{width}" opacity="{op}"/>'
        )

    def rect(self, x, y, w, h, fill=FRAME, rx=2, op=1.0, ang=0, ox=None, oy=None):
        t = ""
        if ang:
            ox = x if ox is None else ox
            oy = y if oy is None else oy
            t = f' transform="rotate({ang} {ox:.1f} {oy:.1f})"'
        self.o.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}"'
            f' rx="{rx}" fill="{fill}" opacity="{op}"{t}/>'
        )

    def arrow(self, a, b, color=ARROW, width=4, head=9):
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        tip = b
        back = (tip[0] - head * math.cos(ang), tip[1] - head * math.sin(ang))
        self.line(a, back, color, width, cap="round")
        l = (back[0] - head * 0.55 * math.sin(ang), back[1] + head * 0.55 * math.cos(ang))
        r = (back[0] + head * 0.55 * math.sin(ang), back[1] - head * 0.55 * math.cos(ang))
        self.shape([tip, l, r], fill=color)

    def arc_arrow(self, c, r, a0, a1, color=ARROW, width=4):
        """Fleche courbe de a0 a a1 (degres, sens trigo)."""
        steps = 16
        pts = [P(c, a0 + (a1 - a0) * i / steps, r) for i in range(steps)]
        self.poly(pts, color=color, width=width)
        self.arrow(P(c, a0 + (a1 - a0) * (steps - 1) / steps, r), P(c, a1, r), color, width)

    def floor(self, y, x0=10, x1=None):
        x1 = self.w - 10 if x1 is None else x1
        self.line((x0, y), (x1, y), FLOOR, 4)

    def svg(self):
        body = "\n".join(self.o)
        return (
            f'<svg viewBox="0 0 {self.w} {self.h}" width="100%" '
            f'xmlns="http://www.w3.org/2000/svg" role="img">'
            f'<g transform="translate(0,{self.h}) scale(1,-1)">{body}</g></svg>'
        )


# --------------------------------------------------------------------------
# Bonhommes
# --------------------------------------------------------------------------

def side(s, hip, trunk=90, arm=(-90, -90), leg=(-90, -90), color=BODY, w=6, op=1.0,
         head=True, both_arms=False, arm2=None, ls=1.0):
    """Vue de profil. Angles absolus en degres (0 = vers la droite, 90 = vers le haut)."""
    sh = P(hip, trunk, TORSO)
    elb = P(sh, arm[0], UARM)
    hand = P(elb, arm[1], FARM)
    knee = P(hip, leg[0], THIGH * ls)
    ankle = P(knee, leg[1], SHIN * ls)
    if both_arms:
        a2 = arm2 or arm
        e2 = P(sh, a2[0], UARM)
        h2 = P(e2, a2[1], FARM)
        s.poly([sh, e2, h2], color=GHOST if op == 1 else color, width=w - 1, op=op * 0.75)
    s.line(hip, sh, color, w + 1, op)
    if head:
        s.circle(P(sh, trunk, NECK + HEAD_R - 2), HEAD_R, fill="none", stroke=color, width=w - 1.5, op=op)
        s.line(sh, P(sh, trunk, NECK), color, w - 1, op)
    s.poly([sh, elb, hand], color=color, width=w - 1, op=op)
    s.poly([hip, knee, ankle], color=color, width=w - 1, op=op)
    return dict(sh=sh, elb=elb, hand=hand, knee=knee, ankle=ankle, hip=hip)


def side_foot(s, ankle, ang=0, color=BODY, w=5, op=1.0, l=FOOT):
    s.line(ankle, P(ankle, ang, l), color, w, op)


def front(s, hip, armL=(210, 250), armR=(-30, -70), color=BODY, w=6, op=1.0,
          sw=30, hw=18, leg_spread=9, head=True, trunk_tilt=0, shrug=0, ls=1.0):
    """Vue de face. armL/armR = (bras, avant-bras) en angles absolus."""
    shc = P(hip, 90 + trunk_tilt, TORSO)
    shL = (shc[0] - sw / 2.0, shc[1] + shrug)
    shR = (shc[0] + sw / 2.0, shc[1] + shrug)
    hipL = (hip[0] - hw / 2.0, hip[1])
    hipR = (hip[0] + hw / 2.0, hip[1])
    s.shape([shL, shR, hipR, hipL], fill="none", stroke=color, width=w, op=op)
    s.line(shL, shR, color, w, op)
    if head:
        s.circle((shc[0], shc[1] + NECK + HEAD_R - 1 + shrug), HEAD_R, "none", color, w - 1.5, op)
        s.line((shc[0], shc[1] + shrug), (shc[0], shc[1] + NECK + shrug), color, w - 1, op)
    eL = P(shL, armL[0], UARM); hL = P(eL, armL[1], FARM)
    eR = P(shR, armR[0], UARM); hR = P(eR, armR[1], FARM)
    s.poly([shL, eL, hL], color=color, width=w - 1, op=op)
    s.poly([shR, eR, hR], color=color, width=w - 1, op=op)
    kL = (hipL[0] - leg_spread * 0.4, hipL[1] - THIGH * ls); fL = (kL[0] - leg_spread * 0.6, kL[1] - SHIN * ls)
    kR = (hipR[0] + leg_spread * 0.4, hipR[1] - THIGH * ls); fR = (kR[0] + leg_spread * 0.6, kR[1] - SHIN * ls)
    s.poly([hipL, kL, fL], color=color, width=w - 1, op=op)
    s.poly([hipR, kR, fR], color=color, width=w - 1, op=op)
    return dict(shL=shL, shR=shR, hL=hL, hR=hR, eL=eL, eR=eR, fL=fL, fR=fR, shc=shc)


# --------------------------------------------------------------------------
# Materiel
# --------------------------------------------------------------------------

def barbell(s, c, ang=0, half=46, r=13, color=GEAR, op=1.0):
    a = P(c, ang + 180, half); b = P(c, ang, half)
    s.line(a, b, color, 5, op)
    for p in (a, b):
        s.circle(p, r, fill="none", stroke=color, width=5, op=op)


def dumbbell(s, c, ang=90, half=11, color=GEAR, op=1.0):
    a = P(c, ang + 180, half); b = P(c, ang, half)
    s.line(a, b, color, 4, op)
    for p in (a, b):
        s.line(P(p, ang + 90, 6), P(p, ang - 90, 6), color, 8, op)


def plate(s, c, r=14, color=GEAR, op=1.0):
    s.circle(c, r, "none", color, 5, op)
    s.circle(c, 3, "none", color, 2, op)


def cable(s, a, b, color=FRAME, op=1.0, w=2.5):
    s.line(a, b, color, w, op, cap="butt")


def pulley(s, c, r=6, color=FRAME):
    s.circle(c, r, fill="#ffffff", stroke=color, width=3)


def stack(s, x, y, w=26, h=64, color=FRAME):
    s.rect(x, y, w, h, fill="#e7ebf1", rx=3)
    n = 6
    for i in range(n):
        yy = y + 4 + i * (h - 8) / n
        s.line((x + 3, yy), (x + w - 3, yy), color, 3)
    s.rect(x - 3, y - 4, w + 6, 4, fill=color, rx=1)


def tower(s, x, y0, y1, color=FRAME):
    s.line((x, y0), (x, y1), color, 6)


def bench(s, c, ang=0, half=58, color=FRAME, legs=True, y_floor=None, pad=11):
    """Banc : c = centre du coussin, ang = inclinaison."""
    a = P(c, ang + 180, half); b = P(c, ang, half)
    s.line(a, b, color, pad, cap="butt")
    if legs and y_floor is not None:
        for p in (P(c, ang + 180, half * 0.75), P(c, ang, half * 0.75)):
            s.line((p[0], p[1] - pad / 2), (p[0], y_floor), color, 5)
