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
HALO = "#f5f7fa"       # liseré de détourage : sépare un membre de ce qu'il recouvre


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

def _membre(s, a, b, e1, e2, color, op, halo=True):
    """Segment de membre a epaisseur variable (epais pres du tronc).

    Le liseré clair permet de distinguer un bras qui passe devant le torse.
    """
    if halo and op > 0.8:
        s.line(a, b, HALO, e1 + 5, 1.0)
        s.line(mid(a, b), b, HALO, e2 + 5, 1.0)
    s.line(a, b, color, e1, op)
    s.line(mid(a, b), b, color, e2, op)


def _tete(s, centre, ang, color, op, r=HEAD_R):
    """Tete ovale + menton, pour qu'on voie de quel cote regarde le bonhomme."""
    if op > 0.8:
        s.o.append(
            f'<ellipse cx="{centre[0]:.1f}" cy="{centre[1]:.1f}" rx="{r * .92 + 2.5:.1f}"'
            f' ry="{r + 2.5:.1f}" fill="{HALO}"'
            f' transform="rotate({90 - ang:.1f} {centre[0]:.1f} {centre[1]:.1f})"/>')
    s.o.append(
        f'<ellipse cx="{centre[0]:.1f}" cy="{centre[1]:.1f}" rx="{r * .92:.1f}"'
        f' ry="{r:.1f}" fill="{color}" opacity="{op}"'
        f' transform="rotate({90 - ang:.1f} {centre[0]:.1f} {centre[1]:.1f})"/>')
    s.line(centre, P(centre, ang - 90, r * 1.15), color, r * 0.55, op)


def side(s, hip, trunk=90, arm=(-90, -90), leg=(-90, -90), color=BODY, w=6, op=1.0,
         head=True, both_arms=False, arm2=None, ls=1.0):
    """Vue de profil. Angles absolus en degres (0 = vers la droite, 90 = vers le haut)."""
    sh = P(hip, trunk, TORSO)
    elb = P(sh, arm[0], UARM)
    hand = P(elb, arm[1], FARM)
    knee = P(hip, leg[0], THIGH * ls)
    ankle = P(knee, leg[1], SHIN * ls)
    ech = w / 6.0                      # les appels historiques passent w=6

    if both_arms:                                          # bras arriere, en retrait
        a2 = arm2 or arm
        e2 = P(sh, a2[0], UARM)
        h2 = P(e2, a2[1], FARM)
        _membre(s, sh, e2, 9 * ech, 7 * ech, color, op * 0.4)
        _membre(s, e2, h2, 7 * ech, 6 * ech, color, op * 0.4)

    # jambe
    _membre(s, hip, knee, 13 * ech, 10 * ech, color, op)
    _membre(s, knee, ankle, 9.5 * ech, 7 * ech, color, op)

    # tronc : epaules plus larges que le bassin
    n = (trunk + 90) % 360
    epaule_g, epaule_d = P(sh, n, 9 * ech), P(sh, n - 180, 9 * ech)
    hanche_g, hanche_d = P(hip, n, 7 * ech), P(hip, n - 180, 7 * ech)
    if op > 0.8:
        s.shape([epaule_g, epaule_d, hanche_d, hanche_g], fill=HALO, stroke=HALO, width=5)
        s.circle(sh, 8.5 * ech + 2.5, fill=HALO, stroke="none", width=0)
        s.circle(hip, 6.5 * ech + 2.5, fill=HALO, stroke="none", width=0)
    s.shape([epaule_g, epaule_d, hanche_d, hanche_g], fill=color, op=op)
    s.circle(sh, 8.5 * ech, fill=color, stroke="none", width=0, op=op)
    s.circle(hip, 6.5 * ech, fill=color, stroke="none", width=0, op=op)

    if head:
        s.line(sh, P(sh, trunk, NECK), color, 7 * ech, op)
        _tete(s, P(sh, trunk, NECK + HEAD_R - 2), trunk, color, op)

    # bras avant + main
    _membre(s, sh, elb, 9.5 * ech, 7.5 * ech, color, op)
    _membre(s, elb, hand, 7.5 * ech, 6 * ech, color, op)
    if op > 0.8:
        s.circle(hand, 3.6 * ech + 2, fill=HALO, stroke="none", width=0)
    s.circle(hand, 3.6 * ech, fill=color, stroke="none", width=0, op=op)
    return dict(sh=sh, elb=elb, hand=hand, knee=knee, ankle=ankle, hip=hip)


def side_foot(s, ankle, ang=0, color=BODY, w=5, op=1.0, l=FOOT):
    """Pied : coup de pied plus epais que les orteils."""
    bout = P(ankle, ang, l)
    if op > 0.8:
        s.line(ankle, bout, HALO, 13, 1.0)
    s.line(ankle, mid(ankle, bout), color, 8, op)
    s.line(mid(ankle, bout), bout, color, 5.5, op)


def front(s, hip, armL=(210, 250), armR=(-30, -70), color=BODY, w=6, op=1.0,
          sw=30, hw=18, leg_spread=9, head=True, trunk_tilt=0, shrug=0, ls=1.0):
    """Vue de face. armL/armR = (bras, avant-bras) en angles absolus."""
    shc = P(hip, 90 + trunk_tilt, TORSO)
    shL = (shc[0] - sw / 2.0, shc[1] + shrug)
    shR = (shc[0] + sw / 2.0, shc[1] + shrug)
    hipL = (hip[0] - hw / 2.0, hip[1])
    hipR = (hip[0] + hw / 2.0, hip[1])
    ech = w / 6.0

    kL = (hipL[0] - leg_spread * 0.4, hipL[1] - THIGH * ls)
    fL = (kL[0] - leg_spread * 0.6, kL[1] - SHIN * ls)
    kR = (hipR[0] + leg_spread * 0.4, hipR[1] - THIGH * ls)
    fR = (kR[0] + leg_spread * 0.6, kR[1] - SHIN * ls)
    for h, k, f in ((hipL, kL, fL), (hipR, kR, fR)):
        _membre(s, h, k, 12 * ech, 9.5 * ech, color, op)
        _membre(s, k, f, 9 * ech, 6.5 * ech, color, op)

    # buste : trapeze epaules -> bassin
    if op > 0.8:
        s.shape([shL, shR, hipR, hipL], fill=HALO, stroke=HALO, width=5)
        s.circle(shL, 7 * ech + 2.5, fill=HALO, stroke="none", width=0)
        s.circle(shR, 7 * ech + 2.5, fill=HALO, stroke="none", width=0)
    s.shape([shL, shR, hipR, hipL], fill=color, op=op)
    s.circle(shL, 7 * ech, fill=color, stroke="none", width=0, op=op)
    s.circle(shR, 7 * ech, fill=color, stroke="none", width=0, op=op)

    if head:
        s.line((shc[0], shc[1] + shrug), (shc[0], shc[1] + NECK + shrug), color, 7 * ech, op)
        s.circle((shc[0], shc[1] + NECK + HEAD_R - 1 + shrug), HEAD_R, fill=color,
                 stroke="none", width=0, op=op)

    eL = P(shL, armL[0], UARM); hL = P(eL, armL[1], FARM)
    eR = P(shR, armR[0], UARM); hR = P(eR, armR[1], FARM)
    for sh_, e_, h_ in ((shL, eL, hL), (shR, eR, hR)):
        _membre(s, sh_, e_, 9 * ech, 7 * ech, color, op)
        _membre(s, e_, h_, 7 * ech, 5.5 * ech, color, op)
        if op > 0.8:
            s.circle(h_, 3.6 * ech + 2, fill=HALO, stroke="none", width=0)
        s.circle(h_, 3.6 * ech, fill=color, stroke="none", width=0, op=op)
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
