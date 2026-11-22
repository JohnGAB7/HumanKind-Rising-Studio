# Animation — 002 Conscience et compulsivité

- `animation.html` : animation en canvas, déterministe. Ouvrir dans un navigateur pour un aperçu en boucle (servir le dossier en local pour charger les polices).
- `render.js` : rend chaque image avec Playwright/Chromium puis encode en MP4 H.264 sans audio via ffmpeg.
- `fonts/` : Cormorant Garamond et Montserrat Light (Google Fonts, SIL Open Font License).

Le rendu se fait automatiquement dans GitHub Actions à chaque modification de ce dossier, ou à la demande (onglet Actions → « Rendu vidéo (MP4 silencieux) » → Run workflow).
