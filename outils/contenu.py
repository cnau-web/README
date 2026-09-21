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

    # --------------------------------- ABDOS ---------------------------------
    dict(id="planche", nom="Planche ventrale (gainage)", groupe="Abdos",
         machine="Un simple tapis de sol. Coudes sous les épaules, avant-bras à plat.",
         reglage="Aucun matériel. Si c'est trop dur : pose les genoux au sol, la ligne épaules-hanches-genoux "
                 "reste droite.",
         etapes=["Coudes à la verticale sous les épaules, avant-bras parallèles.",
                 "Pieds écartés de la largeur des hanches, corps en ligne droite.",
                 "Rentre légèrement le bassin (comme si tu rentrais le nombril).",
                 "Serre fessiers et abdominaux, respire normalement.",
                 "Tiens 45 à 60 s, ou arrête dès que les hanches s'affaissent."],
         erreurs=["Fesses trop hautes (position de repos) ou trop basses (mal de dos).",
                  "Bloquer sa respiration.",
                  "Regarder devant : la nuque doit rester dans le prolongement du dos."]),

    dict(id="planche_laterale", nom="Planche latérale", groupe="Abdos",
         machine="Tapis de sol. Tu es sur le côté, en appui sur un seul avant-bras.",
         reglage="Coude sous l'épaule, pieds superposés (ou décalés l'un devant l'autre pour plus de stabilité).",
         etapes=["Allongé sur le côté, coude à la verticale sous l'épaule.",
                 "Décolle les hanches : épaule, hanche et cheville forment une ligne.",
                 "Bras libre tendu vers le plafond ou posé sur la hanche.",
                 "Tiens 30 à 45 s, puis change de côté.",
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
                 "Tiens 30 s en gardant le bas du dos plaqué."],
         erreurs=["Laisser le bas du dos se décoller : remonte les jambes plus haut.",
                  "Tirer sur la nuque avec les mains.",
                  "Retenir sa respiration."]),

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
]

IDX = {f["id"]: i + 1 for i, f in enumerate(FICHES)}

# Seances : (titre, sous-titre, [(id ou None, nom affiche, series, reps, repos, note)])
SEANCES = [
    ("Séance A — Pectoraux", "Lundi · 50 à 60 min · suivie du bloc abdos A", [
        ("developpe_couche", "Développé couché à la barre", "4", "8 à 10", "2 min", "Exercice principal, le plus lourd"),
        ("developpe_incline", "Développé incliné haltères (30°)", "3", "10 à 12", "90 s", "Haut des pectoraux"),
        ("ecarte_poulie", "Écarté à la poulie vis-à-vis", "3", "12 à 15", "60 s", "Ou pec deck (fiche 4) si les poulies sont prises"),
        ("dips", "Dips assistés ou pompes", "3", "10 à 12", "90 s", "Buste penché en avant"),
        ("ecarte_incline", "Écarté incliné haltères", "2", "15", "60 s", "Finition, charge légère"),
    ]),
    ("Séance B — Dos", "Mardi · 50 à 60 min · suivie du bloc abdos B", [
        ("tractions", "Tractions (ou tirage vertical, fiche 8)", "4", "8 à 10", "2 min", "Assistées tant que 8 reps ne passent pas"),
        ("rowing_barre", "Rowing barre, buste penché", "4", "8 à 10", "2 min", "Dos plat impératif"),
        ("tirage_horizontal", "Tirage horizontal à la poulie", "3", "10 à 12", "90 s", "Serrer les omoplates"),
        ("rowing_haltere", "Rowing haltère à un bras", "3", "10 à 12 par bras", "60 s", "Descente contrôlée"),
        ("pullover_poulie", "Pull-over poulie haute, bras tendus", "3", "12 à 15", "60 s", "Isolation du grand dorsal"),
        ("extensions_lombaires", "Extensions lombaires (banc 45°)", "2", "15", "45 s", "Sans hyperextension"),
    ]),
    ("Séance C — Épaules", "Jeudi · 45 à 55 min · suivie du bloc abdos C", [
        ("developpe_militaire", "Développé militaire", "4", "8 à 10", "2 min", "Abdos serrés, pas de cambrure"),
        ("elevations_laterales", "Élévations latérales", "4", "12 à 15", "60 s", "Léger, sans élan"),
        ("tirage_menton", "Tirage menton poulie, prise large", "3", "12", "60 s", "S'arrêter au haut des pectoraux"),
        ("oiseau", "Oiseau (arrière d'épaule)", "3", "15", "60 s", "Très léger"),
        ("face_pull", "Face pull à la poulie", "3", "15", "45 s", "Santé de l'épaule : à ne pas sauter"),
        ("shrugs", "Shrugs aux haltères", "3", "12 à 15", "60 s", "Pause 1 s en haut"),
    ]),
    ("Séance D — Haut du corps complet", "Vendredi · 55 à 65 min · suivie du bloc abdos A", [
        ("developpe_incline", "Développé incliné haltères", "3", "10", "90 s", "Pectoraux"),
        ("tirage_vertical", "Tirage vertical prise neutre", "3", "10", "90 s", "Dos"),
        ("developpe_haltere_assis", "Développé haltères assis", "3", "10 à 12", "90 s", "Épaules"),
        ("tirage_horizontal", "Rowing poulie basse", "3", "12", "60 s", "Dos"),
        ("elevations_laterales", "Élévations latérales", "3", "15", "30 s", "En superset avec le pec deck"),
        ("pec_deck", "Pec deck", "3", "15", "60 s", "Pectoraux, finition"),
    ]),
]

BLOCS = [
    ("Bloc abdos A — gainage", "5 à 8 min, en fin de séance A et D", [
        ("planche", "Planche ventrale", "3", "45 à 60 s", "45 s"),
        ("planche_laterale", "Planche latérale", "3", "30 à 45 s par côté", "30 s"),
        ("hollow", "Hollow body hold", "3", "30 s", "45 s"),
    ]),
    ("Bloc abdos B — grand droit", "6 à 9 min, en fin de séance B", [
        ("releves_jambes", "Relevés de jambes suspendu", "4", "10 à 15", "60 s"),
        ("crunch_poulie", "Crunch à la poulie haute", "3", "15", "45 s"),
        ("crunch_inverse", "Crunch inversé au sol", "3", "15", "45 s"),
    ]),
    ("Bloc abdos C — obliques", "6 à 9 min, en fin de séance C", [
        ("russian_twist", "Russian twist (avec disque)", "3", "20 (10 par côté)", "45 s"),
        ("woodchopper", "Woodchopper à la poulie", "3", "12 par côté", "45 s"),
        ("ab_wheel", "Roue abdominale", "3", "8 à 12", "60 s"),
    ]),
]

SEMAINE = [
    ("Lundi", "Séance A — Pectoraux + bloc abdos A", "50 à 60 min"),
    ("Mardi", "Séance B — Dos + bloc abdos B", "50 à 60 min"),
    ("Mercredi", "Repos (cardio du matin uniquement)", "—"),
    ("Jeudi", "Séance C — Épaules + bloc abdos C", "45 à 55 min"),
    ("Vendredi", "Séance D — Haut du corps complet + bloc abdos A", "55 à 65 min"),
    ("Samedi", "Repos complet", "—"),
    ("Dimanche", "Repos complet", "—"),
]
