/**
 * DETERMINISTIC FOOD DATABASE 
 * Used for Rule-Based Parsing (no AI needed).
 * Nutritional values per 100g.
 */

export interface FoodItem {
  id: string | number;
  name: string;
  cal: number;
  prot: number;
  carbs: number;
  fat: number;
  fiber: number;
  emoji: string;
}

export const FOOD_DATABASE: Record<string, FoodItem> = {
  chicken: { id: 'chicken', name: 'Chicken Breast', cal: 165, prot: 31, carbs: 0, fat: 3.6, fiber: 0, emoji: '🍗' },
  egg:     { id: 'egg',     name: 'Egg',            cal: 155, prot: 13, carbs: 1.1, fat: 11, fiber: 0, emoji: '🥚' },
  rice:    { id: 'rice',    name: 'White Rice',     cal: 130, prot: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, emoji: '🍚' },
  oats:    { id: 'oats',    name: 'Oats',           cal: 389, prot: 16.9, carbs: 66, fat: 6.9, fiber: 10.6, emoji: '🥣' },
  banana:  { id: 'banana',  name: 'Banana',         cal: 89, prot: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, emoji: '🍌' },
  milk:    { id: 'milk',    name: 'Milk',           cal: 42, prot: 3.4, carbs: 5, fat: 1, fiber: 0, emoji: '🥛' },
  apple:   { id: 'apple',   name: 'Apple',          cal: 52, prot: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, emoji: '🍎' },
  bread:   { id: 'bread',   name: 'Wheat Bread',    cal: 265, prot: 9.4, carbs: 49, fat: 3.2, fiber: 7, emoji: '🍞' },
  salad:   { id: 'salad',   name: 'Green Salad',    cal: 20, prot: 1.5, carbs: 3.5, fat: 0.2, fiber: 2, emoji: '🥗' },
  cake:    { id: 'cake',    name: 'Chocolate Cake', cal: 370, prot: 5, carbs: 55, fat: 18, fiber: 2, emoji: '🍰' },
  noodle:  { id: 'noodle',  name: 'Noodles',        cal: 350, prot: 12, carbs: 70, fat: 200, fiber: 2, emoji: '🍜' },
};

/**
 * ALGORITHM 3: Pure Pattern Matcher (Meal Scraper)
 * Manual Tokenization & Entity Extraction (No Regex/AI).
 */
export function parseMealAlgorithmic(text: string) {
  const result = { cal: 0, prot: 0, carbs: 0, fat: 0, fiber: 0, matches: [] as string[] };
  const raw = text.toLowerCase();
  
  // Custom Tokenizer: Split by spaces manually
  const tokens: string[] = [];
  let currentToken = "";
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === " " || char === "\n" || char === "\t") {
      if (currentToken.length > 0) tokens.push(currentToken);
      currentToken = "";
    } else {
      currentToken += char;
    }
  }
  if (currentToken.length > 0) tokens.push(currentToken);

  let currentMultiplier = 1.0; // Units of 100g

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // 1. MANUAL UNIT PARSER (Pure Logic)
    let numStr = "";
    let unitStr = "";
    let isParsingUnit = false;

    for (let j = 0; j < token.length; j++) {
      const c = token[j];
      if ((c >= '0' && c <= '9') || c === '.') {
        if (isParsingUnit) break; // Token format error (e.g. g500)
        numStr += c;
      } else {
        isParsingUnit = true;
        unitStr += c;
      }
    }

    if (numStr.length > 0) {
      const val = parseFloat(numStr);
      if (unitStr === "kg") currentMultiplier = val * 10;
      else if (unitStr === "g" || unitStr === "") currentMultiplier = val / 100;
      // If valid quantity found, move to next token to look for food
      if (unitStr !== "") continue; 
    }

    // 2. SEARCH ALGORITHM (Linear Keyword Match)
    const foodKeys = Object.keys(FOOD_DATABASE);
    for (let k = 0; k < foodKeys.length; k++) {
      const key = foodKeys[k];
      // Manual subsequence check / match
      if (token === key || token.indexOf(key) !== -1) {
        const item = FOOD_DATABASE[key];
        
        // Final Aggregation Logic
        result.cal += Math.round(item.cal * currentMultiplier);
        result.prot += Math.round(item.prot * currentMultiplier);
        result.carbs += Math.round(item.carbs * currentMultiplier);
        result.fat += Math.round(item.fat * currentMultiplier);
        result.fiber += Math.round(item.fiber * currentMultiplier);
        
        if (!result.matches.includes(item.emoji)) {
          result.matches.push(item.emoji);
        }

        // Reset state after match
        currentMultiplier = 1.0; 
      }
    }
  }

  return result;
}
