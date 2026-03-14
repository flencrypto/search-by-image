const optionKeys = [
  'engines',
  'disabledEngines',
  'showInContextMenu',
  'searchAllEnginesContextMenu',
  'searchAllEnginesAction',
  'tabInBackgound',
  'localGoogle',
  'imgFullParse',
  'searchModeAction',
  'searchModeContextMenu',
  'bypassImageHostBlocking',
  'shareImageContextMenu',
  'convertSharedImage',
  'autoPasteAction',
  'confirmPaste',
  'detectAltImageDimension',
  'viewImageContextMenu',
  'viewImageUseViewer',
  'appTheme',
  'showContribPage',
  'showEngineIcons',
  'pinActionToolbarViewImage',
  'pinActionToolbarShareImage',
  'pinActionToolbarOptions',
  'pinActionToolbarContribute'
];

const searchUrl = browser.runtime.getURL('/src/search/index.html') + '?id={id}';

const engines = {
  pimeyes: {
    image: {
      target: 'https://pimeyes.com/en',
      isExec: true
    }
  },
  facecheck: {
    image: {
      target: 'https://facecheck.id/',
      isExec: true
    }
  },
  yandex: {
    url: {
      target: 'https://yandex.com/images/search?url={imgUrl}&rpt=imageview'
    },
    image: {
      target: 'https://yandex.com/images/',
      isExec: true
    }
  },
  bing: {
    url: {
      target:
        'https://www.bing.com/images/search?q=imgurl:{imgUrl}&view=detailv2' +
        '&iss=sbi&FORM=IRSBIQ&redirecturl=https%3A%2F%2Fwww.bing.com' +
        '%2Fimages%2Fdiscover%3Fform%3DHDRSC2#enterInsights'
    },
    image: {
      target: 'https://www.bing.com/',
      isExec: true
    }
  },
  tineye: {
    url: {target: 'https://www.tineye.com/search/?&url={imgUrl}'},
    image: {
      target: 'https://www.tineye.com/',
      isExec: true
    }
  },
  googleLens: {
    url: {
      target: 'https://www.google.com/webhp',
      isExec: true
    },
    image: {
      target: 'https://www.google.com/webhp',
      isExec: true
    }
  },
  lenso: {
    url: {
      target: 'https://lenso.ai/en/search-by-url?url={imgUrl}&utm_source=sbi',
      isExec: true
    },
    image: {
      target: 'https://lenso.ai/en?utm_source=sbi',
      isExec: true
    }
  },
  googleImages: {
    url: {
      target:
        'https://www.google.com/searchbyimage?sbisrc=cr_1_5_2&image_url={imgUrl}',
      isExec: true
    },

    image: {
      target: searchUrl,
      isTaskId: true
    }
  }
};

const censoredEngines = [];

const engineIconAlias = {};

const engineIconVariants = {
  pimeyes: ['dark'],
  lenso: ['dark']
};

const sponsorLogoVariants = {
  lenso: ['dark']
};

const rasterEngineIcons = ['tineye'];

// https://github.com/jshttp/mime-db
const imageMimeTypes = {
  'image/aces': ['exr'],
  'image/apng': ['apng'],
  'image/avci': ['avci'],
  'image/avcs': ['avcs'],
  'image/avif': ['avif'],
  'image/bmp': ['bmp', 'dib'],
  'image/cgm': ['cgm'],
  'image/dicom-rle': ['drle'],
  'image/dpx': ['dpx'],
  'image/emf': ['emf'],
  'image/fits': ['fits'],
  'image/g3fax': ['g3'],
  'image/gif': ['gif'],
  'image/heic': ['heic'],
  'image/heic-sequence': ['heics'],
  'image/heif': ['heif'],
  'image/heif-sequence': ['heifs'],
  'image/hej2k': ['hej2'],
  'image/hsj2': ['hsj2'],
  'image/ief': ['ief'],
  'image/jls': ['jls'],
  'image/jp2': ['jp2', 'jpg2'],
  'image/jpeg': ['jpg', 'jpeg', 'jpe'],
  'image/jph': ['jph'],
  'image/jphc': ['jhc'],
  'image/jpm': ['jpm', 'jpgm'],
  'image/jpx': ['jpx', 'jpf'],
  'image/jxr': ['jxr'],
  'image/jxra': ['jxra'],
  'image/jxrs': ['jxrs'],
  'image/jxs': ['jxs'],
  'image/jxsc': ['jxsc'],
  'image/jxsi': ['jxsi'],
  'image/jxss': ['jxss'],
  'image/ktx': ['ktx'],
  'image/ktx2': ['ktx2'],
  'image/png': ['png'],
  'image/prs.btif': ['btif', 'btf'],
  'image/prs.pti': ['pti'],
  'image/sgi': ['sgi'],
  'image/svg+xml': ['svg', 'svgz'],
  'image/t38': ['t38'],
  'image/tiff': ['tif', 'tiff'],
  'image/tiff-fx': ['tfx'],
  'image/vnd.adobe.photoshop': ['psd'],
  'image/vnd.airzip.accelerator.azv': ['azv'],
  'image/vnd.dece.graphic': ['uvi', 'uvvi', 'uvg', 'uvvg'],
  'image/vnd.djvu': ['djvu', 'djv'],
  'image/vnd.dvb.subtitle': ['sub'],
  'image/vnd.dwg': ['dwg'],
  'image/vnd.dxf': ['dxf'],
  'image/vnd.fastbidsheet': ['fbs'],
  'image/vnd.fpx': ['fpx'],
  'image/vnd.fst': ['fst'],
  'image/vnd.fujixerox.edmics-mmr': ['mmr'],
  'image/vnd.fujixerox.edmics-rlc': ['rlc'],
  'image/vnd.microsoft.icon': ['ico'],
  'image/vnd.ms-dds': ['dds'],
  'image/vnd.ms-modi': ['mdi'],
  'image/vnd.ms-photo': ['wdp'],
  'image/vnd.net-fpx': ['npx'],
  'image/vnd.pco.b16': ['b16'],
  'image/vnd.tencent.tap': ['tap'],
  'image/vnd.valve.source.texture': ['vtf'],
  'image/vnd.wap.wbmp': ['wbmp'],
  'image/vnd.xiff': ['xif'],
  'image/vnd.zbrush.pcx': ['pcx'],
  'image/webp': ['webp'],
  'image/wmf': ['wmf'],
  'image/x-3ds': ['3ds'],
  'image/x-cmu-raster': ['ras'],
  'image/x-cmx': ['cmx'],
  'image/x-freehand': ['fh', 'fhc', 'fh4', 'fh5', 'fh7'],
  'image/x-icon': ['ico'],
  'image/x-jng': ['jng'],
  'image/x-mrsid-image': ['sid'],
  'image/x-ms-bmp': ['bmp'],
  'image/x-pcx': ['pcx'],
  'image/x-pict': ['pic', 'pct'],
  'image/x-portable-anymap': ['pnm'],
  'image/x-portable-bitmap': ['pbm'],
  'image/x-portable-graymap': ['pgm'],
  'image/x-portable-pixmap': ['ppm'],
  'image/x-rgb': ['rgb'],
  'image/x-tga': ['tga'],
  'image/x-xbitmap': ['xbm'],
  'image/x-xpixmap': ['xpm'],
  'image/x-xwindowdump': ['xwd']
};

Object.assign(imageMimeTypes, {
  'image/jxl': ['jxl']
});

const imageTypeNames = {
  'image/aces': '',
  'image/apng': 'APNG',
  'image/avci': '',
  'image/avcs': '',
  'image/avif': 'AVIF',
  'image/bmp': 'BMP',
  'image/cgm': '',
  'image/dicom-rle': '',
  'image/emf': '',
  'image/fits': '',
  'image/g3fax': '',
  'image/gif': 'GIF',
  'image/heic': 'HEIC',
  'image/heic-sequence': '',
  'image/heif': 'HEIF',
  'image/heif-sequence': '',
  'image/hej2k': '',
  'image/hsj2': '',
  'image/ief': '',
  'image/jls': '',
  'image/jp2': 'JP2',
  'image/jpeg': 'JPEG',
  'image/jph': '',
  'image/jphc': '',
  'image/jpm': '',
  'image/jpx': 'JPX',
  'image/jxr': '',
  'image/jxra': '',
  'image/jxrs': '',
  'image/jxs': '',
  'image/jxsc': '',
  'image/jxsi': '',
  'image/jxss': '',
  'image/ktx': '',
  'image/ktx2': '',
  'image/png': 'PNG',
  'image/prs.btif': '',
  'image/prs.pti': '',
  'image/sgi': '',
  'image/svg+xml': 'SVG',
  'image/t38': '',
  'image/tiff': 'TIFF',
  'image/tiff-fx': '',
  'image/vnd.adobe.photoshop': 'PSD',
  'image/vnd.airzip.accelerator.azv': '',
  'image/vnd.dece.graphic': '',
  'image/vnd.djvu': '',
  'image/vnd.dvb.subtitle': '',
  'image/vnd.dwg': '',
  'image/vnd.dxf': '',
  'image/vnd.fastbidsheet': '',
  'image/vnd.fpx': '',
  'image/vnd.fst': '',
  'image/vnd.fujixerox.edmics-mmr': '',
  'image/vnd.fujixerox.edmics-rlc': '',
  'image/vnd.microsoft.icon': 'ICO',
  'image/vnd.ms-dds': '',
  'image/vnd.ms-modi': '',
  'image/vnd.ms-photo': '',
  'image/vnd.net-fpx': '',
  'image/vnd.pco.b16': '',
  'image/vnd.tencent.tap': '',
  'image/vnd.valve.source.texture': '',
  'image/vnd.wap.wbmp': '',
  'image/vnd.xiff': '',
  'image/vnd.zbrush.pcx': '',
  'image/webp': 'WebP',
  'image/wmf': '',
  'image/x-3ds': '',
  'image/x-cmu-raster': '',
  'image/x-cmx': '',
  'image/x-freehand': '',
  'image/x-icon': 'ICO',
  'image/x-jng': '',
  'image/x-mrsid-image': '',
  'image/x-ms-bmp': '',
  'image/x-pcx': '',
  'image/x-pict': '',
  'image/x-portable-anymap': '',
  'image/x-portable-bitmap': '',
  'image/x-portable-graymap': '',
  'image/x-portable-pixmap': '',
  'image/x-rgb': '',
  'image/x-tga': '',
  'image/x-xbitmap': 'XBM',
  'image/x-xpixmap': '',
  'image/x-xwindowdump': ''
};

Object.assign(imageTypeNames, {
  'image/jxl': 'JPEG XL'
});

const convertImageMimeTypes = ['image/webp', 'image/avif'];

const webpEngineSupport = [
  'bing',
  'yandex',
  'tineye',
  'pimeyes',
  'facecheck',
  'googleLens',
  'lenso',
  'googleImages'
];

// Search engines only support the image format in compatible browsers.
// https://caniuse.com/avif
const avifEngineSupport = [
  'bing',
  'yandex'
];

const gifEngineSupport = [
  'bing',
  'yandex',
  'tineye',
  'googleImages'
];

const maxImageUploadSize = {
  pimeyes: {ui: Infinity},
  facecheck: {ui: 10 * 1024 * 1024},
  yandex: {api: 4 * 1024 * 1024, ui: Infinity},
  bing: {api: 600 * 1024, ui: 20 * 1024 * 1024},
  tineye: {ui: 10 * 1024 * 1024},
  googleLens: {api: 20 * 1024 * 1024},
  lenso: {ui: 10 * 1024 * 1024},
  googleImages: {api: 20 * 1024 * 1024}
};

const chromeDesktopUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const chromeMobileUA =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const chromeSbiSrc = 'Google Chrome 110.0.5481.78 (Official) Windows';

const supportUrl = 'https://github.com/dessant/search-by-image/issues';

const shareBridgeUrl = 'https://searchbyimage.vapps.dev/share';

const sponsors = ['lenso'];

const sponsorSites = {
  lenso: 'https://lenso.ai/en?utm_source=sbi'
};

export {
  optionKeys,
  engines,
  censoredEngines,
  rasterEngineIcons,
  engineIconAlias,
  engineIconVariants,
  sponsorLogoVariants,
  imageMimeTypes,
  imageTypeNames,
  convertImageMimeTypes,
  webpEngineSupport,
  avifEngineSupport,
  gifEngineSupport,
  maxImageUploadSize,
  chromeDesktopUA,
  chromeMobileUA,
  chromeSbiSrc,
  supportUrl,
  shareBridgeUrl,
  sponsors,
  sponsorSites
};
