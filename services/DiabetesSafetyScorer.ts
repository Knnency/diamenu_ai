/**
 * DiabetesSafetyScorer
 *
 * Encapsulates the diabetic food safety scoring algorithm for recipes.
 *
 * Scoring methodology:
 *   • ADA Standards of Medical Care in Diabetes 2024 (§5.2, §5.4, §5.7–5.9, §10.3–10.4)
 *   • WHO Healthy Diet guidelines for diabetes management
 *   • Glycemic Index (GI) research — Jenkins et al.
 *
 * Design:
 *   - Immutable tag weight tables (private readonly)
 *   - Single-responsibility methods: compute() and classify()
 *   - SafetyResult value object as the public contract
 *   - Exported singleton `diabetesSafetyScorer` for zero-cost instantiation
 */

// ── Value Object ──────────────────────────────────────────────────────────────

export interface SafetyResult {
  /** 0–100 score clamped to valid range */
  score: number;
  /** Human-readable risk tier */
  label: 'Safe' | 'Moderate' | 'Caution' | 'High Risk';
  /** Hex color for the tier */
  color: string;
  /** Translucent RGBA background for the tier badge */
  bg: string;
  /** Clinical description shown in the UI tooltip */
  description: string;
}

// ── Scorable recipe contract ──────────────────────────────────────────────────

export interface ScorableRecipe {
  tags: string[];
  dietary_options: string[];
  ingredients_to_avoid?: string[];
}

// ── Scorer Class ──────────────────────────────────────────────────────────────

export class DiabetesSafetyScorer {
  /** Baseline score before tag analysis (neutral starting point) */
  private readonly BASELINE = 50;

  /**
   * Tags/keywords that indicate beneficial dietary patterns for glycemic control.
   * Points are additive — each matched tag contributes its weight once.
   */
  private readonly positiveTags: ReadonlyMap<string, number> = new Map([
    // Low Glycemic Index/Load — reduces post-meal glucose spikes (ADA 2024 §5)
    ['low-glycemic', 20], ['low-gi', 20], ['low glycemic', 20],
    // Dietary fibre — improves insulin sensitivity (ADA §5.9)
    ['high-fiber', 15], ['fiber-rich', 15],
    // Lean protein — satiety without glucose impact (ADA §5.4)
    ['high-protein', 12], ['lean protein', 12], ['lean-protein', 12],
    // Carbohydrate restriction — directly limits post-meal rise (ADA §5.2)
    ['low-carb', 15], ['low-carbohydrate', 15], ['carb-controlled', 12],
    // Reduced fat — lowers CVD risk comorbid with T2DM (ADA §10)
    ['low-fat', 10], ['heart-healthy', 10],
    // Explicit diabetes-safe classification from Recipe Auditor AI
    ['diabetes-friendly', 18], ['diabetic-friendly', 18], ['diabetes friendly', 18],
    // Plant-based patterns — associated with better glycemic outcomes (Barnard et al.)
    ['plant-based', 10], ['vegetarian', 8], ['vegan', 8],
    // Whole grains — lower HbA1c vs refined grains (ADA §5.8)
    ['whole-grain', 12], ['whole grain', 12],
    // Low sodium — reduces hypertension risk in diabetics (ADA §10.4)
    ['low-sodium', 8], ['low-salt', 8],
    // Halal — avoids processed/cured meats linked to T2DM risk
    ['halal', 5],
    // Ketogenic — short-term glycemic benefit (ADA §5.3)
    ['keto', 10], ['ketogenic', 10],
  ]);

  /**
   * Tags/keywords that indicate risk factors for poor glycemic control.
   * Points are subtractive — each matched tag reduces the score once.
   */
  private readonly negativeTags: ReadonlyMap<string, number> = new Map([
    // High sugar — primary driver of post-meal glucose spikes (ADA §5.7)
    ['high-sugar', -20], ['sugary', -15], ['sweetened', -12],
    // High GI — rapid blood glucose elevation (Jenkins GI scale)
    ['high-glycemic', -20], ['high-gi', -20],
    // High-carb without fibre — reduces glycemic benefit
    ['high-carb', -15], ['high-carbohydrate', -15],
    // Processed/fried — associated with insulin resistance (ADA §5.5)
    ['fried', -12], ['deep-fried', -15], ['processed', -12],
    // High saturated fat — CVD risk in diabetics (ADA §10.3)
    ['high-fat', -10], ['fatty', -8],
    // High sodium — hypertension risk (ADA §10.4)
    ['high-sodium', -10], ['salty', -8],
    // Alcohol — disrupts blood glucose regulation (ADA §5.11)
    ['alcohol', -15], ['alcoholic', -15],
  ]);

  /**
   * Computes a 0–100 diabetic food safety score for a single recipe.
   *
   * Algorithm:
   *   1. Start at the neutral baseline (50)
   *   2. Normalise all tags and dietary options to lowercase
   *   3. For each item, add the first matching positive weight found
   *   4. For each item, subtract the first matching negative weight found
   *   5. Apply a small penalty if `ingredients_to_avoid` is non-empty
   *   6. Clamp result to [0, 100]
   */
  public compute(recipe: ScorableRecipe): number {
    const items = [
      ...recipe.tags,
      ...recipe.dietary_options,
    ].map(s => s.toLowerCase().trim());

    let score = this.BASELINE;

    for (const item of items) {
      score += this.matchWeight(item, this.positiveTags);
      score += this.matchWeight(item, this.negativeTags);
    }

    if ((recipe.ingredients_to_avoid?.length ?? 0) > 0) {
      score -= 5;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Maps a numeric score to a `SafetyResult` value object containing
   * the risk tier label, display colors, and clinical description.
   *
   * Thresholds:
   *   ≥ 80 → Safe      (green)
   *   ≥ 60 → Moderate  (amber)
   *   ≥ 40 → Caution   (orange)
   *    < 40 → High Risk (red)
   */
  public classify(score: number): SafetyResult {
    if (score >= 80) {
      return {
        score,
        label: 'Safe',
        color: '#16a34a',
        bg: 'rgba(22,163,74,0.12)',
        description:
          'Excellent glycemic profile. Well-suited for diabetes management per ADA guidelines.',
      };
    }
    if (score >= 60) {
      return {
        score,
        label: 'Moderate',
        color: '#ca8a04',
        bg: 'rgba(202,138,4,0.12)',
        description:
          'Acceptable for most diabetics. Monitor portion sizes and pair with fiber-rich sides.',
      };
    }
    if (score >= 40) {
      return {
        score,
        label: 'Caution',
        color: '#ea580c',
        bg: 'rgba(234,88,12,0.12)',
        description:
          'Some glycemic risk factors present. Consume in limited portions and consult your dietitian.',
      };
    }
    return {
      score,
      label: 'High Risk',
      color: '#dc2626',
      bg: 'rgba(220,38,38,0.12)',
      description:
        'Significant markers for elevated blood glucose or cardiovascular risk. Avoid or heavily modify.',
    };
  }

  /**
   * Convenience method: computes the score AND classifies it in one call.
   */
  public evaluate(recipe: ScorableRecipe): SafetyResult {
    return this.classify(this.compute(recipe));
  }

  /**
   * Computes the average safety score across an array of recipes
   * and returns a classified `SafetyResult` for the collection.
   */
  public evaluateCollection(recipes: ScorableRecipe[]): SafetyResult {
    if (recipes.length === 0) return this.classify(0);
    const avg = Math.round(
      recipes.reduce((sum, r) => sum + this.compute(r), 0) / recipes.length,
    );
    return this.classify(avg);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Returns the weight of the first key found in `weightMap` that `item`
   * contains as a substring. Returns 0 if no key matches.
   */
  private matchWeight(item: string, weightMap: ReadonlyMap<string, number>): number {
    for (const [key, weight] of weightMap) {
      if (item.includes(key)) return weight;
    }
    return 0;
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

/** Pre-instantiated scorer — import this directly, no `new` needed. */
export const diabetesSafetyScorer = new DiabetesSafetyScorer();
