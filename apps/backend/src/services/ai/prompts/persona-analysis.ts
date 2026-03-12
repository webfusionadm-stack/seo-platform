export function getPersonaAnalysisPrompt(sampleText: string): string {
  return `Tu es un expert en analyse stylistique et rédactionnelle. Ta mission est d'analyser un article exemple pour en extraire un profil rédactionnel ultra-détaillé qui permettra de reproduire fidèlement le style de l'auteur.

Analyse l'article suivant en profondeur :

=== ARTICLE À ANALYSER ===
${sampleText}
=== FIN DE L'ARTICLE ===

Génère un JSON strict avec EXACTEMENT 4 champs :

1. "tone" : Un mot-clé parmi "conversationnel", "professionnel", "academique", "enthousiaste", "neutre". Choisis celui qui correspond le mieux au ton dominant.

2. "formalityLevel" : Un parmi "informel", "semi-formel", "formel".

3. "theme" : La thématique principale de l'article en 1 à 5 mots (ex: "entrepreneuriat et reconversion", "cuisine healthy", "voyages en famille", "marketing digital").

4. "style" : UN SEUL BLOC DE TEXTE RICHE ET FLUIDE (~150-250 mots) qui constitue un vrai portrait rédactionnel complet de l'auteur. Ce texte doit se lire comme un brief éditorial et couvrir TOUS ces aspects :
   - Le ton et l'attitude générale de l'auteur
   - Sa façon d'interpeller le lecteur (tutoiement, vouvoiement, "on" inclusif, apostrophes directes)
   - Ses expressions et tournures récurrentes (CITE-LES entre guillemets simples, extraites du texte)
   - Son type d'anecdotes (personnelles, professionnelles, données chiffrées, métaphores...)
   - Sa structure de pensée (paragraphes courts, listes, alternance, transitions)
   - Son rythme de phrases (courtes percutantes, longues explicatives, alternance)
   - Ses tics d'écriture (parenthèses, tirets, points de suspension, exclamations, questions rhétoriques)
   - Son vocabulaire (registre, champs lexicaux, niveau technique, mots favoris entre guillemets)
   - Sa façon de commencer et conclure ses idées
   - Ce qu'il faut ÉVITER pour ne pas trahir ce style

   Le texte doit se lire naturellement, comme un portrait rédactionnel. Pas de listes, pas de catégories — un texte fluide.

   Exemple de format attendu pour "style" :
   "Son style est conversationnel et accessible, avec un ton d'ami qui partage ses connaissances. Il vouvoie le lecteur tout en restant chaleureux. Il utilise des expressions comme 'J'ai souvent remarqué que...', 'Ma méthode est simple...'. Ses anecdotes sont professionnelles mais légères, jamais trop personnelles. Il structure ses idées avec des paragraphes courts, alterne phrases punchy et explications. Il interpelle le lecteur directement et pose des questions rhétoriques pour maintenir l'engagement."

Règles :
- Tous les textes doivent être en français.
- Le champ "style" doit faire entre 600 et 1200 caractères.
- CITE des exemples concrets tirés de l'article entre guillemets simples.
- Réponds UNIQUEMENT avec le JSON, sans markdown, sans backticks, sans explication.

Format :
{"tone":"...","formalityLevel":"...","theme":"...","style":"..."}`;
}
