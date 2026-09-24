# -*- coding: utf-8 -*-
"""Traductions de la carte interactive : français, anglais, espagnol.

Le français est la langue source (contenu.py) ; ce fichier fournit les deux
autres, plus les chaînes d'interface dans les trois langues.
"""

LANGUES = [("fr", "Français"), ("en", "English"), ("es", "Español")]

# --- interface --------------------------------------------------------------
UI = {
    "titre": ("Carte des exercices", "Exercise map", "Mapa de ejercicios"),
    "sur_titre": ("Musculation du soir · lundi à vendredi",
                  "Evening strength training · Monday to Friday",
                  "Musculación por la tarde · de lunes a viernes"),
    "intro": (
        "Épaules, dos, pectoraux, abdominaux. Touche un exercice pour ouvrir sa fiche : schéma du "
        "mouvement, machine à chercher dans la salle, réglages, exécution, erreurs à éviter et lien "
        "vidéo. Le bouton « exercice suivant » enchaîne les fiches dans l'ordre de la séance. Les "
        "deux programmes se suivent par blocs de 4 à 5 semaines : mêmes jours, mêmes muscles, "
        "d'autres exercices.",
        "Shoulders, back, chest, abs. Tap an exercise to open its card: movement diagram, which "
        "machine to look for, setup, step-by-step execution, mistakes to avoid and a video link. "
        "The “next exercise” button walks through the session in order. The two programmes "
        "run in blocks of 4 to 5 weeks: same days, same muscles, different exercises.",
        "Hombros, espalda, pecho, abdominales. Toca un ejercicio para abrir su ficha: esquema del "
        "movimiento, qué máquina buscar, ajustes, ejecución paso a paso, errores a evitar y un "
        "enlace de vídeo. El botón «siguiente ejercicio» encadena las fichas en el orden de la "
        "sesión. Los dos programas se hacen en bloques de 4 a 5 semanas: mismos días, mismos "
        "músculos, otros ejercicios."),
    "langue": ("Langue", "Language", "Idioma"),
    "filtrer": ("Filtrer", "Filter", "Filtrar"),
    "tous": ("Tous les exercices", "All exercises", "Todos los ejercicios"),
    "opt_groupe": ("Groupe musculaire", "Muscle group", "Grupo muscular"),
    "opt_materiel": ("Matériel", "Equipment", "Material"),
    "vide": ("Aucun exercice ne correspond.", "No exercise matches.",
             "Ningún ejercicio coincide."),
    "abdominaux": ("Abdominaux", "Abs", "Abdominales"),
    "gainage": ("Gainage", "Core holds", "Isométricos"),
    "gainage_note": ("2 à 3 min · pour finir", "2 to 3 min · to finish",
                     "2 a 3 min · para terminar"),
    "machine": ("Quelle machine", "Which machine", "Qué máquina"),
    "reglage": ("Réglages avant de commencer", "Setup before you start",
                "Ajustes antes de empezar"),
    "execution": ("Exécution", "Execution", "Ejecución"),
    "erreurs": ("Erreurs à éviter", "Mistakes to avoid", "Errores a evitar"),
    "depart": ("Départ", "Start", "Inicio"),
    "arrivee": ("Arrivée", "End", "Final"),
    "sens": ("Sens du mouvement", "Direction of movement", "Sentido del movimiento"),
    "video": ("▶ Voir la démonstration", "▶ Watch a demonstration", "▶ Ver una demostración"),
    "suivant": ("Exercice suivant →", "Next exercise →", "Siguiente ejercicio →"),
    "fin": ("Fin de la séance", "End of the session", "Fin de la sesión"),
    "fermer": ("Fermer", "Close", "Cerrar"),
    "fiche_no": ("fiche n°", "card no.", "ficha n.º"),
    "repos": ("repos", "rest", "descanso"),
    "seance": ("Séance", "Session", "Sesión"),
    "note_video": (
        "Le bouton vidéo ouvre une recherche YouTube sur le nom de l'exercice : les résultats "
        "changent avec le temps, choisis une démonstration récente et complète plutôt que la "
        "première miniature. Les schémas et les fiches reprennent le PDF du programme, rédigé en "
        "français.",
        "The video button opens a YouTube search for the exercise name: results change over time, "
        "so pick a recent, complete demonstration rather than the first thumbnail. The diagrams and "
        "cards mirror the programme PDF, which is written in French.",
        "El botón de vídeo abre una búsqueda en YouTube con el nombre del ejercicio: los resultados "
        "cambian con el tiempo, así que elige una demostración reciente y completa en lugar de la "
        "primera miniatura. Los esquemas y las fichas provienen del PDF del programa, redactado en "
        "francés."),
    "cal_titre": ("Calendrier de suivi", "Training calendar", "Calendario de seguimiento"),
    "cal_debut": ("Début du cycle", "Cycle start", "Inicio del ciclo"),
    "cal_duree": ("Longueur d'un bloc", "Block length", "Duración del bloque"),
    "cal_4": ("4 semaines", "4 weeks", "4 semanas"),
    "cal_5": ("5 semaines", "5 weeks", "5 semanas"),
    "cal_sem": ("S", "W", "S"),
    "cal_jours": ("L M J V", "Mo Tu Th Fr", "L M J V"),
    "cal_ici": ("cette semaine", "this week", "esta semana"),
    "cal_etat": ("Semaine %N% du programme %P%", "Week %N% of programme %P%",
                 "Semana %N% del programa %P%"),
    "cal_reste_un": ("dernière semaine du bloc : la semaine prochaine, tu passes au programme %Q%",
                     "last week of this block: next week you move to programme %Q%",
                     "última semana del bloque: la próxima semana pasas al programa %Q%"),
    "cal_reste": ("encore %R% semaines avant de passer au programme %Q%",
                  "%R% more weeks before moving to programme %Q%",
                  "faltan %R% semanas para pasar al programa %Q%"),
    "cal_avant": ("Le cycle commence le %D%.", "The cycle starts on %D%.",
                  "El ciclo empieza el %D%."),
    "cal_sans_date": ("Choisis la date du lundi où tu commences le programme A.",
                      "Pick the Monday you start programme A.",
                      "Elige el lunes en que empiezas el programa A."),
    "cal_aide": ("Coche chaque séance faite : le calendrier retient tes coches et ouvre "
                 "automatiquement le bon programme à chaque visite.",
                 "Tick each session you complete: the calendar remembers your ticks and opens the "
                 "right programme every time you come back.",
                 "Marca cada sesión hecha: el calendario recuerda tus marcas y abre el programa "
                 "correcto cada vez que vuelves."),
    "cal_en_ligne": ("Coches enregistrées en ligne : tu les retrouves sur tous tes appareils.",
                     "Ticks saved online: they follow you across devices.",
                     "Marcas guardadas en línea: las tienes en todos tus dispositivos."),
    "cal_local": ("Coches enregistrées dans ce navigateur uniquement.",
                  "Ticks saved in this browser only.",
                  "Marcas guardadas solo en este navegador."),
    "cal_total": ("%N% séances cochées", "%N% sessions ticked", "%N% sesiones marcadas"),
    "rotation": (
        "Suis le programme A pendant 4 à 5 semaines, puis passe au programme B pour 4 à 5 semaines. "
        "Répéter le même exercice plusieurs semaines de suite est ce qui permet d'augmenter les "
        "charges ; alterner chaque semaine ne le permet pas.",
        "Follow programme A for 4 to 5 weeks, then switch to programme B for 4 to 5 weeks. Repeating "
        "the same exercise week after week is what lets you add weight; alternating every week does "
        "not.",
        "Sigue el programa A durante 4 o 5 semanas y pasa luego al programa B otras 4 o 5 semanas. "
        "Repetir el mismo ejercicio varias semanas seguidas es lo que permite subir las cargas; "
        "alternar cada semana no lo permite."),
    "prog_sous_a": ("1er bloc · 4 à 5 semaines", "1st block · 4 to 5 weeks",
                    "1.er bloque · 4 a 5 semanas"),
    "prog_sous_b": ("2e bloc · 4 à 5 semaines", "2nd block · 4 to 5 weeks",
                    "2.º bloque · 4 a 5 semanas"),
    "programme": ("Programme", "Programme", "Programa"),
    "repos_jour": ("repos", "rest", "descanso"),
    "plus_abdos": ("+ abdos", "+ abs", "+ abdominales"),
}

GROUPES = {
    "Pectoraux": ("Pectoraux", "Chest", "Pecho"),
    "Dos": ("Dos", "Back", "Espalda"),
    "Épaules": ("Épaules", "Shoulders", "Hombros"),
    "Abdos": ("Abdominaux", "Abs", "Abdominales"),
}

MATERIELS = {
    "barre": ("Barre", "Barbell", "Barra"),
    "halteres": ("Haltères et disques", "Dumbbells and plates", "Mancuernas y discos"),
    "poulie": ("Poulie et câbles", "Cables", "Poleas y cables"),
    "machine": ("Machine guidée", "Machines", "Máquinas guiadas"),
    "corps": ("Poids du corps", "Bodyweight", "Peso corporal"),
}

JOURS = {
    "Lundi": ("Lundi", "Monday", "Lunes"),
    "Mardi": ("Mardi", "Tuesday", "Martes"),
    "Mercredi": ("Mercredi", "Wednesday", "Miércoles"),
    "Jeudi": ("Jeudi", "Thursday", "Jueves"),
    "Vendredi": ("Vendredi", "Friday", "Viernes"),
    "Samedi": ("Samedi", "Saturday", "Sábado"),
    "Dimanche": ("Dimanche", "Sunday", "Domingo"),
}

# Titre des séances : le groupe travaillé, tel qu'affiché en tête de carte.
SEANCE_GROUPE = {
    "Pectoraux": ("Pectoraux", "Chest", "Pecho"),
    "Dos": ("Dos", "Back", "Espalda"),
    "Épaules": ("Épaules", "Shoulders", "Hombros"),
    "Haut du corps complet": ("Haut du corps", "Full upper body", "Tren superior"),
}

# Sous-titre des blocs abdominaux (après le tiret du titre français).
BLOCS_NOM = {
    "force": ("force", "strength", "fuerza"),
    "grand droit": ("grand droit", "rectus abdominis", "recto abdominal"),
    "obliques": ("obliques", "obliques", "oblicuos"),
    "suspension": ("suspension", "hanging", "suspensión"),
    "flexion lestée": ("flexion lestée", "loaded flexion", "flexión con carga"),
    "mixte": ("mixte", "mixed", "mixto"),
}

# Suffixe ajouté à la recherche vidéo selon la langue.
SUFFIXE_VIDEO = ("technique musculation", "proper form technique", "técnica ejecución")


def dose(txt, i):
    """Traduit une dose du type « 8 à 10 » ou « 10 à 12 par bras »."""
    if i == 0:
        return txt
    r = txt.replace(" à ", " to " if i == 1 else " a ")
    r = r.replace("par bras", "per arm" if i == 1 else "por brazo")
    r = r.replace("par côté", "per side" if i == 1 else "por lado")
    r = r.replace("max", "max")
    return r


def duree(txt, i):
    """Traduit une durée du type « 55 à 65 min »."""
    return dose(txt, i)


# --- fiches en anglais ------------------------------------------------------
FICHES_EN = {
 "developpe_couche": dict(
   nom="Barbell bench press",
   machine="A flat bench set under a barbell rack (two hooks at shoulder height). If a free barbell "
           "feels intimidating, use the Smith machine: the bar slides on two rails and cannot tip.",
   reglage="Bar on the hooks, above your eyes once you lie down. Identical plates on both sides, "
           "collars every time. Start with the empty bar to find your grip.",
   etapes=["Lie down with your eyes under the bar, feet flat on the floor.",
           "Three contact points: head, upper back, glutes — they stay put.",
           "Grip slightly wider than your shoulders, wrists in line with your forearms.",
           "Unrack the bar and bring it over your chest, arms straight.",
           "Lower it in 2 s until it brushes the lower chest, elbows at 45° to your torso.",
           "Press up without slamming your elbows into lockout."],
   erreurs=["Bouncing the bar off your chest.",
            "Lifting your glutes off the bench to help.",
            "Elbows flared to 90°: very hard on the shoulder."]),
 "developpe_incline": dict(
   nom="Incline dumbbell press",
   machine="An adjustable bench in the dumbbell area. Set it to 30° (first or second notch): past "
           "45° the shoulders take over from the chest.",
   reglage="Two matching dumbbells. Sit down with them flat on your thighs, then lie back while "
           "kneeing them up: that is the safe way to get them into place.",
   etapes=["Back flat against the pad, feet on the floor.",
           "Dumbbells at shoulder level, palms forward, elbows under your wrists.",
           "Press up and slightly inward, without clacking the dumbbells together.",
           "Lower in 2 s until your elbows reach shoulder level.",
           "To finish: bring the dumbbells back onto your thighs, then sit up."],
   erreurs=["Going too deep chasing a stretch.",
            "Arching your lower back to lift heavier.",
            "Letting the dumbbells drift back over your face."]),
 "ecarte_poulie": dict(
   nom="Cable crossover fly",
   machine="The tall cable station with one column on each side. Clip a single handle to each "
           "pulley, both set to the high position.",
   reglage="Same load on both stacks: the pin goes all the way into the plate. Stand in the middle, "
           "one foot slightly forward for balance.",
   etapes=["A handle in each hand, torso leaning very slightly forward.",
           "Arms almost straight, elbows just unlocked — that angle never changes.",
           "Bring your hands towards each other in front of your lower chest, in an arc.",
           "Hold the squeeze for 1 s, chest proud.",
           "Let your arms travel back under control, without forcing the stretch."],
   erreurs=["Bending then straightening your elbows: that turns it into a triceps exercise.",
            "A load so heavy it drags you backwards.",
            "Shrugging your shoulders towards your ears."]),
 "pec_deck": dict(
   nom="Pec deck",
   machine="The seated machine with two vertical arms and pads (or handles) that you bring together "
           "in front of you. The simplest alternative to the cable fly.",
   reglage="Set the seat height so your elbows (or handles) sit at shoulder height. Pin in the "
           "stack, back flat against the pad.",
   etapes=["Seated, back and shoulders touching the pad, feet on the floor.",
           "Forearms or hands against the pads, elbows at shoulder height.",
           "Bring both arms together in front of your chest.",
           "Pause 1 s closed, then return in 2 s.",
           "Do not let the plates crash down between reps."],
   erreurs=["Peeling your back off the pad to push.",
            "Opening too far back, forcing the shoulder into a stretch.",
            "Rushing: control is the whole point of this machine."]),
 "dips": dict(
   nom="Dips (parallel bars)",
   machine="The two parallel bars at hip height, often on the same frame as the pull-up bar. If "
           "there is an assisted dip machine, a pad lifts your knees and lightens the movement: the "
           "heavier the plate you select, the easier it gets.",
   reglage="On the assisted machine, start with generous assistance. Otherwise swap in push-ups, "
           "feet elevated if needed.",
   etapes=["Hands on the bars, arms straight, body hanging, knees bent behind you.",
           "Lean your torso about 20° forward: that is what targets the chest.",
           "Lower by bending your elbows until your shoulders reach elbow height.",
           "Press back up without snapping into lockout.",
           "Keep your shoulders down, away from your ears, throughout."],
   erreurs=["Going too deep: pain at the front of the shoulder.",
            "Swinging to generate momentum.",
            "Staying perfectly upright: the work shifts to the triceps."]),
 "ecarte_incline": dict(
   nom="Incline dumbbell fly",
   machine="The same bench at 30° as the incline press, with two light dumbbells. The diagram is a "
           "top view: you are lying on your back and your arms open out to the sides.",
   reglage="Go much lighter than for the press: this is a stretch exercise, not a strength one. "
           "Dumbbells onto your thighs, then lie back.",
   etapes=["Arms straight above your chest, palms facing each other.",
           "Elbows very slightly bent — that angle is locked for the whole set.",
           "Open your arms out to the sides in an arc, down to shoulder height.",
           "Close them by squeezing your chest, as if hugging a tree trunk.",
           "Finish the set by resting the dumbbells back on your thighs."],
   erreurs=["Dropping your arms below shoulder level.",
            "Turning it into a press (elbows bending).",
            "Going too heavy: this is the finisher of the session."]),
 "developpe_couche_halteres": dict(
   nom="Dumbbell bench press",
   machine="The same flat bench, but with two dumbbells instead of the bar. Each arm works alone: "
           "your weaker side can no longer hide behind the other, and the bottom range is deeper.",
   reglage="Pick dumbbells 30 to 40 % lighter than your usual barbell load. Sit at the end of the "
           "bench, dumbbells on your thighs, then lie back while kneeing them up.",
   etapes=["Lying down, feet on the floor, dumbbells at chest level, palms forward.",
           "Elbows at 45° to your torso, wrists in line with your forearms.",
           "Press up, bringing the dumbbells slightly together without clacking them.",
           "Lower in 2 s until your elbows pass below shoulder level.",
           "Keep your shoulder blades squeezed and your upper back flat throughout.",
           "To finish: bring the dumbbells onto your thighs, then sit up."],
   erreurs=["Going too deep chasing a stretch: the shoulder pays for it.",
            "Letting the dumbbells drift outwards late in the set.",
            "Dropping the dumbbells to the side: always set them down on your thighs."]),
 "developpe_decline": dict(
   nom="Decline barbell press",
   machine="The decline bench (head down) with its thigh rollers, under a rack. If your gym has "
           "none, the converging decline press machine does the same job and is easier to set up.",
   reglage="15 to 30° of decline, no more. Hook your thighs under the rollers before lying back. "
           "Have someone hand you the bar the first few times: being head-down is disorienting.",
   etapes=["Lying head down, thighs locked in, bar above your eyes.",
           "Grip slightly wider than your shoulders, bar unracked with straight arms.",
           "Lower towards the bottom of your chest, below nipple line.",
           "Elbows at 45°, 2 s down until the bar brushes your chest.",
           "Press vertically, without snapping your elbows into lockout.",
           "Rack the bar before sitting up, never the other way round."],
   erreurs=["Staying head-down between sets: sit up to recover.",
            "Lowering the bar too high, towards your neck.",
            "Setting 45° of decline: pointless and unpleasant."]),
 "presse_pectoraux": dict(
   nom="Chest press machine",
   machine="The seated machine where you push two handles forward, back against a pad. The safest "
           "exercise of the group: nothing to stabilise, so you can push hard at the end of a "
           "session with no spotter.",
   reglage="Set the seat so the handles line up with the middle of your chest, not your shoulders. "
           "Pin in the stack.",
   etapes=["Seated, back and shoulders against the pad, feet flat.",
           "Handles at chest level, elbows slightly below your hands.",
           "Press forward until your arms are straight, without locking out.",
           "Return in 2 s until your hands come back level with your chest.",
           "Do not let the plates crash into the stack between reps."],
   erreurs=["Peeling your back off the pad to push more weight.",
            "Letting your elbows ride up to shoulder height.",
            "Cutting the range short: your hands must come back to your torso."]),
 "ecarte_poulie_basse": dict(
   nom="Low-to-high cable fly",
   machine="The same crossover station, but with both pulleys set at the bottom. The movement goes "
           "up instead of down: it targets the upper chest, the area the rest of the programme "
           "reaches least.",
   reglage="Single handles on both low pulleys, same load each side. Stand in the middle, one foot "
           "slightly forward, torso upright.",
   etapes=["A handle in each hand, arms by your sides, palms forward.",
           "Elbows very slightly bent, angle locked for the whole set.",
           "Sweep your hands up and together to shoulder height, in an arc.",
           "Squeeze your chest for 1 s at the top, hands almost touching in front of your sternum.",
           "Lower in 3 s under control, without letting your arms swing behind you."],
   erreurs=["Raising your hands above shoulder height: it becomes a front raise.",
            "Leaning back to launch the weight.",
            "Bending your elbows along the way."]),
 "pompes": dict(
   nom="Weighted push-ups",
   machine="A mat, plus a 5 to 20 kg plate laid on your upper back (ask someone to place it, or "
           "wear a weighted vest). Session finisher: you chase clean failure here.",
   reglage="Hands slightly wider than your shoulders, straight under them. No added weight until 15 "
           "strict push-ups are easy.",
   etapes=["Body in a straight line from heels to head, glutes and abs braced.",
           "Elbows at 45° to your torso, not flared out.",
           "Lower in 2 s until your chest grazes the floor.",
           "Press up without sagging your lower back or piking your hips.",
           "Stop 2 reps short of failure, not at the point where form breaks.",
           "Too hard? Hands on a bench. Too easy? Feet elevated, then add weight."],
   erreurs=["Hips sagging, or backside in the air.",
            "Partial range: your chest must come down to elbow level.",
            "Head poking forward on every rep."]),
 "tractions": dict(
   nom="Pull-ups",
   machine="A fixed bar, or the assisted pull-up machine (you kneel or stand on a counterweighted "
           "platform that pushes you up).",
   reglage="On the assisted machine, the heavier the selected load, the more help you get. Aim for "
           "assistance that allows 8 to 10 clean reps, and reduce it week by week.",
   etapes=["Overhand grip (palms forward), hands slightly wider than your shoulders.",
           "Start from straight arms, shoulders down, core braced, ankles crossed.",
           "Begin by pulling your shoulder blades down, then drive your elbows down and back.",
           "Pull until your chin clears the bar (or as high as you can).",
           "Lower in 2 s to straight arms, without dropping."],
   erreurs=["Kicking your legs for momentum.",
            "Only going halfway down.",
            "Burying your head between your shoulders at the top."]),
 "tirage_vertical": dict(
   nom="Lat pulldown",
   machine="The seated machine with a long bar hanging from a high pulley and an adjustable thigh "
           "pad. This is the stand-in for pull-ups.",
   reglage="Set the thigh pad so it holds you on the seat without crushing you. Grab the bar while "
           "standing, then sit down. Wide overhand grip, or neutral (V-handle) grip in session D.",
   etapes=["Seated, thighs locked, torso leaning back about 15°.",
           "Chest proud, shoulders down, eyes forward.",
           "Pull the bar to your upper chest, leading with your elbows.",
           "Squeeze your shoulder blades at the end, hold 1 s.",
           "Let the bar rise in 2 s back to straight arms."],
   erreurs=["Pulling the bar behind your neck: useless and risky for the shoulder.",
            "Leaning far back to rip the weight up.",
            "Pulling with your arms and forgetting to depress the shoulder blades."]),
 "rowing_barre": dict(
   nom="Bent-over barbell row",
   machine="A straight barbell picked up from the floor in the free-weight area. Easier on the back: "
           "the trap bar, or the seated row machine (next card).",
   reglage="Moderate load until the position is second nature. Feet hip-width apart, bar over the "
           "middle of your foot.",
   etapes=["Soften your knees and hinge your torso forward to about 45°.",
           "Back perfectly flat, chest proud, eyes on the floor 2 m ahead.",
           "Arms straight, bar hanging under your shoulders, overhand grip.",
           "Row the bar to your navel, keeping your elbows close to your body.",
           "Lower under control without rounding; your torso does not rise."],
   erreurs=["Rounding your lower back: end the set right there.",
            "Standing up on each rep to throw the bar.",
            "Rowing to your chest instead of your navel."]),
 "tirage_horizontal": dict(
   nom="Seated cable row",
   machine="The seated station with a footplate and a low pulley: you pull a V-handle (or a short "
           "bar) towards your stomach. Also the “low cable row” of session D.",
   reglage="Feet braced on the plate, knees slightly bent (never locked). Take the handle keeping "
           "your back flat, then sit up.",
   etapes=["Seated, torso vertical, arms reaching forward, back flat.",
           "Pull the handle to your navel, elbows along your body.",
           "Squeeze your shoulder blades at the end, chest forward.",
           "Let your arms travel back out in 2 s, torso staying vertical.",
           "On the last rep, guide the handle back to its rest."],
   erreurs=["Rocking back and forth like a rower.",
            "Rounding your back as your arms go forward.",
            "Shrugging during the pull."]),
 "rowing_haltere": dict(
   nom="One-arm dumbbell row",
   machine="A flat bench and a dumbbell. You brace one hand (or one knee) on the bench and row the "
           "dumbbell with the other side.",
   reglage="Dumbbell on the floor alongside the bench, on the working side. Brace the opposite hand "
           "and leg for a stable back.",
   etapes=["Left hand on the bench, torso almost horizontal, back flat.",
           "Dumbbell in your right hand, arm hanging towards the floor.",
           "Row the dumbbell to your hip, elbow close to your body.",
           "Pause 1 s at the top without twisting your shoulders.",
           "Lower in 2 s to a straight arm, then switch sides."],
   erreurs=["Rotating your torso to lift higher.",
            "Rowing out and around in an arc.",
            "Letting your back round between reps."]),
 "pullover_poulie": dict(
   nom="Straight-arm cable pullover",
   machine="A cable column set to the high position, with a short straight bar or a rope. Stand "
           "facing the machine, a good step away.",
   reglage="Go light at first: the lever is long. Bar taken overhand, shoulder-width.",
   etapes=["Standing, feet staggered, torso leaning slightly forward, core braced.",
           "Arms reaching towards the pulley, elbows just unlocked.",
           "Sweep the bar down in an arc to your thighs, arms still straight.",
           "Squeeze your lats for 1 s at the bottom.",
           "Let the bar rise under control, without your shoulders rolling forward."],
   erreurs=["Bending your elbows (it becomes a triceps extension).",
            "Using your torso as a pendulum.",
            "Going too heavy: the exercise loses its whole purpose."]),
 "extensions_lombaires": dict(
   nom="45° back extensions",
   machine="The 45° bench with a large hip pad and two rollers for your ankles. Some gyms have the "
           "horizontal version: same principle.",
   reglage="Set the pad height so its top edge sits just below your hip bones, letting your pelvis "
           "move freely.",
   etapes=["Ankles locked, hips on the pad, arms crossed over your chest.",
           "Lower your torso keeping your back straight, to about 70°.",
           "Come back up by squeezing your glutes and lower back.",
           "Stop when your body forms a straight line: no higher.",
           "Slow, no jerking, 2 s in each direction."],
   erreurs=["Coming up into hyperextension, back arched.",
            "Swinging your torso for momentum.",
            "Adding weight too early: start with bodyweight."]),
 "tractions_supination": dict(
   nom="Chin-ups (underhand grip)",
   machine="The same fixed bar (or assisted machine), but with your palms facing you, hands "
           "shoulder-width apart. This grip brings the biceps in: you will go higher and more often "
           "than with the overhand grip.",
   reglage="On the assisted machine, drop the assistance by 5 kg compared with your usual pull-up: "
           "this variation is easier.",
   etapes=["Underhand grip (palms towards you), hands shoulder-width apart.",
           "Start from straight arms, shoulders down, core braced, ankles crossed.",
           "Pull your shoulder blades down first, then drive your elbows down and back.",
           "Pull until your chest approaches the bar.",
           "Lower in 2 s to straight arms without losing tension."],
   erreurs=["Swinging for momentum.",
            "Pulling with the arms only and forgetting the back.",
            "Skipping the bottom of the descent."]),
 "rowing_machine": dict(
   nom="Chest-supported row machine",
   machine="The seated row machine with a chest pad. Your torso is braced, so your lower back does "
           "no work: this is the variation to favour the day after a heavy session.",
   reglage="Set the seat so the handles sit level with your lower chest. The pad should support "
           "your sternum, not your throat.",
   etapes=["Seated, chest against the pad, feet braced, arms reaching forward.",
           "Pull the handles to your ribs, leading with your elbows.",
           "Squeeze your shoulder blades for 1 s at the end of the pull.",
           "Let your arms travel out in 2 s, chest never leaving the pad.",
           "Neutral grip (palms facing) if the machine allows: more comfortable."],
   erreurs=["Peeling your chest off the pad to cheat.",
            "Shrugging during the pull.",
            "Pulling too high, towards your armpits."]),
 "rowing_t": dict(
   nom="T-bar row",
   machine="The barbell with one end wedged in a corner (or in the dedicated landmine holder) and "
           "plates loaded on the other. You straddle it with a V-handle passed under the bar.",
   reglage="Start with a single 10 kg plate: the leverage makes it heavier than it looks. Some gyms "
           "have the dedicated machine, with a chest pad.",
   etapes=["Standing over the bar, knees soft, torso hinged to 45°.",
           "Back flat, V-handle held with both hands under the bar.",
           "Row the bar to your navel, elbows close to your body.",
           "Pause 1 s at the top, shoulder blades squeezed.",
           "Lower under control, without the plates touching down between reps."],
   erreurs=["Rounding your back: end the set immediately.",
            "Standing up on each rep to launch the weight.",
            "Loading so many plates that every rep becomes a half rep."]),
 "pullover_haltere": dict(
   nom="Dumbbell pullover",
   machine="A flat bench and a single dumbbell held in both hands. The free-weight version of the "
           "cable pullover: more stretch, plus a rib-cage expansion nothing else in the programme "
           "provides.",
   reglage="Lie along the bench with your head supported. Moderate dumbbell: this is a stretch "
           "movement, not a strength one. Hold it by the top plate, both hands cupped.",
   etapes=["Lying down, feet on the floor, dumbbell held at arm's length over your chest.",
           "Elbows slightly bent, angle locked.",
           "Lower the dumbbell behind your head in an arc, breathing in deeply.",
           "Go to a comfortable lat stretch, no further.",
           "Bring it back over your chest as you breathe out, arms still straight."],
   erreurs=["Arching your lower back to reach further.",
            "Bending your elbows: it turns into a triceps exercise.",
            "Going too heavy: the shoulder is vulnerable with the arms overhead."]),
}

FICHES_EN.update({
 "developpe_militaire": dict(
   nom="Standing barbell overhead press",
   machine="A straight bar taken from a rack at chest height, standing. Guided alternative: the "
           "Smith machine, or the seated shoulder press machine.",
   reglage="Rack hooks at upper-chest height. Grip slightly wider than your shoulders, bar resting "
           "on your upper chest to start.",
   etapes=["Standing, feet hip-width apart, glutes and abs braced.",
           "Bar on your upper chest, elbows slightly in front.",
           "Press the bar straight up, tucking your head back slightly as it passes your forehead.",
           "Finish with straight arms, bar above the middle of your head.",
           "Lower in 2 s back to your chest."],
   erreurs=["Arching your lower back to compensate: mistake number one.",
            "Pressing the bar forward instead of straight up.",
            "Taking the bar behind your neck."]),
 "developpe_haltere_assis": dict(
   nom="Seated dumbbell shoulder press",
   machine="A bench with the backrest almost vertical (80-90°) and two dumbbells. Safer on the "
           "shoulders than the barbell.",
   reglage="Backrest upright, dumbbells brought up on your thighs then flipped into the shoulder "
           "position. Start lighter than you think.",
   etapes=["Seated, back flat against the pad, feet on the floor, dumbbells at ear height.",
           "Palms forward, elbows slightly ahead of your body's plane.",
           "Press up, bringing the dumbbells together without clacking them.",
           "Lower in 2 s until your elbows pass below your shoulders.",
           "Keep your ribs down: no arching."],
   erreurs=["Flaring your elbows straight out to the sides.",
            "Peeling your back off the pad.",
            "Holding your breath: exhale as you press."]),
 "elevations_laterales": dict(
   nom="Dumbbell lateral raises",
   machine="Two light dumbbells (2 to 6 kg is plenty), standing. There is also a dedicated seated "
           "machine, with pads under your arms.",
   reglage="Much lighter than your instinct says: if you need to heave with your hips, it is too "
           "heavy.",
   etapes=["Standing, dumbbells by your sides, elbows very slightly bent.",
           "Raise your arms out to the sides up to horizontal, no higher.",
           "Picture pouring two jugs: little finger a touch higher than the thumb.",
           "Short pause at the top, then lower in 3 s.",
           "Shoulders stay down, torso stays still."],
   erreurs=["Swinging your torso to launch the dumbbells.",
            "Raising above horizontal (that is trap work).",
            "Letting your arms drop back down in free fall."]),
 "tirage_menton": dict(
   nom="Wide-grip cable upright row",
   machine="A low pulley fitted with a straight bar. Stand facing the machine, 30 cm from the "
           "column.",
   reglage="Wide grip, hands clearly wider than your shoulders: that width is what keeps the "
           "exercise shoulder-friendly.",
   etapes=["Standing, bar in front of your thighs, arms straight.",
           "Pull the bar up leading with your elbows, which stay higher than your hands.",
           "Stop when the bar reaches your upper chest.",
           "Pause 1 s, elbows wide, shoulders down.",
           "Lower in 2 s."],
   erreurs=["Pulling to your chin with a narrow grip: shoulder impingement.",
            "Bouncing with your legs.",
            "Shrugging instead of driving your elbows out."]),
 "oiseau": dict(
   nom="Bent-over dumbbell rear delt raises",
   machine="Two light dumbbells, torso hinged forward. Seated alternative: the pec deck used "
           "backwards (sit facing the pad and open your arms behind you).",
   reglage="Very light: 2 to 5 kg. Small, often-neglected muscle — no need to load it.",
   etapes=["Feet hip-width, knees soft, torso hinged to 45° or more.",
           "Back flat, arms hanging under your shoulders, elbows barely bent.",
           "Open your arms out to the sides up to horizontal, thumbs pointing down.",
           "Squeeze your shoulder blades for 1 s at the end.",
           "Lower slowly, without dropping your arms."],
   erreurs=["Standing up on every rep.",
            "Bending your elbows and turning it into a row.",
            "Going heavy: the rear delt cannot follow."]),
 "face_pull": dict(
   nom="Cable face pull",
   machine="A cable column set at face height (or a little above), with a rope. This is the "
           "shoulder-health exercise: do not skip it.",
   reglage="Pulley at head height, rope held with palms facing each other, one step back to put "
           "the cable under tension.",
   etapes=["Standing, arms reaching towards the pulley, shoulders down.",
           "Pull the rope towards your face while spreading your hands apart.",
           "Your elbows finish high, at shoulder level or above.",
           "Pause 1 s: you should feel the rear delts and mid-back.",
           "Return in 2 s to straight arms."],
   erreurs=["Pulling the rope to your chest (that is a row).",
            "Letting your elbows drop.",
            "A load so heavy it pulls you forward."]),
 "shrugs": dict(
   nom="Dumbbell shrugs",
   machine="Two heavy dumbbells held by your sides, or a barbell. The dumbbell racks go heavy "
           "enough for this one: you can load up.",
   reglage="Arms straight, dumbbells alongside your thighs, firm grip (straps help if your hands "
           "give out before your traps).",
   etapes=["Standing, arms straight, shoulders relaxed and down.",
           "Shrug straight up towards your ears, as high as you can.",
           "Pause 1 s at the top, without bending your arms.",
           "Lower slowly to a full stretch.",
           "Breathe: exhale on the way up."],
   erreurs=["Rolling your shoulders: the movement is strictly vertical.",
            "Bending your elbows to help.",
            "Poking your head forward."]),
 "presse_epaules": dict(
   nom="Shoulder press machine",
   machine="The seated machine where you press two handles upwards, back against an upright pad. "
           "The path is guided, so you can load it without arching — something the standing "
           "overhead press never forgives.",
   reglage="Seat set so the handles start level with your ears, no higher. Back fully against the "
           "pad.",
   etapes=["Seated, back flat, feet on the floor, handles at ear height.",
           "Press straight up until your arms are straight, without locking out.",
           "Lower in 2 s until your elbows pass below your shoulders.",
           "Keep your ribs down: no arching, despite the backrest.",
           "Exhale as you press, inhale on the way down."],
   erreurs=["Going too deep and forcing the shoulder.",
            "Peeling your back off the pad late in the set.",
            "Kicking with your legs to help."]),
 "elevations_poulie": dict(
   nom="One-arm cable lateral raise",
   machine="A low pulley and a single handle, one arm at a time. The cable keeps tension from start "
           "to finish, which dumbbells do not: this is the most effective version of the lateral "
           "raise.",
   reglage="Pulley all the way down. Stand side-on, the machine on the opposite side to the working "
           "arm, and take the handle across your body.",
   etapes=["Standing side-on, handle in the hand furthest from the machine, arm across your thighs.",
           "Elbow very slightly bent, shoulder down.",
           "Raise your arm out to the side up to horizontal, no higher.",
           "Pause 1 s at the top, then lower in 3 s against the cable's pull.",
           "Do all reps on one side, then switch."],
   erreurs=["Leaning away to help the arm up.",
            "Raising above horizontal.",
            "Too heavy: 5 kg is often plenty here."]),
 "elevations_frontales": dict(
   nom="Plate front raises",
   machine="A 5 to 15 kg plate held in both hands (or a dumbbell). Front-delt work, the direct "
           "complement to pressing.",
   reglage="Start with a 5 kg plate. Standing, feet hip-width, plate held at 3 and 9 o'clock, arms "
           "straight in front of your thighs.",
   etapes=["Standing, core braced, plate in front of your thighs, arms straight.",
           "Raise the plate in front of you to eye height, arms straight.",
           "No momentum: your torso stays strictly still.",
           "Pause 1 s at the top, then lower in 3 s.",
           "End the set as soon as you need to heave with your hips."],
   erreurs=["Leaning back to get the plate up.",
            "Raising far above eye level.",
            "Bending your elbows to shorten the lever."]),
 "oiseau_poulie": dict(
   nom="Crossed-cable rear delt fly",
   machine="The crossover station with both pulleys at shoulder height. You take the right handle "
           "with your left hand and vice versa, so the cables cross in front of you. Constant "
           "tension on the rear delt, impossible to cheat.",
   reglage="Both pulleys at shoulder height, light load on each side. Stand in the middle, one foot "
           "slightly forward.",
   etapes=["Arms crossed in front of you, each hand holding the opposite handle.",
           "Arms almost straight, elbows barely bent, shoulders down.",
           "Open your arms out to the sides in a wide arc, up to horizontal.",
           "Squeeze your shoulder blades for 1 s at full opening.",
           "Return in 3 s, holding the weight back, without your shoulders rolling forward."],
   erreurs=["Bending your elbows: the movement becomes a row.",
            "Opening past the line of your shoulders.",
            "A load so heavy your torso tips forward."]),
 "shrugs_barre": dict(
   nom="Barbell shrugs",
   machine="A loaded straight bar held in front of your thighs. Compared with dumbbells, the bar "
           "lets you go heavier, but the range is slightly shorter.",
   reglage="Overhand grip, hands shoulder-width apart. Lifting straps help if your grip fails "
           "before your traps.",
   etapes=["Standing, bar in front of your thighs, arms straight, shoulders relaxed down.",
           "Shrug straight up towards your ears, as high as possible.",
           "Pause 1 s at the top without bending your arms.",
           "Lower slowly to a full trap stretch.",
           "Exhale on the way up."],
   erreurs=["Rolling your shoulders: the movement is strictly vertical.",
            "Bending your elbows to help.",
            "Letting your head drop forward under the load."]),
 "dragon_flag": dict(
   nom="Dragon flag (negative)",
   machine="A flat bench, gripped behind your head. The hardest ab exercise in the programme: the "
           "whole body stays a rigid plank and only your abs stop your hips from dropping.",
   reglage="Nothing to adjust, but position yourself so you can grip the bench firmly with both "
           "hands, just above your shoulders. Use a mat if the bench is hard.",
   etapes=["Lying on your back, hands gripping the bench edge behind your head.",
           "Lift your hips and raise your legs until your body is almost vertical, resting on your "
           "upper back — not your neck.",
           "Squeeze your glutes and abs: your body is one straight, braced line.",
           "Lower that line as slowly as you can, over 4 to 5 seconds.",
           "Stop the descent the moment your lower back lifts, then bend your knees to reset.",
           "Too hard? Do the same descent with your knees tucked, then half-extended, before "
           "moving to straight legs."],
   erreurs=["Letting your lower back arch: it takes the load instead of your abs.",
            "Resting on your neck instead of your upper back.",
            "Dropping in free fall: the whole value is in the slowness."]),
 "crunch_decline": dict(
   nom="Weighted decline crunch",
   machine="The decline ab bench, with two rollers at the top for your feet (head down). Add a 5 to "
           "15 kg plate held on your chest: that is what turns this into a real strength movement, "
           "with progressive load.",
   reglage="Set 20 to 30° of decline to start. Hook your feet under the rollers, knees bent. Take "
           "the plate once you are settled, crossed over your chest.",
   etapes=["Lying head down, plate hugged to your chest, chin slightly tucked.",
           "Curl your torso towards your thighs, peeling your shoulder blades up first.",
           "Come up to about 30° above the bench: no need to reach your knees.",
           "Exhale fully at the top, pause 1 s.",
           "Lower in 3 s without letting your head fall back.",
           "When 12 reps go up cleanly, add 2.5 kg."],
   erreurs=["Yanking on your neck with your hands to get started.",
            "Sitting all the way up using your hip flexors.",
            "Taking too heavy a plate and cutting the range short."]),
 "v_ups": dict(
   nom="V-ups",
   machine="A mat. The body starts fully extended and folds into a V: upper and lower abs work "
           "together, which makes this an excellent way to end the block once loading is no longer "
           "manageable.",
   reglage="Nothing to adjust. Easier version: bend your knees and touch your shins (tuck-ups). "
           "Harder: hold a light dumbbell at arm's length.",
   etapes=["Lying on your back, arms extended behind your head, legs straight on the floor.",
           "Lift your torso and legs at the same time, folding at the hips.",
           "Reach for your feet with your hands, body in a V, balanced on your seat.",
           "Exhale on the way up, brief pause at the top.",
           "Lower in 3 s without letting your heels or shoulders touch the floor.",
           "Link the reps with no rest on the floor: tension stays on for the whole set."],
   erreurs=["Swinging your arms for momentum.",
            "Letting your lower back lift at the bottom: shorten the range.",
            "Bending your knees without meaning to late in the set: stop there."]),
 "releves_jambes": dict(
   nom="Hanging leg raises",
   machine="A pull-up bar, or the captain's chair (the upright frame with two arm pads and a back "
           "rest), which is far easier to hold.",
   reglage="On the captain's chair: forearms on the pads, back against the rest. Hanging from the "
           "bar: shoulder-width grip, body still.",
   etapes=["Start with your body still, legs under your hips, no swinging.",
           "Curl your pelvis up as you raise your knees or straight legs.",
           "Come up at least to horizontal, exhaling.",
           "Lower in 3 s, without dropping your legs.",
           "Easier version: knees bent."],
   erreurs=["Swinging: every rep starts from a dead stop.",
            "Only lifting from the hip, without curling the pelvis.",
            "Dropping your legs at the end of the set."]),
 "crunch_poulie": dict(
   nom="Kneeling cable crunch",
   machine="A high pulley with a rope. Kneel in front of the machine, facing it or with your back "
           "to the column depending on space.",
   reglage="Pulley at the top, rope held on either side of your face, hands by your temples.",
   etapes=["Kneeling, hips fixed, rope held close to your face.",
           "Curl your torso towards the floor, deliberately rounding your upper back.",
           "The movement comes from the abs, not the arms or the hips.",
           "Exhale fully at the bottom, pause 1 s.",
           "Come back up in 2 s without releasing the tension."],
   erreurs=["Pulling with your arms: your hands never move relative to your head.",
            "Rocking your hips backwards.",
            "A load so heavy the curl cannot happen."]),
 "crunch_inverse": dict(
   nom="Reverse crunch",
   machine="A mat, and optionally a flat bench whose edge you grip to stay stable.",
   reglage="Nothing to set. Hands flat alongside your body, or gripping a fixed support behind your "
           "head.",
   etapes=["Lying on your back, knees bent to 90°, thighs vertical.",
           "Lift your hips off the floor by drawing your knees towards your chest.",
           "The range is short: the lower abs curl the pelvis.",
           "Pause 1 s at the top, then lower in 3 s.",
           "Your lower back stays in contact with the floor on the way back."],
   erreurs=["Swinging your legs for momentum.",
            "Pushing off the floor with your hands.",
            "Letting your lower back lift at the bottom."]),
 "russian_twist": dict(
   nom="Russian twist",
   machine="A 5 to 10 kg plate, a dumbbell or a medicine ball, seated on a mat.",
   reglage="Start with no weight to find the position. Feet on the floor (easier) or lifted "
           "(harder).",
   etapes=["Seated, torso leaning back to 45°, back straight.",
           "Plate held in both hands in front of your sternum.",
           "Rotate your torso to one side, bringing the plate beside your hip.",
           "Come back to centre, then rotate to the other side: that is 2 reps.",
           "Your eyes follow the plate; your hips stay still."],
   erreurs=["Moving only your arms without rotating your torso.",
            "Rounding your back.",
            "Going fast: the rotation must be controlled."]),
 "woodchopper": dict(
   nom="Cable woodchopper",
   machine="A cable column set high, with a rope or a single handle. Stand side-on to the machine.",
   reglage="High pulley, one big step sideways to put the cable under tension. Moderate load.",
   etapes=["Standing side-on, feet shoulder-width, handle held in both hands up high.",
           "Pull diagonally down towards the opposite hip, like an axe swing.",
           "Arms almost straight: the rotation comes from the trunk, not the arms.",
           "Your back foot pivots slightly, your hips follow.",
           "Return under control, then switch sides."],
   erreurs=["Pulling with your arms only.",
            "Rounding your back at the end of the rotation.",
            "A load so heavy it unbalances you."]),
 "ab_wheel": dict(
   nom="Ab wheel rollout",
   machine="The small wheel with two handles, in the accessory bin. Hard exercise: keep it for the "
           "end, and swap in a moving plank if your back complains.",
   reglage="Kneeling on a mat (fold a towel under your knees). Wheel under your shoulders.",
   etapes=["Kneeling, hands on the handles, arms straight, back slightly rounded.",
           "Draw your navel in and squeeze your glutes before you start.",
           "Roll the wheel forward keeping your pelvis tucked.",
           "Go only as far as you can hold your back flat.",
           "Pull yourself back with your abs, not your arms."],
   erreurs=["Going too far: the lower back hollows out and takes the load.",
            "Lifting your hips on the way back.",
            "Doing it in deep fatigue, with control gone."]),
 "planche": dict(
   nom="Front plank",
   machine="Just a mat. Elbows under your shoulders, forearms flat.",
   reglage="No equipment. Too hard? Put your knees down, keeping the shoulder-hip-knee line "
           "straight.",
   etapes=["Elbows straight under your shoulders, forearms parallel.",
           "Feet hip-width apart, body in a straight line.",
           "Tuck your pelvis slightly (as if drawing your navel in).",
           "Squeeze glutes and abs, breathe normally.",
           "Hold 45 s, two sets, at the very end of the session.",
           "Straight-arm version (session D): hands under your shoulders, elbows unlocked."],
   erreurs=["Hips too high (a rest position) or too low (back pain).",
            "Holding your breath.",
            "Looking ahead: your neck stays in line with your back."]),
 "planche_laterale": dict(
   nom="Side plank",
   machine="A mat. You are on your side, propped on one forearm.",
   reglage="Elbow under your shoulder, feet stacked (or staggered for more stability).",
   etapes=["Lying on your side, elbow straight under your shoulder.",
           "Lift your hips: shoulder, hip and ankle form one line.",
           "Free arm pointing at the ceiling or resting on your hip.",
           "Hold 30 s, then switch sides; two sets each side.",
           "Easier version: knees bent on the floor."],
   erreurs=["Hips sinking back towards the floor.",
            "Tipping your torso forward or backward.",
            "Letting your head drop towards your shoulder."]),
 "hollow": dict(
   nom="Hollow body hold",
   machine="A mat. Bodyweight exercise, very effective on deep core strength.",
   reglage="Nothing to set. The key point: your lower back stays glued to the floor (green marker "
           "on the diagram).",
   etapes=["Lying on your back, press your lower back into the floor by drawing your navel in.",
           "Lift your shoulders and head a few centimetres.",
           "Straighten your legs and lift them 20-30 cm off the floor.",
           "Arms extended behind you, or alongside your body (easier).",
           "Hold 30 s keeping your lower back pinned, two sets."],
   erreurs=["Letting your lower back lift: raise your legs higher instead.",
            "Pulling on your neck with your hands.",
            "Holding your breath."]),
})


# --- fiches en espagnol -----------------------------------------------------
FICHES_ES = {
 "developpe_couche": dict(
   nom="Press de banca con barra",
   machine="Un banco plano colocado bajo un rack de barra (dos ganchos a la altura de los hombros). "
           "Si la barra libre te intimida, usa la máquina Smith: la barra se desliza sobre dos "
           "raíles y no puede desviarse.",
   reglage="Barra en los ganchos, a la vertical de tus ojos una vez tumbado. Discos idénticos a "
           "ambos lados y cierres siempre. Empieza con la barra vacía para encontrar el agarre.",
   etapes=["Túmbate con los ojos bajo la barra, pies bien apoyados en el suelo.",
           "Tres puntos de contacto: cabeza, parte alta de la espalda y glúteos — no se mueven.",
           "Agarre algo más ancho que los hombros, muñecas alineadas con los antebrazos.",
           "Saca la barra y llévala a la vertical del pecho, brazos estirados.",
           "Baja en 2 s hasta rozar la parte baja del pectoral, codos a 45° del torso.",
           "Empuja hacia arriba sin bloquear los codos de golpe."],
   erreurs=["Rebotar la barra en el pecho.",
            "Despegar los glúteos del banco para ayudarte.",
            "Codos abiertos a 90°: muy agresivo para el hombro."]),
 "developpe_incline": dict(
   nom="Press inclinado con mancuernas",
   machine="Un banco con respaldo regulable, en la zona de mancuernas. Ajústalo a 30° (primera o "
           "segunda muesca): por encima de 45° trabajan los hombros, no el pecho.",
   reglage="Dos mancuernas iguales. Siéntate con ellas sobre los muslos y échate hacia atrás "
           "impulsándolas con las rodillas: es la forma segura de colocarlas.",
   etapes=["Espalda totalmente apoyada en el respaldo, pies en el suelo.",
           "Mancuernas a la altura de los hombros, palmas hacia delante, codos bajo las muñecas.",
           "Empuja hacia arriba y ligeramente hacia dentro, sin chocar las mancuernas.",
           "Baja en 2 s hasta que los codos lleguen a la altura de los hombros.",
           "Para terminar: lleva las mancuernas a los muslos y luego incorpórate."],
   erreurs=["Bajar demasiado buscando el estiramiento máximo.",
            "Arquear la zona lumbar para levantar más peso.",
            "Dejar que las mancuernas se vayan hacia atrás, sobre la cara."]),
 "ecarte_poulie": dict(
   nom="Cruce de poleas altas",
   machine="La jaula de poleas con una columna a cada lado. Engancha un asa simple en cada polea, "
           "ambas en posición alta.",
   reglage="La misma carga en las dos columnas: el pin entra hasta el fondo de la placa. Colócate "
           "en el centro, un pie algo adelantado para el equilibrio.",
   etapes=["Un asa en cada mano, torso muy ligeramente inclinado hacia delante.",
           "Brazos casi estirados, codos apenas desbloqueados — ese ángulo no cambia.",
           "Junta las manos delante de la parte baja del pecho, describiendo un arco.",
           "Mantén la contracción 1 s, pecho sacado.",
           "Deja que los brazos vuelvan atrás controlando, sin forzar el estiramiento."],
   erreurs=["Doblar y estirar los codos: se convierte en un ejercicio de tríceps.",
            "Una carga tan pesada que te arrastra hacia atrás.",
            "Subir los hombros hacia las orejas."]),
 "pec_deck": dict(
   nom="Contractor de pecho (pec deck)",
   machine="La máquina sentada con dos brazos verticales y almohadillas (o asas) que se juntan "
           "delante. Es la alternativa más sencilla al cruce de poleas.",
   reglage="Regula la altura del asiento para que los codos (o las asas) queden a la altura de los "
           "hombros. Pin en la placa, espalda pegada al respaldo.",
   etapes=["Sentado, espalda y hombros en contacto con el respaldo, pies en el suelo.",
           "Antebrazos o manos contra las almohadillas, codos a la altura de los hombros.",
           "Junta los dos brazos delante del pecho.",
           "Pausa de 1 s en posición cerrada y vuelve en 2 s.",
           "No dejes que las placas golpeen el tope entre repeticiones."],
   erreurs=["Despegar la espalda del respaldo para empujar.",
            "Abrir demasiado hacia atrás (estiramiento forzado del hombro).",
            "Ir deprisa: el interés de esta máquina es el control."]),
 "dips": dict(
   nom="Fondos en paralelas",
   machine="Las dos barras paralelas a la altura de la cadera, a menudo en la misma estructura que "
           "la barra de dominadas. Si hay máquina de fondos asistidos, una almohadilla sube tus "
           "rodillas y aligera el movimiento: cuanto más pesada la placa, más fácil.",
   reglage="En la máquina asistida, empieza con bastante asistencia. Si no, sustitúyelo por "
           "flexiones, con los pies elevados si hace falta.",
   etapes=["Manos en las barras, brazos estirados, cuerpo suspendido, piernas flexionadas atrás.",
           "Inclina el torso unos 20° hacia delante: eso es lo que enfoca el pectoral.",
           "Baja doblando los codos hasta que los hombros lleguen a su altura.",
           "Sube empujando, sin bloquear de golpe.",
           "Mantén los hombros bajos, lejos de las orejas, todo el movimiento."],
   erreurs=["Bajar demasiado: dolor en la parte anterior del hombro.",
            "Balancearse para coger impulso.",
            "Quedarse totalmente vertical: el trabajo se va al tríceps."]),
 "ecarte_incline": dict(
   nom="Aperturas inclinadas con mancuernas",
   machine="El mismo banco a 30° del press inclinado, con dos mancuernas ligeras. El esquema está "
           "visto desde arriba: estás tumbado boca arriba y los brazos se abren a los lados.",
   reglage="Mucho más ligero que en el press: es un ejercicio de estiramiento, no de fuerza. "
           "Mancuernas sobre los muslos y luego túmbate.",
   etapes=["Brazos estirados sobre el pecho, palmas enfrentadas.",
           "Codos muy ligeramente flexionados — ángulo fijo durante toda la serie.",
           "Abre los brazos a los lados, en arco, hasta la altura de los hombros.",
           "Cierra apretando el pectoral, como si abrazaras un tronco.",
           "Termina la serie dejando las mancuernas sobre los muslos."],
   erreurs=["Bajar los brazos por debajo de la línea de los hombros.",
            "Convertirlo en un press (codos que se doblan).",
            "Cargar demasiado: es el ejercicio de remate de la sesión."]),
 "developpe_couche_halteres": dict(
   nom="Press de banca con mancuernas",
   machine="El mismo banco plano, pero con dos mancuernas en lugar de la barra. Cada brazo trabaja "
           "solo: el lado débil ya no puede esconderse, y el recorrido abajo es mayor.",
   reglage="Coge mancuernas un 30-40 % más ligeras que tu barra habitual. Siéntate al final del "
           "banco, mancuernas sobre los muslos, y échate hacia atrás impulsándolas con las rodillas.",
   etapes=["Tumbado, pies en el suelo, mancuernas a la altura del pecho, palmas hacia delante.",
           "Codos a 45° del torso, muñecas alineadas con los antebrazos.",
           "Empuja juntando ligeramente las mancuernas, sin chocarlas.",
           "Baja en 2 s hasta que los codos pasen por debajo de los hombros.",
           "Mantén las escápulas juntas y la espalda alta pegada al banco.",
           "Para terminar: mancuernas sobre los muslos y luego incorpórate."],
   erreurs=["Bajar demasiado buscando estiramiento: lo paga el hombro.",
            "Dejar que las mancuernas se abran al final de la serie.",
            "Soltarlas de lado: déjalas siempre sobre los muslos."]),
 "developpe_decline": dict(
   nom="Press declinado con barra",
   machine="El banco declinado (cabeza abajo) con sus rodillos para los muslos, bajo un rack. Si tu "
           "gimnasio no lo tiene, la máquina de press declinado convergente hace el mismo trabajo y "
           "es más fácil de colocar.",
   reglage="Declinación de 15 a 30°, no más. Encaja los muslos bajo los rodillos antes de tumbarte. "
           "Pide ayuda para sacar la barra las primeras veces: la posición invertida desorienta.",
   etapes=["Tumbado cabeza abajo, muslos bloqueados, barra a la vertical de los ojos.",
           "Agarre algo más ancho que los hombros, barra fuera del rack con brazos estirados.",
           "Baja hacia la parte baja del pectoral, por debajo de la línea de los pezones.",
           "Codos a 45°, bajada en 2 s hasta rozar el pecho.",
           "Empuja en vertical, sin bloquear los codos de golpe.",
           "Deja la barra en los ganchos antes de incorporarte, nunca al revés."],
   erreurs=["Quedarte mucho rato cabeza abajo entre series: incorpórate para recuperar.",
            "Bajar la barra demasiado alto, hacia el cuello.",
            "Declinar el banco a 45°: inútil y desagradable."]),
 "presse_pectoraux": dict(
   nom="Máquina de press de pecho",
   machine="La máquina sentada en la que empujas dos asas hacia delante, con la espalda apoyada. Es "
           "el ejercicio más seguro del grupo: no hay nada que estabilizar, así que puedes empujar "
           "fuerte al final de la sesión sin compañero.",
   reglage="Ajusta la altura del asiento para que las asas queden a la altura media del pecho, no "
           "de los hombros. Pin en la placa.",
   etapes=["Sentado, espalda y hombros en contacto con el respaldo, pies bien apoyados.",
           "Asas a la altura del pecho, codos algo por debajo de las manos.",
           "Empuja hacia delante hasta estirar los brazos sin bloquear.",
           "Vuelve en 2 s hasta que las manos regresen a la altura del pecho.",
           "No dejes que las placas golpeen el tope entre repeticiones."],
   erreurs=["Despegar la espalda del respaldo para empujar más peso.",
            "Dejar que los codos suban a la altura de los hombros.",
            "Recortar el recorrido: las manos deben volver hasta el torso."]),
 "ecarte_poulie_basse": dict(
   nom="Cruce de poleas bajas (de abajo arriba)",
   machine="La misma jaula de poleas, pero con las dos poleas abajo. El movimiento sube en lugar de "
           "bajar: enfoca la parte alta del pectoral, la zona menos trabajada por el resto del "
           "programa.",
   reglage="Asas simples en las dos poleas bajas, misma carga a cada lado. Colócate en el centro, "
           "un pie algo adelantado, torso recto.",
   etapes=["Un asa en cada mano, brazos a lo largo del cuerpo, palmas hacia delante.",
           "Codos muy ligeramente flexionados, ángulo fijo durante toda la serie.",
           "Sube las manos juntándolas hasta la altura de los hombros, en arco.",
           "Aprieta el pectoral 1 s arriba, manos casi juntas delante del esternón.",
           "Baja en 3 s controlando, sin dejar que los brazos se vayan hacia atrás."],
   erreurs=["Subir las manos por encima de los hombros: se convierte en una elevación frontal.",
            "Inclinarte hacia atrás para lanzar la carga.",
            "Doblar los codos por el camino."]),
 "pompes": dict(
   nom="Flexiones con lastre",
   machine="Una esterilla y un disco de 5 a 20 kg apoyado en la parte alta de la espalda (pide que "
           "te lo coloquen, o usa un chaleco lastrado). Remate de sesión: se busca el fallo con "
           "buena técnica.",
   reglage="Manos algo más anchas que los hombros, justo debajo de ellos. Sin lastre mientras no "
           "hagas 15 flexiones estrictas.",
   etapes=["Cuerpo en línea recta de los talones a la cabeza, glúteos y abdomen apretados.",
           "Codos a 45° del torso, no en cruz.",
           "Baja hasta que el pecho roce el suelo, en 2 s.",
           "Empuja sin hundir la zona lumbar ni levantar el glúteo.",
           "Serie hasta 2 repeticiones antes del fallo, no hasta perder la técnica.",
           "¿Demasiado duro? Manos en un banco. ¿Fácil? Pies elevados y luego lastre."],
   erreurs=["Cadera hundida o glúteo en alto.",
            "Recorrido parcial: el pecho debe bajar a la altura de los codos.",
            "Adelantar la cabeza en cada repetición."]),
 "tractions": dict(
   nom="Dominadas",
   machine="Una barra fija, o la máquina de dominadas asistidas (apoyas rodillas o pies en una "
           "plataforma con contrapeso que te empuja hacia arriba).",
   reglage="En la máquina asistida, cuanta más carga selecciones, más ayuda recibes. Busca una "
           "asistencia que te permita 8-10 repeticiones limpias y redúcela cada semana.",
   etapes=["Agarre prono (palmas hacia delante), manos algo más anchas que los hombros.",
           "Parte con los brazos estirados, hombros bajos, abdomen apretado, piernas cruzadas.",
           "Empieza bajando las escápulas y luego tira de los codos hacia abajo y atrás.",
           "Sube hasta que la barbilla pase la barra (o lo más alto posible).",
           "Baja en 2 s hasta brazos estirados, sin dejarte caer."],
   erreurs=["Balancear las piernas para ayudarte.",
            "Bajar solo hasta la mitad.",
            "Hundir la cabeza entre los hombros al final."]),
 "tirage_vertical": dict(
   nom="Jalón al pecho",
   machine="La máquina sentada con una barra larga colgada de una polea alta y un rodillo "
           "regulable que bloquea los muslos. Es el sustituto de las dominadas.",
   reglage="Ajusta el rodillo para que te sujete sin aplastarte. Coge la barra de pie y luego "
           "siéntate. Agarre ancho prono, o neutro (asa en V) en la sesión D.",
   etapes=["Sentado, muslos bloqueados, torso inclinado unos 15° hacia atrás.",
           "Pecho sacado, hombros bajos, mirada al frente.",
           "Tira de la barra hacia la parte alta del pecho, guiando con los codos.",
           "Junta las escápulas al final, pausa de 1 s.",
           "Deja subir la barra en 2 s hasta estirar los brazos."],
   erreurs=["Llevar la barra detrás de la nuca: inútil y arriesgado para el hombro.",
            "Inclinarte mucho hacia atrás para arrancar la carga.",
            "Tirar con los brazos olvidando bajar las escápulas."]),
 "rowing_barre": dict(
   nom="Remo con barra inclinado",
   machine="Una barra recta cargada, cogida del suelo en la zona de peso libre. Variante más suave "
           "para la espalda: la barra hexagonal o la máquina de remo sentado (ficha siguiente).",
   reglage="Carga moderada mientras la posición no esté asimilada. Pies a la anchura de la cadera, "
           "barra sobre la mitad del pie.",
   etapes=["Flexiona ligeramente las rodillas e inclina el torso unos 45°.",
           "Espalda completamente plana, pecho sacado, mirada 2 m por delante en el suelo.",
           "Brazos estirados, barra colgando bajo los hombros, agarre prono.",
           "Tira de la barra hacia el ombligo con los codos cerca del cuerpo.",
           "Baja controlando sin redondear la espalda; el torso no se levanta."],
   erreurs=["Redondear la zona lumbar: corta la serie de inmediato.",
            "Incorporarte en cada repetición para lanzar la barra.",
            "Tirar hacia el pecho en lugar del ombligo."]),
 "tirage_horizontal": dict(
   nom="Remo sentado en polea baja",
   machine="La estación sentada con reposapiés y polea baja: tiras de un asa en V (o una barra "
           "corta) hacia el abdomen. Es también el «remo en polea baja» de la sesión D.",
   reglage="Pies apoyados en la plataforma, rodillas algo flexionadas (nunca bloqueadas). Coge el "
           "asa manteniendo la espalda plana y luego incorpórate.",
   etapes=["Sentado, torso vertical, brazos estirados hacia delante, espalda plana.",
           "Tira del asa hacia el ombligo, codos pegados al cuerpo.",
           "Junta las escápulas al final, pecho hacia delante.",
           "Deja que los brazos vuelvan en 2 s, con el torso siempre vertical.",
           "En la última repetición, acompaña el asa hasta su soporte."],
   erreurs=["Balancear el torso adelante y atrás como un remero.",
            "Redondear la espalda cuando los brazos van hacia delante.",
            "Encoger los hombros durante el tirón."]),
 "rowing_haltere": dict(
   nom="Remo a una mano con mancuerna",
   machine="Un banco plano y una mancuerna. Apoyas una mano (o una rodilla) en el banco y remas con "
           "el otro lado.",
   reglage="Mancuerna en el suelo junto al banco, del lado que trabaja. Apoya mano y pierna "
           "contrarias para una espalda estable.",
   etapes=["Mano izquierda en el banco, torso casi horizontal, espalda plana.",
           "Mancuerna en la mano derecha, brazo estirado hacia el suelo.",
           "Tira de la mancuerna hacia la cadera con el codo cerca del cuerpo.",
           "Pausa de 1 s arriba, sin girar los hombros.",
           "Baja en 2 s con el brazo estirado y cambia de lado."],
   erreurs=["Girar el torso para subir más alto.",
            "Tirar en arco hacia fuera.",
            "Dejar que la espalda se redondee entre repeticiones."]),
 "pullover_poulie": dict(
   nom="Pullover en polea alta con brazos estirados",
   machine="Columna de polea en posición alta, con una barra recta corta o una cuerda. De pie "
           "frente a la máquina, a un buen paso de distancia.",
   reglage="Carga ligera al principio: el brazo de palanca es largo. Barra cogida en pronación, a "
           "la anchura de los hombros.",
   etapes=["De pie, pies desalineados, torso algo inclinado, abdomen apretado.",
           "Brazos estirados hacia la polea, codos apenas desbloqueados.",
           "Baja la barra en arco hasta los muslos, con los brazos siempre estirados.",
           "Aprieta los dorsales 1 s abajo.",
           "Deja subir la barra controlando, sin que los hombros se vayan hacia delante."],
   erreurs=["Doblar los codos (se convierte en una extensión de tríceps).",
            "Usar el torso como balancín.",
            "Cargar demasiado: el ejercicio pierde todo su sentido."]),
 "extensions_lombaires": dict(
   nom="Extensiones lumbares en banco a 45°",
   machine="El banco inclinado a 45° con una almohadilla grande para la cadera y dos rodillos para "
           "los tobillos. Algunos gimnasios tienen la versión horizontal: mismo principio.",
   reglage="Ajusta la altura de la almohadilla: su borde superior debe quedar justo bajo la cadera, "
           "para que la pelvis pueda bascular libremente.",
   etapes=["Tobillos encajados, cadera sobre la almohadilla, brazos cruzados en el pecho.",
           "Baja el torso manteniendo la espalda recta, hasta unos 70°.",
           "Sube contrayendo glúteos y zona lumbar.",
           "Detente cuando el cuerpo forme una línea recta: no más.",
           "Movimiento lento, sin tirones, 2 s en cada sentido."],
   erreurs=["Subir en hiperextensión, con la espalda arqueada.",
            "Coger impulso balanceando el torso.",
            "Añadir peso demasiado pronto: empieza con el peso del cuerpo."]),
 "tractions_supination": dict(
   nom="Dominadas en supinación",
   machine="La misma barra fija (o la máquina asistida), pero con las palmas hacia ti y las manos a "
           "la anchura de los hombros. Este agarre implica más al bíceps: subirás más alto y más "
           "veces que en pronación.",
   reglage="En la máquina asistida, reduce la asistencia 5 kg respecto a tu agarre prono habitual: "
           "esta variante es más fácil.",
   etapes=["Agarre supino (palmas hacia ti), manos a la anchura de los hombros.",
           "Parte con los brazos estirados, hombros bajos, abdomen apretado, piernas cruzadas.",
           "Baja primero las escápulas y luego tira de los codos hacia abajo y atrás.",
           "Sube hasta acercar el pecho a la barra.",
           "Baja en 2 s hasta brazos estirados, sin perder la tensión."],
   erreurs=["Balancearte para coger impulso.",
            "Tirar solo con los brazos y olvidar la espalda.",
            "Saltarte el final de la bajada."]),
 "rowing_machine": dict(
   nom="Máquina de remo con apoyo pectoral",
   machine="La máquina de remo sentado con almohadilla para el pecho. Al estar el torso apoyado, la "
           "zona lumbar no trabaja: es la variante ideal al día siguiente de una sesión pesada.",
   reglage="Ajusta la altura del asiento para que las asas queden a la altura de la parte baja del "
           "pecho. La almohadilla debe sostener el esternón, no la garganta.",
   etapes=["Sentado, pecho contra la almohadilla, pies apoyados, brazos estirados hacia delante.",
           "Tira de las asas hacia las costillas guiando con los codos.",
           "Junta las escápulas 1 s al final del tirón.",
           "Deja que los brazos vuelvan en 2 s, sin despegar el pecho de la almohadilla.",
           "Agarre neutro (palmas enfrentadas) si la máquina lo permite: más cómodo."],
   erreurs=["Despegar el pecho de la almohadilla para hacer trampa.",
            "Encoger los hombros durante el tirón.",
            "Tirar demasiado alto, hacia las axilas."]),
 "rowing_t": dict(
   nom="Remo en barra T",
   machine="La barra con un extremo bloqueado en una esquina del suelo (o en el soporte "
           "correspondiente) y cargada con discos en el otro. Te colocas a horcajadas con un asa en "
           "V pasada bajo la barra.",
   reglage="Empieza con un solo disco de 10 kg: la palanca lo hace más pesado de lo que parece. "
           "Algunos gimnasios tienen la máquina específica, con apoyo para el pecho.",
   etapes=["De pie a horcajadas sobre la barra, rodillas flexionadas, torso inclinado 45°.",
           "Espalda plana, asa en V cogida con las dos manos bajo la barra.",
           "Tira de la barra hacia el ombligo, codos cerca del cuerpo.",
           "Pausa de 1 s arriba, escápulas juntas.",
           "Baja controlando, sin que los discos toquen el suelo entre repeticiones."],
   erreurs=["Redondear la espalda: corta la serie de inmediato.",
            "Incorporarte en cada repetición para lanzar la carga.",
            "Cargar tantos discos que solo hagas medias repeticiones."]),
 "pullover_haltere": dict(
   nom="Pullover con mancuerna",
   machine="Un banco plano y una sola mancuerna cogida con las dos manos. Versión libre del "
           "pullover en polea: más estiramiento y un trabajo de la caja torácica que ningún otro "
           "ejercicio del programa aporta.",
   reglage="Túmbate en el eje del banco, con la cabeza apoyada. Mancuerna moderada: es un "
           "movimiento de estiramiento, no de fuerza. Sujétala por el disco superior, con ambas manos.",
   etapes=["Tumbado, pies en el suelo, mancuerna con los brazos estirados sobre el pecho.",
           "Codos ligeramente flexionados, ángulo fijo.",
           "Baja la mancuerna por detrás de la cabeza en arco, inspirando a fondo.",
           "Llega hasta un estiramiento cómodo de los dorsales, no más.",
           "Devuélvela sobre el pecho soltando el aire, sin doblar los brazos."],
   erreurs=["Arquear la zona lumbar para bajar más.",
            "Doblar los codos: pasa a ser trabajo de tríceps.",
            "Cargar demasiado: el hombro está vulnerable con los brazos por encima de la cabeza."]),
}

FICHES_ES.update({
 "developpe_militaire": dict(
   nom="Press militar con barra",
   machine="Una barra recta cogida de un rack a la altura del pecho, de pie. Alternativa guiada: la "
           "máquina Smith o la máquina de press de hombros sentado.",
   reglage="Ganchos del rack a la altura de la parte alta del pecho. Agarre algo más ancho que los "
           "hombros, barra apoyada en el pecho al inicio.",
   etapes=["De pie, pies a la anchura de la cadera, glúteos y abdomen apretados.",
           "Barra en la parte alta del pecho, codos ligeramente adelantados.",
           "Empuja la barra en vertical metiendo un poco la cabeza cuando pase la frente.",
           "Termina con los brazos estirados, barra sobre el centro de la cabeza.",
           "Baja en 2 s hasta el pecho."],
   erreurs=["Arquear la zona lumbar para compensar: es el error número uno.",
            "Empujar la barra hacia delante en lugar de en vertical.",
            "Pasar la barra por detrás de la nuca."]),
 "developpe_haltere_assis": dict(
   nom="Press de hombros sentado con mancuernas",
   machine="Banco con el respaldo casi vertical (80-90°) y dos mancuernas. Versión más segura que "
           "la barra para el hombro.",
   reglage="Respaldo bien vertical, mancuernas subidas sobre los muslos y luego llevadas a la "
           "posición de hombros. Empieza más ligero de lo que imaginas.",
   etapes=["Sentado, espalda pegada al respaldo, pies en el suelo, mancuernas a la altura de las orejas.",
           "Palmas hacia delante, codos algo por delante del plano del cuerpo.",
           "Empuja hacia arriba juntando las mancuernas sin chocarlas.",
           "Baja en 2 s hasta que los codos pasen por debajo de los hombros.",
           "Mantén las costillas bajas: nada de arquear."],
   erreurs=["Abrir los codos completamente hacia los lados.",
            "Despegar la espalda del respaldo.",
            "Bloquear la respiración: suelta el aire al empujar."]),
 "elevations_laterales": dict(
   nom="Elevaciones laterales con mancuernas",
   machine="Dos mancuernas ligeras (2 a 6 kg bastan de sobra), de pie. También existe una máquina "
           "sentada específica, con almohadillas bajo los brazos.",
   reglage="Mucho más ligero de lo que te pide la intuición: si necesitas dar un impulso de cadera, "
           "pesa demasiado.",
   etapes=["De pie, mancuernas a los lados, codos muy ligeramente flexionados.",
           "Sube los brazos por los lados hasta la horizontal, no más.",
           "Imagina que viertes dos jarras: meñique algo más alto que el pulgar.",
           "Pausa corta arriba y baja en 3 s.",
           "Los hombros se quedan bajos, el torso inmóvil."],
   erreurs=["Balancear el torso para lanzar las mancuernas.",
            "Subir por encima de la horizontal (trabajo de trapecios).",
            "Dejar caer los brazos sin control."]),
 "tirage_menton": dict(
   nom="Remo al mentón en polea, agarre ancho",
   machine="Polea baja con una barra recta. De pie, frente a la máquina, a 30 cm de la columna.",
   reglage="Agarre ancho, manos claramente más separadas que los hombros: esa anchura es lo que "
           "hace el ejercicio seguro para el hombro.",
   etapes=["De pie, barra delante de los muslos, brazos estirados.",
           "Tira de la barra hacia arriba guiando con los codos, que quedan más altos que las manos.",
           "Detente cuando la barra llegue a la parte alta del pectoral.",
           "Pausa de 1 s, codos anchos, hombros bajos.",
           "Baja en 2 s."],
   erreurs=["Subir la barra hasta el mentón con agarre estrecho: pinzamiento del hombro.",
            "Coger impulso con las piernas.",
            "Encoger los hombros en lugar de abrir los codos."]),
 "oiseau": dict(
   nom="Pájaro con mancuernas (deltoides posterior)",
   machine="Dos mancuernas ligeras, con el torso inclinado. Alternativa sentada: el contractor de "
           "pecho al revés (te sientas de cara al respaldo y abres los brazos hacia atrás).",
   reglage="Muy ligero: 2 a 5 kg. Es un músculo pequeño y a menudo olvidado, no hace falta cargar.",
   etapes=["Pies a la anchura de la cadera, rodillas flexionadas, torso inclinado 45° o más.",
           "Espalda plana, brazos colgando bajo los hombros, codos apenas flexionados.",
           "Abre los brazos por los lados hasta la horizontal, pulgares hacia el suelo.",
           "Junta las escápulas 1 s al final del movimiento.",
           "Baja despacio, sin dejar caer los brazos."],
   erreurs=["Incorporarte en cada repetición.",
            "Doblar los codos y convertirlo en un remo.",
            "Cargar pesado: el deltoides posterior no puede seguir."]),
 "face_pull": dict(
   nom="Face pull en polea",
   machine="Columna de polea a la altura de la cara (o algo por encima), con una cuerda. Es el "
           "ejercicio de salud del hombro: no te lo saltes.",
   reglage="Polea a la altura de la cabeza, cuerda cogida con las palmas enfrentadas, un paso atrás "
           "para poner el cable en tensión.",
   etapes=["De pie, brazos estirados hacia la polea, hombros bajos.",
           "Tira de la cuerda hacia la cara separando las manos entre sí.",
           "Los codos terminan altos, a la altura de los hombros o por encima.",
           "Pausa de 1 s: debes notar la parte posterior del hombro y la espalda media.",
           "Vuelve en 2 s a brazos estirados."],
   erreurs=["Tirar de la cuerda hacia el pecho (se convierte en un remo).",
            "Dejar caer los codos.",
            "Una carga tan pesada que te lleva hacia delante."]),
 "shrugs": dict(
   nom="Encogimientos con mancuernas",
   machine="Dos mancuernas pesadas a los lados del cuerpo, o una barra. Los racks de mancuernas "
           "llegan bastante alto para este ejercicio: puedes cargar.",
   reglage="Brazos estirados, mancuernas junto a los muslos, agarre firme (unas cinchas ayudan si "
           "las manos ceden antes que los trapecios).",
   etapes=["De pie, brazos estirados, hombros relajados hacia abajo.",
           "Encoge los hombros recto hacia las orejas, lo más alto posible.",
           "Pausa de 1 s arriba, sin doblar los brazos.",
           "Baja despacio hasta el estiramiento completo.",
           "Respira: suelta el aire al subir."],
   erreurs=["Hacer rotaciones de hombros: el movimiento es estrictamente vertical.",
            "Doblar los codos para ayudarte.",
            "Inclinar la cabeza hacia delante."]),
 "presse_epaules": dict(
   nom="Máquina de press de hombros",
   machine="La máquina sentada en la que empujas dos asas hacia arriba, con respaldo vertical. "
           "Trayectoria guiada: puedes cargar sin riesgo de arquear, algo que el press militar de "
           "pie no perdona.",
   reglage="Asiento ajustado para que las asas queden a la altura de las orejas al inicio, no más "
           "arriba. Espalda totalmente pegada al respaldo.",
   etapes=["Sentado, espalda pegada, pies en el suelo, asas a la altura de las orejas.",
           "Empuja en vertical hasta estirar los brazos sin bloquear los codos.",
           "Baja en 2 s hasta que los codos pasen por debajo de los hombros.",
           "Mantén las costillas bajas: nada de arquear, pese al respaldo.",
           "Suelta el aire al empujar, inspira al bajar."],
   erreurs=["Bajar demasiado forzando el hombro.",
            "Despegar la espalda del respaldo al final de la serie.",
            "Empujar dando un impulso con las piernas."]),
 "elevations_poulie": dict(
   nom="Elevación lateral en polea a un brazo",
   machine="Una polea baja y un asa simple, un brazo cada vez. El cable mantiene la tensión de "
           "principio a fin, cosa que las mancuernas no hacen: es la versión más eficaz de la "
           "elevación lateral.",
   reglage="Polea abajo del todo. Colócate de perfil, con la máquina del lado contrario al brazo "
           "que trabaja, y coge el asa pasándola por delante.",
   etapes=["De pie de perfil, asa en la mano más alejada de la máquina, brazo delante de los muslos.",
           "Codo muy ligeramente flexionado, hombro bajo.",
           "Sube el brazo por el lado hasta la horizontal, no más.",
           "Pausa de 1 s arriba y baja en 3 s contra la tensión del cable.",
           "Haz todas las repeticiones de un lado y luego cambia."],
   erreurs=["Inclinarte hacia el lado contrario para ayudarte.",
            "Subir por encima de la horizontal.",
            "Cargar demasiado: 5 kg suelen bastar en este ejercicio."]),
 "elevations_frontales": dict(
   nom="Elevaciones frontales con disco",
   machine="Un disco de 5 a 15 kg cogido con las dos manos (o una mancuerna). Trabajo de la parte "
           "anterior del hombro, complemento directo del press.",
   reglage="Empieza con un disco de 5 kg. De pie, pies a la anchura de la cadera, disco cogido a "
           "las 3 y a las 9, brazos estirados delante de los muslos.",
   etapes=["De pie, abdomen apretado, disco delante de los muslos, brazos estirados.",
           "Sube el disco por delante hasta la altura de los ojos, con los brazos estirados.",
           "Sin impulso: el torso permanece totalmente inmóvil.",
           "Pausa de 1 s arriba y baja en 3 s.",
           "Corta la serie en cuanto necesites dar un impulso de cadera."],
   erreurs=["Arquearte hacia atrás para subir el disco.",
            "Subir mucho más arriba de los ojos.",
            "Doblar los codos para acortar la palanca."]),
 "oiseau_poulie": dict(
   nom="Pájaro en poleas cruzadas",
   machine="La jaula de poleas con ambas poleas a la altura de los hombros. Coges el asa de la "
           "derecha con la mano izquierda y al revés: los cables se cruzan delante de ti. Tensión "
           "constante en la parte posterior del hombro, imposible hacer trampa.",
   reglage="Las dos poleas a la altura de los hombros, carga ligera a cada lado. Colócate en el "
           "centro, un pie algo adelantado.",
   etapes=["Brazos cruzados delante de ti, cada mano con el asa contraria.",
           "Brazos casi estirados, codos apenas flexionados, hombros bajos.",
           "Abre los brazos por los lados describiendo un gran arco, hasta la horizontal.",
           "Junta las escápulas 1 s al final de la apertura.",
           "Vuelve en 3 s reteniendo la carga, sin que los hombros se vayan hacia delante."],
   erreurs=["Doblar los codos: el movimiento se convierte en un tirón.",
            "Abrir más allá de la línea de los hombros.",
            "Una carga tan pesada que inclina el torso hacia delante."]),
 "shrugs_barre": dict(
   nom="Encogimientos con barra",
   machine="Una barra recta cargada, sujeta delante de los muslos. Frente a las mancuernas, la "
           "barra permite cargar más, pero el recorrido es algo más corto.",
   reglage="Barra cogida en pronación, manos a la anchura de los hombros. Unas cinchas ayudan si "
           "las manos ceden antes que los trapecios.",
   etapes=["De pie, barra delante de los muslos, brazos estirados, hombros relajados hacia abajo.",
           "Encoge los hombros recto hacia las orejas, lo más alto posible.",
           "Pausa de 1 s arriba sin doblar los brazos.",
           "Baja despacio hasta el estiramiento completo de los trapecios.",
           "Suelta el aire al subir."],
   erreurs=["Hacer rotaciones de hombros: el movimiento es estrictamente vertical.",
            "Doblar los codos para ayudarte.",
            "Dejar caer la cabeza hacia delante bajo la carga."]),
 "dragon_flag": dict(
   nom="Dragon flag (versión negativa)",
   machine="Un banco plano, agarrado por el borde detrás de la cabeza. Es el ejercicio de abdomen "
           "más exigente del programa: todo el cuerpo se mantiene rígido como una tabla y solo el "
           "abdomen impide que la cadera caiga.",
   reglage="Nada que ajustar, pero colócate de forma que puedas agarrar con firmeza el banco con "
           "las dos manos, justo por encima de los hombros. Una esterilla si el banco es duro.",
   etapes=["Tumbado boca arriba, manos agarradas al borde del banco detrás de la cabeza.",
           "Despega la cadera y sube las piernas hasta que el cuerpo quede casi vertical, apoyado "
           "en la parte alta de la espalda — no en la nuca.",
           "Aprieta glúteos y abdomen: el cuerpo forma una línea recta y tensa.",
           "Baja esa línea lo más despacio posible, en 4 o 5 segundos.",
           "Detén la bajada en cuanto la zona lumbar se despegue y vuelve con las rodillas "
           "flexionadas.",
           "¿Demasiado duro? Haz la misma bajada con las rodillas al pecho, luego a media altura, "
           "antes de pasar a piernas estiradas."],
   erreurs=["Dejar que la zona lumbar se arquee: la carga la aguanta ella, no el abdomen.",
            "Apoyarte en la nuca en lugar de la parte alta de la espalda.",
            "Bajar en caída libre: todo el valor del ejercicio está en la lentitud."]),
 "crunch_decline": dict(
   nom="Crunch declinado con lastre",
   machine="El banco declinado de abdominales, con dos rodillos arriba para los pies (cabeza "
           "abajo). Añade un disco de 5 a 15 kg sobre el pecho: eso convierte el ejercicio en un "
           "verdadero movimiento de fuerza, con carga progresiva.",
   reglage="Inclina el banco 20-30° para empezar. Encaja los pies bajo los rodillos, rodillas "
           "flexionadas. Coge el disco una vez colocado, cruzado sobre el pecho.",
   etapes=["Tumbado cabeza abajo, disco apretado contra el pecho, mentón ligeramente metido.",
           "Enrolla el torso hacia los muslos despegando primero las escápulas.",
           "Sube hasta unos 30° por encima del banco: no hace falta llegar a las rodillas.",
           "Suelta todo el aire arriba, pausa de 1 s.",
           "Baja en 3 s sin dejar caer la cabeza hacia atrás.",
           "Cuando 12 repeticiones salgan limpias, sube 2,5 kg."],
   erreurs=["Tirar de la nuca con las manos para arrancar.",
            "Incorporarte del todo empujando con los flexores de la cadera.",
            "Coger un disco demasiado pesado y acortar el recorrido."]),
 "v_ups": dict(
   nom="V-ups (elevaciones simultáneas)",
   machine="Una esterilla. El cuerpo parte estirado y se cierra en V: la parte alta y baja del "
           "abdomen trabajan juntas, lo que lo hace un excelente final de bloque cuando ya no se "
           "puede sostener carga.",
   reglage="Nada que ajustar. Versión más fácil: flexiona las rodillas y toca las espinillas "
           "(tuck-ups); más difícil: una mancuerna ligera sujeta con los brazos estirados.",
   etapes=["Tumbado boca arriba, brazos estirados por detrás de la cabeza, piernas estiradas en el suelo.",
           "Despega a la vez el torso y las piernas flexionando por la cadera.",
           "Busca los pies con las manos, cuerpo en V, en equilibrio sobre los glúteos.",
           "Suelta el aire al subir, pausa breve arriba.",
           "Baja en 3 s sin que talones ni hombros toquen el suelo.",
           "Encadena sin descanso en el suelo: la tensión es continua toda la serie."],
   erreurs=["Coger impulso balanceando los brazos.",
            "Dejar que la zona lumbar se despegue abajo: reduce el recorrido.",
            "Doblar las rodillas sin querer al final de la serie: párate ahí."]),
 "releves_jambes": dict(
   nom="Elevaciones de piernas en suspensión",
   machine="Barra de dominadas, o la silla romana (el marco vertical con dos coderas y un "
           "respaldo), que es bastante más fácil de sostener.",
   reglage="En la silla romana: antebrazos en las coderas, espalda contra el respaldo. Colgado de "
           "la barra: agarre a la anchura de los hombros, cuerpo inmóvil.",
   etapes=["Parte con el cuerpo estirado, piernas bajo la cadera, sin balanceo.",
           "Enrolla la pelvis hacia arriba subiendo las rodillas o las piernas estiradas.",
           "Sube al menos hasta la horizontal, soltando el aire.",
           "Baja en 3 s, sin dejar caer las piernas.",
           "Versión fácil: rodillas flexionadas."],
   erreurs=["Balancearte: cada repetición parte de la inmovilidad.",
            "Subir las piernas solo desde la cadera, sin enrollar la pelvis.",
            "Dejar caer las piernas al final de la serie."]),
 "crunch_poulie": dict(
   nom="Crunch en polea alta",
   machine="Columna de polea alta con una cuerda. Te pones de rodillas delante de la máquina, de "
           "cara o de espaldas a la columna según el espacio.",
   reglage="Polea arriba del todo, cuerda cogida a ambos lados de la cara, manos en las sienes.",
   etapes=["De rodillas, cadera fija, cuerda sujeta cerca de la cara.",
           "Enrolla el torso hacia el suelo redondeando a propósito la parte alta de la espalda.",
           "El movimiento sale del abdomen, no de los brazos ni de la cadera.",
           "Suelta todo el aire abajo, pausa de 1 s.",
           "Sube en 2 s sin soltar la tensión."],
   erreurs=["Tirar con los brazos: las manos no se mueven respecto a la cabeza.",
            "Bascular la cadera hacia atrás.",
            "Una carga tan pesada que impide enrollar el torso."]),
 "crunch_inverse": dict(
   nom="Crunch inverso en el suelo",
   machine="Una esterilla y, si quieres, un banco plano cuyo borde agarras para estabilizarte.",
   reglage="Nada que ajustar. Manos apoyadas junto al cuerpo o agarradas a un soporte fijo detrás "
           "de la cabeza.",
   etapes=["Tumbado boca arriba, rodillas flexionadas a 90°, muslos en vertical.",
           "Despega la cadera del suelo llevando las rodillas hacia el pecho.",
           "El movimiento es corto: el abdomen bajo enrolla la pelvis.",
           "Pausa de 1 s arriba y baja en 3 s.",
           "La zona lumbar sigue en contacto con el suelo a la vuelta."],
   erreurs=["Coger impulso con las piernas.",
            "Empujar con las manos contra el suelo.",
            "Despegar la zona lumbar en la posición baja."]),
 "russian_twist": dict(
   nom="Russian twist",
   machine="Un disco de 5 a 10 kg, una mancuerna o un balón medicinal, sentado en una esterilla.",
   reglage="Empieza sin carga para encontrar la posición. Pies en el suelo (fácil) o despegados "
           "(difícil).",
   etapes=["Sentado, torso inclinado 45° hacia atrás, espalda recta.",
           "Disco sujeto con las dos manos delante del esternón.",
           "Gira el torso hacia un lado llevando el disco junto a la cadera.",
           "Vuelve al centro y gira al otro lado: eso son 2 repeticiones.",
           "La mirada sigue al disco; la cadera permanece inmóvil."],
   erreurs=["Mover solo los brazos sin girar el torso.",
            "Redondear la espalda.",
            "Ir deprisa: la rotación debe ser controlada."]),
 "woodchopper": dict(
   nom="Leñador en polea",
   machine="Columna de polea en posición alta, con una cuerda o un asa simple. Te colocas de perfil "
           "respecto a la máquina.",
   reglage="Polea alta, un paso largo hacia el lado para poner el cable en tensión. Carga moderada.",
   etapes=["De pie de perfil, pies a la anchura de los hombros, asa cogida con las dos manos arriba.",
           "Tira en diagonal hacia la cadera contraria, como un hachazo.",
           "Brazos casi estirados: la rotación sale del tronco, no de los brazos.",
           "El pie de atrás pivota ligeramente y la cadera acompaña.",
           "Vuelve controlando y luego cambia de lado."],
   erreurs=["Tirar solo con los brazos.",
            "Redondear la espalda al final de la rotación.",
            "Una carga tan pesada que te desequilibra."]),
 "ab_wheel": dict(
   nom="Rueda abdominal",
   machine="La rueda pequeña con dos asas, en el cajón de accesorios. Ejercicio difícil: déjalo "
           "para el final y sustitúyelo por una plancha dinámica si notas la espalda.",
   reglage="De rodillas sobre una esterilla (pon una toalla doblada bajo las rodillas). Rueda bajo "
           "los hombros.",
   etapes=["De rodillas, manos en las asas, brazos estirados, espalda ligeramente redondeada.",
           "Mete el ombligo y aprieta los glúteos antes de salir.",
           "Desenrolla la rueda hacia delante manteniendo la pelvis en retroversión.",
           "Llega solo hasta donde puedas mantener la espalda sin arquear.",
           "Vuelve tirando con el abdomen, no con los brazos."],
   erreurs=["Ir demasiado lejos: la zona lumbar se hunde y es ella la que aguanta.",
            "Levantar los glúteos a la vuelta.",
            "Hacerlo con fatiga extrema, sin control."]),
 "planche": dict(
   nom="Plancha frontal",
   machine="Una simple esterilla. Codos bajo los hombros, antebrazos apoyados.",
   reglage="Sin material. Si es demasiado duro: apoya las rodillas, manteniendo recta la línea "
           "hombros-cadera-rodillas.",
   etapes=["Codos en la vertical bajo los hombros, antebrazos paralelos.",
           "Pies a la anchura de la cadera, cuerpo en línea recta.",
           "Mete ligeramente la pelvis (como si metieras el ombligo).",
           "Aprieta glúteos y abdomen, respira con normalidad.",
           "Aguanta 45 s, dos series, al final de la sesión.",
           "Versión con brazos estirados (sesión D): manos bajo los hombros, codos desbloqueados."],
   erreurs=["Glúteos demasiado altos (posición de descanso) o demasiado bajos (dolor de espalda).",
            "Bloquear la respiración.",
            "Mirar al frente: la nuca sigue la línea de la espalda."]),
 "planche_laterale": dict(
   nom="Plancha lateral",
   machine="Una esterilla. Estás de lado, apoyado en un solo antebrazo.",
   reglage="Codo bajo el hombro, pies superpuestos (o desplazados uno delante del otro para más "
           "estabilidad).",
   etapes=["Tumbado de lado, codo en la vertical bajo el hombro.",
           "Despega la cadera: hombro, cadera y tobillo forman una línea.",
           "Brazo libre estirado hacia el techo o apoyado en la cadera.",
           "Aguanta 30 s y cambia de lado; dos series por lado.",
           "Versión fácil: rodillas flexionadas en el suelo."],
   erreurs=["Cadera que vuelve a bajar hacia el suelo.",
            "Bascular el torso hacia delante o hacia atrás.",
            "Dejar caer la cabeza hacia el hombro."]),
 "hollow": dict(
   nom="Hollow body hold",
   machine="Una esterilla. Ejercicio con el peso del cuerpo, muy eficaz para el core profundo.",
   reglage="Nada que ajustar. La clave: la zona lumbar pegada al suelo (marca verde en el esquema).",
   etapes=["Tumbado boca arriba, pega la zona lumbar al suelo metiendo el ombligo.",
           "Despega los hombros y la cabeza unos centímetros.",
           "Estira las piernas y despégalas 20-30 cm del suelo.",
           "Brazos estirados hacia atrás o a lo largo del cuerpo (más fácil).",
           "Aguanta 30 s manteniendo la zona lumbar pegada, dos series."],
   erreurs=["Dejar que la zona lumbar se despegue: sube más las piernas.",
            "Tirar de la nuca con las manos.",
            "Contener la respiración."]),
})
