# Rapport de production

- Durée : **72 s** (69 s de voix + ≈ 3 s de visuel final, consigne de John), calée sur l'enregistrement ElevenLabs de la voix off v3 (validée par John le 22/11/2026).
- Format : vertical 9:16, 1080 × 1920, 30 i/s.
- Export : MP4 H.264, yuv420p.
- Audio : aucune piste audio (vérifiée automatiquement par le workflow).
- Revue Claude : `06-claude-review.md`.
- Voix off : `07-final-voiceover.md` (v3).
- Storyboard : `10-storyboard.md`.
- Animation : `animation/animation.html` (motion design en code, aperçu possible dans un navigateur), rendue par `animation/render.js`.
- Rendu : GitHub Actions, workflow « Rendu vidéo (MP4 silencieux) ». Le MP4 est déposé dans `export/` à chaque rendu.
- Polices : Cormorant Garamond et Montserrat (Google Fonts, licence SIL OFL), incluses dans `animation/fonts/`.
- Contrôles techniques : voir `controle.txt` dans l'artefact du run.
- Validation éditoriale finale : John (synchronisation avec la voix dans Canva).
- Version avec voix : `export/002-conscience-et-compulsivite-avec-voix.mp4` (AAC), produite à la demande de John à partir de son enregistrement ElevenLabs. L'animation est calée sur les silences mesurés de cet enregistrement. La version silencieuse reste la référence pour Canva.
