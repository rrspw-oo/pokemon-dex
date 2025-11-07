// 模糊搜尋工具 - 支援字符相似度匹配和智能建議

// Levenshtein Distance 算法 - 計算兩個字符串的編輯距離
export function levenshteinDistance(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // 初始化矩陣
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 計算編輯距離
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替換
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 刪除
        );
      }
    }
  }

  return matrix[len1][len2];
}

// 計算字符串相似度 (0-1 之間，1 表示完全相似)
export function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (maxLength - distance) / maxLength;
}

// 常見的中文拼音錯誤對照表
const pinyinCorrections = {
  'z': ['zh', 'j'],
  'zh': ['z', 'j'],
  'c': ['ch', 'q'],
  'ch': ['c', 'q'],
  's': ['sh', 'x'],
  'sh': ['s', 'x'],
  'n': ['l'],
  'l': ['n'],
  'r': ['l'],
  'an': ['ang'],
  'ang': ['an'],
  'en': ['eng'],
  'eng': ['en'],
  'in': ['ing'],
  'ing': ['in'],
  'un': ['ong'],
  'ong': ['un']
};

// 常見的英文拼寫錯誤對照表
const englishCorrections = {
  'ph': ['f'],
  'ck': ['k'],
  'qu': ['kw', 'q'],
  'x': ['ks'],
  'ch': ['k', 'sh'],
  'sh': ['ch'],
  'th': ['t', 'd'],
  'oo': ['u'],
  'ou': ['ow'],
  'ow': ['ou'],
  'ei': ['ai'],
  'ai': ['ei']
};

// 生成可能的拼寫變體
export function generateSpellingVariants(input) {
  if (!input || input.length < 2) return [input];

  const variants = new Set([input.toLowerCase()]);

  // 處理常見拼寫錯誤
  const corrections = /[\u4e00-\u9fff]/.test(input) ? pinyinCorrections : englishCorrections;

  Object.entries(corrections).forEach(([wrong, rights]) => {
    if (input.toLowerCase().includes(wrong)) {
      rights.forEach(right => {
        variants.add(input.toLowerCase().replace(wrong, right));
      });
    }
  });

  // 處理重複字母 (例如: pokemon -> pokemom, pikemon)
  if (input.length > 3) {
    for (let i = 0; i < input.length - 1; i++) {
      if (input[i] === input[i + 1]) {
        // 移除重複字母
        variants.add(input.substring(0, i) + input.substring(i + 1));
      } else {
        // 添加重複字母
        variants.add(input.substring(0, i + 1) + input[i] + input.substring(i + 1));
      }
    }
  }

  return Array.from(variants);
}

// 模糊匹配函數
export function fuzzyMatch(query, target, threshold = 0.6) {
  if (!query || !target) return { matched: false, score: 0 };

  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // 完全匹配 (最高分)
  if (queryLower === targetLower) {
    return { matched: true, score: 1.0, type: 'exact' };
  }

  // 前綴匹配 (高分)
  if (targetLower.startsWith(queryLower)) {
    return { matched: true, score: 0.9, type: 'prefix' };
  }

  // 包含匹配 (中等分)
  if (targetLower.includes(queryLower)) {
    const score = 0.7 * (queryLower.length / targetLower.length);
    return { matched: true, score, type: 'contains' };
  }

  // 字符相似度匹配
  const similarity = calculateSimilarity(queryLower, targetLower);
  if (similarity >= threshold) {
    return { matched: true, score: similarity * 0.6, type: 'fuzzy' };
  }

  // 嘗試拼寫變體匹配
  const variants = generateSpellingVariants(queryLower);
  for (const variant of variants) {
    if (targetLower.includes(variant)) {
      const score = 0.5 * (variant.length / targetLower.length);
      return { matched: true, score, type: 'variant' };
    }

    const variantSimilarity = calculateSimilarity(variant, targetLower);
    if (variantSimilarity >= threshold) {
      return { matched: true, score: variantSimilarity * 0.4, type: 'variant_fuzzy' };
    }
  }

  return { matched: false, score: 0, type: 'none' };
}

// 搜尋結果排序函數
export function sortSearchResults(results) {
  return results.sort((a, b) => {
    // 首先按匹配分數排序
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }

    // 然後按 ID 排序 (較小的 ID 優先)
    if (a.id !== b.id) {
      return a.id - b.id;
    }

    // 最後按名稱長度排序 (較短的名稱優先)
    const aNameLength = (a.chineseName || a.englishName || '').length;
    const bNameLength = (b.chineseName || b.englishName || '').length;
    return aNameLength - bNameLength;
  });
}

// 增強的搜尋建議生成器 - 優化版本，支持早期終止
export function generateSearchSuggestions(query, pokemonData, maxSuggestions = 5) {
  if (!query || query.length < 1) return [];

  const suggestions = [];
  const seen = new Set();
  let perfectMatches = 0;

  // 遍歷所有 Pokemon 資料，但在找到足夠的高質量匹配時提早退出
  for (const pokemon of pokemonData) {
    // 如果已經找到足夠的建議且有足夠的高分匹配，提早退出
    if (suggestions.length >= maxSuggestions * 2 && perfectMatches >= maxSuggestions) {
      break;
    }

    const { chineseName, englishName, id } = pokemon;

    // 檢查中文名稱匹配
    if (chineseName && !seen.has(chineseName)) {
      const zhMatch = fuzzyMatch(query, chineseName, 0.4);
      if (zhMatch.matched) {
        suggestions.push({
          text: chineseName,
          type: 'chinese',
          score: zhMatch.score,
          matchType: zhMatch.type,
          id: id
        });
        seen.add(chineseName);

        if (zhMatch.score >= 0.9) perfectMatches++;
      }
    }

    // 檢查英文名稱匹配
    if (englishName && !seen.has(englishName)) {
      const enMatch = fuzzyMatch(query, englishName, 0.4);
      if (enMatch.matched) {
        suggestions.push({
          text: englishName,
          type: 'english',
          score: enMatch.score,
          matchType: enMatch.type,
          id: id
        });
        seen.add(englishName);

        if (enMatch.score >= 0.9) perfectMatches++;
      }
    }
  }

  // 按分數排序並限制數量
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
}

// 熱門搜尋關鍵字 (預設建議)
export const popularSearchTerms = [
  { text: '皮卡丘', type: 'chinese', id: 25 },
  { text: 'Pikachu', type: 'english', id: 25 },
  { text: '妙蛙種子', type: 'chinese', id: 1 },
  { text: 'Bulbasaur', type: 'english', id: 1 },
  { text: '小火龍', type: 'chinese', id: 4 },
  { text: 'Charmander', type: 'english', id: 4 },
  { text: '傑尼龜', type: 'chinese', id: 7 },
  { text: 'Squirtle', type: 'english', id: 7 },
  { text: '超夢', type: 'chinese', id: 150 },
  { text: 'Mewtwo', type: 'english', id: 150 }
];