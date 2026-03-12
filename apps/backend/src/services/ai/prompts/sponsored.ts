export function getSponsoredPrompt(
  keyword: string,
  anchorText: string,
  targetUrl: string,
  brief: string | undefined,
  wordCount: number,
  language: string,
  siteName: string
): string {
  return `Rédige un article sponsorisé naturel et de qualité pour le mot-clé : "${keyword}"

Contexte :
- Site : ${siteName}
- Langue : ${language === 'fr' ? 'Français' : language}
- Longueur cible : environ ${wordCount} mots

LIEN SPONSORISÉ À INTÉGRER :
- Texte d'ancre : "${anchorText}"
- URL cible : ${targetUrl}
- Le lien doit apparaître sous cette forme exacte : <a href="${targetUrl}">${anchorText}</a>
- Intègre ce lien de manière NATURELLE dans le contenu, au milieu d'un paragraphe pertinent
- Le lien ne doit PAS être en début ou fin d'article
- Le contexte autour du lien doit être thématiquement cohérent

${brief ? `Brief du client : ${brief}` : ''}

Structure attendue :
1. Un titre <h1> accrocheur lié au sujet
2. Une introduction engageante
3. 3 à 4 sections avec des <h2> pertinents
4. Le lien sponsorisé intégré naturellement dans une des sections centrales
5. Une conclusion
6. Les méta-données en commentaires HTML

Éléments visuels OBLIGATOIRES :
- Au moins une liste à puces avec un emoji en début de chaque item (✅, 💡, 🔑, 🎯, ⚡, 📌)
- Au moins un tableau récapitulatif ou comparatif avec des emojis dans les cellules (✅, ❌, ⚠️, 💡, 🔥, ⭐)

IMPORTANT : L'article doit avoir l'air 100% éditorial. Le lien doit sembler être une recommandation naturelle, pas une publicité.`;
}
