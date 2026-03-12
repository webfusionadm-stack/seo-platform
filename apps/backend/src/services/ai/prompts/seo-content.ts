export function getSeoPrompt(keyword: string, wordCount: number, language: string, siteName: string): string {
  return `Rédige un article SEO complet et optimisé pour le mot-clé principal : "${keyword}"

Contexte :
- Site : ${siteName}
- Langue : ${language === 'fr' ? 'Français' : language}
- Longueur cible : environ ${wordCount} mots

Structure attendue :
1. Un titre <h1> accrocheur et optimisé contenant le mot-clé
2. Une introduction engageante (2-3 paragraphes) qui présente le sujet
3. 3 à 5 sections avec des <h2> pertinents contenant des variations du mot-clé
4. Des sous-sections <h3> si nécessaire pour approfondir
5. Des listes à puces <ul><li> pour les points clés
6. Une conclusion avec un appel à l'action
7. Les méta-données en commentaires HTML

Optimisation SEO :
- Densité du mot-clé naturelle (1-2%)
- Utilise des synonymes et le champ sémantique du mot-clé
- Phrases de transition entre les sections
- Paragraphes de 2-4 phrases maximum

Éléments visuels OBLIGATOIRES :
- Au moins une liste à puces avec un emoji en début de chaque item (✅, 💡, 🔑, 🎯, ⚡, 📌)
- Au moins un tableau récapitulatif ou comparatif avec des emojis dans les cellules (✅, ❌, ⚠️, 💡, 🔥, ⭐) pour rendre le contenu scannable`;
}
