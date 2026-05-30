import hskData from '../../assets/data/hsk.json';

const dictionary = hskData.dict as Record<string, any>;
const wordSet = new Set(Object.keys(dictionary));
const maxWordLen = hskData.maxLen || 4;

/**
 * Forward Maximum Matching (FMM) segmentation for Chinese text.
 */
export function segmentChinese(text: string): string[] {
  const result: string[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Handle non-Chinese characters (punctuations, numbers, latin)
    if (!/[\u4e00-\u9fff]/.test(char)) {
      let chunk = '';
      while (i < text.length && !/[\u4e00-\u9fff\s]/.test(text[i])) {
        chunk += text[i];
        i++;
      }
      if (chunk) result.push(chunk);
      continue;
    }

    // Forward Maximum Matching for Chinese characters
    let matched = false;
    for (let len = Math.min(maxWordLen, text.length - i); len > 1; len--) {
      const candidate = text.substring(i, i + len);
      if (wordSet.has(candidate)) {
        result.push(candidate);
        i += len;
        matched = true;
        break;
      }
    }

    // If no multi-character word found, add single character
    if (!matched) {
      result.push(text[i]);
      i++;
    }
  }

  return result;
}
