import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from './ui/textarea';

interface SpellCheckTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  name?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  word: string;
  suggestions: string[];
  startIndex: number;
  endIndex: number;
}

interface MisspelledWord {
  word: string;
  startIndex: number;
  endIndex: number;
}

export default function SpellCheckTextarea({
  value,
  onChange,
  placeholder,
  className,
  name
}: SpellCheckTextareaProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    word: '',
    suggestions: [],
    startIndex: 0,
    endIndex: 0
  });
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Common English words that should not be flagged as misspelled
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above', 'through',
    'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over',
    'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
    'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'can', 'will', 'just', 'should', 'now',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
    'this', 'that', 'these', 'those', 'a', 'an', 'am', 'is', 'are', 'was', 'were',
    'be', 'being', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'going', 'want', 'need',
    'like', 'know', 'think', 'feel', 'see', 'hear', 'say', 'get', 'make', 'go', 'come',
    'take', 'give', 'work', 'play', 'run', 'walk', 'talk', 'look', 'find', 'keep',
    'start', 'stop', 'help', 'show', 'move', 'live', 'believe', 'bring', 'happen',
    'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
    'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create',
    'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer',
    'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send',
    'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest',
    'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'return', 'explain',
    'hope', 'develop', 'carry', 'break', 'receive', 'agree', 'support', 'hit', 'produce',
    'eat', 'cover', 'catch', 'draw', 'choose', 'cause', 'point', 'plan', 'wear', 'increase',
    'result', 'change', 'morning', 'evening', 'night', 'today', 'tomorrow', 'yesterday',
    'week', 'month', 'year', 'time', 'day', 'hour', 'minute', 'moment', 'second',
    'home', 'house', 'room', 'door', 'window', 'car', 'phone', 'computer', 'book',
    'table', 'chair', 'food', 'water', 'coffee', 'tea', 'money', 'job', 'work',
    'school', 'family', 'friend', 'person', 'people', 'man', 'woman', 'child',
    'good', 'bad', 'great', 'small', 'big', 'large', 'little', 'long', 'short',
    'high', 'low', 'hot', 'cold', 'warm', 'cool', 'new', 'old', 'young', 'easy',
    'hard', 'simple', 'difficult', 'important', 'different', 'same', 'right', 'wrong',
    'true', 'false', 'real', 'sure', 'possible', 'early', 'late', 'ready', 'happy',
    'sad', 'angry', 'excited', 'tired', 'busy', 'free', 'available', 'interested',
    'surprised', 'worried', 'scared', 'safe', 'dangerous', 'careful', 'beautiful',
    'nice', 'pretty', 'ugly', 'clean', 'dirty', 'quiet', 'loud', 'fast', 'slow',
    'strong', 'weak', 'healthy', 'sick', 'full', 'empty', 'rich', 'poor', 'cheap',
    'expensive', 'free', 'open', 'closed', 'public', 'private', 'special', 'normal',
    'strange', 'funny', 'serious', 'social', 'personal', 'professional', 'natural',
    'human', 'animal', 'plant', 'tree', 'flower', 'grass', 'water', 'fire', 'air',
    'earth', 'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind', 'weather'
  ]);

  // Common typos and their corrections
  const commonCorrections: { [key: string]: string[] } = {
    'teh': ['the'],
    'adn': ['and'],
    'youre': ["you're", 'your'],
    'recieve': ['receive'],
    'seperate': ['separate'],
    'definately': ['definitely'],
    'occured': ['occurred'],
    'neccessary': ['necessary'],
    'beleive': ['believe'],
    'wierd': ['weird'],
    'freind': ['friend'],
    'accomodate': ['accommodate'],
    'embarass': ['embarrass'],
    'maintenence': ['maintenance'],
    'recomend': ['recommend'],
    'wich': ['which', 'witch'],
    'loose': ['lose'],
    'alot': ['a lot'],
    'untill': ['until'],
    'tommorow': ['tomorrow'],
    'occassion': ['occasion'],
    'begining': ['beginning'],
    'goverment': ['government'],
    'enviroment': ['environment'],
    'buisness': ['business'],
    'calender': ['calendar'],
    'cemetary': ['cemetery'],
    'definitly': ['definitely'],
    'desparate': ['desperate'],
    'exagerate': ['exaggerate'],
    'existance': ['existence'],
    'fourty': ['forty'],
    'gaurd': ['guard'],
    'independant': ['independent'],
    'jewelery': ['jewelry'],
    'knowlege': ['knowledge'],
    'liesure': ['leisure'],
    'lightening': ['lightning'],
    'neice': ['niece'],
    'occurance': ['occurrence'],
    'perseverence': ['perseverance'],
    'priviledge': ['privilege'],
    'publically': ['publicly'],
    'refered': ['referred'],
    'relevent': ['relevant'],
    'religous': ['religious'],
    'rythm': ['rhythm'],
    'sciense': ['science'],
    'truely': ['truly'],
    'writen': ['written']
  };

  // Check if a word is correctly spelled
  const isWordCorrect = useCallback((word: string): boolean => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    // Skip very short words, numbers, or empty strings
    if (cleanWord.length < 2 || /\d/.test(word)) {
      return true;
    }

    // Check if word is in ignored list
    if (ignoredWords.has(cleanWord)) {
      return true;
    }

    // Check against common words
    if (commonWords.has(cleanWord)) {
      return true;
    }

    // Check if it's a known typo
    if (commonCorrections[cleanWord]) {
      return false;
    }

    // Basic heuristics for common word patterns
    // Accept contractions
    if (word.includes("'")) {
      return true;
    }

    // Accept capitalized words (proper nouns)
    if (word[0] === word[0].toUpperCase() && word.length > 2) {
      return true;
    }

    // Accept words with common suffixes
    const commonSuffixes = [
      'ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'ful', 'less',
      'able', 'ible', 'ous', 'ious', 'al', 'ic', 'ary', 'ory', 'ive', 'ative'
    ];
    
    for (const suffix of commonSuffixes) {
      if (cleanWord.endsWith(suffix)) {
        const root = cleanWord.slice(0, -suffix.length);
        if (root.length > 2 && commonWords.has(root)) {
          return true;
        }
      }
    }

    // If none of the above, assume it's misspelled
    return false;
  }, [ignoredWords]);

  // Get suggestions for a misspelled word
  const getSuggestions = useCallback((word: string): string[] => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    // Check for known corrections first
    if (commonCorrections[cleanWord]) {
      return commonCorrections[cleanWord];
    }

    const suggestions: string[] = [];

    // Simple edit distance suggestions
    // Try removing each character
    for (let i = 0; i < cleanWord.length; i++) {
      const candidate = cleanWord.slice(0, i) + cleanWord.slice(i + 1);
      if (candidate.length > 1 && commonWords.has(candidate)) {
        suggestions.push(candidate);
      }
    }

    // Try adding common endings
    const endings = ['s', 'ed', 'ing', 'er', 'ly'];
    for (const ending of endings) {
      const candidate = cleanWord + ending;
      if (commonWords.has(candidate)) {
        suggestions.push(candidate);
      }
    }

    // Try removing common endings
    for (const ending of endings) {
      if (cleanWord.endsWith(ending)) {
        const candidate = cleanWord.slice(0, -ending.length);
        if (candidate.length > 1 && commonWords.has(candidate)) {
          suggestions.push(candidate);
        }
      }
    }

    return [...new Set(suggestions)].slice(0, 5);
  }, []);

  // Get all misspelled words in the text
  const getMisspelledWords = useCallback((): MisspelledWord[] => {
    if (!value) return [];

    const words = value.split(/(\s+|[^\w\s'])/);
    const misspelled: MisspelledWord[] = [];
    let currentIndex = 0;

    for (const word of words) {
      if (word.match(/[a-zA-Z]/) && !isWordCorrect(word)) {
        misspelled.push({
          word: word,
          startIndex: currentIndex,
          endIndex: currentIndex + word.length
        });
      }
      currentIndex += word.length;
    }

    return misspelled;
  }, [value, isWordCorrect]);

  // Handle right click on misspelled words
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const misspelledWords = getMisspelledWords();
    
    // Find if click is on a misspelled word
    const clickedWord = misspelledWords.find(
      word => cursorPosition >= word.startIndex && cursorPosition <= word.endIndex
    );

    if (clickedWord) {
      const suggestions = getSuggestions(clickedWord.word);
      
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        word: clickedWord.word,
        suggestions,
        startIndex: clickedWord.startIndex,
        endIndex: clickedWord.endIndex
      });
    }
  }, [getMisspelledWords, getSuggestions]);

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    const newValue = 
      value.substring(0, contextMenu.startIndex) +
      suggestion +
      value.substring(contextMenu.endIndex);
    
    onChange(newValue);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Handle ignore word
  const handleIgnoreWord = () => {
    const cleanWord = contextMenu.word.toLowerCase().replace(/[^a-z]/g, '');
    setIgnoredWords(prev => new Set(prev).add(cleanWord));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Create highlighted text overlay
  const createHighlightedText = () => {
    if (!value) return '';

    const misspelledWords = getMisspelledWords();
    let highlightedText = value;
    let offset = 0;

    misspelledWords.forEach(word => {
      const startTag = '<span class="misspelled-word">';
      const endTag = '</span>';
      const start = word.startIndex + offset;
      const end = word.endIndex + offset;
      
      highlightedText = 
        highlightedText.substring(0, start) +
        startTag +
        highlightedText.substring(start, end) +
        endTag +
        highlightedText.substring(end);
      
      offset += startTag.length + endTag.length;
    });

    return highlightedText.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;');
  };

  return (
    <div className="relative">
      {/* Highlighted overlay */}
      <div
        className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
        style={{
          font: 'inherit',
          padding: '8px 12px',
          lineHeight: 'inherit',
          border: '1px solid transparent',
          color: 'transparent',
          zIndex: 1,
          fontSize: 'inherit',
          fontFamily: 'inherit'
        }}
        dangerouslySetInnerHTML={{ 
          __html: createHighlightedText()
        }}
      />
      
      {/* Actual textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onContextMenu={handleContextMenu}
        placeholder={placeholder}
        className={`relative z-10 bg-transparent resize-none ${className}`}
        name={name}
        spellCheck={false}
      />

      {/* Context menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          {contextMenu.suggestions.length > 0 ? (
            <>
              {contextMenu.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-sm border-none bg-transparent cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
              <div className="border-t border-gray-200 my-1" />
            </>
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">No suggestions</div>
          )}
          
          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-sm text-gray-600 border-none bg-transparent cursor-pointer"
            onClick={handleIgnoreWord}
          >
            Ignore "{contextMenu.word}"
          </button>
        </div>
      )}

      {/* CSS for misspelled words */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .misspelled-word {
            text-decoration: underline;
            text-decoration-color: red;
            text-decoration-style: wavy;
            text-underline-offset: 2px;
          }
        `
      }} />
    </div>
  );
}