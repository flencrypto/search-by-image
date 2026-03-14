const message = 'Convert to face search';

const revision = '20260314154800_convert_to_face_search';

async function upgrade() {
  const changes = {};
  const {engines, disabledEngines} = await browser.storage.local.get([
    'engines',
    'disabledEngines'
  ]);

  const faceEngines = [
    'pimeyes',
    'facecheck',
    'yandex',
    'bing',
    'tineye',
    'googleLens',
    'lenso',
    'googleImages'
  ];

  const removeEngines = engines.filter(function (item) {
    return !faceEngines.includes(item);
  });

  changes.engines = engines.filter(function (item) {
    return !removeEngines.includes(item);
  });
  changes.disabledEngines = disabledEngines.filter(function (item) {
    return !removeEngines.includes(item);
  });

  // Add new face search engines if not present
  const newEngines = ['facecheck'];
  for (const engine of newEngines) {
    if (!changes.engines.includes(engine)) {
      changes.engines.splice(1, 0, engine);
    }
  }

  // Ensure pimeyes is first
  if (changes.engines.includes('pimeyes')) {
    changes.engines.splice(
      0,
      0,
      changes.engines.splice(changes.engines.indexOf('pimeyes'), 1)[0]
    );
  }

  changes.storageVersion = revision;
  return browser.storage.local.set(changes);
}

export {message, revision, upgrade};
