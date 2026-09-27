"""Une illustration SVG par exercice : trait plein = position de depart,
trait clair = position d'arrivee, fleche rouge = sens du mouvement."""
from dessins import (S, P, ip, side, front, side_foot, barbell, dumbbell, plate,
                     cable, pulley, stack, tower, bench, BODY, GHOST, GEAR,
                     GEAR_G, FRAME, ARROW)

W, H = 340, 240
MAT = "#e2e7ee"
LINE_OK = "#16a34a"
ILLUS = {}


def phases(cle):
    """Les images d'un schéma : départ, milieu, fin — une seule si c'est un maintien."""
    vues = [ILLUS[cle](t).svg() for t in (0.0, 0.5, 1.0)]
    return [vues[0]] if vues[0] == vues[1] == vues[2] else vues


def illu(name):
    def deco(f):
        ILLUS[name] = f
        return f
    return deco


def g(op):
    """Couleur du materiel selon la phase."""
    return GEAR if op == 1 else GEAR_G


def handle(s, c, ang=0, half=9, op=1.0):
    s.line(P(c, ang + 180, half), P(c, ang, half), g(op), 7, op)


# =========================== PECTORAUX ====================================

@illu("developpe_couche")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    bench(s, (166, 74), 0, 74, legs=True, y_floor=26)
    arm = ip((10, 95), (80, 85), t)
    op, col = 1, BODY
    b = side(s, (196, 86), 180, arm, (-35, -85), col, op=op)
    side_foot(s, b["ankle"], -80, col, op=op, l=20)
    plate(s, b["hand"], 13, g(op), op)
    s.arrow((212, 112), (212, 138))
    return s


@illu("developpe_incline")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.line((128, 106), (198, 68), FRAME, 12, cap="butt")   # dossier incline
    s.line((198, 68), (242, 64), FRAME, 12, cap="butt")    # assise
    s.line((228, 58), (228, 24), FRAME, 5); s.line((150, 88), (150, 24), FRAME, 5)
    arm = ip((20, 145), (62, 62), t)
    op, col = 1, BODY
    b = side(s, (196, 72), 152, arm, (-35, -80), col, op=op)
    side_foot(s, b["ankle"], -8, col, op=op, l=16)
    dumbbell(s, b["hand"], 152, 11, g(op), op)
    s.arrow((206, 112), (218, 134))
    return s


@illu("ecarte_poulie")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    for x in (26, 314):
        tower(s, x, 24, 210); pulley(s, (x, 196))
    stack(s, 13, 30); stack(s, 301, 30)
    aL = ip((172, 178), (-52, -30), t)
    aR = ip((8, 2), (232, 210), t)
    op, col = 1, BODY
    b = front(s, (170, 78), aL, aR, col, op=op)
    cable(s, (26, 196), b["hL"], FRAME, op); cable(s, (314, 196), b["hR"], FRAME, op)
    handle(s, b["hL"], 90, 7, op); handle(s, b["hR"], 90, 7, op)
    s.arc_arrow((170, 128), 54, 186, 232)
    s.arc_arrow((170, 128), 54, -6, -52)
    return s


@illu("pec_deck")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(158, 62, 24, 74, "#dde3ea", rx=4)               # dossier (derriere)
    s.rect(122, 50, 96, 12, FRAME, rx=4)                   # assise
    s.line((170, 52), (170, 24), FRAME, 7)                 # colonne
    for x in (104, 236):
        s.line((x, 104), (x, 156), FRAME, 5)               # bras de la machine
    aL = ip((174, 92), (196, 92), t)
    aR = ip((6, 88), (-16, 88), t)
    op, col = 1, BODY
    b = front(s, (170, 62), aL, aR, col, op=op, ls=0.6)
    handle(s, b["hL"], 90, 10, op); handle(s, b["hR"], 90, 10, op)
    s.arrow((112, 148), (146, 148))
    s.arrow((228, 148), (194, 148))
    return s


@illu("dips")
def _(t=0.0):
    s = S(W, H); s.floor(20)
    s.line((112, 126), (196, 126), FRAME, 6)               # barre arrière
    s.line((120, 120), (204, 120), FRAME, 7)               # barre avant
    s.line((198, 120), (198, 20), FRAME, 5)
    hip = ip((152, 115), (152, 129), t)
    arm = ip((-137, -43), (-89, -89), t)
    op, col = 1, BODY
    b = side(s, hip, 78, arm, (-125, -35), col, op=op)
    side_foot(s, b["ankle"], 20, col, op=op, l=13)
    s.circle((160, 120), 5.5, "#ffffff", GEAR, 4)
    s.arrow((246, 92), (246, 126))
    return s


@illu("ecarte_incline")
def _(t=0.0):
    s = S(W, H); s.floor(22)
    s.rect(152, 46, 36, 112, MAT, rx=8)                    # banc vu de dessus
    s.line((170, 46), (170, 22), FRAME, 5)
    aL = ip((168, 176), (104, 84), t)
    aR = ip((12, 4), (76, 96), t)
    op, col = 1, BODY
    b = front(s, (170, 84), aL, aR, col, op=op, ls=0.5)
    dumbbell(s, b["hL"], 0 if op == 1 else 90, 11, g(op), op)
    dumbbell(s, b["hR"], 0 if op == 1 else 90, 11, g(op), op)
    s.arc_arrow((170, 130), 52, 182, 124)
    s.arc_arrow((170, 130), 52, -2, 56)
    return s


# ============================== DOS =======================================

@illu("tractions")
def _(t=0.0):
    s = S(W, H); s.floor(18)
    s.line((70, 214), (270, 214), FRAME, 7)
    s.line((78, 214), (78, 18), FRAME, 5); s.line((262, 214), (262, 18), FRAME, 5)
    hip_y = ip(84, 116, t)
    aL = ip((96, 92), (118, 74), t)
    aR = ip((84, 88), (62, 106), t)
    op, col = 1, BODY
    b = front(s, (170, hip_y), aL, aR, col, op=op, ls=0.86, leg_spread=6)
    for h in (b["hL"], b["hR"]):
        s.circle(h, 5, "none", g(op), 4, op)
    s.arrow((246, 104), (246, 140))
    return s


@illu("tirage_vertical")
def _(t=0.0):
    s = S(W, H); s.floor(22)
    tower(s, 70, 22, 216); s.line((70, 216), (152, 216), FRAME, 5)
    pulley(s, (152, 208)); stack(s, 54, 30)
    s.rect(152, 56, 90, 12, FRAME, rx=4)                   # assise
    s.line((200, 56), (200, 22), FRAME, 6)
    s.line((150, 92), (200, 92), FRAME, 9, cap="butt")     # boudin cuisses
    arm = ip((98, 92), (122, 42), t)
    op, col = 1, BODY
    b = side(s, (200, 70), 96, arm, (174, -86), col, op=op)
    side_foot(s, b["ankle"], -6, col, op=op, l=15)
    cable(s, (152, 208), b["hand"], FRAME, op)
    handle(s, b["hand"], 172, 22, op)
    s.arrow((262, 176), (262, 132))
    return s


@illu("rowing_barre")
def _(t=0.0):
    s = S(W, H); s.floor(30)
    arm = ip((-88, -92), (175, -63), t)
    op, col = 1, BODY
    b = side(s, (170, 90), 20, arm, (-80, -95), col, op=op)
    side_foot(s, b["ankle"], -20, col, op=op, l=16)
    plate(s, b["hand"], 15, g(op), op)
    s.arrow((244, 66), (236, 96))
    return s


@illu("tirage_horizontal")
def _(t=0.0):
    s = S(W, H); s.floor(22)
    tower(s, 52, 22, 110); pulley(s, (56, 74)); stack(s, 34, 28)
    s.rect(160, 44, 130, 10, FRAME, rx=4)                  # banc
    s.line((138, 42), (138, 88), FRAME, 10, cap="butt")    # cale-pieds
    arm = ip((185, 180), (-82, 148), t)
    op, col = 1, BODY
    b = side(s, (206, 62), 96, arm, (180, 182), col, op=op)
    side_foot(s, b["ankle"], 100, col, op=op, l=14)
    cable(s, (56, 74), b["hand"], FRAME, op)
    handle(s, b["hand"], 90, 9, op)
    s.arrow((118, 116), (158, 116))
    return s


@illu("rowing_haltere")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    bench(s, (120, 72), 0, 42, legs=True, y_floor=26)
    arm = ip((-88, -92), (13, -103), t)
    op, col = 1, BODY
    b = side(s, (226, 96), 170, arm, (-70, -95), col, op=op)
    side_foot(s, b["ankle"], -14, col, op=op, l=18)
    s.line(b["sh"], (152, 78), GHOST, 5, op * 0.8)     # bras d'appui
    dumbbell(s, b["hand"], 0, 11, g(op), op)
    s.arrow((272, 66), (266, 94))
    return s


@illu("pullover_poulie")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    tower(s, 62, 24, 212); pulley(s, (66, 198)); stack(s, 46, 32)
    arm = ip((150, 150), (-100, -96), t)
    op, col = 1, BODY
    b = side(s, (196, 96), 96, arm, (-86, -90), col, op=op)
    side_foot(s, b["ankle"], -174, col, op=op, l=15)
    cable(s, (66, 198), b["hand"], FRAME, op)
    handle(s, b["hand"], 60, 15, op)
    s.arc_arrow((192, 132), 54, 158, 262)
    return s


@illu("extensions_lombaires")
def _(t=0.0):
    s = S(W, H); s.floor(22)
    s.line((162, 116), (194, 84), FRAME, 13, cap="butt")   # coussin bassin
    s.line((178, 96), (178, 22), FRAME, 6)                 # colonne
    s.line((206, 74), (230, 50), FRAME, 11, cap="butt")    # cale-chevilles
    trunk = ip(215, 135, t)
    op, col = 1, BODY
    b = side(s, (178, 100), trunk, (trunk - 100, trunk - 168), (-45, -45), col, op=op)
    side_foot(s, b["ankle"], 45, col, op=op, l=13)
    s.arc_arrow((178, 100), 50, 210, 140)
    return s


# ============================= EPAULES ====================================

@illu("developpe_militaire")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    aL = ip((152, 40), (100, 88), t)
    aR = ip((28, 140), (80, 92), t)
    op, col = 1, BODY
    b = front(s, (170, 78), aL, aR, col, op=op)
    y = (b["hL"][1] + b["hR"][1]) / 2
    barbell(s, (170, y), 0, 74, 16, g(op), op)
    s.arrow((256, 146), (256, 186))
    return s


@illu("developpe_haltere_assis")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(122, 56, 92, 12, FRAME, rx=4)                   # assise
    s.line((214, 62), (226, 150), FRAME, 11, cap="butt")   # dossier
    s.line((164, 56), (164, 24), FRAME, 6)
    arm = ip((150, 95), (88, 92), t)
    op, col = 1, BODY
    b = side(s, (190, 72), 98, arm, (178, -88), col, op=op)
    side_foot(s, b["ankle"], -6, col, op=op, l=18)
    dumbbell(s, b["hand"], 0, 11, g(op), op)
    s.arrow((132, 128), (132, 164))
    return s


@illu("elevations_laterales")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    aL = ip((256, 262), (178, 174), t)
    aR = ip((-76, -82), (2, 6), t)
    op, col = 1, BODY
    b = front(s, (170, 78), aL, aR, col, op=op)
    dumbbell(s, b["hL"], 0 if op == 1 else 90, 11, g(op), op)
    dumbbell(s, b["hR"], 0 if op == 1 else 90, 11, g(op), op)
    s.arc_arrow((155, 114), 46, 258, 186)
    s.arc_arrow((185, 114), 46, -78, -6)
    return s


@illu("tirage_menton")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    tower(s, 40, 24, 120); pulley(s, (44, 46)); stack(s, 22, 30)
    aL = ip((262, 268), (215, 60), t)
    aR = ip((-82, -88), (-35, 120), t)
    op, col = 1, BODY
    b = front(s, (176, 78), aL, aR, col, op=op)
    m = ((b["hL"][0] + b["hR"][0]) / 2, (b["hL"][1] + b["hR"][1]) / 2)
    cable(s, (44, 46), m, FRAME, op)
    handle(s, m, 0, 22, op)
    s.arrow((256, 72), (256, 114))
    return s


@illu("oiseau")
def _(t=0.0):
    s = S(W, H); s.floor(30)
    arm = ip((-88, -92), (-6, -2), t)
    op, col = 1, BODY
    b = side(s, (170, 90), 20, arm, (-80, -95), col, op=op)
    side_foot(s, b["ankle"], -20, col, op=op, l=16)
    dumbbell(s, b["hand"], 90 if op == 1 else 0, 11, g(op), op)
    s.arc_arrow((204, 102), 48, -84, -8)
    return s


@illu("face_pull")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    tower(s, 54, 24, 200); pulley(s, (58, 178)); stack(s, 36, 30)
    arm = ip((168, 172), (150, 60), t)
    op, col = 1, BODY
    b = side(s, (196, 84), 92, arm, (-88, -90), col, op=op)
    side_foot(s, b["ankle"], -174, col, op=op, l=15)
    cable(s, (58, 178), b["hand"], FRAME, op)
    handle(s, b["hand"], 90, 9, op)
    s.arrow((132, 178), (170, 178))
    return s


@illu("shrugs")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    sg = ip(0, 14, t)
    op, col = 1, BODY
    b = front(s, (170, 78), (256, 262), (-76, -82), col, op=op, shrug=sg)
    dumbbell(s, b["hL"], 0, 11, g(op), op)
    dumbbell(s, b["hR"], 0, 11, g(op), op)
    s.arrow((244, 114), (244, 144)); s.arrow((96, 114), (96, 144))
    return s


# ============================= ABDOS ======================================

@illu("dragon_flag")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    bench(s, (170, 74), 0, 78, legs=True, y_floor=26)       # banc plat
    hip = ip((176, 105), (185, 89), t)
    trunk = ip(225, 195, t)
    leg = ip((45, 45), (15, 15), t)
    op, col = 1, BODY
    b = side(s, hip, trunk, (180, 180), leg, col, op=op)
    side_foot(s, b["ankle"], leg[0] - 70, col, op=op, l=13)
    s.circle(b["hand"], 4, "none", col, 4, op)          # prise sur le bord du banc
    s.arc_arrow((150, 80), 92, 44, 16)
    return s


@illu("crunch_decline")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.line((104, 62), (246, 112), FRAME, 12, cap="butt")    # banc décliné
    s.line((150, 70), (150, 24), FRAME, 5)
    s.line((232, 106), (232, 24), FRAME, 5)
    s.line((244, 122), (244, 146), FRAME, 10)               # boudins pour les pieds
    trunk = ip(200, 152, t)
    op, col = 1, BODY
    b = side(s, (208, 104), trunk, (trunk - 55, trunk - 118), (22, 112), col, op=op)
    side_foot(s, b["ankle"], 80, col, op=op, l=12)
    plate(s, P(b["sh"], trunk - 90, 17), 13, g(op), op)   # disque sur la poitrine
    s.arc_arrow((208, 104), 46, 196, 154)
    return s


@illu("v_ups")
def _(t=0.0):
    s = S(W, H); s.floor(34)
    s.rect(40, 34, 262, 8, MAT, rx=4)
    trunk = ip(140, 180, t)
    arm = ip((20, 14), (180, 180), t)
    leg = ip((40, 40), (4, 4), t)
    op, col = 1, BODY
    b = side(s, (170, 44), trunk, arm, leg, col, op=op)
    side_foot(s, b["ankle"], leg[0] - 80, col, op=op, l=12)
    s.arc_arrow((170, 44), 58, 176, 138)
    s.arc_arrow((170, 44), 58, 6, 42)
    return s


@illu("releves_jambes")
def _(t=0.0):
    s = S(W, H); s.floor(18)
    s.line((100, 212), (240, 212), FRAME, 7)
    s.line((108, 212), (108, 18), FRAME, 5); s.line((232, 212), (232, 18), FRAME, 5)
    leg = ip((-90, -90), (0, 0), t)
    op, col = 1, BODY
    b = side(s, (170, 124), 90, (90, 90), leg, col, op=op)
    side_foot(s, b["ankle"], 0 if op < 1 else -80, col, op=op, l=13)
    s.circle(b["hand"], 5, "none", g(op), 4, op)
    s.arc_arrow((170, 124), 58, -86, -4)
    return s


@illu("crunch_poulie")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    tower(s, 58, 26, 210); pulley(s, (62, 196)); stack(s, 40, 32)
    trunk = ip(96, 126, t)
    op, col = 1, BODY
    b = side(s, (196, 62), trunk, (trunk + 76, trunk + 54), (178, -88), col, op=op, ls=0.85)
    cable(s, (62, 196), b["hand"], FRAME, op)
    handle(s, b["hand"], 60, 9, op)
    s.arc_arrow((196, 62), 54, 104, 130)
    return s


@illu("crunch_inverse")
def _(t=0.0):
    s = S(W, H); s.floor(34)
    s.rect(46, 34, 250, 8, MAT, rx=4)
    hip = ip((190, 44), (186, 54), t)
    trunk = ip(178, 172, t)
    leg = ip((90, 180), (150, 20), t)
    op, col = 1, BODY
    side(s, hip, trunk, (trunk + 6, trunk + 4), leg, col, op=op)
    s.arc_arrow((190, 44), 56, 60, 130)
    return s


@illu("russian_twist")
def _(t=0.0):
    s = S(W, H); s.floor(34)
    s.rect(46, 34, 250, 8, MAT, rx=4)
    b = front(s, (170, 70), (-36, -10), (216, 190), BODY, ls=0.72, leg_spread=14)
    plate(s, (216, 92), 15, GEAR)
    s.arc_arrow((170, 96), 62, 8, 44)
    s.arc_arrow((170, 96), 62, 172, 136)
    return s


@illu("woodchopper")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    tower(s, 36, 24, 212); pulley(s, (40, 198)); stack(s, 18, 32)
    aL = ip((-28, -34), (146, 152), t)
    aR = ip((-34, -40), (140, 146), t)
    op, col = 1, BODY
    b = front(s, (184, 78), aL, aR, col, op=op)
    m = ((b["hL"][0] + b["hR"][0]) / 2, (b["hL"][1] + b["hR"][1]) / 2)
    cable(s, (40, 198), m, FRAME, op)
    s.circle(m, 6, "none", g(op), 5, op)
    s.arrow((202, 172), (258, 128))
    return s


@illu("planche")
def _(t=0.0):
    s = S(W, H); s.floor(40)
    s.rect(60, 40, 220, 8, MAT, rx=4)
    b = side(s, (176, 66), 10, (-90, 0), (195, 195), BODY, ls=1.05)
    side_foot(s, b["ankle"], 60, BODY, l=14)
    s.line((116, 50), (214, 74), LINE_OK, 3, dash="8 7")
    return s


@illu("planche_laterale")
def _(t=0.0):
    s = S(W, H); s.floor(40)
    s.rect(60, 40, 220, 8, MAT, rx=4)
    b = side(s, (176, 66), 10, (-90, 0), (195, 195), BODY, ls=1.05)
    s.line(b["sh"], P(b["sh"], 96, 46), BODY, 5)           # bras libre vers le haut
    s.line((116, 50), (214, 74), LINE_OK, 3, dash="8 7")
    return s


@illu("hollow")
def _(t=0.0):
    s = S(W, H); s.floor(34)
    s.rect(46, 34, 250, 8, MAT, rx=4)
    b = side(s, (170, 46), 150, (145, 148), (28, 32), BODY)
    side_foot(s, b["ankle"], -60, BODY, l=13)
    s.circle((170, 45), 5, "none", LINE_OK, 3)
    s.arrow((132, 74), (132, 92)); s.arrow((236, 74), (236, 92))
    return s


@illu("ab_wheel")
def _(t=0.0):
    s = S(W, H); s.floor(34)
    s.rect(46, 26, 250, 8, MAT, rx=4)
    trunk = ip(136, 183, t)
    arm = ip((-90, -90), (198, 198), t)
    op, col = 1, BODY
    b = side(s, (230, 62), trunk, arm, (-80, 0), col, op=op)
    s.circle(b["hand"], 12, "none", g(op), 5, op)
    s.circle(b["hand"], 3, "none", g(op), 3, op)
    s.arrow((212, 74), (168, 62))
    return s


# ================== PROGRAMME B — semaine 2 ===============================

@illu("developpe_couche_halteres")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    bench(s, (166, 74), 0, 74, legs=True, y_floor=26)
    arm = ip((-2, 104), (72, 72), t)
    op, col = 1, BODY
    b = side(s, (196, 86), 180, arm, (-35, -85), col, op=op)
    side_foot(s, b["ankle"], -80, col, op=op, l=20)
    dumbbell(s, b["hand"], 90, 11, g(op), op)
    s.arrow((212, 106), (212, 136))
    return s


@illu("developpe_decline")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.line((118, 60), (216, 98), FRAME, 12, cap="butt")     # banc décliné
    s.line((150, 70), (150, 24), FRAME, 5)
    s.line((206, 92), (206, 24), FRAME, 5)
    s.line((214, 108), (238, 108), FRAME, 9)                # boudins des cuisses
    arm = ip((170, 50), (110, 110), t)
    op, col = 1, BODY
    b = side(s, (196, 92), 200, arm, (12, 100), col, op=op)
    side_foot(s, b["ankle"], 10, col, op=op, l=13)
    plate(s, b["hand"], 14, g(op), op)
    s.arrow((120, 104), (114, 128))
    return s


@illu("presse_pectoraux")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(180, 54, 84, 12, FRAME, rx=4)                    # assise
    s.line((222, 60), (222, 146), FRAME, 11, cap="butt")    # dossier
    s.line((212, 54), (212, 24), FRAME, 6)
    tower(s, 258, 24, 150); stack(s, 246, 30)
    arm = ip((240, 129), (180, 180), t)
    op, col = 1, BODY
    b = side(s, (206, 66), 94, arm, (176, -88), col, op=op)
    side_foot(s, b["ankle"], -6, col, op=op, l=14)
    s.line((252, 140), b["hand"], FRAME, 3, op)         # bras de la machine
    handle(s, b["hand"], 90, 9, op)
    s.arrow((150, 84), (118, 84))
    return s


@illu("ecarte_poulie_basse")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    for x in (26, 314):
        tower(s, x, 24, 120); pulley(s, (x, 44))
    stack(s, 13, 30); stack(s, 301, 30)
    aL = ip((244, 250), (30, 58), t)
    aR = ip((-64, -70), (150, 122), t)
    op, col = 1, BODY
    b = front(s, (170, 78), aL, aR, col, op=op)
    cable(s, (26, 44), b["hL"], FRAME, op); cable(s, (314, 44), b["hR"], FRAME, op)
    handle(s, b["hL"], 90, 7, op); handle(s, b["hR"], 90, 7, op)
    s.arc_arrow((155, 116), 50, 248, 300)
    s.arc_arrow((185, 116), 50, -68, -120)
    return s


@illu("pompes")
def _(t=0.0):
    s = S(W, H); s.floor(38)
    s.rect(60, 30, 220, 8, MAT, rx=4)
    hip = ip((160, 77), (160, 55), t)
    arm = ip((-88, -92), (210, -30), t)
    op, col = 1, BODY
    b = side(s, hip, 8, arm, (188, 188), col, op=op)
    side_foot(s, b["ankle"], -60, col, op=op, l=13)
    plate(s, (176, 64), 11, GEAR)                           # lest sur le haut du dos
    s.arrow((236, 60), (236, 86))
    return s


@illu("rowing_machine")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(182, 52, 86, 12, FRAME, rx=4)                    # assise
    s.line((214, 52), (214, 24), FRAME, 6)
    s.line((178, 68), (182, 126), FRAME, 12, cap="butt")    # coussin de poitrine
    tower(s, 120, 24, 150); stack(s, 108, 30)
    arm = ip((-140, -140), (13, -133), t)
    op, col = 1, BODY
    b = side(s, (200, 62), 100, arm, (176, -88), col, op=op)
    side_foot(s, b["ankle"], -6, col, op=op, l=14)
    s.line((126, 140), b["hand"], FRAME, 3, op)         # bras de la machine
    handle(s, b["hand"], 90, 9, op)
    s.arrow((132, 60), (168, 60))
    return s


@illu("rowing_t")
def _(t=0.0):
    s = S(W, H); s.floor(28)
    s.line((44, 30), (214, 78), GEAR, 5)                    # barre en T ancrée au sol
    s.circle((44, 30), 6, "none", FRAME, 4)
    for c in ((206, 76), (214, 78)):
        plate(s, c, 15, GEAR)
    arm = ip((-90, -158), (162, -72), t)
    op, col = 1, BODY
    b = side(s, (190, 90), 20, arm, (-80, -95), col, op=op)
    side_foot(s, b["ankle"], -20, col, op=op, l=16)
    s.circle(b["hand"], 4, "none", col, 4, op)
    s.arrow((262, 62), (256, 92))
    return s


@illu("pullover_haltere")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    s.line((140, 72), (206, 72), FRAME, 12, cap="butt")     # banc, en travers
    s.line((150, 66), (150, 26), FRAME, 5); s.line((196, 66), (196, 26), FRAME, 5)
    arm = ip((76, 84), (136, 140), t)
    op, col = 1, BODY
    b = side(s, (200, 80), 180, arm, (-62, -88), col, op=op)
    side_foot(s, b["ankle"], -8, col, op=op, l=15)
    dumbbell(s, b["hand"], 0, 11, g(op), op)
    s.arc_arrow((164, 80), 46, 78, 136)
    return s


@illu("presse_epaules")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(160, 54, 84, 12, FRAME, rx=4)                    # assise
    s.line((236, 60), (240, 150), FRAME, 11, cap="butt")    # dossier
    s.line((196, 54), (196, 24), FRAME, 6)
    tower(s, 140, 24, 180); stack(s, 128, 30)
    arm = ip((150, 95), (88, 92), t)
    op, col = 1, BODY
    b = side(s, (208, 70), 98, arm, (178, -88), col, op=op)
    side_foot(s, b["ankle"], -6, col, op=op, l=16)
    s.line((146, 172), b["hand"], FRAME, 3, op)         # bras de la machine
    handle(s, b["hand"], 0, 10, op)
    s.arrow((110, 120), (110, 158))
    return s


@illu("elevations_poulie")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    tower(s, 306, 24, 120); pulley(s, (306, 44)); stack(s, 293, 30)
    aL = ip((-54, -54), (178, 176), t)
    op, col = 1, BODY
    b = front(s, (168, 78), aL, (-76, -82), col, op=op)
    cable(s, (306, 44), b["hL"], FRAME, op)
    handle(s, b["hL"], 90, 7, op)
    s.arc_arrow((153, 114), 48, -52, -182)
    return s


@illu("elevations_frontales")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    arm = ip((-88, -92), (2, 0), t)
    op, col = 1, BODY
    b = side(s, (160, 84), 90, arm, (-86, -92), col, op=op)
    side_foot(s, b["ankle"], 0, col, op=op, l=15)
    plate(s, b["hand"], 14, g(op), op)
    s.arc_arrow((160, 120), 54, -80, -6)
    return s


@illu("oiseau_poulie")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    for x in (26, 314):
        tower(s, x, 24, 170); pulley(s, (x, 122))
    stack(s, 13, 30); stack(s, 301, 30)
    aL = ip((-24, -6), (176, 178), t)
    aR = ip((204, 186), (4, 2), t)
    op, col = 1, BODY
    b = front(s, (170, 78), aL, aR, col, op=op)
    cable(s, (314, 122), b["hL"], FRAME, op)            # câbles croisés
    cable(s, (26, 122), b["hR"], FRAME, op)
    handle(s, b["hL"], 90, 7, op); handle(s, b["hR"], 90, 7, op)
    s.arrow((150, 120), (104, 120)); s.arrow((190, 120), (236, 120))
    return s


@illu("shrugs_barre")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    sg = ip(0, 14, t)
    op, col = 1, BODY
    b = front(s, (170, 78), (256, 262), (-76, -82), col, op=op, shrug=sg)
    y = (b["hL"][1] + b["hR"][1]) / 2
    barbell(s, (170, y), 0, 72, 15, g(op), op)
    s.arrow((252, 96), (252, 126)); s.arrow((88, 96), (88, 126))
    return s


# ============ SCHÉMAS DES EXERCICES DE REMPLACEMENT ========================

@illu("pullover_machine")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(160, 54, 86, 12, FRAME, rx=4)                    # assise
    s.line((236, 60), (244, 148), FRAME, 11, cap="butt")    # dossier
    s.line((196, 54), (196, 24), FRAME, 6)
    tower(s, 140, 24, 176); stack(s, 128, 30)
    arm = ip((128, 132), (186, 188), t)
    b = side(s, (206, 66), 96, arm, (176, -88), BODY)
    side_foot(s, b["ankle"], -6, BODY, l=15)
    s.line((146, 170), b["hand"], FRAME, 3)                 # bras de la machine
    handle(s, b["hand"], 90, 9)
    s.arc_arrow((202, 102), 52, 146, 190)
    return s


@illu("lombaires_machine")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(150, 52, 92, 12, FRAME, rx=4)                    # assise
    s.line((180, 70), (176, 138), FRAME, 12, cap="butt")    # dossier arrière
    s.line((196, 52), (196, 24), FRAME, 6)
    s.line((236, 66), (236, 94), FRAME, 10)                 # cale-cuisses
    trunk = ip(64, 104, t)
    b = side(s, (196, 64), trunk, (trunk - 158, trunk - 96), (-6, -86), BODY)
    side_foot(s, b["ankle"], -6, BODY, l=15)
    s.arc_arrow((196, 64), 52, 66, 102)
    return s


@illu("superman")
def _(t=0.0):
    s = S(W, H); s.floor(34)
    s.rect(46, 26, 250, 8, MAT, rx=4)
    arm = ip((176, 176), (156, 156), t)
    leg = ip((2, 2), (24, 24), t)
    b = side(s, (176, 42), 174, arm, leg, BODY)
    side_foot(s, b["ankle"], leg[0] - 40, BODY, l=12)
    s.arrow((120, 60), (120, 78)); s.arrow((236, 56), (236, 74))
    return s


@illu("machine_laterale")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(128, 52, 86, 12, FRAME, rx=4)                    # assise
    s.line((168, 52), (168, 24), FRAME, 6)
    tower(s, 246, 24, 150); stack(s, 234, 30)
    for x in (120, 216):                                    # coussins des bras
        s.line((x, 104), (x, 132), FRAME, 9)
    aL = ip((256, 262), (182, 178), t)
    aR = ip((-76, -82), (-2, 2), t)
    b = front(s, (168, 64), aL, aR, BODY, ls=0.6)
    for h in (b["hL"], b["hR"]):
        handle(s, h, 90, 8)
    s.arc_arrow((153, 100), 46, 258, 186)
    s.arc_arrow((183, 100), 46, -78, -6)
    return s


@illu("pec_deck_inverse")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(158, 62, 24, 74, "#dde3ea", rx=4)                # dossier : poitrine appuyée
    s.rect(122, 50, 96, 12, FRAME, rx=4)
    s.line((170, 52), (170, 24), FRAME, 7)
    for x in (104, 236):
        s.line((x, 104), (x, 156), FRAME, 5)
    aL = ip((-24, -6), (176, 178), t)
    aR = ip((204, 186), (4, 2), t)
    b = front(s, (170, 62), aL, aR, BODY, ls=0.6)
    handle(s, b["hL"], 90, 10); handle(s, b["hR"], 90, 10)
    s.arrow((150, 150), (108, 150)); s.arrow((190, 150), (232, 150))
    return s


@illu("rotations_externes")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    tower(s, 306, 24, 150); pulley(s, (306, 112)); stack(s, 293, 30)
    aL = ip((270, 4), (270, 176), t)
    b = front(s, (164, 78), aL, (-76, -82), BODY)
    cable(s, (306, 112), b["hL"], FRAME)
    handle(s, b["hL"], 90, 7)
    s.arc_arrow((149, 92), 30, 4, 176)
    return s


@illu("crunch_machine")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(156, 50, 90, 12, FRAME, rx=4)                    # assise
    s.line((242, 58), (246, 132), FRAME, 11, cap="butt")    # dossier
    s.line((196, 50), (196, 24), FRAME, 6)
    tower(s, 140, 24, 150); stack(s, 128, 28)
    s.line((160, 122), (192, 122), FRAME, 9, cap="butt")    # coussin de poitrine
    trunk = ip(98, 124, t)
    b = side(s, (204, 62), trunk, (trunk - 64, trunk - 116), (176, -86), BODY, ls=0.9)
    side_foot(s, b["ankle"], -6, BODY, l=14)
    s.arc_arrow((204, 62), 50, 102, 126)
    return s


@illu("releves_banc")
def _(t=0.0):
    s = S(W, H); s.floor(26)
    bench(s, (170, 74), 0, 74, legs=True, y_floor=26)
    leg = ip((-58, -58), (76, 76), t)
    b = side(s, (196, 86), 180, (180, 180), leg, BODY)
    side_foot(s, b["ankle"], leg[0] - 60, BODY, l=12)
    s.circle(b["hand"], 4.5, "none", GEAR, 4)               # prise sur le banc
    s.arc_arrow((196, 86), 60, -56, 74)
    return s


@illu("rotations_machine")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    s.rect(126, 52, 92, 12, FRAME, rx=4)                    # assise
    s.line((172, 52), (172, 24), FRAME, 6)
    dec = ip(-20, 20, t)
    aL = ip((196, 178), (186, 170), t)
    aR = ip((-16, 2), (-6, 10), t)
    b = front(s, (172 + dec, 64), aL, aR, BODY, ls=0.6, trunk_tilt=dec * 0.35)
    for h in (b["hL"], b["hR"]):                            # coussins solidaires du buste
        s.line((h[0], h[1] - 26), (h[0], h[1] + 26), FRAME, 9)
        handle(s, h, 90, 8)
    s.arrow((214, 150), (150, 150))
    return s


@illu("planche_haute")
def _(t=0.0):
    s = S(W, H); s.floor(40)
    s.rect(60, 40, 220, 8, MAT, rx=4)
    b = side(s, (176, 76), 10, (-92, -88), (195, 195), BODY, ls=1.05)
    side_foot(s, b["ankle"], 60, BODY, l=14)
    s.line((128, 58), (236, 86), LINE_OK, 3, dash="8 7")
    return s


@illu("flexion_poulie")
def _(t=0.0):
    s = S(W, H); s.floor(24)
    tower(s, 98, 24, 116); pulley(s, (102, 40)); stack(s, 84, 30)
    dec = ip(0, 20, t)
    b = front(s, (196, 78), (256, 262), (-74, -80), BODY, trunk_tilt=dec)
    cable(s, (102, 40), b["hL"], FRAME)
    handle(s, b["hL"], 90, 7)
    s.arc_arrow((196, 112), 54, 94, 118)
    return s
