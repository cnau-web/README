"""Une illustration SVG par exercice : trait plein = position de depart,
trait clair = position d'arrivee, fleche rouge = sens du mouvement."""
from dessins import (S, P, side, front, side_foot, barbell, dumbbell, plate,
                     cable, pulley, stack, tower, bench, BODY, GHOST, GEAR,
                     GEAR_G, FRAME, ARROW)

W, H = 340, 240
MAT = "#e2e7ee"
LINE_OK = "#16a34a"
ILLUS = {}


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
def _():
    s = S(W, H); s.floor(26)
    bench(s, (166, 74), 0, 74, legs=True, y_floor=26)
    for op, col, arm in ((0.45, GHOST, (72, 72)), (1, BODY, (0, 100))):
        b = side(s, (196, 86), 180, arm, (-35, -85), col, op=op)
        side_foot(s, b["ankle"], -80, col, op=op, l=20)
        plate(s, b["hand"], 13, g(op), op)
    s.arrow((210, 108), (210, 136))
    return s


@illu("developpe_incline")
def _():
    s = S(W, H); s.floor(24)
    s.line((128, 106), (198, 68), FRAME, 12, cap="butt")   # dossier incline
    s.line((198, 68), (242, 64), FRAME, 12, cap="butt")    # assise
    s.line((228, 58), (228, 24), FRAME, 5); s.line((150, 88), (150, 24), FRAME, 5)
    for op, col, arm in ((0.45, GHOST, (62, 62)), (1, BODY, (20, 145))):
        b = side(s, (196, 72), 152, arm, (-35, -80), col, op=op)
        side_foot(s, b["ankle"], -8, col, op=op, l=16)
        dumbbell(s, b["hand"], 152, 11, g(op), op)
    s.arrow((206, 112), (218, 134))
    return s


@illu("ecarte_poulie")
def _():
    s = S(W, H); s.floor(24)
    for x in (26, 314):
        tower(s, x, 24, 210); pulley(s, (x, 196))
    stack(s, 13, 30); stack(s, 301, 30)
    for op, col, aL, aR in ((0.45, GHOST, (-52, -30), (232, 210)),
                            (1, BODY, (172, 178), (8, 2))):
        b = front(s, (170, 78), aL, aR, col, op=op)
        cable(s, (26, 196), b["hL"], FRAME, op); cable(s, (314, 196), b["hR"], FRAME, op)
        handle(s, b["hL"], 90, 7, op); handle(s, b["hR"], 90, 7, op)
    s.arc_arrow((170, 128), 54, 186, 232)
    s.arc_arrow((170, 128), 54, -6, -52)
    return s


@illu("pec_deck")
def _():
    s = S(W, H); s.floor(24)
    s.rect(158, 62, 24, 74, "#dde3ea", rx=4)               # dossier (derriere)
    s.rect(122, 50, 96, 12, FRAME, rx=4)                   # assise
    s.line((170, 52), (170, 24), FRAME, 7)                 # colonne
    for x in (104, 236):
        s.line((x, 104), (x, 156), FRAME, 5)               # bras de la machine
    for op, col, aL, aR in ((0.45, GHOST, (196, 92), (-16, 88)),
                            (1, BODY, (174, 92), (6, 88))):
        b = front(s, (170, 62), aL, aR, col, op=op, ls=0.6)
        handle(s, b["hL"], 90, 10, op); handle(s, b["hR"], 90, 10, op)
    s.arrow((112, 148), (146, 148))
    s.arrow((228, 148), (194, 148))
    return s


@illu("dips")
def _():
    s = S(W, H); s.floor(20)
    s.line((126, 120), (200, 120), FRAME, 7)               # barres paralleles
    s.line((194, 120), (194, 20), FRAME, 5)
    for op, col, sh_y, arm, hip_y in ((0.45, GHOST, 164, (-90, -90), 128),
                                      (1, BODY, 150, (-137, -43), 114)):
        b = side(s, (160, hip_y), 90, arm, (-120, -30), col, op=op)
        side_foot(s, b["ankle"], 10, col, op=op, l=13)
    s.circle((160, 120), 5, "#ffffff", GEAR, 4)
    s.arrow((246, 92), (246, 126))
    return s


@illu("ecarte_incline")
def _():
    s = S(W, H); s.floor(22)
    s.rect(152, 46, 36, 112, MAT, rx=8)                    # banc vu de dessus
    s.line((170, 46), (170, 22), FRAME, 5)
    for op, col, aL, aR in ((0.45, GHOST, (104, 84), (76, 96)),
                            (1, BODY, (168, 176), (12, 4))):
        b = front(s, (170, 84), aL, aR, col, op=op, ls=0.5)
        dumbbell(s, b["hL"], 0 if op == 1 else 90, 11, g(op), op)
        dumbbell(s, b["hR"], 0 if op == 1 else 90, 11, g(op), op)
    s.arc_arrow((170, 130), 52, 182, 124)
    s.arc_arrow((170, 130), 52, -2, 56)
    return s


# ============================== DOS =======================================

@illu("tractions")
def _():
    s = S(W, H); s.floor(18)
    s.line((70, 214), (270, 214), FRAME, 7)
    s.line((78, 214), (78, 18), FRAME, 5); s.line((262, 214), (262, 18), FRAME, 5)
    for op, col, hip_y, aL, aR in ((0.45, GHOST, 116, (118, 74), (62, 106)),
                                   (1, BODY, 84, (96, 92), (84, 88))):
        b = front(s, (170, hip_y), aL, aR, col, op=op, ls=0.86, leg_spread=6)
        for h in (b["hL"], b["hR"]):
            s.circle(h, 5, "none", g(op), 4, op)
    s.arrow((246, 104), (246, 140))
    return s


@illu("tirage_vertical")
def _():
    s = S(W, H); s.floor(22)
    tower(s, 70, 22, 216); s.line((70, 216), (152, 216), FRAME, 5)
    pulley(s, (152, 208)); stack(s, 54, 30)
    s.rect(152, 56, 90, 12, FRAME, rx=4)                   # assise
    s.line((200, 56), (200, 22), FRAME, 6)
    s.line((150, 92), (200, 92), FRAME, 9, cap="butt")     # boudin cuisses
    for op, col, arm in ((0.45, GHOST, (122, 42)), (1, BODY, (98, 92))):
        b = side(s, (200, 70), 96, arm, (174, -86), col, op=op)
        side_foot(s, b["ankle"], -6, col, op=op, l=15)
        cable(s, (152, 208), b["hand"], FRAME, op)
        handle(s, b["hand"], 172, 22, op)
    s.arrow((262, 176), (262, 132))
    return s


@illu("rowing_barre")
def _():
    s = S(W, H); s.floor(30)
    for op, col, arm in ((0.45, GHOST, (175, -63)), (1, BODY, (-88, -92))):
        b = side(s, (170, 90), 20, arm, (-80, -95), col, op=op)
        side_foot(s, b["ankle"], -20, col, op=op, l=16)
        plate(s, b["hand"], 15, g(op), op)
    s.arrow((244, 66), (236, 96))
    return s


@illu("tirage_horizontal")
def _():
    s = S(W, H); s.floor(22)
    tower(s, 52, 22, 110); pulley(s, (56, 74)); stack(s, 34, 28)
    s.rect(160, 44, 130, 10, FRAME, rx=4)                  # banc
    s.line((138, 42), (138, 88), FRAME, 10, cap="butt")    # cale-pieds
    for op, col, arm in ((0.45, GHOST, (-82, 148)), (1, BODY, (185, 180))):
        b = side(s, (206, 62), 96, arm, (180, 182), col, op=op)
        side_foot(s, b["ankle"], 100, col, op=op, l=14)
        cable(s, (56, 74), b["hand"], FRAME, op)
        handle(s, b["hand"], 90, 9, op)
    s.arrow((118, 116), (158, 116))
    return s


@illu("rowing_haltere")
def _():
    s = S(W, H); s.floor(26)
    bench(s, (120, 72), 0, 42, legs=True, y_floor=26)
    for op, col, arm in ((0.45, GHOST, (13, -103)), (1, BODY, (-88, -92))):
        b = side(s, (226, 96), 170, arm, (-70, -95), col, op=op)
        side_foot(s, b["ankle"], -14, col, op=op, l=18)
        s.line(b["sh"], (152, 78), GHOST, 5, op * 0.8)     # bras d'appui
        dumbbell(s, b["hand"], 0, 11, g(op), op)
    s.arrow((272, 66), (266, 94))
    return s


@illu("pullover_poulie")
def _():
    s = S(W, H); s.floor(24)
    tower(s, 62, 24, 212); pulley(s, (66, 198)); stack(s, 46, 32)
    for op, col, arm in ((0.45, GHOST, (-100, -96)), (1, BODY, (150, 150))):
        b = side(s, (196, 96), 96, arm, (-86, -90), col, op=op)
        side_foot(s, b["ankle"], -174, col, op=op, l=15)
        cable(s, (66, 198), b["hand"], FRAME, op)
        handle(s, b["hand"], 60, 15, op)
    s.arc_arrow((192, 132), 54, 158, 262)
    return s


@illu("extensions_lombaires")
def _():
    s = S(W, H); s.floor(22)
    s.line((162, 116), (194, 84), FRAME, 13, cap="butt")   # coussin bassin
    s.line((178, 96), (178, 22), FRAME, 6)                 # colonne
    s.line((206, 74), (230, 50), FRAME, 11, cap="butt")    # cale-chevilles
    for op, col, trunk in ((0.45, GHOST, 135), (1, BODY, 215)):
        b = side(s, (178, 100), trunk, (trunk - 100, trunk - 168), (-45, -45), col, op=op)
        side_foot(s, b["ankle"], 45, col, op=op, l=13)
    s.arc_arrow((178, 100), 50, 210, 140)
    return s


# ============================= EPAULES ====================================

@illu("developpe_militaire")
def _():
    s = S(W, H); s.floor(24)
    for op, col, aL, aR in ((0.45, GHOST, (100, 88), (80, 92)),
                            (1, BODY, (152, 40), (28, 140))):
        b = front(s, (170, 78), aL, aR, col, op=op)
        y = (b["hL"][1] + b["hR"][1]) / 2
        barbell(s, (170, y), 0, 74, 16, g(op), op)
    s.arrow((256, 146), (256, 186))
    return s


@illu("developpe_haltere_assis")
def _():
    s = S(W, H); s.floor(24)
    s.rect(122, 56, 92, 12, FRAME, rx=4)                   # assise
    s.line((214, 62), (226, 150), FRAME, 11, cap="butt")   # dossier
    s.line((164, 56), (164, 24), FRAME, 6)
    for op, col, arm in ((0.45, GHOST, (88, 92)), (1, BODY, (150, 95))):
        b = side(s, (190, 72), 98, arm, (178, -88), col, op=op)
        side_foot(s, b["ankle"], -6, col, op=op, l=18)
        dumbbell(s, b["hand"], 0, 11, g(op), op)
    s.arrow((132, 128), (132, 164))
    return s


@illu("elevations_laterales")
def _():
    s = S(W, H); s.floor(24)
    for op, col, aL, aR in ((0.45, GHOST, (178, 174), (2, 6)),
                            (1, BODY, (256, 262), (-76, -82))):
        b = front(s, (170, 78), aL, aR, col, op=op)
        dumbbell(s, b["hL"], 0 if op == 1 else 90, 11, g(op), op)
        dumbbell(s, b["hR"], 0 if op == 1 else 90, 11, g(op), op)
    s.arc_arrow((155, 114), 46, 258, 186)
    s.arc_arrow((185, 114), 46, -78, -6)
    return s


@illu("tirage_menton")
def _():
    s = S(W, H); s.floor(24)
    tower(s, 40, 24, 120); pulley(s, (44, 46)); stack(s, 22, 30)
    for op, col, aL, aR in ((0.45, GHOST, (215, 60), (-35, 120)),
                            (1, BODY, (262, 268), (-82, -88))):
        b = front(s, (176, 78), aL, aR, col, op=op)
        m = ((b["hL"][0] + b["hR"][0]) / 2, (b["hL"][1] + b["hR"][1]) / 2)
        cable(s, (44, 46), m, FRAME, op)
        handle(s, m, 0, 22, op)
    s.arrow((256, 72), (256, 114))
    return s


@illu("oiseau")
def _():
    s = S(W, H); s.floor(30)
    for op, col, arm in ((0.45, GHOST, (-6, -2)), (1, BODY, (-88, -92))):
        b = side(s, (170, 90), 20, arm, (-80, -95), col, op=op)
        side_foot(s, b["ankle"], -20, col, op=op, l=16)
        dumbbell(s, b["hand"], 90 if op == 1 else 0, 11, g(op), op)
    s.arc_arrow((204, 102), 48, -84, -8)
    return s


@illu("face_pull")
def _():
    s = S(W, H); s.floor(24)
    tower(s, 54, 24, 200); pulley(s, (58, 178)); stack(s, 36, 30)
    for op, col, arm in ((0.45, GHOST, (150, 60)), (1, BODY, (168, 172))):
        b = side(s, (196, 84), 92, arm, (-88, -90), col, op=op)
        side_foot(s, b["ankle"], -174, col, op=op, l=15)
        cable(s, (58, 178), b["hand"], FRAME, op)
        handle(s, b["hand"], 90, 9, op)
    s.arrow((132, 178), (170, 178))
    return s


@illu("shrugs")
def _():
    s = S(W, H); s.floor(24)
    for op, col, sg in ((0.45, GHOST, 14), (1, BODY, 0)):
        b = front(s, (170, 78), (256, 262), (-76, -82), col, op=op, shrug=sg)
        dumbbell(s, b["hL"], 0, 11, g(op), op)
        dumbbell(s, b["hR"], 0, 11, g(op), op)
    s.arrow((244, 114), (244, 144)); s.arrow((96, 114), (96, 144))
    return s


# ============================= ABDOS ======================================

@illu("dragon_flag")
def _():
    s = S(W, H); s.floor(26)
    bench(s, (170, 74), 0, 78, legs=True, y_floor=26)       # banc plat
    for op, col, hip, trunk, leg in ((0.45, GHOST, (185, 89), 195, (15, 15)),
                                     (1, BODY, (176, 105), 225, (45, 45))):
        b = side(s, hip, trunk, (180, 180), leg, col, op=op)
        side_foot(s, b["ankle"], leg[0] - 70, col, op=op, l=13)
        s.circle(b["hand"], 4, "none", col, 4, op)          # prise sur le bord du banc
    s.arc_arrow((150, 80), 92, 44, 16)
    return s


@illu("crunch_decline")
def _():
    s = S(W, H); s.floor(24)
    s.line((104, 62), (246, 112), FRAME, 12, cap="butt")    # banc décliné
    s.line((150, 70), (150, 24), FRAME, 5)
    s.line((232, 106), (232, 24), FRAME, 5)
    s.line((244, 122), (244, 146), FRAME, 10)               # boudins pour les pieds
    for op, col, trunk in ((0.38, GHOST, 152), (1, BODY, 200)):
        b = side(s, (208, 104), trunk, (trunk - 55, trunk - 118), (22, 112), col, op=op)
        side_foot(s, b["ankle"], 80, col, op=op, l=12)
        plate(s, P(b["sh"], trunk - 90, 17), 13, g(op), op)   # disque sur la poitrine
    s.arc_arrow((208, 104), 46, 196, 154)
    return s


@illu("v_ups")
def _():
    s = S(W, H); s.floor(34)
    s.rect(40, 34, 262, 8, MAT, rx=4)
    for op, col, trunk, arm, leg in ((0.45, GHOST, 180, (180, 180), (4, 4)),
                                     (1, BODY, 140, (20, 14), (40, 40))):
        b = side(s, (170, 44), trunk, arm, leg, col, op=op)
        side_foot(s, b["ankle"], leg[0] - 80, col, op=op, l=12)
    s.arc_arrow((170, 44), 58, 176, 138)
    s.arc_arrow((170, 44), 58, 6, 42)
    return s


@illu("releves_jambes")
def _():
    s = S(W, H); s.floor(18)
    s.line((100, 212), (240, 212), FRAME, 7)
    s.line((108, 212), (108, 18), FRAME, 5); s.line((232, 212), (232, 18), FRAME, 5)
    for op, col, leg in ((0.45, GHOST, (0, 0)), (1, BODY, (-90, -90))):
        b = side(s, (170, 124), 90, (90, 90), leg, col, op=op)
        side_foot(s, b["ankle"], 0 if op < 1 else -80, col, op=op, l=13)
        s.circle(b["hand"], 5, "none", g(op), 4, op)
    s.arc_arrow((170, 124), 58, -86, -4)
    return s


@illu("crunch_poulie")
def _():
    s = S(W, H); s.floor(26)
    tower(s, 58, 26, 210); pulley(s, (62, 196)); stack(s, 40, 32)
    for op, col, trunk in ((0.45, GHOST, 126), (1, BODY, 96)):
        b = side(s, (196, 62), trunk, (trunk + 76, trunk + 54), (178, -88), col, op=op, ls=0.85)
        cable(s, (62, 196), b["hand"], FRAME, op)
        handle(s, b["hand"], 60, 9, op)
    s.arc_arrow((196, 62), 54, 104, 130)
    return s


@illu("crunch_inverse")
def _():
    s = S(W, H); s.floor(34)
    s.rect(46, 34, 250, 8, MAT, rx=4)
    for op, col, hip, trunk, leg in ((0.45, GHOST, (186, 54), 172, (150, 20)),
                                     (1, BODY, (190, 44), 178, (90, 180))):
        side(s, hip, trunk, (trunk + 6, trunk + 4), leg, col, op=op)
    s.arc_arrow((190, 44), 56, 60, 130)
    return s


@illu("russian_twist")
def _():
    s = S(W, H); s.floor(34)
    s.rect(46, 34, 250, 8, MAT, rx=4)
    b = front(s, (170, 70), (-36, -10), (216, 190), BODY, ls=0.72, leg_spread=14)
    plate(s, (216, 92), 15, GEAR)
    s.arc_arrow((170, 96), 62, 8, 44)
    s.arc_arrow((170, 96), 62, 172, 136)
    return s


@illu("woodchopper")
def _():
    s = S(W, H); s.floor(24)
    tower(s, 36, 24, 212); pulley(s, (40, 198)); stack(s, 18, 32)
    for op, col, aL, aR in ((0.45, GHOST, (146, 152), (140, 146)),
                            (1, BODY, (-28, -34), (-34, -40))):
        b = front(s, (184, 78), aL, aR, col, op=op)
        m = ((b["hL"][0] + b["hR"][0]) / 2, (b["hL"][1] + b["hR"][1]) / 2)
        cable(s, (40, 198), m, FRAME, op)
        s.circle(m, 6, "none", g(op), 5, op)
    s.arrow((202, 172), (258, 128))
    return s


@illu("planche")
def _():
    s = S(W, H); s.floor(40)
    s.rect(60, 40, 220, 8, MAT, rx=4)
    b = side(s, (176, 66), 10, (-90, 0), (195, 195), BODY, ls=1.05)
    side_foot(s, b["ankle"], 60, BODY, l=14)
    s.line((116, 50), (214, 74), LINE_OK, 3, dash="8 7")
    return s


@illu("planche_laterale")
def _():
    s = S(W, H); s.floor(40)
    s.rect(60, 40, 220, 8, MAT, rx=4)
    b = side(s, (176, 66), 10, (-90, 0), (195, 195), BODY, ls=1.05)
    s.line(b["sh"], P(b["sh"], 96, 46), BODY, 5)           # bras libre vers le haut
    s.line((116, 50), (214, 74), LINE_OK, 3, dash="8 7")
    return s


@illu("hollow")
def _():
    s = S(W, H); s.floor(34)
    s.rect(46, 34, 250, 8, MAT, rx=4)
    b = side(s, (170, 46), 150, (145, 148), (28, 32), BODY)
    side_foot(s, b["ankle"], -60, BODY, l=13)
    s.circle((170, 45), 5, "none", LINE_OK, 3)
    s.arrow((132, 74), (132, 92)); s.arrow((236, 74), (236, 92))
    return s


@illu("ab_wheel")
def _():
    s = S(W, H); s.floor(34)
    s.rect(46, 26, 250, 8, MAT, rx=4)
    for op, col, trunk, arm in ((0.45, GHOST, 183, (198, 198)), (1, BODY, 136, (-90, -90))):
        b = side(s, (230, 62), trunk, arm, (-80, 0), col, op=op)
        s.circle(b["hand"], 12, "none", g(op), 5, op)
        s.circle(b["hand"], 3, "none", g(op), 3, op)
    s.arrow((212, 74), (168, 62))
    return s


# ================== PROGRAMME B — semaine 2 ===============================

@illu("developpe_couche_halteres")
def _():
    s = S(W, H); s.floor(26)
    bench(s, (166, 74), 0, 74, legs=True, y_floor=26)
    for op, col, arm in ((0.45, GHOST, (72, 72)), (1, BODY, (-2, 104))):
        b = side(s, (196, 86), 180, arm, (-35, -85), col, op=op)
        side_foot(s, b["ankle"], -80, col, op=op, l=20)
        dumbbell(s, b["hand"], 90, 11, g(op), op)
    s.arrow((212, 106), (212, 136))
    return s


@illu("developpe_decline")
def _():
    s = S(W, H); s.floor(24)
    s.line((118, 60), (216, 98), FRAME, 12, cap="butt")     # banc décliné
    s.line((150, 70), (150, 24), FRAME, 5)
    s.line((206, 92), (206, 24), FRAME, 5)
    s.line((214, 108), (238, 108), FRAME, 9)                # boudins des cuisses
    for op, col, arm in ((0.45, GHOST, (110, 110)), (1, BODY, (170, 50))):
        b = side(s, (196, 92), 200, arm, (12, 100), col, op=op)
        side_foot(s, b["ankle"], 10, col, op=op, l=13)
        plate(s, b["hand"], 14, g(op), op)
    s.arrow((120, 104), (114, 128))
    return s


@illu("presse_pectoraux")
def _():
    s = S(W, H); s.floor(24)
    s.rect(180, 54, 84, 12, FRAME, rx=4)                    # assise
    s.line((222, 60), (222, 146), FRAME, 11, cap="butt")    # dossier
    s.line((212, 54), (212, 24), FRAME, 6)
    tower(s, 258, 24, 150); stack(s, 246, 30)
    for op, col, arm in ((0.45, GHOST, (180, 180)), (1, BODY, (240, 129))):
        b = side(s, (206, 66), 94, arm, (176, -88), col, op=op)
        side_foot(s, b["ankle"], -6, col, op=op, l=14)
        s.line((252, 140), b["hand"], FRAME, 3, op)         # bras de la machine
        handle(s, b["hand"], 90, 9, op)
    s.arrow((150, 84), (118, 84))
    return s


@illu("ecarte_poulie_basse")
def _():
    s = S(W, H); s.floor(24)
    for x in (26, 314):
        tower(s, x, 24, 120); pulley(s, (x, 44))
    stack(s, 13, 30); stack(s, 301, 30)
    for op, col, aL, aR in ((0.45, GHOST, (30, 58), (150, 122)),
                            (1, BODY, (244, 250), (-64, -70))):
        b = front(s, (170, 78), aL, aR, col, op=op)
        cable(s, (26, 44), b["hL"], FRAME, op); cable(s, (314, 44), b["hR"], FRAME, op)
        handle(s, b["hL"], 90, 7, op); handle(s, b["hR"], 90, 7, op)
    s.arc_arrow((155, 116), 50, 248, 300)
    s.arc_arrow((185, 116), 50, -68, -120)
    return s


@illu("pompes")
def _():
    s = S(W, H); s.floor(38)
    s.rect(60, 30, 220, 8, MAT, rx=4)
    for op, col, hip, arm in ((0.45, GHOST, (160, 55), (210, -30)),
                              (1, BODY, (160, 77), (-88, -92))):
        b = side(s, hip, 8, arm, (188, 188), col, op=op)
        side_foot(s, b["ankle"], -60, col, op=op, l=13)
    plate(s, (176, 64), 11, GEAR)                           # lest sur le haut du dos
    s.arrow((236, 60), (236, 86))
    return s


@illu("rowing_machine")
def _():
    s = S(W, H); s.floor(24)
    s.rect(182, 52, 86, 12, FRAME, rx=4)                    # assise
    s.line((214, 52), (214, 24), FRAME, 6)
    s.line((178, 68), (182, 126), FRAME, 12, cap="butt")    # coussin de poitrine
    tower(s, 120, 24, 150); stack(s, 108, 30)
    for op, col, arm in ((0.45, GHOST, (13, -133)), (1, BODY, (-140, -140))):
        b = side(s, (200, 62), 100, arm, (176, -88), col, op=op)
        side_foot(s, b["ankle"], -6, col, op=op, l=14)
        s.line((126, 140), b["hand"], FRAME, 3, op)         # bras de la machine
        handle(s, b["hand"], 90, 9, op)
    s.arrow((132, 60), (168, 60))
    return s


@illu("rowing_t")
def _():
    s = S(W, H); s.floor(28)
    s.line((44, 30), (214, 78), GEAR, 5)                    # barre en T ancrée au sol
    s.circle((44, 30), 6, "none", FRAME, 4)
    for c in ((206, 76), (214, 78)):
        plate(s, c, 15, GEAR)
    for op, col, arm in ((0.45, GHOST, (162, -72)), (1, BODY, (-90, -158))):
        b = side(s, (190, 90), 20, arm, (-80, -95), col, op=op)
        side_foot(s, b["ankle"], -20, col, op=op, l=16)
        s.circle(b["hand"], 4, "none", col, 4, op)
    s.arrow((262, 62), (256, 92))
    return s


@illu("pullover_haltere")
def _():
    s = S(W, H); s.floor(26)
    s.line((140, 72), (206, 72), FRAME, 12, cap="butt")     # banc, en travers
    s.line((150, 66), (150, 26), FRAME, 5); s.line((196, 66), (196, 26), FRAME, 5)
    for op, col, arm in ((0.45, GHOST, (136, 140)), (1, BODY, (76, 84))):
        b = side(s, (200, 80), 180, arm, (-62, -88), col, op=op)
        side_foot(s, b["ankle"], -8, col, op=op, l=15)
        dumbbell(s, b["hand"], 0, 11, g(op), op)
    s.arc_arrow((164, 80), 46, 78, 136)
    return s


@illu("presse_epaules")
def _():
    s = S(W, H); s.floor(24)
    s.rect(160, 54, 84, 12, FRAME, rx=4)                    # assise
    s.line((236, 60), (240, 150), FRAME, 11, cap="butt")    # dossier
    s.line((196, 54), (196, 24), FRAME, 6)
    tower(s, 140, 24, 180); stack(s, 128, 30)
    for op, col, arm in ((0.45, GHOST, (88, 92)), (1, BODY, (150, 95))):
        b = side(s, (208, 70), 98, arm, (178, -88), col, op=op)
        side_foot(s, b["ankle"], -6, col, op=op, l=16)
        s.line((146, 172), b["hand"], FRAME, 3, op)         # bras de la machine
        handle(s, b["hand"], 0, 10, op)
    s.arrow((110, 120), (110, 158))
    return s


@illu("elevations_poulie")
def _():
    s = S(W, H); s.floor(24)
    tower(s, 306, 24, 120); pulley(s, (306, 44)); stack(s, 293, 30)
    for op, col, aL in ((0.45, GHOST, (178, 176)), (1, BODY, (-54, -54))):
        b = front(s, (168, 78), aL, (-76, -82), col, op=op)
        cable(s, (306, 44), b["hL"], FRAME, op)
        handle(s, b["hL"], 90, 7, op)
    s.arc_arrow((153, 114), 48, -52, -182)
    return s


@illu("elevations_frontales")
def _():
    s = S(W, H); s.floor(26)
    for op, col, arm in ((0.45, GHOST, (2, 0)), (1, BODY, (-88, -92))):
        b = side(s, (160, 84), 90, arm, (-86, -92), col, op=op)
        side_foot(s, b["ankle"], 0, col, op=op, l=15)
        plate(s, b["hand"], 14, g(op), op)
    s.arc_arrow((160, 120), 54, -80, -6)
    return s


@illu("oiseau_poulie")
def _():
    s = S(W, H); s.floor(24)
    for x in (26, 314):
        tower(s, x, 24, 170); pulley(s, (x, 122))
    stack(s, 13, 30); stack(s, 301, 30)
    for op, col, aL, aR in ((0.45, GHOST, (176, 178), (4, 2)),
                            (1, BODY, (-24, -6), (204, 186))):
        b = front(s, (170, 78), aL, aR, col, op=op)
        cable(s, (314, 122), b["hL"], FRAME, op)            # câbles croisés
        cable(s, (26, 122), b["hR"], FRAME, op)
        handle(s, b["hL"], 90, 7, op); handle(s, b["hR"], 90, 7, op)
    s.arrow((150, 120), (104, 120)); s.arrow((190, 120), (236, 120))
    return s


@illu("shrugs_barre")
def _():
    s = S(W, H); s.floor(24)
    for op, col, sg in ((0.45, GHOST, 14), (1, BODY, 0)):
        b = front(s, (170, 78), (256, 262), (-76, -82), col, op=op, shrug=sg)
        y = (b["hL"][1] + b["hR"][1]) / 2
        barbell(s, (170, y), 0, 72, 15, g(op), op)
    s.arrow((252, 96), (252, 126)); s.arrow((88, 96), (88, 126))
    return s
