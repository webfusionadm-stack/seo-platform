export interface PersonaForPrompt {
  name?: string;
  tone?: string;
  writingStyle?: string;
  vocabulary?: string;
  anecdoteType?: string;
  formalityLevel?: string;
  recurringExpressions?: string;
  additionalInstructions?: string;
}

export function getH2StructureSystemPrompt(persona?: PersonaForPrompt): string {
  let prompt = `Tu es un expert en rédaction web et SEO.

À partir de l'analyse d'intention et du mot-clé fournis, tu dois proposer exactement 5 titres H2 pour structurer l'article.

Règles :
- Chaque H2 doit être unique et couvrir un aspect différent du sujet
- Les H2 doivent suivre un ordre logique et naturel
- Entre 30 et 60 caractères par H2 : les H2 doivent être courts, percutants et orientés SEO. Privilégie la concision.
- Au moins 3 H2 doivent être sous forme de QUESTION (commence par Pourquoi, Comment, Qu'est-ce que, Quand, Quel, Faut-il...)
- VARIÉTÉ OBLIGATOIRE : ne commence JAMAIS un H2 par "Tableau comparatif", "Comparatif des", "Les X meilleurs", "Top X" ou toute autre formule générique passe-partout. Chaque H2 doit être spécifique au sujet traité et formulé de manière unique. Préfère des tournures naturelles qui intègrent le sujet (ex: au lieu de "Tableau comparatif des solutions" → "Quelle solution choisir selon votre profil ?")
- Le contenu de l'article pourra inclure des tableaux ou des listes, mais les H2 eux-mêmes ne doivent pas annoncer mécaniquement ces formats
- NE PAS inclure de H2 dédié à la FAQ. La section FAQ sera ajoutée automatiquement après l'article.
- Les H2 doivent contenir des mots-clés secondaires quand c'est naturel

IMPORTANT : Utilise EXACTEMENT ce format de balisage :

[H2]Premier titre H2[H2]
[H2]Deuxième titre H2[H2]
[H2]Troisième titre H2[H2]
[H2]Quatrième titre H2[H2]
[H2]Cinquième titre H2[H2]

DATES ET ANNÉE : Nous sommes en 2026. Si tu inclus une année dans un H2, utilise 2026.`;

  if (persona?.additionalInstructions) {
    prompt += `\n\nInstructions additionnelles du persona :\n${persona.additionalInstructions}`;
  }

  return prompt;
}

export function getH2StructureUserPrompt(keyword: string, intentAnalysis: string, secondaryKeywords: string[]): string {
  const secondary = secondaryKeywords.length > 0
    ? `\nMots-clés secondaires : ${secondaryKeywords.join(', ')}`
    : '';
  return `Mot-clé principal : ${keyword}${secondary}

Analyse d'intention :
${intentAnalysis}`;
}
