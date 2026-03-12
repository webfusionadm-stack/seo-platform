export function getPersonaGenerationPrompt(name: string, theme: string, age: number): string {
  return `Tu es un expert en création de personas rédactionnels ultra-réalistes pour des sites web et blogs.

À partir des informations suivantes, génère un profil rédactionnel complet, réaliste et cohérent.

Informations du persona :
- Nom / Prénom : ${name}
- Thématique : ${theme}
- Âge : ${age} ans

Génère un JSON strict avec EXACTEMENT 3 champs :

1. "tone" : Un mot-clé parmi "conversationnel", "professionnel", "academique", "enthousiaste", "neutre". Déduis le ton le plus approprié à la thématique et à l'âge.

2. "formalityLevel" : Un parmi "informel", "semi-formel", "formel". Déduis-le de la thématique et de l'âge.

3. "style" : UN SEUL BLOC DE TEXTE RICHE ET FLUIDE (~150-250 mots) qui constitue un vrai portrait rédactionnel complet de ce persona. Ce texte doit se lire comme un brief éditorial et couvrir TOUS ces aspects :
   - Le background / l'identité de ${name} : qui est-il/elle, quelle est son expertise, d'où vient sa légitimité sur la thématique "${theme}"
   - Son ton et sa façon de s'adresser au lecteur (tutoiement, vouvoiement, "on" inclusif)
   - Son public cible : à qui s'adresse-t-il/elle
   - Le type d'anecdotes qu'il/elle utilise (personnelles, professionnelles, études de cas, métaphores...)
   - Ce qu'il/elle encourage et ce qu'il/elle évite (valeurs, red flags, sujets tabous)
   - Sa façon d'écrire : rythme de phrases, tics d'écriture, transitions, structure de pensée
   - Son vocabulaire : registre, mots favoris, niveau technique
   - Sa façon de commencer et conclure ses articles / posts

   Le texte doit se lire naturellement, comme un portrait rédactionnel rédigé par un directeur éditorial. Pas de listes à puces, pas de catégories — un texte fluide et vivant.

   Exemple de qualité attendue :
   "${name} écrit comme quelqu'un qui a vécu ce dont il/elle parle. Son ton est chaleureux mais direct, celui d'un ami bienveillant qui ne mâche pas ses mots quand c'est nécessaire. Il/Elle vouvoie le lecteur mais crée une intimité immédiate grâce à un style personnel et des interpellations directes. Ses anecdotes sont tirées de son vécu professionnel et personnel, toujours au service d'une leçon concrète. Il/Elle privilégie les paragraphes courts, les questions rhétoriques et les transitions franches. Son vocabulaire est accessible mais précis, jamais jargonneux. Il/Elle commence souvent par une accroche personnelle ou une question provocante, et conclut avec un encouragement à l'action."

Règles :
- Tous les textes doivent être en français.
- Le profil doit être réaliste et cohérent avec l'âge (${age} ans) et la thématique "${theme}".
- Le champ "style" doit faire entre 600 et 1200 caractères.
- Réponds UNIQUEMENT avec le JSON, sans markdown, sans backticks, sans explication.

Format :
{"tone":"...","formalityLevel":"...","style":"..."}`;
}
