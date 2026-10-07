// First supported language among ?lang, the saved toggle choice, then the browser's ordered preferences; English otherwise.
export function preferredLanguage(candidates){
 for(const value of candidates){const code=String(value??'').toLowerCase().split('-')[0];if(code==='zh'||code==='en')return code;}
 return 'en';
}
