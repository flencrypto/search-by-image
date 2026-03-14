import {findNode, processNode, runOnce} from 'utils/common';
import {setFileInputData, initSearch, sendReceipt} from 'utils/engines';

const engine = 'pimeyes';

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

      // Look for result elements with face thumbnails
      const selectors = [
        '.results .result img[src]',
        '[class*="result"] img[src]',
        '.thumbnail img[src]',
        '[class*="match"] img[src]',
        '[class*="face"] img[src]'
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
  const inputSelector = '.upload-file input#file-input';

  processNode(inputSelector, function (node) {
    node.addEventListener('click', ev => ev.preventDefault(), {
      capture: true,
      once: true
    });
  });

  (await findNode('.upload-bar button[aria-label="upload photo" i]')).click();

  const input = await findNode(inputSelector);

  await setFileInputData(inputSelector, input, image);

  await sendReceipt(storageIds);

  input.dispatchEvent(new Event('change'));

  const searchButton = await findNode('.start-search-inner > button', {
    throwError: false
  });

  // button is missing when no faces were detected
  if (searchButton) {
    if (searchButton.classList.contains('disabled')) {
      await findNode('.permissions input[type=checkbox]');

      for (const checkbox of document.querySelectorAll(
        '.permissions input[type=checkbox]'
      )) {
        if (!checkbox.checked) {
          checkbox.click();
        }
      }

      (
        await findNode('.start-search-inner > button:not(.disabled)', {
          observerOptions: {attributes: true, attributeFilter: ['class']}
        })
      ).click();
    } else {
      searchButton.click();
    }
  }

  // Collect results after search is triggered
  try {
    const results = await collectResults();
    await browser.runtime.sendMessage({
      id: 'faceSearchResults',
      engine: 'pimeyes',
      results,
      pageUrl: window.location.href
    });
  } catch (e) {
    await browser.runtime.sendMessage({
      id: 'faceSearchResults',
      engine: 'pimeyes',
      results: [],
      pageUrl: window.location.href
    });
  }
}

function init() {
  initSearch(search, engine, taskId);
}

if (runOnce('search')) {
  init();
}
