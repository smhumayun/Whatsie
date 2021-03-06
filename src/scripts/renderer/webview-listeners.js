import {ipcRenderer as ipcr} from 'electron';
import webView from './webview';
import remote from 'remote';

const prefs = remote.require('../browser/utils/prefs').default;
const files = remote.require('../browser/utils/files').default;

// Log console messages
webView.addEventListener('console-message', function(event) {
  const msg = event.message.replace(/%c/g, '');
  const fwNormal = 'font-weight: normal;';
  const fwBold = 'font-weight: bold;';
  console.log('%cWV:%c ' + msg, fwBold, fwNormal);
});

// Listen for title changes to update the badge
webView.addEventListener('page-title-updated', function() {
  const matches = /\(([\d]+)\)/.exec(webView.getTitle());
  const parsed = parseInt(matches && matches[1], 10);
  const count = isNaN(parsed) || !parsed ? '' : '' + parsed;
  log('sending notif-count', count);
  ipcr.send('notif-count', count);
});

// Handle url clicks
webView.addEventListener('new-window', function(event) {
  log('sending open-url', event.url);
  ipcr.send('open-url', event.url, event.options);
});

// Listen for dom-ready
webView.addEventListener('dom-ready', function() {
  log('dom-ready');

  // Open dev tools when debugging
  if (window.localStorage.debugDevTools) {
    webView.openDevTools();
  }

  // Inject custom css
  log('injecting custom css');
  files.getStyleCss('mini', css => webView.insertCSS(css));

  // Restore the default theme
  const theme = prefs.get('theme');
  if (theme) {
    log('restoring theme', theme);
    files.getThemeCss(theme, css => {
      webView.send('apply-theme', css);
    });
  }

  // Restore the default zoom level
  const zoomLevel = prefs.get('zoom-level');
  if (zoomLevel) {
    log('restoring zoom level', zoomLevel);
    webView.send('zoom-level', zoomLevel);
  }

  // Restore spell checker and auto correct
  const spellCheckerCheck = prefs.get('spell-checker-check');
  if (spellCheckerCheck) {
    const autoCorrect = prefs.get('spell-checker-auto-correct');
    const langCode = prefs.get('spell-checker-language');
    log('restoring spell checker', spellCheckerCheck, 'auto correct', autoCorrect, 'lang code', langCode);
    webView.send('spell-checker', spellCheckerCheck, autoCorrect, langCode);
  }
});

// Listen for did-finish-load
webView.addEventListener('did-finish-load', function() {
  // Hide the loading splash screen
  const loadingSplashDiv = document.querySelector('.loader');
  loadingSplashDiv.style.opacity = 0;
  setTimeout(function() {
    loadingSplashDiv.style.display = 'none';
  }, 250);
});

// Animate the splash screen into view
document.addEventListener('DOMContentLoaded', function() {
  const loadingSplashDiv = document.querySelector('.loader');
  loadingSplashDiv.style.opacity = 1;
});

export default webView;
