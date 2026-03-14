import {findNode, runOnce} from 'utils/common';
import {setFileInputData, initSearch, sendReceipt} from 'utils/engines';

const engine = 'facecheck';

async function collectResults() {
  return new Promise(resolve => {
    const startTime = Date.now();
    const maxWait = 120000;
    const checkInterval = 3000;

    const check = () => {
      if (Date.now() - startTime > maxWait) {
        resolve([]);
        return;
      }

      const results = [];

      // Look for result elements on FaceCheck
      const selectors = [
        '.result img[src]',
        '[class*="result"] img[src]',
        '[class*="face"] img[src]',
        '[class*="match"] img[src]',
        '.card img[src]'
      ];

      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach((img, idx) => {
              if (
                img.src &&
                !img.src.startsWith('data:image/svg') &&
                img.naturalWidth > 30 &&
                !img.src.includes('logo') &&
                !img.src.includes('icon')
              ) {
                const link = img.closest('a[href]');
                results.push({
                  image: img.src,
                  page: link ? link.href : '',
                  text: ''
                });
              }
            });
            if (results.length > 0) break;
          }
        } catch (e) {
          // selector may not be valid on this page
        }
      }

      if (results.length > 0) {
        resolve(results);
      } else {
        setTimeout(check, checkInterval);
      }
    };

    setTimeout(check, 5000);
  });
}

async function search({session, search, image, storageIds}) {
  const inputSelector = '#file_upload';

  const input = await findNode(inputSelector);

  await setFileInputData(inputSelector, input, image);

  await sendReceipt(storageIds);

  input.dispatchEvent(new Event('change', {bubbles: true}));

  // Collect results after search is triggered
  try {
    const results = await collectResults();
    await browser.runtime.sendMessage({
      id: 'faceSearchResults',
      engine: 'facecheck',
      results,
      pageUrl: window.location.href,
      sessionId: session.faceSessionId
    });
  } catch (e) {
    await browser.runtime.sendMessage({
      id: 'faceSearchResults',
      engine: 'facecheck',
      results: [],
      pageUrl: window.location.href,
      sessionId: session.faceSessionId
    });
  }
}

function init() {
  initSearch(search, engine, taskId);
}

if (runOnce('search')) {
  init();
}
