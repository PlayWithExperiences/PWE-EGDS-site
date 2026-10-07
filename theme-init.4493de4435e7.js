// Apply the saved/system appearance before the stylesheet paints.
(()=>{let saved;try{saved=localStorage.getItem('egds-theme')}catch{}document.documentElement.dataset.theme=['dark','light'].includes(saved)?saved:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';})();
