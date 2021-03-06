import remote from 'remote';
import path from 'path';

const manifest = remote.getGlobal('manifest');
const prefs = remote.require('../browser/utils/prefs').default;
const browserAnalytics = remote.require('../browser/utils/analytics');

const activeTheme = prefs.get('theme');
const trackAnalytics = prefs.get('analytics-track');
const userId = browserAnalytics.getUserId();
const siteId = 1;

let piwikTracker = null;

if (trackAnalytics && manifest.piwik) {
  log('enabling piwik analytics');

  // Configure
  window.piwikAsyncInit = function() {
    try {
      piwikTracker = window.Piwik.getTracker();
      piwikTracker.setDocumentTitle(document.title);
      piwikTracker.setTrackerUrl(manifest.piwik.serverUrl + '/piwik.php');
      piwikTracker.setCustomVariable(1, 'AppVersion', manifest.version, 'visit');
      piwikTracker.setCustomVariable(2, 'AppDistrib', manifest.distrib, 'visit');
      piwikTracker.setCustomVariable(3, 'Theme', activeTheme, 'visit');
      piwikTracker.setCustomUrl(getCustomUrl());
      piwikTracker.setUserId(userId);
      piwikTracker.setSiteId(siteId);
      piwikTracker.trackPageView();
      log('piwik analytics instance created');
    } catch (err) {
      log(err);
    }
  };

  // Load the tracking lib
  const scriptElem = document.createElement('script');
  scriptElem.type = 'text/javascript';
  scriptElem.async = true;
  scriptElem.defer = true;
  scriptElem.src = manifest.piwik.serverUrl + '/piwik.js';
  document.head.appendChild(scriptElem);
} else {
  log('piwik analytics disabled');
}

function getCustomUrl() {
  const pathname = document.location.pathname;
  let appDirPath = remote.app.getAppPath();

  // Fix path separators on win32
  if (process.platform === 'win32') {
    appDirPath = ('\\' + appDirPath).replace(/\\/g, '/');
  }

  const indexOfAppDir = pathname.indexOf(appDirPath);
  let customPath = null;

  if (indexOfAppDir > -1) {
    customPath = pathname.replace(appDirPath, '');
  } else {
    customPath = path.posix.join('/raw', pathname);
  }

  return path.posix.join(manifest.piwik.baseUrl, customPath);
}

export function getTracker() {
  return piwikTracker;
}

export default {
  getTracker
};
