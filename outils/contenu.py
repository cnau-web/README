# -*- coding: utf-8 -*-
"""Contenu redactionnel du programme : fiches d'exercices et seances."""

# Chaque fiche : (id illustration, nom, groupe, ou trouver la machine,
#                 reglages, etapes d'execution, erreurs frequentes)
FICHES = [
    # ------------------------------- PECTORAUX -------------------------------
    dict(id="developpe_couche", nom="Développé couché à la barre", groupe="Pectoraux",
         machine="Un banc plat horizontal placé sous un rack à barre (deux crochets à hauteur d'épaules). "
                 "Si le banc libre t'intimide, prends la barre guidée (Smith machine) : la barre coulisse "
                 "sur deux rails, impossible de partir de travers.",
         reglage="Barre sur les crochets, à la verticale de tes yeux une fois allongé. Disques identiques "
                 "des deux côtés, colliers de serrage systématiques. Commence à vide pour trouver la prise.",
         etapes=["Allonge-toi, yeux sous la barre, pieds bien à plat au sol.",
                 "Trois points de contact : tête, haut du dos, fesses — ils ne bougent plus.",
                 "Prise un peu plus large que les épaules, poignets dans l'axe des avant-bras.",
                 "Sors la barre et amène-la à la verticale de la poitrine, bras tendus.",
                 "Descends en 2 s jusqu'à effleurer le bas des pectoraux, coudes à 45° du buste.",
                 "Pousse vers le haut sans bloquer sèchement les coudes."],
         erreurs=["Faire rebondir la barre sur la poitrine.",
                  "Décoller les fesses du banc pour aider.",
                  "Coudes écartés à 90° : très agressif pour l'épaule."]),

    dict(id="developpe_incline", nom="Développé incliné aux haltères", groupe="Pectoraux",
         machine="Banc à dossier inclinable, dans la zone des haltères. Règle-le à 30° (premier ou deuxième "
                 "cran) : au-delà de 45°, ce sont les épaules qui prennent le travail, plus les pectoraux.",
         reglage="Deux haltères identiques. Assieds-toi, haltères posés à plat sur les cuisses, puis bascule "
                 "en arrière en les remontant avec les genoux : c'est la manière sûre de les mettre en place.",
         etapes=["Dos entièrement plaqué au dossier, pieds au sol.",
                 "Haltères au niveau des épaules, paumes vers l'avant, coudes sous les poignets.",
                 "Pousse vers le haut et légèrement vers l'intérieur, sans cogner les haltères.",
                 "Redescends en 2 s jusqu'à ce que les coudes arrivent au niveau des épaules.",
                 "Pour reposer : ramène les haltères sur les cuisses, puis relève-toi."],
         erreurs=["Descendre trop bas en cherchant l'étirement maximal.",
                  "Cambrer le bas du dos pour soulever plus lourd.",
                  "Laisser les haltères partir vers l'arrière, au-dessus du visage."]),

    dict(id="ecarte_poulie", nom="Écarté à la poulie vis-à-vis", groupe="Pectoraux",
         machine="La grande cage à poulies avec une colonne de chaque côté (« vis-à-vis » ou cable crossover). "
                 "Accroche une poignée simple (étrier) sur chaque poulie, réglée en position haute.",
         reglage="Même charge sur les deux colonnes : la goupille s'enfonce à fond dans la pile de plaques. "
                 "Place-toi au milieu, un pied légèrement avancé pour l'équilibre.",
         etapes=["Une poignée dans chaque main, buste très légèrement penché en avant.",
                 "Bras quasi tendus, coudes juste déverrouillés — cet angle ne change plus.",
                 "Ramène les mains l'une vers l'autre devant le bas de la poitrine, en arc de cercle.",
                 "Tiens la contraction 1 s, poitrine sortie.",
                 "Laisse les bras repartir en arrière en contrôlant, sans forcer l'étirement."],
         erreurs=["Plier puis tendre les coudes : ça devient un exercice de triceps.",
                  "Charge trop lourde qui t'emmène vers l'arrière.",
                  "Monter les épaules vers les oreilles."]),

    dict(id="pec_deck", nom="Pec deck (machine à écarté)", groupe="Pectoraux",
         machine="Machine assise avec deux bras verticaux munis de coussins (ou de poignées) que l'on ramène "
                 "devant soi. C'est l'alternative la plus simple à l'écarté à la poulie.",
         reglage="Règle la hauteur du siège pour que tes coudes (ou tes poignées) soient à hauteur d'épaules. "
                 "Goupille dans la pile de plaques, dos plaqué au dossier.",
         etapes=["Assis, dos et épaules en contact avec le dossier, pieds au sol.",
                 "Avant-bras ou mains contre les coussins, coudes à hauteur d'épaules.",
                 "Ramène les deux bras l'un vers l'autre devant la poitrine.",
                 "Pause 1 s en position fermée, puis reviens en 2 s.",
                 "Ne laisse pas les plaques retomber en butée entre les répétitions."],
         erreurs=["Décoller le dos du dossier pour pousser.",
                  "Ouvrir trop loin en arrière (étirement forcé de l'épaule).",
                  "Aller trop vite : l'intérêt de cette machine est le contrôle."]),

    dict(id="dips", nom="Dips (barres parallèles)", groupe="Pectoraux",
         machine="Les deux barres parallèles à hauteur de hanches, souvent sur la même station que la barre "
                 "de traction. S'il y a une machine « dips assistés », un coussin remonte tes genoux et allège "
                 "le mouvement : plus la plaque choisie est lourde, plus c'est facile.",
         reglage="Sur la machine assistée, commence avec une assistance généreuse. Sinon, remplace par des "
                 "pompes, éventuellement pieds surélevés.",
         etapes=["Mains sur les barres, bras tendus, corps suspendu, jambes fléchies en arrière.",
                 "Penche le buste d'environ 20° vers l'avant : c'est ce qui cible les pectoraux.",
                 "Descends en pliant les coudes jusqu'à ce que les épaules arrivent au niveau des coudes.",
                 "Remonte en poussant, sans verrouiller violemment.",
                 "Garde les épaules basses, loin des oreilles, pendant tout le mouvement."],
         erreurs=["Descendre trop bas : douleur à l'avant de l'épaule.",
                  "Se balancer pour prendre de l'élan.",
                  "Rester parfaitement vertical : le travail part alors sur les triceps."]),

    dict(id="ecarte_incline", nom="Écarté incliné aux haltères", groupe="Pectoraux",
         machine="Le même banc incliné à 30° que pour le développé incliné, avec deux haltères légers. "
                 "Le schéma est vu du dessus : tu es allongé sur le dos, les bras s'ouvrent sur les côtés.",
         reglage="Prends nettement plus léger que pour le développé : c'est un exercice d'étirement, pas de "
                 "force. Haltères montés sur les cuisses puis bascule en arrière.",
         etapes=["Bras tendus au-dessus de la poitrine, paumes face à face.",
                 "Coudes très légèrement fléchis — angle figé pour toute la série.",
                 "Ouvre les bras sur les côtés, en arc de cercle, jusqu'à hauteur des épaules.",
                 "Referme en serrant les pectoraux, comme si tu enlaçais un tronc d'arbre.",
                 "Termine la série en reposant les haltères sur les cuisses."],
         erreurs=["Descendre les bras sous la ligne des épaules.",
                  "Transformer le mouvement en développé (coudes qui plient).",
                  "Charge trop lourde : c'est l'exercice de finition de la séance."]),

    # --- programme B ---
    dict(id="developpe_couche_halteres", nom="Développé couché aux haltères", groupe="Pectoraux",
         machine="Le même banc plat, mais avec deux haltères au lieu de la barre. Chaque bras "
                 "travaille seul : le côté faible ne peut plus se cacher derrière l'autre, et "
                 "l'amplitude en bas est plus grande.",
         reglage="Prends des haltères 30 à 40 % plus légers que ta barre habituelle. Assieds-toi "
                 "au bout du banc, haltères posés sur les cuisses, puis bascule en arrière en les "
                 "remontant avec les genoux.",
         etapes=["Allongé, pieds au sol, haltères au niveau de la poitrine, paumes vers l'avant.",
                 "Coudes à 45° du buste, poignets dans l'axe des avant-bras.",
                 "Pousse vers le haut en rapprochant légèrement les haltères, sans les cogner.",
                 "Descends en 2 s jusqu'à ce que les coudes passent sous la ligne des épaules.",
                 "Garde les omoplates serrées et le haut du dos plaqué tout du long.",
                 "Pour reposer : ramène les haltères sur les cuisses, puis relève-toi."],
         erreurs=["Descendre trop bas en cherchant l'étirement : l'épaule paie l'addition.",
                  "Laisser les haltères partir vers l'extérieur en fin de série.",
                  "Lâcher les haltères sur le côté : repose-les toujours sur les cuisses."]),

    dict(id="developpe_decline", nom="Développé décliné à la barre", groupe="Pectoraux",
         machine="Le banc décliné (tête en bas) avec ses boudins pour caler les cuisses, sous un "
                 "rack. Si ta salle n'en a pas, la machine à développé décliné convergente fait "
                 "le même travail, en plus simple à installer.",
         reglage="Déclinaison de 15 à 30°, pas plus. Cale les cuisses sous les boudins avant de "
                 "t'allonger. Fais-toi aider pour sortir la barre les premières fois : la position "
                 "tête en bas déstabilise au début.",
         etapes=["Allongé tête en bas, cuisses bloquées, barre à la verticale des yeux.",
                 "Prise un peu plus large que les épaules, barre sortie du rack bras tendus.",
                 "Descends vers le bas des pectoraux, sous la ligne des tétons.",
                 "Coudes à 45°, descente en 2 s jusqu'à effleurer la poitrine.",
                 "Pousse à la verticale, sans bloquer sèchement les coudes.",
                 "Repose la barre sur les crochets avant de te relever, jamais l'inverse."],
         erreurs=["Rester trop longtemps tête en bas entre les séries : relève-toi pour récupérer.",
                  "Descendre la barre trop haut, vers le cou.",
                  "Décliner le banc à 45° : inutile et désagréable."]),

    dict(id="presse_pectoraux", nom="Presse à pectoraux (machine)", groupe="Pectoraux",
         machine="La machine assise où l'on pousse deux poignées vers l'avant, dos calé contre un "
                 "dossier. C'est l'exercice le plus sûr du groupe : aucune stabilisation à gérer, "
                 "donc tu peux pousser fort en fin de séance sans partenaire.",
         reglage="Règle la hauteur du siège pour que les poignées arrivent au niveau du milieu de "
                 "la poitrine, pas des épaules. Goupille dans la pile de plaques.",
         etapes=["Assis, dos et épaules en contact avec le dossier, pieds bien à plat.",
                 "Poignées au niveau de la poitrine, coudes légèrement sous les mains.",
                 "Pousse vers l'avant jusqu'à tendre les bras sans verrouiller.",
                 "Reviens en 2 s jusqu'à ce que les mains reviennent au niveau de la poitrine.",
                 "Ne laisse pas les plaques retomber en butée entre les répétitions."],
         erreurs=["Décoller le dos du dossier pour pousser plus lourd.",
                  "Laisser les coudes monter à hauteur d'épaules.",
                  "Amplitude tronquée : les mains doivent revenir jusqu'au buste."]),

    dict(id="ecarte_poulie_basse", nom="Écarté à la poulie basse (de bas en haut)", groupe="Pectoraux",
         machine="La cage à poulies vis-à-vis, mais avec les deux poulies réglées **en bas**. Le "
                 "mouvement monte au lieu de descendre : il cible le haut des pectoraux, la zone "
                 "la moins sollicitée par le reste du programme.",
         reglage="Poignées simples sur les deux poulies basses, même charge des deux côtés. "
                 "Place-toi au milieu, un pied légèrement avancé, buste droit.",
         etapes=["Une poignée dans chaque main, bras le long du corps, paumes vers l'avant.",
                 "Coudes très légèrement fléchis, angle figé pour toute la série.",
                 "Monte les mains l'une vers l'autre jusqu'à hauteur des épaules, en arc de cercle.",
                 "Serre les pectoraux 1 s en haut, mains presque jointes devant le sternum.",
                 "Redescends en 3 s en contrôlant, sans laisser les bras partir en arrière."],
         erreurs=["Monter les mains au-dessus des épaules : ça devient une élévation frontale.",
                  "Se pencher en arrière pour lancer la charge.",
                  "Plier les coudes en cours de route."]),

    dict(id="pompes", nom="Pompes lestées", groupe="Pectoraux",
         machine="Un tapis de sol, et un disque de 5 à 20 kg posé au milieu du haut du dos (demande "
                 "à quelqu'un de le poser, ou utilise un gilet lesté). Finisher de séance : on va "
                 "chercher l'échec proprement.",
         reglage="Mains légèrement plus larges que les épaules, à la verticale sous elles. Sans "
                 "lest tant que 15 pompes strictes ne passent pas.",
         etapes=["Corps en ligne droite des talons à la tête, fessiers et abdos serrés.",
                 "Coudes à 45° du buste, pas en croix.",
                 "Descends jusqu'à ce que la poitrine frôle le sol, en 2 s.",
                 "Pousse sans creuser le bas du dos ni décoller les fesses.",
                 "Série menée jusqu'à 2 répétitions de la limite, pas jusqu'à la casse technique.",
                 "Trop dur ? Mains sur un banc. Trop facile ? Pieds surélevés, puis lest."],
         erreurs=["Bassin qui s'affaisse ou fesses en l'air.",
                  "Amplitude partielle : la poitrine doit descendre au niveau des coudes.",
                  "Tête qui part en avant à chaque répétition."]),

    # ---------------------------------- DOS ----------------------------------
    dict(id="tractions", nom="Tractions", groupe="Dos",
         machine="Barre fixe horizontale, ou la machine à tractions assistées (tu poses les genoux ou les "
                 "pieds sur un marchepied lesté qui te pousse vers le haut).",
         reglage="Sur la machine assistée : plus la charge sélectionnée est lourde, plus tu es aidé. Vise une "
                 "assistance qui te permet 8 à 10 répétitions propres, et réduis-la au fil des semaines.",
         etapes=["Prise pronation (paumes vers l'avant), mains un peu plus larges que les épaules.",
                 "Pars bras tendus, épaules descendues, gainage serré, jambes légèrement croisées.",
                 "Commence par abaisser les omoplates, puis tire les coudes vers le bas et l'arrière.",
                 "Monte jusqu'à ce que le menton dépasse la barre (ou le plus haut possible).",
                 "Redescends en 2 s jusqu'à bras tendus, sans te laisser tomber."],
         erreurs=["Se balancer avec les jambes pour s'aider.",
                  "Ne descendre qu'à moitié.",
                  "Rentrer la tête dans les épaules en fin de traction."]),

    dict(id="tirage_vertical", nom="Tirage vertical (lat pulldown)", groupe="Dos",
         machine="Machine assise avec une longue barre suspendue à une poulie haute et un boudin réglable "
                 "qui bloque les cuisses. C'est l'exercice de remplacement des tractions.",
         reglage="Règle le boudin des cuisses pour qu'il te plaque sur le siège sans écraser. Attrape la barre "
                 "debout, puis assieds-toi. Prise large en pronation, ou prise neutre (poignées en V) en séance D.",
         etapes=["Assis, cuisses bloquées, buste incliné d'environ 15° vers l'arrière.",
                 "Poitrine sortie, épaules basses, regard devant.",
                 "Tire la barre vers le haut de la poitrine en menant avec les coudes.",
                 "Serre les omoplates en fin de tirage, pause 1 s.",
                 "Laisse remonter la barre en 2 s jusqu'aux bras tendus."],
         erreurs=["Tirer la barre derrière la nuque : inutile et risqué pour l'épaule.",
                  "Se pencher très en arrière pour arracher la charge.",
                  "Tirer avec les bras en oubliant de descendre les omoplates."]),

    dict(id="rowing_barre", nom="Rowing barre, buste penché", groupe="Dos",
         machine="Une barre droite chargée, prise au sol dans la zone des barres libres. Variante plus facile "
                 "pour le dos : la barre de trap bar ou la machine de rowing assis (fiche suivante).",
         reglage="Charge modérée tant que la position n'est pas acquise. Pieds écartés de la largeur des "
                 "hanches, barre au-dessus du milieu du pied.",
         etapes=["Fléchis légèrement les genoux et bascule le buste vers l'avant à 45° environ.",
                 "Dos parfaitement plat, poitrine sortie, regard 2 m devant toi au sol.",
                 "Bras tendus, barre pendue sous les épaules, prise pronation.",
                 "Tire la barre vers le nombril en gardant les coudes près du corps.",
                 "Redescends en contrôlant sans arrondir le dos ; le buste ne se relève pas."],
         erreurs=["Arrondir le bas du dos : arrête la série immédiatement si ça arrive.",
                  "Se redresser à chaque répétition pour lancer la barre.",
                  "Tirer vers la poitrine au lieu du nombril."]),

    dict(id="tirage_horizontal", nom="Tirage horizontal à la poulie basse", groupe="Dos",
         machine="Station assise avec un repose-pieds et une poulie basse : tu tires une poignée en V (ou une "
                 "barre courte) vers le ventre. C'est aussi le « rowing poulie basse » de la séance D.",
         reglage="Pieds calés sur les repose-pieds, genoux légèrement fléchis (jamais tendus à bloc). "
                 "Attrape la poignée en gardant le dos plat, puis redresse-toi.",
         etapes=["Assis, buste vertical, bras tendus vers l'avant, dos plat.",
                 "Tire la poignée vers le nombril, coudes le long du corps.",
                 "Serre les omoplates en fin de mouvement, poitrine en avant.",
                 "Laisse repartir les bras en 2 s, en gardant le buste à la verticale.",
                 "Sur la dernière répétition, accompagne la poignée jusqu'au support."],
         erreurs=["Balancer le buste d'avant en arrière comme un rameur.",
                  "Arrondir le dos quand les bras repartent vers l'avant.",
                  "Hausser les épaules pendant le tirage."]),

    dict(id="rowing_haltere", nom="Rowing haltère à un bras", groupe="Dos",
         machine="Un banc plat et un haltère. Tu prends appui d'une main (ou d'un genou) sur le banc et tu "
                 "tires l'haltère de l'autre côté.",
         reglage="Haltère posé au sol le long du banc, du côté du bras qui travaille. Appui main + jambe "
                 "opposées pour un dos bien stable.",
         etapes=["Main gauche posée sur le banc, buste quasi horizontal, dos plat.",
                 "Haltère dans la main droite, bras tendu vers le sol.",
                 "Tire l'haltère vers la hanche en gardant le coude près du corps.",
                 "Pause 1 s en haut, sans tourner les épaules.",
                 "Redescends en 2 s bras tendu, puis change de côté."],
         erreurs=["Tourner le buste pour monter plus haut.",
                  "Tirer en arc de cercle vers l'extérieur.",
                  "Laisser le dos s'arrondir entre les répétitions."]),

    dict(id="pullover_poulie", nom="Pull-over à la poulie haute, bras tendus", groupe="Dos",
         machine="Colonne à poulie réglée en position haute, avec une barre droite courte ou une corde. "
                 "Tu te places debout face à la machine, à un bon pas de distance.",
         reglage="Charge légère au début : le bras de levier est long. Barre saisie en pronation, largeur "
                 "des épaules.",
         etapes=["Debout, pieds décalés, buste légèrement penché en avant, gainage serré.",
                 "Bras tendus vers la poulie, coudes juste déverrouillés.",
                 "Descends la barre en arc de cercle jusqu'aux cuisses, bras toujours tendus.",
                 "Serre les dorsaux 1 s en position basse.",
                 "Laisse remonter la barre en contrôlant, sans que les épaules partent en avant."],
         erreurs=["Plier les coudes (ça devient une extension de triceps).",
                  "Utiliser le buste comme balancier.",
                  "Charge trop lourde : l'exercice perd tout son intérêt."]),

    dict(id="extensions_lombaires", nom="Extensions lombaires (banc à 45°)", groupe="Dos",
         machine="Le banc incliné à 45° avec un gros coussin pour les hanches et deux rouleaux pour bloquer "
                 "les chevilles. Certaines salles ont la version horizontale : même principe.",
         reglage="Règle la hauteur du coussin : son bord haut doit s'arrêter juste sous les hanches, pour "
                 "que le bassin puisse basculer librement.",
         etapes=["Chevilles calées, hanches sur le coussin, bras croisés sur la poitrine.",
                 "Descends le buste en gardant le dos droit, jusqu'à environ 70°.",
                 "Remonte en contractant les fessiers et le bas du dos.",
                 "Arrête-toi quand le corps forme une ligne droite : pas plus haut.",
                 "Mouvement lent, sans à-coup, 2 s dans chaque sens."],
         erreurs=["Monter en hyperextension, dos cambré en arrière.",
                  "Prendre de l'élan en balançant le buste.",
                  "Ajouter du poids trop tôt : commence au poids du corps."]),

    # --- programme B ---
    dict(id="tractions_supination", illu="tractions", nom="Tractions prise supination", groupe="Dos",
         machine="La même barre fixe (ou la machine assistée), mais paumes tournées vers toi, mains "
                 "à largeur d'épaules. Cette prise met plus de biceps dans le coup : tu monteras "
                 "plus haut et plus souvent qu'en prise pronation.",
         reglage="Sur la machine assistée, réduis l'assistance de 5 kg par rapport à ta prise "
                 "pronation habituelle : cette variante est plus facile.",
         etapes=["Prise supination (paumes vers toi), mains à largeur d'épaules.",
                 "Pars bras tendus, épaules basses, gainage serré, jambes croisées.",
                 "Abaisse d'abord les omoplates, puis tire les coudes vers le bas et l'arrière.",
                 "Monte jusqu'à ce que la poitrine approche la barre.",
                 "Redescends en 2 s jusqu'à bras tendus, sans lâcher la tension."],
         erreurs=["Se balancer pour prendre de l'élan.",
                  "Tirer uniquement avec les bras en oubliant le dos.",
                  "Sauter la fin de la descente."]),

    dict(id="rowing_machine", nom="Rowing machine, poitrine appuyée", groupe="Dos",
         machine="La machine de rowing assis avec un coussin pour la poitrine (chest-supported "
                 "row). Le buste étant calé, le bas du dos ne travaille pas : c'est la variante à "
                 "privilégier le lendemain d'une séance lourde.",
         reglage="Règle la hauteur du siège pour que les poignées soient à hauteur du bas de la "
                 "poitrine. Le coussin doit soutenir le sternum, pas la gorge.",
         etapes=["Assis, poitrine contre le coussin, pieds calés, bras tendus vers l'avant.",
                 "Tire les poignées vers les côtes en menant avec les coudes.",
                 "Serre les omoplates 1 s en fin de tirage.",
                 "Laisse repartir les bras en 2 s, sans décoller la poitrine du coussin.",
                 "Prise neutre (paumes face à face) si la machine le permet : plus confortable."],
         erreurs=["Décoller la poitrine du coussin pour tricher.",
                  "Hausser les épaules pendant le tirage.",
                  "Tirer trop haut, vers les aisselles."]),

    dict(id="rowing_t", nom="Rowing barre en T", groupe="Dos",
         machine="La barre dont une extrémité est bloquée au sol dans un angle (ou dans le support "
                 "prévu), et qu'on charge de disques à l'autre bout. Tu te places à cheval "
                 "au-dessus, une poignée en V passée sous la barre.",
         reglage="Commence avec un seul disque de 10 kg : le bras de levier rend l'exercice plus "
                 "lourd qu'il n'en a l'air. Certaines salles ont la machine dédiée, avec un appui "
                 "pour la poitrine.",
         etapes=["Debout à cheval sur la barre, genoux fléchis, buste penché à 45°.",
                 "Dos plat, poignée en V tenue à deux mains sous la barre.",
                 "Tire la barre vers le nombril, coudes près du corps.",
                 "Pause 1 s en haut, omoplates serrées.",
                 "Redescends en contrôlant, sans que les disques touchent le sol entre les reps."],
         erreurs=["Arrondir le dos : arrête la série immédiatement.",
                  "Se redresser à chaque répétition pour lancer la charge.",
                  "Charger trop de disques et ne plus faire que des demi-répétitions."]),

    dict(id="pullover_haltere", nom="Pull-over à l'haltère", groupe="Dos",
         machine="Un banc plat et un seul haltère tenu à deux mains. Version libre du pull-over à "
                 "la poulie : plus d'étirement, et un travail de la cage thoracique que rien "
                 "d'autre ne donne dans le programme.",
         reglage="Allonge-toi dans l'axe du banc, tête soutenue. Haltère modéré : c'est un "
                 "mouvement d'étirement, pas de force. Tiens-le par le disque supérieur, à deux mains.",
         etapes=["Allongé, pieds au sol, haltère tenu bras tendus au-dessus de la poitrine.",
                 "Coudes légèrement fléchis, angle figé.",
                 "Descends l'haltère derrière la tête en arc de cercle, en inspirant à fond.",
                 "Va jusqu'à l'étirement confortable des dorsaux, pas au-delà.",
                 "Ramène l'haltère au-dessus de la poitrine en soufflant, sans plier les bras."],
         erreurs=["Cambrer le bas du dos pour descendre plus loin.",
                  "Plier les coudes : l'exercice devient un travail de triceps.",
                  "Charge trop lourde : l'épaule est en position vulnérable, bras au-dessus de la tête."]),

    # -------------------------------- EPAULES --------------------------------
    dict(id="developpe_militaire", nom="Développé militaire (barre)", groupe="Épaules",
         machine="Une barre droite prise dans un rack à hauteur de poitrine, debout. Alternative guidée : "
                 "la Smith machine, ou la machine à développé épaules assis.",
         reglage="Crochets du rack à hauteur du haut de la poitrine. Prise légèrement plus large que les "
                 "épaules, barre posée sur le haut des pectoraux au départ.",
         etapes=["Debout, pieds largeur de hanches, fessiers et abdominaux serrés.",
                 "Barre sur le haut de la poitrine, coudes légèrement en avant.",
                 "Pousse la barre à la verticale en rentrant un peu la tête quand elle passe le front.",
                 "Termine bras tendus, barre au-dessus du milieu de la tête.",
                 "Redescends en 2 s jusqu'à la poitrine."],
         erreurs=["Cambrer le bas du dos pour compenser : c'est le défaut n°1.",
                  "Pousser la barre vers l'avant au lieu de la verticale.",
                  "Passer la barre derrière la nuque."]),

    dict(id="developpe_haltere_assis", nom="Développé haltères assis", groupe="Épaules",
         machine="Banc à dossier réglé quasiment à la verticale (80-90°) et deux haltères. Version plus "
                 "sûre que la barre pour les épaules.",
         reglage="Dossier bien vertical, haltères montés sur les cuisses puis basculés en position épaules. "
                 "Commence plus léger que ce que tu imagines.",
         etapes=["Assis, dos plaqué, pieds au sol, haltères à hauteur d'oreilles.",
                 "Paumes vers l'avant, coudes légèrement en avant du plan du corps.",
                 "Pousse vers le haut en rapprochant les haltères sans les cogner.",
                 "Descends en 2 s jusqu'à ce que les coudes passent sous les épaules.",
                 "Garde les côtes basses : pas de cambrure."],
         erreurs=["Ouvrir les coudes complètement sur les côtés.",
                  "Décoller le dos du dossier.",
                  "Bloquer sa respiration : souffle en poussant."]),

    dict(id="elevations_laterales", nom="Élévations latérales", groupe="Épaules",
         machine="Deux haltères légers (2 à 6 kg suffisent largement), debout. Il existe aussi une machine "
                 "assise dédiée, avec des coussins sous les bras.",
         reglage="Beaucoup plus léger que ton intuition : si tu dois donner un coup de reins, c'est trop lourd.",
         etapes=["Debout, haltères le long du corps, coudes très légèrement fléchis.",
                 "Monte les bras sur les côtés jusqu'à l'horizontale, pas plus haut.",
                 "Imagine verser deux carafes : le petit doigt légèrement plus haut que le pouce.",
                 "Pause courte en haut, puis descends en 3 s.",
                 "Les épaules restent basses, le buste immobile."],
         erreurs=["Balancer le buste pour lancer les haltères.",
                  "Monter au-dessus de l'horizontale (travail des trapèzes).",
                  "Laisser redescendre les bras en chute libre."]),

    dict(id="tirage_menton", nom="Tirage menton à la poulie (prise large)", groupe="Épaules",
         machine="Poulie basse équipée d'une barre droite. Debout, face à la machine, à 30 cm de la colonne.",
         reglage="Prise large, mains nettement plus écartées que les épaules : c'est cette largeur qui rend "
                 "l'exercice sûr pour l'épaule.",
         etapes=["Debout, barre devant les cuisses, bras tendus.",
                 "Tire la barre vers le haut en menant avec les coudes, qui restent plus hauts que les mains.",
                 "Arrête-toi quand la barre arrive au niveau du haut des pectoraux.",
                 "Pause 1 s, coudes larges, épaules basses.",
                 "Redescends en 2 s."],
         erreurs=["Monter la barre jusqu'au menton avec une prise serrée : pincement de l'épaule.",
                  "Prendre de l'élan avec les jambes.",
                  "Hausser les épaules au lieu d'écarter les coudes."]),

    dict(id="oiseau", nom="Oiseau (élévations postérieures)", groupe="Épaules",
         machine="Deux haltères légers, buste penché en avant. Alternative assise : le pec deck utilisé à "
                 "l'envers (tu t'assieds face au dossier et tu ouvres les bras vers l'arrière).",
         reglage="Très léger : 2 à 5 kg. C'est un muscle petit et souvent négligé, inutile de charger.",
         etapes=["Pieds largeur de hanches, genoux fléchis, buste penché à 45° ou plus.",
                 "Dos plat, bras pendants sous les épaules, coudes à peine fléchis.",
                 "Ouvre les bras sur les côtés jusqu'à l'horizontale, pouces vers le sol.",
                 "Serre les omoplates 1 s en fin de mouvement.",
                 "Redescends lentement, sans laisser tomber les bras."],
         erreurs=["Se redresser à chaque répétition.",
                  "Plier les coudes et transformer ça en rowing.",
                  "Charger lourd : l'arrière d'épaule ne suit pas."]),

    dict(id="face_pull", nom="Face pull à la poulie", groupe="Épaules",
         machine="Colonne à poulie réglée au niveau du visage (ou un peu au-dessus), avec une corde. "
                 "C'est l'exercice de santé de l'épaule : ne le saute pas.",
         reglage="Poulie à hauteur de tête, corde saisie paumes face à face, un pas en arrière pour mettre "
                 "le câble en tension.",
         etapes=["Debout, bras tendus vers la poulie, épaules basses.",
                 "Tire la corde vers ton visage en écartant les mains l'une de l'autre.",
                 "Les coudes finissent hauts, au niveau des épaules ou au-dessus.",
                 "Pause 1 s : tu dois sentir l'arrière des épaules et le milieu du dos.",
                 "Reviens en 2 s bras tendus."],
         erreurs=["Tirer la corde vers la poitrine (ça devient un rowing).",
                  "Coudes qui tombent vers le bas.",
                  "Charge trop lourde qui t'emmène vers l'avant."]),

    dict(id="shrugs", nom="Shrugs (haussements d'épaules)", groupe="Épaules",
         machine="Deux haltères lourds tenus le long du corps, ou une barre. Les racks à haltères vont "
                 "assez haut pour cet exercice : tu peux charger.",
         reglage="Bras tendus, haltères le long des cuisses, prise ferme (des sangles peuvent aider si les "
                 "mains lâchent avant les trapèzes).",
         etapes=["Debout, bras tendus, épaules relâchées vers le bas.",
                 "Hausse les épaules droit vers les oreilles, le plus haut possible.",
                 "Pause 1 s en position haute, sans plier les bras.",
                 "Redescends lentement jusqu'à l'étirement complet.",
                 "Respire : souffle en montant."],
         erreurs=["Faire des rotations d'épaules : mouvement strictement vertical.",
                  "Plier les coudes pour aider.",
                  "Pencher la tête en avant."]),

    # --- programme B ---
    dict(id="presse_epaules", nom="Presse à épaules (machine)", groupe="Épaules",
         machine="La machine assise où l'on pousse deux poignées vers le haut, dossier vertical "
                 "dans le dos. Trajectoire guidée : tu peux charger sans risquer de cambrer, ce "
                 "que le développé militaire debout ne pardonne pas.",
         reglage="Siège réglé pour que les poignées soient au niveau des oreilles au départ, pas "
                 "plus haut. Dos entièrement plaqué au dossier.",
         etapes=["Assis, dos plaqué, pieds au sol, poignées à hauteur d'oreilles.",
                 "Pousse à la verticale jusqu'à tendre les bras sans bloquer les coudes.",
                 "Redescends en 2 s jusqu'à ce que les coudes passent sous les épaules.",
                 "Garde les côtes basses : pas de cambrure malgré le dossier.",
                 "Souffle en poussant, inspire en descendant."],
         erreurs=["Descendre trop bas en forçant sur l'épaule.",
                  "Décoller le dos du dossier en fin de série.",
                  "Pousser en donnant un coup de jambes."]),

    dict(id="elevations_poulie", nom="Élévations latérales à la poulie", groupe="Épaules",
         machine="Une poulie basse et une poignée simple, un bras à la fois. Le câble maintient la "
                 "tension du début à la fin du mouvement, ce que les haltères ne font pas : c'est "
                 "la version la plus efficace de l'élévation latérale.",
         reglage="Poulie tout en bas. Place-toi de profil, la machine du côté opposé au bras qui "
                 "travaille, et attrape la poignée en passant devant toi.",
         etapes=["Debout de profil, poignée dans la main éloignée de la machine, bras devant les cuisses.",
                 "Coude très légèrement fléchi, épaule basse.",
                 "Monte le bras sur le côté jusqu'à l'horizontale, pas plus haut.",
                 "Pause 1 s en haut, puis redescends en 3 s contre la tension du câble.",
                 "Fais toutes les répétitions d'un côté, puis change."],
         erreurs=["Se pencher du côté opposé pour aider.",
                  "Monter au-dessus de l'horizontale.",
                  "Charge trop lourde : 5 kg suffisent souvent sur cet exercice."]),

    dict(id="elevations_frontales", nom="Élévations frontales au disque", groupe="Épaules",
         machine="Un disque de 5 à 15 kg tenu à deux mains (ou un haltère). Travail de l'avant de "
                 "l'épaule, complément direct du développé.",
         reglage="Commence avec un disque de 5 kg. Debout, pieds largeur de hanches, disque tenu à "
                 "deux mains à 3 h et 9 h, bras tendus devant les cuisses.",
         etapes=["Debout, gainage serré, disque devant les cuisses, bras tendus.",
                 "Monte le disque devant toi jusqu'à hauteur des yeux, bras tendus.",
                 "Pas d'élan : le buste reste strictement immobile.",
                 "Pause 1 s en haut, puis descends en 3 s.",
                 "Arrête la série dès que tu as besoin de donner un coup de reins."],
         erreurs=["Se cambrer en arrière pour monter le disque.",
                  "Monter beaucoup plus haut que les yeux.",
                  "Plier les coudes pour raccourcir le levier."]),

    dict(id="oiseau_poulie", nom="Oiseau à la poulie (câbles croisés)", groupe="Épaules",
         machine="La cage à poulies vis-à-vis, poulies réglées à hauteur d'épaules. Tu attrapes la "
                 "poignée de droite avec la main gauche et inversement : les câbles se croisent "
                 "devant toi. Tension constante sur l'arrière de l'épaule, impossible à tricher.",
         reglage="Les deux poulies à hauteur d'épaules, charge légère des deux côtés. Place-toi au "
                 "milieu, un pied légèrement avancé.",
         etapes=["Bras croisés devant toi, chaque main tenant la poignée opposée.",
                 "Bras quasi tendus, coudes à peine fléchis, épaules basses.",
                 "Ouvre les bras sur les côtés en décrivant un grand arc, jusqu'à l'horizontale.",
                 "Serre les omoplates 1 s en fin d'ouverture.",
                 "Reviens en 3 s en retenant la charge, sans laisser les épaules partir en avant."],
         erreurs=["Plier les coudes : le mouvement devient un tirage.",
                  "Ouvrir au-delà de la ligne des épaules.",
                  "Charge trop lourde qui fait basculer le buste en avant."]),

    dict(id="shrugs_barre", nom="Shrugs à la barre", groupe="Épaules",
         machine="Une barre droite chargée, tenue devant les cuisses. Comparé aux haltères, la "
                 "barre permet de charger plus lourd, mais l'amplitude est un peu plus courte.",
         reglage="Barre prise en pronation, mains à largeur d'épaules. Des sangles de tirage "
                 "aident si les mains lâchent avant les trapèzes.",
         etapes=["Debout, barre devant les cuisses, bras tendus, épaules relâchées vers le bas.",
                 "Hausse les épaules droit vers les oreilles, le plus haut possible.",
                 "Pause 1 s en haut sans plier les bras.",
                 "Redescends lentement jusqu'à l'étirement complet des trapèzes.",
                 "Souffle en montant."],
         erreurs=["Faire des rotations d'épaules : le mouvement est strictement vertical.",
                  "Plier les coudes pour aider.",
                  "Pencher la tête en avant sous la charge."]),

    # --------------------------------- ABDOS ---------------------------------
    dict(id="dragon_flag", nom="Dragon flag (version négative)", groupe="Abdos",
         machine="Un banc plat, dont tu attrapes le bord derrière ta tête. C'est l'exercice "
                 "d'abdominaux le plus exigeant du programme : tout le corps reste une planche "
                 "rigide, seuls les abdominaux empêchent le bassin de tomber.",
         reglage="Rien à régler, mais place-toi de façon à pouvoir agripper solidement le banc à "
                 "deux mains, juste au-dessus des épaules. Un tapis au sol si le banc est dur.",
         etapes=["Allongé sur le dos, mains agrippées au bord du banc derrière la tête.",
                 "Décolle le bassin et monte les jambes jusqu'à ce que le corps soit presque "
                 "vertical, en appui sur le haut du dos — pas sur la nuque.",
                 "Serre fessiers et abdominaux : le corps forme une ligne droite, tendue.",
                 "Descends cette ligne le plus lentement possible, sur 4 à 5 secondes.",
                 "Arrête la descente dès que le bas du dos se décolle, puis remonte les genoux "
                 "repliés pour repartir.",
                 "Trop dur ? Fais la même descente genoux fléchis contre la poitrine, puis "
                 "jambes à mi-course, avant de passer aux jambes tendues."],
         erreurs=["Laisser le bas du dos se creuser : c'est lui qui encaisse, pas les abdos.",
                  "Prendre appui sur la nuque au lieu du haut du dos.",
                  "Descendre en chute libre : toute la valeur de l'exercice est dans la lenteur."]),

    dict(id="crunch_decline", nom="Crunch décliné lesté", groupe="Abdos",
         machine="Le banc à abdominaux incliné, avec deux boudins en haut pour caler les pieds "
                 "(tête en bas). Ajoute un disque de 5 à 15 kg tenu sur la poitrine : c'est ce "
                 "qui fait de cet exercice un vrai mouvement de force, avec charge progressive.",
         reglage="Incline le banc de 20 à 30° pour commencer. Cale les pieds sous les boudins, "
                 "genoux fléchis. Prends le disque une fois installé, croisé sur la poitrine.",
         etapes=["Allongé tête en bas, disque serré contre la poitrine, menton légèrement rentré.",
                 "Enroule le buste vers les cuisses en décollant d'abord les omoplates.",
                 "Monte jusqu'à environ 30° au-dessus du banc : inutile d'aller chercher les genoux.",
                 "Souffle à fond en haut, pause 1 s.",
                 "Redescends en 3 s sans laisser la tête retomber en arrière.",
                 "Quand 12 répétitions passent proprement, monte de 2,5 kg."],
         erreurs=["Tirer sur la nuque avec les mains pour se lancer.",
                  "Se relever complètement en poussant avec les fléchisseurs de hanche.",
                  "Prendre un disque trop lourd et raccourcir l'amplitude."]),

    dict(id="v_ups", nom="V-ups (relevés simultanés)", groupe="Abdos",
         machine="Un tapis de sol. Le corps part tendu et se referme en V : haut et bas des "
                 "abdominaux travaillent ensemble, ce qui en fait un excellent exercice de fin "
                 "de bloc, quand la charge n'est plus tenable.",
         reglage="Rien à régler. Version plus facile : plie les genoux et touche les tibias "
                 "(tuck-ups) ; version plus dure : un haltère léger tenu à bout de bras.",
         etapes=["Allongé sur le dos, bras tendus derrière la tête, jambes tendues au sol.",
                 "Décolle simultanément le buste et les jambes en pliant à la hanche.",
                 "Va chercher les pieds avec les mains, corps en V, en équilibre sur les fesses.",
                 "Souffle en montant, pause brève en haut.",
                 "Redescends en 3 s sans laisser les talons ni les épaules toucher le sol.",
                 "Enchaîne sans repos au sol : la tension reste continue sur toute la série."],
         erreurs=["Prendre de l'élan en balançant les bras.",
                  "Laisser le bas du dos se décoller en position basse : réduis l'amplitude.",
                  "Plier les genoux sans le vouloir en fin de série : arrête-toi là."]),

    dict(id="releves_jambes", nom="Relevés de jambes suspendu", groupe="Abdos",
         machine="Barre de traction, ou la chaise romaine (le cadre vertical avec deux coudières et un "
                 "dossier) qui est nettement plus facile à tenir.",
         reglage="Sur la chaise romaine : avant-bras sur les coudières, dos contre le dossier. Suspendu à la "
                 "barre : prise largeur d'épaules, corps immobile.",
         etapes=["Pars corps tendu, jambes sous les hanches, sans balancement.",
                 "Enroule le bassin vers le haut en remontant les genoux ou les jambes tendues.",
                 "Monte au moins jusqu'à l'horizontale, en soufflant.",
                 "Redescends en 3 s, sans laisser tomber les jambes.",
                 "Version facile : genoux fléchis."],
         erreurs=["Se balancer : chaque répétition repart de l'immobilité.",
                  "Ne monter les jambes que par la hanche, sans enrouler le bassin.",
                  "Laisser tomber les jambes en fin de série."]),

    dict(id="crunch_poulie", nom="Crunch à la poulie haute", groupe="Abdos",
         machine="Colonne à poulie haute avec une corde. Tu te mets à genoux devant la machine, dos à la "
                 "colonne ou face à elle selon la place.",
         reglage="Poulie tout en haut, corde saisie de part et d'autre du visage, mains contre les tempes.",
         etapes=["À genoux, hanches fixes, corde tenue près du visage.",
                 "Enroule le buste vers le sol en arrondissant volontairement le haut du dos.",
                 "Le mouvement vient des abdominaux, pas des bras ni des hanches.",
                 "Souffle à fond en position basse, pause 1 s.",
                 "Remonte en 2 s sans relâcher la tension."],
         erreurs=["Tirer avec les bras : les mains ne bougent pas par rapport à la tête.",
                  "Basculer les hanches vers l'arrière.",
                  "Charge trop lourde qui bloque l'enroulement."]),

    dict(id="crunch_inverse", nom="Crunch inversé au sol", groupe="Abdos",
         machine="Tapis de sol, éventuellement un banc plat dont tu attrapes le bord pour te stabiliser.",
         reglage="Aucun. Mains à plat le long du corps ou agrippées derrière la tête à un support fixe.",
         etapes=["Allongé sur le dos, genoux fléchis à 90°, cuisses à la verticale.",
                 "Décolle le bassin du sol en ramenant les genoux vers la poitrine.",
                 "Le mouvement est court : ce sont les abdos du bas qui enroulent le bassin.",
                 "Pause 1 s en haut, puis redescends en 3 s.",
                 "Le bas du dos reste en contact avec le sol au retour."],
         erreurs=["Prendre de l'élan avec les jambes.",
                  "Pousser avec les mains sur le sol.",
                  "Décoller le bas du dos en position basse."]),

    dict(id="russian_twist", nom="Russian twist", groupe="Abdos",
         machine="Un disque de 5 à 10 kg, un haltère ou un médecine-ball, assis sur un tapis.",
         reglage="Commence sans charge pour trouver la position. Pieds au sol (facile) ou décollés (difficile).",
         etapes=["Assis, buste incliné à 45° en arrière, dos droit.",
                 "Disque tenu à deux mains devant le sternum.",
                 "Tourne le buste d'un côté, en amenant le disque près de la hanche.",
                 "Reviens au centre puis tourne de l'autre côté : cela fait 2 répétitions.",
                 "Le regard suit le disque ; le bassin reste immobile."],
         erreurs=["Bouger seulement les bras sans tourner le buste.",
                  "Arrondir le dos.",
                  "Aller vite : la rotation doit être contrôlée."]),

    dict(id="woodchopper", nom="Woodchopper à la poulie", groupe="Abdos",
         machine="Colonne à poulie réglée en position haute, avec une corde ou une poignée simple. "
                 "Tu te places de profil par rapport à la machine.",
         reglage="Poulie haute, un grand pas de côté pour mettre le câble en tension. Charge modérée.",
         etapes=["Debout de profil, pieds largeur d'épaules, poignée tenue à deux mains en haut.",
                 "Tire en diagonale vers la hanche opposée, comme un coup de hache.",
                 "Bras quasi tendus : la rotation vient du tronc, pas des bras.",
                 "Le pied arrière pivote légèrement, le bassin accompagne.",
                 "Reviens en contrôlant, puis change de côté."],
         erreurs=["Tirer uniquement avec les bras.",
                  "Arrondir le dos en fin de rotation.",
                  "Charge trop lourde qui déséquilibre."]),

    dict(id="ab_wheel", nom="Roue abdominale (ab wheel)", groupe="Abdos",
         machine="La petite roue à deux poignées, dans le bac à accessoires. Exercice difficile : "
                 "à garder pour la fin, et à remplacer par une planche dynamique si le dos tire.",
         reglage="À genoux sur un tapis (mets une serviette pliée sous les genoux). Roue sous les épaules.",
         etapes=["À genoux, mains sur les poignées, bras tendus, dos légèrement arrondi.",
                 "Rentre le nombril et serre les fessiers avant de partir.",
                 "Déroule la roue vers l'avant en gardant le bassin rétroversé.",
                 "Va seulement jusqu'où tu peux garder le dos non cambré.",
                 "Reviens en tirant avec les abdominaux, pas avec les bras."],
         erreurs=["Aller trop loin : le bas du dos se creuse et c'est lui qui encaisse.",
                  "Lever les fesses au retour.",
                  "Faire l'exercice en fatigue extrême, contrôle perdu."]),

    dict(id="planche", nom="Planche ventrale (gainage)", groupe="Abdos",
         machine="Un simple tapis de sol. Coudes sous les épaules, avant-bras à plat.",
         reglage="Aucun matériel. Si c'est trop dur : pose les genoux au sol, la ligne épaules-hanches-genoux "
                 "reste droite.",
         etapes=["Coudes à la verticale sous les épaules, avant-bras parallèles.",
                 "Pieds écartés de la largeur des hanches, corps en ligne droite.",
                 "Rentre légèrement le bassin (comme si tu rentrais le nombril).",
                 "Serre fessiers et abdominaux, respire normalement.",
                 "Tiens 45 s, deux séries, en toute fin de séance.",
                 "Version bras tendus (séance D) : mains sous les épaules, coudes déverrouillés."],
         erreurs=["Fesses trop hautes (position de repos) ou trop basses (mal de dos).",
                  "Bloquer sa respiration.",
                  "Regarder devant : la nuque doit rester dans le prolongement du dos."]),

    dict(id="planche_laterale", nom="Planche latérale", groupe="Abdos",
         machine="Tapis de sol. Tu es sur le côté, en appui sur un seul avant-bras.",
         reglage="Coude sous l'épaule, pieds superposés (ou décalés l'un devant l'autre pour plus de stabilité).",
         etapes=["Allongé sur le côté, coude à la verticale sous l'épaule.",
                 "Décolle les hanches : épaule, hanche et cheville forment une ligne.",
                 "Bras libre tendu vers le plafond ou posé sur la hanche.",
                 "Tiens 30 s, puis change de côté ; deux séries de chaque côté.",
                 "Version facile : genoux fléchis au sol."],
         erreurs=["Hanches qui redescendent vers le sol.",
                  "Basculer le buste vers l'avant ou l'arrière.",
                  "Tête qui tombe vers l'épaule."]),

    dict(id="hollow", nom="Hollow body hold", groupe="Abdos",
         machine="Tapis de sol. Exercice au poids du corps, très efficace sur le gainage profond.",
         reglage="Rien à régler. Le point clé : le bas du dos reste collé au sol (repère vert sur le schéma).",
         etapes=["Allongé sur le dos, plaque le bas du dos au sol en rentrant le nombril.",
                 "Décolle les épaules et la tête de quelques centimètres.",
                 "Tends les jambes et décolle-les à 20-30 cm du sol.",
                 "Bras tendus vers l'arrière ou le long du corps (plus facile).",
                 "Tiens 30 s en gardant le bas du dos plaqué, deux séries."],
         erreurs=["Laisser le bas du dos se décoller : remonte les jambes plus haut.",
                  "Tirer sur la nuque avec les mains.",
                  "Retenir sa respiration."]),
]

IDX = {f["id"]: i + 1 for i, f in enumerate(FICHES)}


def resoudre(txt):
    """Remplace {fiche:identifiant} par le numéro de fiche courant."""
    import re
    return re.sub(r"\{fiche:([a-z_]+)\}", lambda m: str(IDX[m.group(1)]), txt)

# Seances : (titre, sous-titre, [(id ou None, nom affiche, series, reps, repos, note)])
SEANCES = [
    ("Séance A — Pectoraux", "Lundi · 50 à 60 min · puis bloc abdos A et gainage", [
        ("developpe_couche", "Développé couché à la barre", "4", "8 à 10", "2 min", "Exercice principal, le plus lourd"),
        ("developpe_incline", "Développé incliné haltères (30°)", "3", "10 à 12", "90 s", "Haut des pectoraux"),
        ("ecarte_poulie", "Écarté à la poulie vis-à-vis", "3", "12 à 15", "60 s", "Ou pec deck (fiche {fiche:pec_deck}) si les poulies sont prises"),
        ("dips", "Dips assistés ou pompes", "3", "10 à 12", "90 s", "Buste penché en avant"),
        ("ecarte_incline", "Écarté incliné haltères", "2", "15", "60 s", "Finition, charge légère"),
    ]),
    ("Séance B — Dos", "Mardi · 45 à 55 min · puis bloc abdos B et gainage", [
        ("tractions", "Tractions", "4", "8 à 10", "2 min",
         "Assistées tant que 8 reps ne passent pas · ou tirage vertical (fiche {fiche:tirage_vertical})"),
        ("rowing_barre", "Rowing barre, buste penché", "4", "8 à 10", "2 min", "Dos plat impératif"),
        ("tirage_horizontal", "Tirage horizontal à la poulie", "3", "10 à 12", "90 s",
         "Serrer les omoplates · variante : pull-over poulie (fiche {fiche:pullover_poulie})"),
        ("rowing_haltere", "Rowing haltère à un bras", "3", "10 à 12 par bras", "60 s", "Descente contrôlée"),
        ("extensions_lombaires", "Extensions lombaires (banc 45°)", "2", "15", "45 s", "Sans hyperextension"),
    ]),
    ("Séance C — Épaules", "Jeudi · 45 à 55 min · puis bloc abdos C et gainage", [
        ("developpe_militaire", "Développé militaire", "4", "8 à 10", "2 min", "Abdos serrés, pas de cambrure"),
        ("elevations_laterales", "Élévations latérales", "3", "12 à 15", "60 s",
         "Léger, sans élan · variante : tirage menton (fiche {fiche:tirage_menton})"),
        ("oiseau", "Oiseau (arrière d'épaule)", "3", "15", "60 s", "Très léger"),
        ("face_pull", "Face pull à la poulie", "3", "15", "45 s", "Santé de l'épaule : à ne pas sauter"),
        ("shrugs", "Shrugs aux haltères", "2", "12 à 15", "60 s", "Pause 1 s en haut"),
    ]),
    ("Séance D — Haut du corps complet", "Vendredi · 45 à 55 min · puis bloc abdos D et gainage", [
        ("developpe_incline", "Développé incliné haltères", "3", "10", "90 s", "Pectoraux"),
        ("tirage_vertical", "Tirage vertical prise neutre", "3", "10", "90 s", "Dos"),
        ("developpe_haltere_assis", "Développé haltères assis", "3", "10 à 12", "90 s", "Épaules"),
        ("pec_deck", "Pec deck", "3", "15", "60 s", "Pectoraux, finition"),
    ]),
]

BLOCS = [
    ("Bloc abdos A — force", "5 à 6 min, en fin de séance A", [
        ("dragon_flag", "Dragon flag (négatif)", "3", "6 à 8", "90 s"),
        ("crunch_decline", "Crunch décliné lesté", "3", "10 à 12", "60 s"),
    ]),
    ("Bloc abdos B — grand droit", "5 à 6 min, en fin de séance B", [
        ("releves_jambes", "Relevés de jambes suspendu", "3", "10 à 15", "60 s"),
        ("crunch_poulie", "Crunch à la poulie haute", "3", "15", "45 s"),
    ]),
    ("Bloc abdos C — obliques", "5 à 6 min, en fin de séance C", [
        ("russian_twist", "Russian twist (avec disque)", "3", "20 (10 par côté)", "45 s"),
        ("woodchopper", "Woodchopper à la poulie", "3", "12 par côté", "45 s"),
    ]),
    ("Bloc abdos D — mixte", "5 à 6 min, en fin de séance D", [
        ("v_ups", "V-ups", "3", "12 à 15", "45 s"),
        ("ab_wheel", "Roue abdominale", "3", "8 à 12", "60 s"),
    ]),
]

# Le finisher de gainage : 2 à 3 min à la toute fin de chaque séance, pour
# équilibrer un bloc abdominal devenu très dynamique.
GAINAGE = {
    "A": ("planche", "Planche ventrale", "2", "45 s", "30 s"),
    "B": ("planche_laterale", "Planche latérale", "2", "30 s par côté", "30 s"),
    "C": ("hollow", "Hollow body hold", "2", "30 s", "30 s"),
    "D": ("planche", "Planche ventrale, bras tendus", "2", "45 s", "30 s"),
}

# ======================= PROGRAMME B — semaine 2 ==========================
# Mêmes muscles, mêmes jours, mêmes volumes : uniquement d'autres exercices.

SEANCES_B = [
    ("Séance A — Pectoraux", "Lundi · 50 à 60 min · puis bloc abdos A et gainage", [
        ("developpe_couche_halteres", "Développé couché aux haltères", "4", "8 à 10", "2 min",
         "Exercice principal, chaque bras travaille seul"),
        ("developpe_decline", "Développé décliné à la barre", "3", "10 à 12", "90 s",
         "Bas des pectoraux"),
        ("presse_pectoraux", "Presse à pectoraux (machine)", "3", "12", "90 s",
         "Charge libre puisque la trajectoire est guidée"),
        ("ecarte_poulie_basse", "Écarté poulie basse, de bas en haut", "3", "12 à 15", "60 s",
         "Haut des pectoraux"),
        ("pompes", "Pompes lestées", "2", "10 à 15", "60 s", "Finisher, jusqu'à 2 reps de la limite"),
    ]),
    ("Séance B — Dos", "Mardi · 45 à 55 min · puis bloc abdos B et gainage", [
        ("tractions_supination", "Tractions prise supination", "4", "8 à 10", "2 min",
         "Plus faciles que la prise pronation"),
        ("rowing_machine", "Rowing machine, poitrine appuyée", "4", "10 à 12", "90 s",
         "Le bas du dos ne travaille pas"),
        ("rowing_t", "Rowing barre en T", "3", "10 à 12", "90 s", "Dos plat impératif"),
        ("pullover_haltere", "Pull-over à l'haltère", "3", "12 à 15", "60 s", "Étirement des dorsaux"),
        ("extensions_lombaires", "Extensions lombaires (banc 45°)", "2", "15", "45 s",
         "Sans hyperextension"),
    ]),
    ("Séance C — Épaules", "Jeudi · 45 à 55 min · puis bloc abdos C et gainage", [
        ("presse_epaules", "Presse à épaules (machine)", "4", "10", "2 min",
         "Trajectoire guidée, pas de cambrure possible"),
        ("elevations_poulie", "Élévations latérales à la poulie", "3", "12 à 15 par bras", "45 s",
         "Tension constante · variante : élévations frontales (fiche {fiche:elevations_frontales})"),
        ("oiseau_poulie", "Oiseau à la poulie, câbles croisés", "3", "15", "60 s",
         "Arrière de l'épaule"),
        ("face_pull", "Face pull à la poulie", "3", "15", "45 s",
         "Gardé des deux programmes : c'est l'exercice de santé de l'épaule"),
        ("shrugs_barre", "Shrugs à la barre", "2", "12 à 15", "60 s", "Plus lourd qu'aux haltères"),
    ]),
    ("Séance D — Haut du corps complet", "Vendredi · 45 à 55 min · puis bloc abdos D et gainage", [
        ("presse_pectoraux", "Presse à pectoraux", "3", "10", "90 s", "Pectoraux"),
        ("rowing_machine", "Rowing machine", "3", "10", "90 s", "Dos"),
        ("presse_epaules", "Presse à épaules", "3", "10 à 12", "90 s", "Épaules"),
        ("ecarte_poulie_basse", "Écarté poulie basse", "3", "15", "60 s", "Pectoraux, finition"),
    ]),
]

BLOCS_B = [
    ("Bloc abdos A — suspension", "5 à 6 min, en fin de séance A", [
        ("releves_jambes", "Relevés de jambes suspendu", "3", "10 à 15", "60 s"),
        ("ab_wheel", "Roue abdominale", "3", "8 à 12", "60 s"),
    ]),
    ("Bloc abdos B — flexion lestée", "5 à 6 min, en fin de séance B", [
        ("crunch_decline", "Crunch décliné lesté", "3", "10 à 12", "60 s"),
        ("crunch_inverse", "Crunch inversé au sol", "3", "15", "45 s"),
    ]),
    ("Bloc abdos C — force", "5 à 6 min, en fin de séance C", [
        ("dragon_flag", "Dragon flag (négatif)", "3", "6 à 8", "90 s"),
        ("v_ups", "V-ups", "3", "12 à 15", "45 s"),
    ]),
    ("Bloc abdos D — mixte", "5 à 6 min, en fin de séance D", [
        ("crunch_poulie", "Crunch à la poulie haute", "3", "15", "45 s"),
        ("woodchopper", "Woodchopper à la poulie", "3", "12 par côté", "45 s"),
    ]),
]

GAINAGE_B = {
    "A": ("hollow", "Hollow body hold", "2", "30 s", "30 s"),
    "B": ("planche", "Planche ventrale", "2", "45 s", "30 s"),
    "C": ("planche_laterale", "Planche latérale", "2", "30 s par côté", "30 s"),
    "D": ("hollow", "Hollow body hold", "2", "30 s", "30 s"),
}

SEMAINE = [
    ("Lundi", "Séance A — Pectoraux + abdos + gainage", "50 à 60 min"),
    ("Mardi", "Séance B — Dos + abdos + gainage", "45 à 55 min"),
    ("Mercredi", "Repos (cardio du matin uniquement)", "—"),
    ("Jeudi", "Séance C — Épaules + abdos + gainage", "45 à 55 min"),
    ("Vendredi", "Séance D — Haut du corps complet + abdos + gainage", "45 à 55 min"),
    ("Samedi", "Repos complet", "—"),
    ("Dimanche", "Repos complet", "—"),
]

SEMAINE_B = [(j, s.replace("Séance ", "Séance "), d) for j, s, d in SEMAINE]

# Les deux programmes se suivent par blocs de 4 à 5 semaines, pas en alternance
# hebdomadaire : il faut répéter un exercice plusieurs fois pour progresser dessus.
PROGRAMMES = [
    dict(cle="A", titre="Programme A", sous="1er bloc · 4 à 5 semaines",
         seances=SEANCES, blocs=BLOCS, gainage=GAINAGE, semaine=SEMAINE),
    dict(cle="B", titre="Programme B", sous="2e bloc · 4 à 5 semaines",
         seances=SEANCES_B, blocs=BLOCS_B, gainage=GAINAGE_B, semaine=SEMAINE_B),
]
