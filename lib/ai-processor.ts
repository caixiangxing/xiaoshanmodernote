export type ExtractedHealth = {
  steps?: number;
  workout_minutes?: number;
  weight?: number;
  sleep_hours?: number;
  calories?: number;
};

export type ExtractedFinance = {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  note?: string;
};

export type ExtractedMood = {
  score: number;
  label: string;
};

export type ExtractionResult = {
  health: ExtractedHealth | null;
  finance: ExtractedFinance | null;
  finances: ExtractedFinance[];
  mood: ExtractedMood | null;
  narrative: string | null;
  hasNarrative: boolean;
};

const NUM = /(\d+(?:[.,]\d+)?)/;

const CATEGORY_KEYWORDS: { category: string; words: RegExp }[] = [
  { category: 'food', words: /\b(?:lunch|dinner|breakfast|brunch|coffee|cafe|tea|meal|restaurant|pizza|burger|sushi|food|groceries?|supermarket|takeout|takeaway)\b/i },
  { category: 'transport', words: /\b(?:uber|lyft|taxi|cab|bus|metro|subway|train|flight|petrol|gas|parking|toll|fare)\b/i },
  { category: 'shopping', words: /\b(?:amazon|shop(?:ping)?|mall|clothes?|clothing|shoes?|shirt|jeans?|dress|store|bought|purchase)\b/i },
  { category: 'bills', words: /\b(?:rent|utilities|electricity|electric|water|internet|wifi|phone\s*bill|insurance|subscription)\b/i },
  { category: 'fitness', words: /\b(?:gym|fitness|sport|yoga|swim(?:ming)?|pilates|crossfit|supplement)\b/i },
  { category: 'entertainment', words: /\b(?:movie|cinema|netflix|spotify|apple\s*tv|hulu|game(?:s)?|ticket|concert|show)\b/i },
  { category: 'health', words: /\b(?:doctor|hospital|pharmacy|medicine|drug|clinic|dental|dentist|prescription)\b/i },
  { category: 'education', words: /\b(?:course|class|tuition|book|textbook|school|college|university|udemy|coursera)\b/i },
];

type ExtractionPattern = {
  pattern: RegExp;
  handler: (match: RegExpMatchArray, text: string) => Partial<ExtractedHealth> | null;
  field: keyof ExtractedHealth;
};

const HEALTH_EXTRACTION_PATTERNS: ExtractionPattern[] = [
  {
    field: 'steps',
    pattern: new RegExp(`(?:ran|run|running|jogged|jog|jogging)\\s+${NUM.source}\\s*(?:km|kilometers?|miles?)`, 'i'),
    handler: (m) => {
      const val = parseFloat(m[1].replace(',', ''));
      const isKm = /km|kilo/i.test(m[0]);
      const isMile = /mile/i.test(m[0]);
      const steps = isKm ? Math.round(val * 1312) : isMile ? Math.round(val * 2112) : Math.round(val * 1312);
      return { steps, workout_minutes: Math.round(val * 6) };
    },
  },
  {
    field: 'steps',
    pattern: new RegExp(`(?:walked?|walk(?:ing)?)\\s+${NUM.source}\\s*(?:km|kilometers?|miles?)`, 'i'),
    handler: (m) => {
      const val = parseFloat(m[1].replace(',', ''));
      const isMile = /mile/i.test(m[0]);
      return { steps: isMile ? Math.round(val * 2112) : Math.round(val * 1312) };
    },
  },
  {
    field: 'steps',
    pattern: new RegExp(`${NUM.source}\\s*(?:km|kilometers?)\\s*(?:run|jog|walk)`, 'i'),
    handler: (m) => ({ steps: Math.round(parseFloat(m[1]) * 1312), workout_minutes: Math.round(parseFloat(m[1]) * 6) }),
  },
  {
    field: 'steps',
    pattern: new RegExp(`${NUM.source}\\s*steps?`, 'i'),
    handler: (m) => ({ steps: Math.round(parseFloat(m[1].replace(',', ''))) }),
  },
  {
    field: 'workout_minutes',
    pattern: new RegExp(`(?:workout|exercise|gym|training|trained|worked\\s*out)(?:\\s+for)?\\s+${NUM.source}\\s*(?:min(?:utes?)?|hrs?|hours?)`, 'i'),
    handler: (m) => {
      const val = parseFloat(m[1]);
      const isHour = /hr|hour/i.test(m[0]);
      return { workout_minutes: isHour ? Math.round(val * 60) : Math.round(val) };
    },
  },
  {
    field: 'workout_minutes',
    pattern: new RegExp(`${NUM.source}\\s*(?:min(?:utes?)?|hrs?|hours?)\\s+(?:workout|exercise|gym|training)`, 'i'),
    handler: (m) => {
      const val = parseFloat(m[1]);
      const isHour = /hr|hour/i.test(m[0]);
      return { workout_minutes: isHour ? Math.round(val * 60) : Math.round(val) };
    },
  },
  {
    field: 'weight',
    pattern: new RegExp(`(?:weigh[st]|weight(?:\\s+is)?|weighed)\\s+${NUM.source}\\s*(?:kg|kgs?|kilograms?|lbs?|pounds?)`, 'i'),
    handler: (m) => {
      const val = parseFloat(m[1]);
      const isLb = /lb|pound/i.test(m[0]);
      return { weight: isLb ? Math.round(val * 0.453592 * 10) / 10 : val };
    },
  },
  {
    field: 'weight',
    pattern: new RegExp(`${NUM.source}\\s*(?:kg|kgs?|kilograms?)(?:\\s+(?:today|now|this morning))?`, 'i'),
    handler: (m) => ({ weight: parseFloat(m[1]) }),
  },
  {
    field: 'sleep_hours',
    pattern: new RegExp(`(?:slept|sleep|sleeping|got)\\s+${NUM.source}\\s*(?:hrs?|hours?)(?:\\s+of\\s+sleep)?`, 'i'),
    handler: (m) => ({ sleep_hours: parseFloat(m[1]) }),
  },
  {
    field: 'sleep_hours',
    pattern: new RegExp(`${NUM.source}\\s*(?:hrs?|hours?)\\s+(?:of\\s+)?sleep`, 'i'),
    handler: (m) => ({ sleep_hours: parseFloat(m[1]) }),
  },
  {
    field: 'calories',
    pattern: new RegExp(`(?:burned?|burnt)\\s+${NUM.source}\\s*(?:cal(?:ories?)?|kcal)`, 'i'),
    handler: (m) => ({ calories: Math.round(parseFloat(m[1])) }),
  },
  {
    field: 'steps',
    pattern: /(?:跑|跑步|跑了|慢跑|长跑)\s*(\d+(?:\.\d+)?)\s*(?:公里|千米|km|KM)/,
    handler: (m) => {
      const val = parseFloat(m[1]);
      return { steps: Math.round(val * 1312), workout_minutes: Math.round(val * 6) };
    },
  },
  {
    field: 'steps',
    pattern: /(?:走路?|散步|走了?)\s*(\d+(?:\.\d+)?)\s*(?:公里|千米|km|KM)/,
    handler: (m) => ({ steps: Math.round(parseFloat(m[1]) * 1312) }),
  },
  {
    field: 'steps',
    pattern: /(\d+(?:\.\d+)?)\s*(?:公里|千米)\s*(?:跑|步|走)/,
    handler: (m) => ({ steps: Math.round(parseFloat(m[1]) * 1312), workout_minutes: Math.round(parseFloat(m[1]) * 6) }),
  },
  {
    field: 'steps',
    pattern: /(\d[,\d]*)\s*步/,
    handler: (m) => ({ steps: Math.round(parseFloat(m[1].replace(',', ''))) }),
  },
  {
    field: 'workout_minutes',
    pattern: /(?:运动|锻炼|健身|训练)\s*(?:了)?\s*(\d+(?:\.\d+)?)\s*(?:分钟|小时|hrs?|hours?)/,
    handler: (m) => {
      const val = parseFloat(m[1]);
      const isHour = /小时|hour|hr/i.test(m[0]);
      return { workout_minutes: isHour ? Math.round(val * 60) : Math.round(val) };
    },
  },
  {
    field: 'weight',
    pattern: /(?:体重|称重|量了?体重)[^\d]*(\d+(?:\.\d+)?)\s*(?:公斤|kg|KG|斤)/,
    handler: (m) => {
      const val = parseFloat(m[1]);
      const isJin = /斤/.test(m[0]);
      return { weight: isJin ? Math.round(val * 0.5 * 10) / 10 : val };
    },
  },
  {
    field: 'weight',
    pattern: /(\d+(?:\.\d+)?)\s*(?:公斤|kg|KG)\s*(?:了|的|体重)?/,
    handler: (m) => ({ weight: parseFloat(m[1]) }),
  },
  {
    field: 'sleep_hours',
    pattern: /(?:睡了?|睡眠)\s*(\d+(?:\.\d+)?)\s*(?:小时|hrs?|hours?)/,
    handler: (m) => ({ sleep_hours: parseFloat(m[1]) }),
  },
  {
    field: 'sleep_hours',
    pattern: /(\d+(?:\.\d+)?)\s*(?:小时)\s*(?:的)?睡眠/,
    handler: (m) => ({ sleep_hours: parseFloat(m[1]) }),
  },
  {
    field: 'calories',
    pattern: /(?:燃烧了?|消耗了?)\s*(\d+)\s*(?:卡路里|卡|千卡|kcal)/,
    handler: (m) => ({ calories: Math.round(parseFloat(m[1])) }),
  },
];

const INCOME_CONTEXT = /(?:received|earned|got\s+paid|salary|income|freelance|收入|工资|到账|收到|赚了?|进账)/i;

function extractContextNote(segment: string): string {
  return segment.replace(/[，。！？,.!?\s]+$/, '').replace(/^[，。！？,.!?\s]+/, '').slice(0, 40);
}

function matchAllToArray(str: string, pattern: RegExp): RegExpMatchArray[] {
  const results: RegExpMatchArray[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags);
  while ((m = re.exec(str)) !== null) {
    results.push(m as unknown as RegExpMatchArray);
    if (!re.global) break;
  }
  return results;
}

function extractAllFinance(text: string): ExtractedFinance[] {
  const results: ExtractedFinance[] = [];
  const seenAmounts = new Set<number>();

  const segments = text.split(/[，。！？,.!?、；;]+/).filter(Boolean);

  for (const seg of segments) {
    const trimSeg = seg.trim();
    if (!trimSeg) continue;

    let matched = false;

    const zhExpensePattern = /(?:花了?|支出|用了|消费了?|付了?|付款|买了?[^，。！？\d]{0,10}?)(\d+(?:\.\d+)?)\s*(?:元|块|RMB|rmb|¥)/gi;
    for (const m of matchAllToArray(trimSeg, zhExpensePattern)) {
      const amount = parseFloat(m[1]);
      if (amount > 0 && !seenAmounts.has(amount)) {
        seenAmounts.add(amount);
        results.push({
          amount,
          type: 'expense',
          category: guessCategory(trimSeg, 'expense'),
          description: trimSeg.slice(0, 80),
          note: extractContextNote(trimSeg),
        });
        matched = true;
      }
    }

    if (!matched) {
      const zhAmtFirst = /(\d+(?:\.\d+)?)\s*(?:元|块)\s*(?:的|买|花|消费|购)/gi;
      for (const m of matchAllToArray(trimSeg, zhAmtFirst)) {
        const amount = parseFloat(m[1]);
        if (amount > 0 && !seenAmounts.has(amount)) {
          seenAmounts.add(amount);
          results.push({
            amount,
            type: 'expense',
            category: guessCategory(trimSeg, 'expense'),
            description: trimSeg.slice(0, 80),
            note: extractContextNote(trimSeg),
          });
          matched = true;
        }
      }
    }

    if (!matched) {
      const zhIncomePattern = /(?:收入|工资|到账|收到|赚了?|进账)\s*(?:了|有)?\s*(\d+(?:\.\d+)?)\s*(?:元|块|RMB|rmb|¥)?/gi;
      for (const m of matchAllToArray(trimSeg, zhIncomePattern)) {
        const amount = parseFloat(m[1]);
        if (amount > 0 && !seenAmounts.has(amount)) {
          seenAmounts.add(amount);
          results.push({
            amount,
            type: 'income',
            category: guessCategory(trimSeg, 'income'),
            description: trimSeg.slice(0, 80),
            note: extractContextNote(trimSeg),
          });
          matched = true;
        }
      }
    }

    if (!matched) {
      const enExpensePatterns = [
        /(?:spent|spend|paying|paid|cost(?:s|ed)?)\s+\$?(\d+(?:[.,]\d+)?)/gi,
        /\$(\d+(?:[.,]\d+)?)\s+(?:on|for)\b/gi,
        /(?:bought|purchased)\s+\w[^$\d]*?(?:for\s+)?\$?(\d+(?:[.,]\d+)?)/gi,
        /(\d+(?:[.,]\d+)?)\s*(?:dollars?|bucks?)\s+(?:on|for|at)\b/gi,
        /¥(\d+(?:\.\d+)?)/gi,
      ];
      for (const pat of enExpensePatterns) {
        for (const m of matchAllToArray(trimSeg, pat)) {
          const amount = parseFloat(m[1].replace(',', ''));
          if (amount > 0 && !seenAmounts.has(amount)) {
            seenAmounts.add(amount);
            const type = INCOME_CONTEXT.test(trimSeg) ? 'income' : 'expense';
            results.push({
              amount,
              type,
              category: guessCategory(trimSeg, type),
              description: trimSeg.slice(0, 80),
              note: extractContextNote(trimSeg),
            });
            matched = true;
          }
        }
        if (matched) break;
      }
    }

    if (!matched) {
      const enIncomePatterns = [
        /(?:received|earned|got\s+paid|salary\s+of|income\s+of)\s+\$?(\d+(?:[.,]\d+)?)/gi,
        /\$(\d+(?:[.,]\d+)?)\s+(?:income|salary|freelance|payment)/gi,
        /(?:sold\s+\w+\s+for)\s+\$?(\d+(?:[.,]\d+)?)/gi,
      ];
      for (const pat of enIncomePatterns) {
        for (const m of matchAllToArray(trimSeg, pat)) {
          const amount = parseFloat(m[1].replace(',', ''));
          if (amount > 0 && !seenAmounts.has(amount)) {
            seenAmounts.add(amount);
            results.push({
              amount,
              type: 'income',
              category: guessCategory(trimSeg, 'income'),
              description: trimSeg.slice(0, 80),
              note: extractContextNote(trimSeg),
            });
            matched = true;
          }
        }
        if (matched) break;
      }
    }
  }

  return results;
}

const MOOD_PATTERNS: { pattern: RegExp; score: number; label: string }[] = [
  { pattern: /\b(?:amazing|fantastic|excellent|wonderful|best day|ecstatic|so happy|thrilled|elated)\b/i, score: 10, label: '非常棒' },
  { pattern: /\b(?:great|really good|pretty good|happy|excited|awesome|love(?:d)? it|joyful)\b/i, score: 8, label: '很棒' },
  { pattern: /\b(?:good|nice|fine|not bad|alright|decent|solid|pleasant)\b/i, score: 6, label: '良好' },
  { pattern: /\b(?:tired|exhausted|drained|meh|so-so|average|okay-ish|mediocre)\b/i, score: 5, label: '一般' },
  { pattern: /\b(?:bad|sad|down|unhappy|frustrated|stressed|anxious|worried|rough)\b/i, score: 3, label: '较差' },
  { pattern: /\b(?:terrible|awful|horrible|miserable|depressed|worst|awful|dreadful)\b/i, score: 1, label: '很差' },
  { pattern: /太棒了|超开心|非常开心|极好|完美|太好了/, score: 10, label: '非常棒' },
  { pattern: /开心|高兴|快乐|愉快|不错|很棒|很好|顺利|满意/, score: 8, label: '很棒' },
  { pattern: /还好|一般|马马虎虎|凑合|平平/, score: 5, label: '一般' },
  { pattern: /累了?|疲惫|无聊|郁闷|烦|不开心|难受/, score: 3, label: '较差' },
  { pattern: /太难了|崩溃|绝望|很差|很糟|很烂/, score: 1, label: '很差' },
];

const PURE_DATA_STARTERS = /^(?:ran|walked|jogged|slept|weighed|weight|steps|workout|exercise|spent|paid|bought|cost|earned|received|got\s+paid|\$\d|跑|走|睡|体重|运动|锻炼|花|买|支出|¥|\d+\s*(?:元|块|公里|公斤|kg))/i;
const NARRATIVE_CONNECTORS = /\b(?:but|however|because|although|since|after|before|while|when|so|therefore|feel(?:s|ing)?|felt|think(?:ing)?|thought|realiz(?:e|ed)|noticed?|seems?|look(?:s|ed)?|today|yesterday|this\s+morning|tonight|actually|overall|honestly|surprisingly|thankfully)\b|(?:但是?|因为|虽然|所以|感觉|觉得|今天|昨天|早上|晚上|其实|总体|总的来说|开心|难过|累)/i;

function detectNarrative(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const charCount = trimmed.replace(/\s/g, '').length;
  if (charCount < 8) return null;

  const startsAsPureData = PURE_DATA_STARTERS.test(trimmed);

  if (!startsAsPureData) return trimmed;

  if (NARRATIVE_CONNECTORS.test(trimmed) && charCount >= 12) return trimmed;

  return null;
}

const ZH_CATEGORY_KEYWORDS: { category: string; words: RegExp }[] = [
  { category: 'food', words: /吃饭|餐厅|外卖|食物|饭|菜|零食|早餐|午餐|晚餐|奶茶|咖啡|超市|菜市场|买菜/ },
  { category: 'transport', words: /打车|出租车|滴滴|地铁|公交|火车|高铁|机票|停车|加油|油费|交通/ },
  { category: 'shopping', words: /衣服|鞋|包|网购|淘宝|京东|拼多多|商场|购物|服装|电器|数码/ },
  { category: 'bills', words: /房租|水电|电费|水费|网费|话费|保险|订阅|物业/ },
  { category: 'fitness', words: /健身房|运动|瑜伽|游泳|健身|跑步装备|运动鞋/ },
  { category: 'entertainment', words: /电影|视频|游戏|票|演唱会|音乐|娱乐|看剧/ },
  { category: 'health', words: /医院|药|看病|体检|牙科|诊所|医疗/ },
  { category: 'education', words: /课程|书|学费|培训|教育|学习/ },
  { category: 'food', words: /生活用品|日用品|用品/ },
];

function guessCategory(text: string, type: 'income' | 'expense'): string {
  if (type === 'income') {
    if (/salary|paycheck|payslip|工资|薪资/i.test(text)) return 'salary';
    if (/freelance|client|project|自由职业|接单|项目/i.test(text)) return 'freelance';
    if (/dividend|stock|invest|股票|基金|投资/i.test(text)) return 'investment';
    return 'income';
  }
  for (const { category, words } of ZH_CATEGORY_KEYWORDS) {
    if (words.test(text)) return category;
  }
  for (const { category, words } of CATEGORY_KEYWORDS) {
    if (words.test(text)) return category;
  }
  return 'other';
}

export const AIProcessor = {
  analyze(text: string): ExtractionResult {
    const result: ExtractionResult = {
      health: null,
      finance: null,
      finances: [],
      mood: null,
      narrative: null,
      hasNarrative: false,
    };

    const health: ExtractedHealth = {};
    let hasHealth = false;

    for (const { pattern, handler } of HEALTH_EXTRACTION_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const extracted = handler(match, text);
        if (extracted) {
          Object.assign(health, extracted);
          hasHealth = true;
        }
      }
    }
    if (hasHealth) result.health = health;

    const allFinances = extractAllFinance(text);
    result.finances = allFinances;
    result.finance = allFinances.length > 0 ? allFinances[0] : null;

    for (const { pattern, score, label } of MOOD_PATTERNS) {
      if (pattern.test(text)) {
        result.mood = { score, label };
        break;
      }
    }

    const narrative = detectNarrative(text);
    result.narrative = narrative;
    result.hasNarrative = narrative !== null;

    return result;
  },
};
