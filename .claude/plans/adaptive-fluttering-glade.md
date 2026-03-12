# Plan : Word count dynamique basé sur le SERP + Article plus visuel (emojis)

## Contexte

Deux améliorations demandées :
1. **Word count dynamique** : Actuellement le nombre de mots est fixé par un slider frontend (900-1800, défaut 1200). On veut que le pipeline analyse automatiquement la longueur des articles concurrents dans le SERP et adapte le word count cible en conséquence.
2. **Article plus visuel** : Ajouter des emojis dans les tableaux et la liste à puce pour rendre l'article plus engageant visuellement.

---

## Changement 1 : Word count dynamique

### Approche

Calculer le nombre de mots moyen des articles concurrents dans l'étape SERP Research, puis utiliser cette valeur comme `wordCount` au lieu de la valeur fixe du slider. Le slider frontend reste disponible mais devient optionnel (override manuel).

### Fichiers à modifier

#### 1.1 — `apps/backend/src/services/ai/pipeline/types.ts`

Ajouter `competitorWordCount` dans `SerpData` :

```typescript
export interface SerpData {
  organic: SerpResult[];
  scrapedContents: { url: string; title: string; content: string }[];
  compiledText: string;
  avgWordCount: number;  // ← NOUVEAU : moyenne des mots des concurrents
}
```

#### 1.2 — `apps/backend/src/services/ai/pipeline/steps/serp-research.ts`

Après le scraping Jina (qui récupère déjà le contenu texte des 5 premiers résultats), calculer le word count de chaque article scrapé et en faire la moyenne :

```typescript
// Après const scrapedContents = await Promise.all(scrapePromises);

const wordCounts = scrapedContents
  .filter(s => s.content.length > 0)
  .map(s => s.content.split(/\s+/).filter(Boolean).length);

const avgWordCount = wordCounts.length > 0
  ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
  : 1200; // fallback si aucun contenu scrapé

ctx.serpData = { organic, scrapedContents, compiledText, avgWordCount };
```

**Choix retenu** : Augmenter la limite de scraping de 3000 à **15 000 caractères** pour avoir des word counts fiables.

Modification ligne 49 :
```typescript
// Avant : if (text.length > 3000) text = text.slice(0, 3000);
if (text.length > 15000) text = text.slice(0, 15000);
```

Puis calcul du word count moyen après le scraping :
```typescript
const wordCounts = scrapedContents
  .filter(s => s.content.length > 0)
  .map(s => s.content.split(/\s+/).filter(Boolean).length);

const avgWordCount = wordCounts.length > 0
  ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
  : 1200; // fallback

ctx.serpData = { organic, scrapedContents, compiledText, avgWordCount };
```

**Note** : Le `compiledText` envoyé à l'analyse d'intention sera plus long (15k chars × 5 articles). Cela augmente légèrement les tokens d'input pour l'étape 2 (intent analysis) mais donne une meilleure analyse des concurrents.

#### 1.3 — `apps/backend/src/services/ai/pipeline/seo-pipeline.ts`

Après l'étape SERP (step 1), mettre à jour `ctx.wordCount` avec la valeur dynamique SI l'utilisateur n'a pas explicitement choisi un word count :

```typescript
// Après step 1 (SERP Research)
// Si wordCount === 0, c'est le mode automatique (basé sur SERP)
if (ctx.wordCount === 0 && ctx.serpData?.avgWordCount) {
  ctx.wordCount = Math.max(800, Math.min(2500, ctx.serpData.avgWordCount));
  logger.info(`Dynamic word count from SERP: ${ctx.wordCount}`);
} else if (ctx.wordCount === 0) {
  ctx.wordCount = 1200; // fallback si pas de données SERP
  logger.info('No SERP word count data, falling back to 1200');
}
```

#### 1.4 — `packages/shared/src/validation/index.ts`

Élargir la validation Zod : accepter `0` (mode auto) ou un range manuel 800-2500 :

```typescript
wordCount: z.number().min(0).max(2500).default(0),
// 0 = mode automatique basé sur le SERP
```

#### 1.5 — `apps/frontend/src/components/articles/PipelineForm.tsx`

Modifier le slider pour ajouter une option "Automatique (basé sur le SERP)" :
- Ajouter un toggle/checkbox "Nombre de mots automatique" — **coché par défaut**
- Si coché : le slider est masqué, on affiche un texte "Sera calculé automatiquement en fonction des concurrents". La valeur envoyée est `0`.
- Si décoché : le slider apparaît (range 800-2500, défaut 1200), fonctionnement classique.
- Mettre à jour le `useState` : `const [autoWordCount, setAutoWordCount] = useState(true)` et `const [wordCount, setWordCount] = useState(1200)`
- Au submit : envoyer `wordCount: autoWordCount ? 0 : wordCount`

---

## Changement 2 : Article plus visuel avec emojis

### Fichiers à modifier

#### 2.1 — `apps/backend/src/services/ai/prompts/pipeline/article-writing.ts`

Dans le **system prompt**, modifier les règles existantes :

```
- Inclus au moins un tableau markdown comparatif. Utilise des emojis pertinents dans les cellules du tableau pour le rendre plus visuel et engageant (ex: ⭐, ✅, ❌, 💡, 🔥, etc.)
- Utilise au MAXIMUM une seule liste à puces ou numérotée dans tout l'article. Pas plus d'une. Privilégie les paragraphes rédigés pour présenter les informations. Si tu utilises une liste, ajoute un emoji en début de chaque item pour la rendre plus visuelle.
```

#### 2.2 — `apps/backend/src/services/ai/prompts/pipeline/cleanup.ts`

Aucune modification nécessaire. Le cleanup ne mentionne pas les emojis et ne les supprime pas — ils passent à travers sans problème.

---

## Résumé des fichiers modifiés

| # | Fichier | Changement |
|---|---------|------------|
| 1 | `apps/backend/src/services/ai/pipeline/types.ts` | Ajouter `avgWordCount` à `SerpData` |
| 2 | `apps/backend/src/services/ai/pipeline/steps/serp-research.ts` | Calculer word count moyen + augmenter limite scraping |
| 3 | `apps/backend/src/services/ai/pipeline/seo-pipeline.ts` | Injecter word count dynamique après step 1 |
| 4 | `packages/shared/src/validation/index.ts` | Élargir range validation (800-2500) |
| 5 | `apps/frontend/src/components/articles/PipelineForm.tsx` | Ajouter toggle "word count auto" |
| 6 | `apps/backend/src/controllers/seo-pipeline.controller.ts` | Gérer `wordCount: 0` (défaut auto) |
| 7 | `apps/backend/src/services/ai/prompts/pipeline/article-writing.ts` | Emojis dans tableaux et listes |

## Vérification

1. Lancer le dev server : `npm run dev`
2. Aller sur `http://localhost:5173/seo-articles/new`
3. Connexion : `admin@seoplatform.com` / `changeme123`
4. Générer un article avec le mode "word count auto" activé
5. Vérifier dans les logs backend : `Dynamic word count from SERP: XXXX`
6. Vérifier dans l'article final : emojis présents dans le tableau et la liste à puce
7. Vérifier que le nombre de mots final est cohérent avec la moyenne des concurrents
