# Fleet Intelligence

Maquette interactive d’une tour de contrôle pour flottes de véhicules à Abidjan : VTC, livraison moto, camions et déménagement. Ville en 3D, vue conducteur, plateforme logistique avec huit agents IA, alertes à examiner avant de décider.

> **Démonstration : toutes les données sont simulées.** Aucun véhicule, chauffeur, client ni montant n’est réel. Aucune API Yango, aucun GPS et aucun modèle de langage n’est connecté. Les agents IA sont des règles déterministes.

![Centre de commande en 3D](docs/captures/hero_city.jpg)

## Ce que montre la maquette

| Écran | Ce qu’on y voit |
|---|---|
| Centre de commande | Ville en 3D par commune, véhicules colorés par statut, fil des opérations avec montants de course |
| Fiche véhicule | Chauffeur, trajet, montant de la course, recettes du jour, carburant, entretien |
| Vue conducteur | La caméra traverse le toit : tableau de bord 3D, volant qui tourne, mains du chauffeur, écran de bord |
| Opérations VTC | Revenu par véhicule et par chauffeur, heures de pointe, classements |
| Plateforme logistique | Garage, dispatch, salle de l’orchestrateur, bureaux, quai ; huit agents robots qui circulent |
| Décision | Chaque alerte s’examine avec ses preuves ; commentaire obligatoire pour prendre en charge ou résoudre |
| Centre IA | Questions en français, trace des agents sollicités, niveau de confiance |
| Rôles | Six rôles ; les montants sont masqués pour le dispatcher |

| Vue conducteur | Agent IA en face à face |
|---|---|
| ![Vue conducteur](docs/captures/hero_cab_c.jpg) | ![Agent IA](docs/captures/08_agent.jpg) |

La barre de régie, en bas de l’écran, pilote la démonstration : scénario, vitesse du temps, pause, remise à zéro.

## Lancer en local

Aucune installation ni compilation : c’est un site statique.

```bash
git clone https://github.com/<votre-compte>/fleet-intelligence.git
cd fleet-intelligence
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Un serveur local est préférable à l’ouverture directe du fichier `index.html`.

## Publier sur GitHub Pages

1. Créer un dépôt vide sur GitHub, par exemple `fleet-intelligence`.
2. Depuis ce dossier :
   ```bash
   git remote add origin https://github.com/<votre-compte>/fleet-intelligence.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`.
4. Après une à deux minutes, la maquette est en ligne à l’adresse `https://<votre-compte>.github.io/fleet-intelligence/`.

Le fichier `.nojekyll` évite que GitHub transforme le site.

## Structure

```
index.html                 point d’entrée
assets/css/styles.css      thème (asphalte, jaune signalisation, police Archivo)
assets/js/engine.js        données simulées et agents à base de règles (window.FLEET)
assets/js/charts.js        graphiques SVG
assets/js/scene.js         ville 3D, véhicules, poste de conduite, plateforme logistique (Three.js)
assets/js/app.js           écrans, navigation, rôles, alertes, décisions
assets/vendor/three/       Three.js r128 (licence MIT incluse)
docs/                      présentation, user stories et captures d’écran
```

Les données sont générées de façon déterministe (graine fixe) : la démonstration est identique à chaque lancement.

## Documents

- [Présentation pour un dirigeant de flotte VTC (PDF)](docs/Fleet-Intelligence_Presentation-VTC.pdf)
- [User stories illustrées (PDF)](docs/Fleet-Intelligence_User-stories-VTC.pdf)

## Limites connues

- Positions, courses, carburant et entretien sont simulés ; le plan de la ville est schématique.
- Les rôles se changent dans la barre du haut pour la démonstration ; il n’y a ni authentification ni serveur.
- Les décisions et le journal vivent dans la page et disparaissent au rechargement.
- La police Archivo vient de Google Fonts ; hors connexion, une police système la remplace.
