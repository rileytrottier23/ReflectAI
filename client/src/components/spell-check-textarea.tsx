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

  // Common English words - basic spell check dictionary
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
    'a', 'an', 'am', 'is', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'must', 'shall', 'not', 'no', 'yes', 'all', 'any', 'some', 'many', 'much',
    'more', 'most', 'few', 'little', 'good', 'bad', 'great', 'big', 'small', 'new',
    'old', 'first', 'last', 'long', 'short', 'high', 'low', 'right', 'left', 'next',
    'other', 'same', 'different', 'own', 'only', 'very', 'well', 'still', 'just',
    'now', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'which',
    'get', 'go', 'come', 'give', 'take', 'make', 'know', 'think', 'see', 'look',
    'want', 'need', 'like', 'feel', 'work', 'play', 'live', 'help', 'find', 'call',
    'try', 'ask', 'seem', 'turn', 'start', 'show', 'hear', 'put', 'keep', 'let',
    'say', 'tell', 'talk', 'sit', 'stand', 'walk', 'run', 'move', 'stop', 'wait',
    'stay', 'leave', 'open', 'close', 'read', 'write', 'eat', 'drink', 'sleep',
    'wake', 'buy', 'sell', 'pay', 'cost', 'spend', 'save', 'win', 'lose', 'break',
    'fix', 'build', 'create', 'destroy', 'kill', 'die', 'live', 'grow', 'change',
    'learn', 'teach', 'study', 'understand', 'remember', 'forget', 'believe',
    'hope', 'wish', 'dream', 'plan', 'decide', 'choose', 'pick', 'use', 'wear',
    'carry', 'bring', 'send', 'receive', 'catch', 'throw', 'hit', 'kick', 'push',
    'pull', 'lift', 'drop', 'fall', 'rise', 'climb', 'jump', 'dance', 'sing',
    'laugh', 'cry', 'smile', 'love', 'hate', 'like', 'enjoy', 'prefer', 'care',
    'worry', 'fear', 'hope', 'expect', 'suppose', 'guess', 'imagine', 'wonder',
    'time', 'day', 'week', 'month', 'year', 'hour', 'minute', 'second', 'moment',
    'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening', 'night',
    'home', 'house', 'room', 'door', 'window', 'wall', 'floor', 'roof', 'garden',
    'car', 'bus', 'train', 'plane', 'bike', 'boat', 'road', 'street', 'city',
    'town', 'country', 'world', 'place', 'area', 'space', 'office', 'school',
    'hospital', 'store', 'shop', 'restaurant', 'hotel', 'bank', 'church', 'park',
    'person', 'people', 'man', 'woman', 'child', 'baby', 'boy', 'girl', 'friend',
    'family', 'parent', 'mother', 'father', 'son', 'daughter', 'brother', 'sister',
    'husband', 'wife', 'doctor', 'teacher', 'student', 'worker', 'job', 'work',
    'money', 'food', 'water', 'coffee', 'tea', 'milk', 'bread', 'meat', 'fish',
    'book', 'paper', 'pen', 'pencil', 'computer', 'phone', 'television', 'music',
    'movie', 'game', 'sport', 'ball', 'team', 'player', 'win', 'game', 'play',
    'happy', 'sad', 'angry', 'excited', 'tired', 'busy', 'free', 'ready', 'easy',
    'hard', 'difficult', 'simple', 'important', 'interesting', 'boring', 'fun',
    'nice', 'beautiful', 'ugly', 'clean', 'dirty', 'quiet', 'loud', 'fast', 'slow'
  ]);

  // Common typo corrections
  const typoCorrections: Record<string, string[]> = {
    'teh': ['the'],
    'adn': ['and'],
    'recieve': ['receive'],
    'seperate': ['separate'],
    'definately': ['definitely'],
    'beleive': ['believe'],
    'freind': ['friend'],
    'wich': ['which'],
    'alot': ['a lot'],
    'tommorow': ['tomorrow'],
    'youre': ['you\'re', 'your'],
    'its': ['it\'s', 'its'],
    'there': ['their', 'they\'re'],
    'loose': ['lose'],
    'than': ['then'],
    'effect': ['affect'],
    'accept': ['except']
  };

  // Check if word is misspelled
  const isWordMisspelled = useCallback((word: string): boolean => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    if (cleanWord.length < 2) return false;
    if (ignoredWords.has(cleanWord)) return false;
    if (commonWords.has(cleanWord)) return false;
    if (word.includes("'")) return false; // Skip contractions
    if (/^[A-Z]/.test(word) && word.length > 2) return false; // Skip proper nouns
    
    return typoCorrections.hasOwnProperty(cleanWord);
  }, [ignoredWords]);

  // Get suggestions for a word
  const getSuggestions = useCallback((word: string): string[] => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    return typoCorrections[cleanWord] || [];
  }, []);

  // Find misspelled words in text
  const getMisspelledWords = useCallback((): MisspelledWord[] => {
    if (!value) return [];

    const words = value.split(/(\s+|[^\w\s'])/);
    const misspelled: MisspelledWord[] = [];
    let currentIndex = 0;

    for (const word of words) {
      if (word.match(/[a-zA-Z]/) && isWordMisspelled(word)) {
        misspelled.push({
          word: word,
          startIndex: currentIndex,
          endIndex: currentIndex + word.length
        });
      }
      currentIndex += word.length;
    }

    return misspelled;
  }, [value, isWordMisspelled]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const misspelledWords = getMisspelledWords();
    
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
    setIgnoredWords(prev => new Set(Array.from(prev).concat(cleanWord)));
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

    // Process words in reverse order to maintain correct indices
    for (let i = misspelledWords.length - 1; i >= 0; i--) {
      const word = misspelledWords[i];
      const startTag = '<span class="misspelled-word">';
      const endTag = '</span>';
      
      highlightedText = 
        highlightedText.substring(0, word.startIndex) +
        startTag +
        highlightedText.substring(word.startIndex, word.endIndex) +
        endTag +
        highlightedText.substring(word.endIndex);
    }

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