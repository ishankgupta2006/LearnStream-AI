const { GoogleGenAI } = require('@google/genai');

let genAI = null;

/**
 * Initialize Gemini AI client
 */
function initializeGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }
  
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  
  return genAI;
}

// 'gemini-2.0-flash' was shut down by Google on June 1, 2026 and now returns
// a 404 for every request, silently triggering the fallback summary/quiz
// logic below. 'gemini-flash-latest' is Google's auto-updating alias that
// always points at their current Flash model, so this won't go stale again
// the next time a model is retired.
//
// A backup model is tried if the primary is overloaded (503) or its daily
// free-tier quota is exhausted - each model has its OWN separate daily
// quota, so a second model is often available even when the first isn't.
const GEMINI_MODEL_CANDIDATES = [  'gemini-3.6-flash','gemini-flash-latest'];

/**
 * Sleep helper for retries
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Gemini with retry logic for rate limits
 */
// The @google/genai SDK's own config.httpOptions.timeout is currently
// broken (doesn't actually abort slow requests), so we enforce our own
// timeout here. Without this, a slow/overloaded Gemini server can leave a
// single attempt hanging for a very long, unpredictable time (observed:
// over a minute) instead of failing fast so we can retry or fall back.
const GEMINI_CALL_TIMEOUT_MS = 40000; // 40 seconds per attempt

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    )
  ]);
}

async function callGeminiWithRetry(prompt, maxRetriesPerModel = 1) {
  const client = initializeGemini();
  let lastError;

  for (let modelIndex = 0; modelIndex < GEMINI_MODEL_CANDIDATES.length; modelIndex++) {
    const model = GEMINI_MODEL_CANDIDATES[modelIndex];
    const isLastModel = modelIndex === GEMINI_MODEL_CANDIDATES.length - 1;

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: prompt,
            config: {
              // Lower temperature = more factual/deterministic, less "creative" drifting.
              temperature: 0.3,
              // Raise the output ceiling so long summaries / full 10-question
              // quizzes don't get cut off mid-response.
              maxOutputTokens: 4096,
              topP: 0.9
            }
          }),
          GEMINI_CALL_TIMEOUT_MS,
          `Gemini API call (${model})`
        );
        if (modelIndex > 0) {
          console.log(`✓ Backup model ${model} succeeded after ${GEMINI_MODEL_CANDIDATES[0]} failed.`);
        }
        return response.text.trim();
      } catch (error) {
        lastError = error;
        const errorMessage = error.message || '';

        // Surface enough detail to diagnose without digging through the SDK -
        // e.g. a 404 almost always means the model name is wrong/retired,
        // a 401/403 means the API key is invalid, a 429 means rate-limited.
        console.error(
          `Gemini API call failed [model=${model}] (attempt ${attempt}/${maxRetriesPerModel}):`,
          errorMessage
        );

        // A 429 can mean two very different things:
        // 1. Short-term per-minute rate limit -> worth waiting a bit and retrying.
        // 2. Daily quota fully exhausted (free tier is often just ~20
        //    requests/day for a given model) -> waiting 60s does NOTHING
        //    for THIS model since the quota only resets the next day. But
        //    since each model has its own separate quota, move straight to
        //    the next model instead of wasting retries here.
        const isDailyQuotaExhausted =
          errorMessage.includes('PerDay') ||
          errorMessage.includes('per day') ||
          errorMessage.includes('daily');

        if (isDailyQuotaExhausted) {
          console.error(`Daily quota exhausted for ${model}${isLastModel ? ' - no more backup models, using fallback.' : ' - trying backup model...'}`);
          break; // stop retrying this model, move to the next one (or fall back if none left)
        }

        const isRateLimited = errorMessage.includes('429') || errorMessage.includes('quota');
        const isTransientOverload =
          errorMessage.includes('503') ||
          errorMessage.includes('UNAVAILABLE') ||
          errorMessage.toLowerCase().includes('overloaded') ||
          errorMessage.toLowerCase().includes('timed out');

        if ((isRateLimited || isTransientOverload) && attempt < maxRetriesPerModel) {
          let waitTime;
          if (isRateLimited) {
            const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)/i);
            waitTime = retryMatch ? parseFloat(retryMatch[1]) * 1000 + 1000 : 8000;
          } else {
            // Exponential backoff for transient overload: 2s, 4s...
            waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
          }

          console.log(`${isRateLimited ? 'Rate limited' : 'Model temporarily overloaded'}. Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetriesPerModel} on ${model}...`);
          await sleep(waitTime);
          continue;
        }

        // Retries exhausted for this model (or a non-retryable error) -
        // fall through to try the next model in the list, if any.
        if (!isLastModel) {
          console.log(`Switching to backup model: ${GEMINI_MODEL_CANDIDATES[modelIndex + 1]}...`);
        }
        break;
      }
    }
  }

  // Every model/attempt failed
  throw lastError || new Error('All Gemini models failed');
}

/**
 * Clean and preprocess transcript - removes junk, promotional content, and normalizes text
 */
function preprocessTranscript(rawTranscript) {
  if (!rawTranscript) return '';
  
  let transcript = rawTranscript;
  
  // Remove URLs and links
  transcript = transcript.replace(/https?:\/\/[^\s]+/gi, '');
  transcript = transcript.replace(/www\.[^\s]+/gi, '');
  transcript = transcript.replace(/bit\.ly\/[^\s]+/gi, '');
  transcript = transcript.replace(/amzn\.to\/[^\s]+/gi, '');

  // Remove leftover tracking / query-string fragments (utm_source=..., ref=..., etc.)
  // These can survive the URL removal above if a link happens to get split across
  // a sentence boundary (e.g. by a period inside the domain name).
  transcript = transcript.replace(/\b(utm_[a-z]+|ref|source|campaign)=[^\s&]*(&(utm_[a-z]+|ref|source|campaign)=[^\s&]*)*/gi, '');

  // Remove bare domain fragments even without a protocol prefix
  // (e.g. "drive.google.com/folders/xyz" left over after a URL got split).
  transcript = transcript.replace(/\b[a-z0-9-]+\.(com|in|org|net|me|io|co|ly)(\/[^\s]*)?/gi, '');
  
  // Remove social media handles and hashtags
  transcript = transcript.replace(/@[\w]+/g, '');
  transcript = transcript.replace(/#[\w]+/g, '');
  
  // Remove promotional patterns
  transcript = transcript.replace(/use code[:\s]+[\w]+/gi, '');
  transcript = transcript.replace(/promo code[:\s]+[\w]+/gi, '');
  transcript = transcript.replace(/discount[:\s]+\d+%?/gi, '');
  transcript = transcript.replace(/subscribe[^.]*channel/gi, '');
  transcript = transcript.replace(/like[^.]*subscribe/gi, '');
  transcript = transcript.replace(/link in (the )?description/gi, '');
  transcript = transcript.replace(/telegram[^.]*link/gi, '');
  transcript = transcript.replace(/join[^.]*channel/gi, '');
  
  // Remove decorative separators
  transcript = transcript.replace(/[=]{3,}/g, ' ');
  transcript = transcript.replace(/[-]{3,}/g, ' ');
  transcript = transcript.replace(/[*]{3,}/g, ' ');
  transcript = transcript.replace(/[_]{3,}/g, ' ');
  
  // Remove emojis commonly used in video descriptions
  transcript = transcript.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  transcript = transcript.replace(/[\u{2600}-\u{26FF}]/gu, '');
  transcript = transcript.replace(/[\u{2700}-\u{27BF}]/gu, '');
  
  // Remove timestamps like [00:00] or (1:23:45)
  transcript = transcript.replace(/[\[\(]\d{1,2}:\d{2}(:\d{2})?[\]\)]/g, '');
  
  // Remove multiple spaces and normalize
  transcript = transcript.replace(/\s+/g, ' ');
  transcript = transcript.replace(/\n\s*\n/g, '\n');
  
  return transcript.trim();
}

/**
 * Extract the core topic from video title
 */
function extractTopicFromTitle(videoTitle) {
  // Remove common suffixes and prefixes
  let topic = videoTitle
    .replace(/\|.*$/g, '')  // Remove everything after |
    .replace(/[-–—].*?(tutorial|lecture|class|course|episode|part|ep\.|#\d+)/gi, '')
    .replace(/\(.*?\)/g, '')  // Remove parenthetical content
    .replace(/\[.*?\]/g, '')  // Remove bracketed content
    .replace(/by\s+[\w\s]+$/i, '')  // Remove "by Author Name"
    .replace(/one shot|full|complete|crash course/gi, '')
    .replace(/in hindi|हिंदी में/gi, '')
    .trim();
  
  return topic || videoTitle;
}

/**
 * Analyze transcript to extract key information
 */
function analyzeTranscript(transcript) {
  const analysis = {
    wordCount: 0,
    sentences: [],
    keyTerms: [],
    hasDefinitions: false,
    hasExamples: false,
    hasSteps: false,
    mainTopics: []
  };
  
  if (!transcript) return analysis;
  
  // Word count
  analysis.wordCount = transcript.split(/\s+/).length;
  
  // Extract sentences
  analysis.sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 300);
  
  // Check for definitions
  analysis.hasDefinitions = /is (defined as|called|known as|referred to as)/i.test(transcript);
  
  // Check for examples
  analysis.hasExamples = /for example|such as|like|instance|e\.g\./i.test(transcript);
  
  // Check for step-by-step content
  analysis.hasSteps = /(step|first|second|third|next|then|finally|firstly|secondly)/i.test(transcript);
  
  // Extract potential key terms (capitalized phrases, repeated technical terms)
  const words = transcript.toLowerCase().split(/\s+/);
  const wordFreq = {};
  words.forEach(w => {
    if (w.length > 4) {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  });
  
  analysis.keyTerms = Object.entries(wordFreq)
    .filter(([word, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
  
  return analysis;
}

/**
 * Generate a comprehensive summary from transcript
 */
async function generateSummary(transcript, videoTitle) {
  // Preprocess transcript
  const cleanTranscript = preprocessTranscript(transcript);
  const topic = extractTopicFromTitle(videoTitle);
  const analysis = analyzeTranscript(cleanTranscript);
  
const prompt = `You are an expert educational content summarizer writing detailed study notes for a student who has NOT watched this video and will rely entirely on your summary to learn the material. Create an accurate, comprehensive learning note based ONLY on this video's actual transcript.

VIDEO TITLE: ${videoTitle}
VIDEO TOPIC: ${topic}
TRANSCRIPT WORD COUNT: ${analysis.wordCount}
${analysis.keyTerms.length > 0 ? `FREQUENTLY MENTIONED TERMS: ${analysis.keyTerms.slice(0, 15).join(', ')}` : ''}

TRANSCRIPT:
${cleanTranscript.substring(0, 60000)}

STRICT ACCURACY RULES:
1. Use ONLY information that actually appears in the transcript above. Do not supplement with outside/general knowledge about the topic.
2. Never invent facts, definitions, examples, numbers, formulas, names, or conclusions that are not explicitly present in the transcript.
3. Ignore greetings, sponsor messages, promotions, calls to subscribe, and unrelated small talk — do not summarize these.
4. If a detail is unclear, incomplete, or ambiguous in the transcript, describe it as the instructor presented it rather than guessing or "filling in" the gap.
5. Preserve exact technical terms, names, numbers, and formulas exactly as the instructor stated them. Do not paraphrase numbers or formulas.
6. Do not skip content just to keep the summary short — err on the side of including more real detail rather than compressing it away.

WRITE THE SUMMARY WITH THIS LEVEL OF DETAIL:
1. Overview (1-2 paragraphs): what the video is about, why the topic matters, and what the viewer should be able to do/understand after watching.
2. Core concepts (multiple paragraphs, one per major concept): for EVERY important concept, definition, formula, or method discussed, explain it fully — what it is, how it works, and any specific detail, number, or nuance the instructor gave about it. Do not merge multiple distinct concepts into a single vague paragraph.
3. Process, steps, or structure: if the video walks through a sequence, workflow, procedure, comparison, or step-by-step reasoning, lay it out faithfully in the order it was presented, including any sub-steps or conditions mentioned.
4. Examples and applications: describe every concrete example, case study, demo, or application the instructor used, and explain specifically what point each example illustrates.
5. Key takeaways: summarize the most important things a learner should remember, phrased as specific, checkable statements (not generic advice).

FORMAT RULES:
- Write as many paragraphs as the content actually requires to be complete and detailed — for a substantial video this is typically 8 to 14 paragraphs, not 5. Do not pad with filler, but do not artificially compress real content either.
- Every paragraph must contain specific, checkable information from the transcript, not generic filler like "this section covers important information."
- Use clear, precise educational language a student could study directly.
- Do NOT use Markdown headings, bullet points, numbered lists, code blocks, or emojis — write in flowing paragraph prose.
- Do NOT mention that you are an AI, that you received a transcript, or reference "the video" as a meta-object — write as direct study notes on the subject matter.

Your final answer must be a thorough, detailed, and completely faithful explanation of THIS specific video's actual content — prioritize completeness and accuracy over brevity.`;

  try {
    const response = await callGeminiWithRetry(prompt);
    return response;
  } catch (error) {
    console.error('Summary generation error:', error.message);
    
    // Create a better fallback using cleaned transcript excerpts.
    // IMPORTANT: pass the already-preprocessed transcript (URLs, promo text,
    // handles etc. already stripped) instead of the raw transcript — using
    // the raw transcript here let junk like tracking-link fragments leak
    // straight into the fallback summary.
    const fallbackSummary = createFallbackSummary(cleanTranscript, videoTitle);
    console.log('Summary generation failed, using fallback');
    return fallbackSummary;
  }
}

/**
 * Clean transcript by removing promotional content, links, and non-educational text
 */
function cleanTranscript(transcript) {
  // Split into lines/sentences
  let lines = transcript.split(/[.!?\n]+/);
  
  // Patterns to filter out
  const junkPatterns = [
    /https?:\/\//i,
    /www\./i,
    /\.com|\.in|\.org|\.net|\.me/i,
    /telegram|whatsapp|instagram|twitter|facebook/i,
    /unacademy|udemy|coursera|youtube\.com/i,
    /subscribe|like|share|comment/i,
    /link|channel|playlist/i,
    /use code|promo|discount|offer|enrollment/i,
    /batch|subscription|join/i,
    /====+|----+|\*\*\*+/,  // Decorative separators
    /👉|🔴|▶|📱|💡|🎯/,  // Emojis often used in descriptions
    /@\w+/,  // Social media handles
    /^\s*$/,  // Empty lines
    /video (title|description):/i,
    /^[A-Z\s]+:$/,  // Headers like "IMPORTANT:"
    /utm_[a-z]+=/i,  // Tracking query params (utm_source=, utm_medium=, ...)
    /\b(ref|source|campaign)=[^\s]+/i,  // Other common query params
    /^[a-z0-9\-_.]+\/[a-z0-9\-_./]+$/i,  // Bare URL-path-looking fragments (e.g. "com/drive/folders/abc123")
    /[a-zA-Z0-9_-]{15,}/  // Long opaque ID-looking tokens (drive folder IDs, hashes, etc.)
  ];
  
  // Filter out junk lines
  lines = lines.filter(line => {
    const trimmed = line.trim();
    if (trimmed.length < 20) return false;
    
    for (const pattern of junkPatterns) {
      if (pattern.test(trimmed)) return false;
    }
    
    return true;
  });
  
  return lines.map(l => l.trim()).filter(l => l.length > 0);
}

/**
 * Create a fallback summary from transcript - IMPROVED VERSION
 */
function createFallbackSummary(transcript, videoTitle) {
  // Clean the transcript first
  const cleanedSentences = cleanTranscript(transcript);
  
  // Extract topic from title (remove common suffixes)
  const topicMatch = videoTitle.match(/^([^|]+)/);
  const topic = topicMatch ? topicMatch[1].trim() : videoTitle;
  
  // Get educational sentences (skip first few which are often greetings)
  const educationalSentences = cleanedSentences
    .slice(3) // Skip potential intro/greetings
    .filter(s => s.length > 40 && s.length < 200)
    .filter(s => !/^(hey|hi|hello|welcome|thank|good morning|good evening)/i.test(s))
    .slice(0, 5);
  
  if (educationalSentences.length >= 2) {
    const contentPreview = educationalSentences.slice(0, 2).join('. ');
    
    return `This video provides a comprehensive overview of ${topic}. ${contentPreview}.

The content explores key concepts and practical applications relevant to ${topic}. The instructor explains fundamental principles and provides examples to help viewers understand the material.

By the end of this video, viewers will have gained valuable knowledge about ${topic} and its applications in real-world scenarios.`;
  }
  
  // If no good sentences found, use a topic-based summary
  return `This video provides a comprehensive introduction to ${topic}.

The content covers essential concepts, principles, and practical applications that are fundamental to understanding ${topic}. Through clear explanations and examples, the instructor guides viewers through the key topics.

This is a valuable resource for students and professionals looking to strengthen their knowledge of ${topic}.`;
}

/**
 * Extract key learning points from transcript
 */
async function extractKeyPoints(transcript, videoTitle) {
  // Preprocess transcript
  const cleanTranscript = preprocessTranscript(transcript);
  const topic = extractTopicFromTitle(videoTitle);
  const analysis = analyzeTranscript(cleanTranscript);
  
  const prompt = `Extract exactly 8 specific key learning points from this video transcript.

VIDEO TOPIC: ${topic}
${analysis.keyTerms.length > 0 ? `KEY TERMS MENTIONED: ${analysis.keyTerms.slice(0, 10).join(', ')}` : ''}

TRANSCRIPT:
${cleanTranscript.substring(0, 30000)}

EXTRACTION RULES:
1. Each point must be a SPECIFIC fact, concept, or insight from THIS video
2. Include actual definitions, formulas, methods, or examples mentioned
3. Do NOT include generic statements like "Understanding X is important"
4. Do NOT include promotional content, greetings, or filler
5. Each point should be 1-2 sentences, complete and standalone
6. Points should cover different aspects of the video content

EXAMPLES OF GOOD KEY POINTS:
- "The derivative of x² is 2x, which represents the rate of change"
- "GIS uses layers to overlay different types of geographic data"
- "The three main types of surveying are: plane, geodetic, and cadastral"

EXAMPLES OF BAD KEY POINTS (DO NOT USE):
- "This topic is very important"
- "Welcome to the video"
- "Understanding the basics is essential"

Return ONLY a valid JSON array of exactly 8 strings. No markdown, no code blocks.
Example: ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6", "Point 7", "Point 8"]`;

  try {
    const response = await callGeminiWithRetry(prompt);
    
    // Clean up response - remove markdown code blocks if present
    let text = response.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
    
    // Find JSON array in response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length >= 8) {
        return parsed.slice(0, 8);
      }
    }
    
    throw new Error('Invalid key points format');
  } catch (error) {
    console.error('Key points extraction error:', error.message);
    
    // Extract key points from transcript
    console.log('Key points extraction failed, using fallback');
    return extractFallbackKeyPoints(transcript, videoTitle);
  }
}

/**
 * Extract fallback key points from transcript - IMPROVED VERSION
 * Filters out greetings, filler content, links, and extracts actual educational sentences
 */
function extractFallbackKeyPoints(transcript, videoTitle) {
  // Words/phrases that indicate non-educational content (greetings, filler, calls to action, links, products)
  const skipPatterns = [
    /^(hey|hi|hello|welcome|thank you|thanks)/i,
    /subscribe/i,
    /click|like|share|comment/i,
    /link in (the )?description/i,
    /don't forget/i,
    /let me know/i,
    /see you (in|next)/i,
    /bye|goodbye/i,
    /patreon|sponsor/i,
    /^(so|well|now|okay|alright|um|uh)/i,
    /my (name is|friend)/i,
    /join(ing)? me/i,
    /today('s| we)/i,
    /^(first|before we)/i,
    /important question/i,
    // NEW: Filter out links, products, promotional content
    /https?:\/\//i,
    /www\./i,
    /amzn|amazon|flipkart|ebay/i,
    /\.com|\.in|\.org|\.net/i,
    /buy now|order now|purchase|discount|offer|price/i,
    /affiliate|promo code|coupon/i,
    /tripod|camera|equipment|gear|product/i,
    /check out|check the|link below/i,
    /description box/i,
    /follow me|follow us/i,
    /instagram|twitter|facebook|tiktok/i,
    /^\d+[\/\-]\d+/i,  // Dates or fractions at start
    /^[A-Z]{2,}[0-9]/i,  // Product codes like "VCT-690"
    /aluminium|aluminum/i,  // Product materials
    /black|white|red|blue\):/i,  // Product color descriptions
  ];
  
  // Patterns that indicate educational/informative content
  const educationalPatterns = [
    /means that/i,
    /this is (called|known as|when|how|why|what)/i,
    /the (key|main|important|fundamental|basic|core)/i,
    /for example/i,
    /in other words/i,
    /the (concept|idea|principle|theory|method|process|technique)/i,
    /you (can|should|need to|must|will) (learn|understand|see|notice)/i,
    /because/i,
    /therefore|thus|hence/i,
    /which means/i,
    /the (difference|reason|purpose|goal|result)/i,
    /defined as/i,
    /works by/i,
    /consists of/i,
    /there are (\d+|several|many|few)/i,
    /(first|second|third|finally),? (step|point|thing|concept)/i,
    /the formula|equation|calculation/i,
    /remember that/i,
    /notice (that|how)/i,
    /this (shows|demonstrates|proves|means|indicates)/i,
    /we can (see|observe|understand|conclude)/i,
    /the (problem|solution|answer|approach)/i,
  ];
  
  // Split into sentences
  const sentences = transcript.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 50 && s.length < 220) // Good sentence length (increased min)
    .filter(s => {
      // Additional filters for garbage content
      const lowerS = s.toLowerCase();
      // Must have at least 5 words
      if (s.split(/\s+/).length < 6) return false;
      // Skip if mostly uppercase (product names, titles)
      const upperCount = (s.match(/[A-Z]/g) || []).length;
      if (upperCount > s.length * 0.4) return false;
      // Skip if contains URLs or special characters typical of links
      if (/[:\/]{2,}|@|#\w+/.test(s)) return false;
      return true;
    });
  
  // Score each sentence for educational value
  const scoredSentences = sentences.map(sentence => {
    let score = 0;
    
    // Strong negative score for skip patterns (promotional/link content)
    for (const pattern of skipPatterns) {
      if (pattern.test(sentence)) {
        score -= 20;  // Increased penalty
      }
    }
    
    // Positive score for educational patterns
    for (const pattern of educationalPatterns) {
      if (pattern.test(sentence)) {
        score += 5;
      }
    }
    
    // Bonus for sentences with numbers that look like facts (not product codes)
    if (/\d+\s*(percent|%|times|years|steps|ways|things)/i.test(sentence)) {
      score += 3;
    }
    
    // Bonus for sentences with technical terms (capitalized words in middle, but not product names)
    const technicalWords = sentence.match(/\s[A-Z][a-z]{3,}/g);
    if (technicalWords && technicalWords.length > 0 && technicalWords.length < 4) {
      score += technicalWords.length;
    }
    
    // Penalty for very short sentences or ones starting with pronouns
    if (sentence.length < 70 || /^(I|You|We|They|It|He|She)\s/i.test(sentence)) {
      score -= 3;
    }
    
    // Strong penalty for sentences that look like product descriptions or links
    if (/[A-Z]{3,}[-\d]|:\s*https?|amzn\.to|bit\.ly/i.test(sentence)) {
      score -= 50;
    }
    
    return { sentence, score };
  });
  
  // Sort by score and get top educational sentences
  const topSentences = scoredSentences
    .filter(s => s.score > 2)  // Higher threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(s => s.sentence);
  
  if (topSentences.length >= 5) {
    // Clean up and format as key points
    return topSentences.slice(0, 8).map(s => {
      // Capitalize first letter
      let point = s.charAt(0).toUpperCase() + s.slice(1);
      // Remove leading connectors
      point = point.replace(/^(And|But|So|Now|Then|Also|Okay|Alright)\s+/i, '');
      // Remove any URLs or link fragments that slipped through
      point = point.replace(/https?:\/\/\S+/gi, '').trim();
      point = point.replace(/amzn\.to\/\S+/gi, '').trim();
      // Remove product codes
      point = point.replace(/\([^)]*[A-Z]{2,}\d+[^)]*\)/gi, '').trim();
      // Clean up double spaces
      point = point.replace(/\s{2,}/g, ' ').trim();
      return point;
    }).filter(p => p.length > 30);  // Filter out too-short results after cleaning
  }
  
  // If we couldn't find enough educational sentences, extract topic-based points
  return extractTopicBasedKeyPoints(transcript, videoTitle);
}

/**
 * Extract key points based on detected topics in the transcript
 */
function extractTopicBasedKeyPoints(transcript, videoTitle) {
  const lowerTranscript = transcript.toLowerCase();
  const lowerTitle = videoTitle.toLowerCase();
  
  // Common educational topic indicators
  const topicKeywords = {
    'programming': ['code', 'function', 'variable', 'programming', 'software', 'developer'],
    'mathematics': ['equation', 'formula', 'calculate', 'number', 'math', 'algebra', 'calculus'],
    'science': ['experiment', 'hypothesis', 'theory', 'research', 'scientific', 'data'],
    'business': ['market', 'strategy', 'customer', 'revenue', 'business', 'growth'],
    'health': ['health', 'exercise', 'nutrition', 'diet', 'wellness', 'body'],
    'psychology': ['mind', 'behavior', 'psychology', 'mental', 'cognitive', 'brain'],
    'history': ['history', 'century', 'war', 'civilization', 'ancient', 'historical'],
    'language': ['language', 'grammar', 'vocabulary', 'word', 'speak', 'pronunciation'],
    'design': ['design', 'creative', 'visual', 'layout', 'color', 'aesthetic'],
    'productivity': ['productivity', 'habit', 'goal', 'time', 'focus', 'efficient'],
    'engineering': ['engineering', 'civil', 'mechanical', 'electrical', 'structure', 'construction', 'building'],
    'surveying': ['surveying', 'gis', 'gps', 'mapping', 'coordinates', 'geodetic', 'topography', 'leveling', 'theodolite'],
  };
  
  // Detect main topic
  let detectedTopic = 'general';
  let maxMatches = 0;
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    const matches = keywords.filter(kw => lowerTranscript.includes(kw) || lowerTitle.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedTopic = topic;
    }
  }
  
  // Generate topic-specific key points
  const topicPoints = {
    'programming': [
      `Core programming concepts explained in "${videoTitle}"`,
      'Understanding the code structure and organization',
      'Best practices for writing clean and maintainable code',
      'Common patterns and techniques demonstrated',
      'Debugging and problem-solving approaches covered',
      'Practical implementation examples shown',
      'Key syntax and language features discussed',
      'Tips for improving coding efficiency'
    ],
    'mathematics': [
      `Mathematical foundations covered in "${videoTitle}"`,
      'Key formulas and equations explained',
      'Step-by-step problem-solving methods',
      'Real-world applications of the concepts',
      'Common mistakes to avoid in calculations',
      'Visual representations of abstract concepts',
      'Practice techniques for mastering the material',
      'Connections to other mathematical topics'
    ],
    'science': [
      `Scientific principles explored in "${videoTitle}"`,
      'Key theories and hypotheses discussed',
      'Experimental methods and procedures explained',
      'Evidence and data interpretation techniques',
      'Real-world applications of the science',
      'Historical context and discoveries mentioned',
      'Current research and future directions',
      'Critical thinking approaches for analysis'
    ],
    'engineering': [
      'Fundamental engineering principles and concepts explained',
      'Design considerations and best practices discussed',
      'Material properties and selection criteria covered',
      'Safety standards and regulations mentioned',
      'Practical applications in real-world projects',
      'Common engineering calculations and formulas',
      'Problem-solving approaches for engineering challenges',
      'Industry standards and professional practices'
    ],
    'surveying': [
      'Fundamentals of surveying and measurement techniques',
      'GIS (Geographic Information System) concepts and applications',
      'GPS technology and positioning systems explained',
      'Coordinate systems and map projections discussed',
      'Field surveying equipment and instruments covered',
      'Data collection and analysis methods',
      'Accuracy and precision in measurements',
      'Practical applications in civil engineering and construction'
    ],
    'general': [
      `Main concepts introduced in "${videoTitle}"`,
      'Key principles and fundamentals covered',
      'Practical applications discussed in the video',
      'Important terminology and definitions explained',
      'Step-by-step processes or methods shown',
      'Common misconceptions addressed',
      'Tips and recommendations provided',
      'Action items and takeaways for viewers'
    ]
  };
  
  return topicPoints[detectedTopic] || topicPoints['general'];
}

/**
 * Fisher-Yates shuffle - returns a new shuffled array, does not mutate input
 */
function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Randomize the position of the correct answer within each question's options.
 * Without this, the correct answer tends to always land on the same index
 * (e.g. index 0) because that's how the source data/fallbacks are built,
 * which makes the quiz trivially guessable.
 */
function shuffleQuizOptions(quiz) {
  return quiz.map((question) => {
    const options = Array.isArray(question.options) ? question.options : [];
    const correctIndex = question.correctAnswer;
    const correctOptionText = options[correctIndex];

    // Pair each option with whether it was the correct one, then shuffle the pairs
    const paired = options.map((opt, idx) => ({
      text: opt,
      wasCorrect: idx === correctIndex
    }));

    const shuffledPaired = shuffleArray(paired);

    const newCorrectIndex = shuffledPaired.findIndex((p) => p.wasCorrect);

    return {
      ...question,
      options: shuffledPaired.map((p) => p.text),
      // Fallback to 0 only if something went wrong and we couldn't locate
      // the correct option (shouldn't normally happen).
      correctAnswer: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      // Keep for debugging/reference, harmless to include.
      _correctOptionText: correctOptionText
    };
  }).map(({ _correctOptionText, ...rest }) => rest); // strip debug field before returning
}

/**
 * Generate quiz questions from transcript - FOCUSED ON VIDEO CONTENT
 */
async function generateQuiz(transcript, videoTitle, keyPoints) {
  // Preprocess and deeply analyze transcript
  const cleanTranscript = preprocessTranscript(transcript);
  const topic = extractTopicFromTitle(videoTitle);
  const analysis = analyzeTranscript(cleanTranscript);
  const keyPointsList = keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n');
  
  // Extract specific facts, numbers, and definitions from transcript
  const extractedFacts = extractFactsFromTranscript(cleanTranscript);
  
  const prompt = `You are creating a quiz that tests ONLY what was actually said in this specific video. 

VIDEO TITLE: ${videoTitle}
CORE TOPIC: ${topic}

=== EXTRACTED FACTS FROM THIS VIDEO ===
${extractedFacts.join('\n')}

=== KEY POINTS IDENTIFIED ===
${keyPointsList}

=== FREQUENTLY USED TERMS IN THIS VIDEO ===
${analysis.keyTerms.slice(0, 15).join(', ')}

=== FULL TRANSCRIPT ===
${cleanTranscript.substring(0, 28000)}

=== QUIZ CREATION INSTRUCTIONS ===

CRITICAL RULES:
1. Every question MUST be answerable ONLY by watching this specific video
2. If the video says "there are 3 types of X" - ask about those 3 types
3. If the video gives a definition - ask about that exact definition
4. If the video mentions a formula - ask about that formula
5. If the video gives an example - ask about that example
6. Do NOT create questions about concepts NOT discussed in the transcript

CREATE 10 QUESTIONS BASED ON:
- Specific definitions given (e.g., "X is defined as...")
- Numbers mentioned (e.g., "there are 5 components...")
- Steps or procedures explained
- Examples and case studies discussed
- Comparisons made between concepts
- Cause and effect relationships explained
- Key terms and their meanings as used in this video
- Specific tools, methods, or techniques mentioned

QUESTION TYPES TO INCLUDE:
- 3 definition/terminology questions
- 3 concept understanding questions
- 2 application/example questions
- 2 comparison/relationship questions

Return ONLY valid JSON array (no markdown, no code blocks):
[
  {
    "id": 1,
    "question": "Question directly from video content?",
    "options": ["Correct answer from video", "Plausible wrong option", "Another wrong option", "Another wrong option"],
    "correctAnswer": 0,
    "explanation": "In the video, the instructor specifically said..."
  }
]`;

  try {
    const response = await callGeminiWithRetry(prompt);
    
    // Clean up response
    let text = response
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    
    // Try to parse JSON
    let quiz;
    try {
      quiz = JSON.parse(text);
    } catch {
      // Try to find JSON array in response
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        quiz = JSON.parse(arrayMatch[0]);
      } else {
        // Try to find object with quiz property
        const objMatch = text.match(/\{[\s\S]*"quiz"[\s\S]*\}/);
        if (objMatch) {
          const parsed = JSON.parse(objMatch[0]);
          quiz = parsed.quiz;
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
    }
    
    // Handle if quiz is wrapped in object
    if (quiz && quiz.quiz) {
      quiz = quiz.quiz;
    }
    
    if (!Array.isArray(quiz) || quiz.length < 5) {
      throw new Error('Invalid quiz format or too few questions');
    }
    
    // Validate and return quiz
    const normalizedQuiz = quiz.slice(0, 10).map((q, index) => ({
      id: q.id || index + 1,
      question: String(q.question || ''),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['A', 'B', 'C', 'D'],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      explanation: String(q.explanation || 'This is the correct answer based on the video content.')
    }));

    return shuffleQuizOptions(normalizedQuiz);
    
  } catch (error) {
    console.error('Quiz generation error:', error.message);
    
    // Try a simpler prompt as fallback
    return await generateSimplifiedQuiz(cleanTranscript, videoTitle, keyPoints);
  }
}

/**
 * Extract specific facts, numbers, and definitions from transcript
 */
function extractFactsFromTranscript(transcript) {
  const facts = [];
  const sentences = transcript.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    
    // Definitions
    if (/is (defined as|called|known as|referred to as|means)/i.test(sentence)) {
      facts.push(`DEFINITION: ${sentence}`);
    }
    
    // Numbers and quantities
    if (/there are \d+|(\d+) (types?|kinds?|categories|steps?|methods?|ways?|components?|parts?|elements?)/i.test(sentence)) {
      facts.push(`QUANTITY: ${sentence}`);
    }
    
    // Formulas and equations
    if (/formula|equation|equal to|equals|=/.test(lower)) {
      facts.push(`FORMULA: ${sentence}`);
    }
    
    // Processes and steps
    if (/first(ly)?|second(ly)?|third(ly)?|step \d|next|then|finally/i.test(sentence) && sentence.length > 40) {
      facts.push(`STEP: ${sentence}`);
    }
    
    // Comparisons
    if (/unlike|whereas|compared to|difference between|on the other hand|however/i.test(sentence)) {
      facts.push(`COMPARISON: ${sentence}`);
    }
    
    // Examples
    if (/for example|such as|for instance|like when/i.test(sentence)) {
      facts.push(`EXAMPLE: ${sentence}`);
    }
    
    // Important statements
    if (/important|crucial|key|essential|remember|note that|keep in mind/i.test(sentence)) {
      facts.push(`IMPORTANT: ${sentence}`);
    }
  }
  
  // Return unique facts, limited to 30
  return [...new Set(facts)].slice(0, 30);
}

/**
 * Simplified quiz generation as backup
 */
async function generateSimplifiedQuiz(transcript, videoTitle, keyPoints) {
  const keyPointsList = keyPoints.slice(0, 8).map((p, i) => `${i + 1}. ${p}`).join('\n');
  
  const prompt = `Create 10 quiz questions based ONLY on these key points from a video titled "${videoTitle}":

${keyPointsList}

Additional context from transcript:
${transcript.substring(0, 10000)}

Rules:
- Questions must be about the content above
- Each question has 4 options, only 1 correct
- Include the correct answer index (0-3)

Return JSON array only:
[{"id":1,"question":"...","options":["...","...","...","..."],"correctAnswer":0,"explanation":"..."}]`;

  try {
    const response = await callGeminiWithRetry(prompt);
    let text = response.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    let quiz;
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      quiz = JSON.parse(arrayMatch[0]);
    } else {
      throw new Error('No JSON array found');
    }
    
    const normalizedQuiz = quiz.slice(0, 10).map((q, index) => ({
      id: q.id || index + 1,
      question: String(q.question || ''),
      options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : ['A', 'B', 'C', 'D'],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      explanation: String(q.explanation || 'Based on the video content.')
    }));

    return shuffleQuizOptions(normalizedQuiz);
  } catch (error) {
    console.error('Simplified quiz generation also failed:', error.message);
    // Final fallback - generate questions from key points
    return generateKeyPointQuiz(keyPoints, videoTitle);
  }
}

/**
 * Generate quiz directly from key points - last resort fallback
 */
function generateKeyPointQuiz(keyPoints, videoTitle) {
  const quiz = [];
  
  for (let i = 0; i < Math.min(keyPoints.length, 10); i++) {
    const point = keyPoints[i];
    
    // Create a question about this key point
    quiz.push({
      id: i + 1,
      question: `According to the video "${videoTitle}", which of the following is correct about: "${point.substring(0, 50)}..."?`,
      options: [
        point.length > 80 ? point.substring(0, 80) + '...' : point,
        'This topic was not discussed in the video',
        'The video mentioned the opposite is true',
        'This is unrelated to the video content'
      ],
      correctAnswer: 0,
      explanation: `This key point was directly discussed in the video: ${point}`
    });
  }
  
  // Pad with additional questions if needed
  while (quiz.length < 10) {
    quiz.push({
      id: quiz.length + 1,
      question: `What is one of the main topics covered in "${videoTitle}"?`,
      options: [
        keyPoints[0] || 'The main concept discussed',
        'A topic not related to this video',
        'Something completely different',
        'An unrelated subject'
      ],
      correctAnswer: 0,
      explanation: 'This was one of the main topics covered in the video.'
    });
  }
  
  return shuffleQuizOptions(quiz);
}

/**
 * Extract the main concept from a key point
 */
function extractMainConceptFromPoint(point) {
  // Remove common filler words and get core concept
  const fillerWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'that', 'this', 'these', 'those', 'and', 'or', 'but', 'if', 'then',
    'so', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'with', 'about', 'into', 'through',
    'understanding', 'key', 'main', 'important', 'fundamental', 'basic', 'core', 'covered',
    'discussed', 'explained', 'mentioned', 'presented', 'shown', 'video'];
  
  const words = point.toLowerCase().split(/\s+/)
    .filter(w => !fillerWords.includes(w) && w.length > 3)
    .slice(0, 4);
  
  if (words.length === 0) return "the key concept";
  return words.join(' ');
}

module.exports = {
  generateSummary,
  extractKeyPoints,
  generateQuiz,
  generateKeyPointQuiz
};