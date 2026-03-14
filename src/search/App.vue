<template>
  <vn-app v-show="dataLoaded">
    <div v-if="isFaceMode" class="face-results-container">
      <div class="face-results-header">
        <h1 class="face-results-title">{{ getText('pageTitle_faceResults') }}</h1>
        <div class="face-results-status" v-if="pendingEngines.length > 0">
          {{ getText('faceSearch_searching') }}
        </div>
        <div class="face-results-status face-results-done" v-else-if="totalResults > 0">
          {{ getText('faceSearch_found', [totalResults.toString()]) }}
        </div>
        <div class="face-results-status" v-else>
          {{ getText('faceSearch_noResults') }}
        </div>
      </div>

      <div
        class="face-engine-section"
        v-for="(engineData, engineName) in engineResults"
        :key="engineName"
      >
        <div class="face-engine-header">
          <img
            class="face-engine-icon"
            :src="getEngineIconUrl(engineName)"
            @error="onIconError"
          />
          <span class="face-engine-name">{{
            getText('engineName_' + engineName)
          }}</span>
          <span class="face-engine-count" v-if="engineData.results.length > 0">
            ({{ engineData.results.length }})
          </span>
          <a
            v-if="engineData.pageUrl"
            class="face-engine-link"
            :href="engineData.pageUrl"
            target="_blank"
            >{{ getText('faceSearch_viewOnSite') }}</a
          >
        </div>

        <div class="face-results-grid" v-if="engineData.results.length > 0">
          <div
            class="face-result-card"
            v-for="(result, idx) in engineData.results"
            :key="idx"
            @click="openFaceResult(result)"
          >
            <img class="face-result-image" :src="result.image" />
            <div class="face-result-info" v-if="result.page">
              <div class="face-result-url" :title="result.page">
                {{ formatUrl(result.page) }}
              </div>
            </div>
          </div>
        </div>
        <div class="face-engine-no-results" v-else>
          {{ getText('faceSearch_engineNoResults') }}
        </div>
      </div>

      <div
        class="face-engine-section face-engine-pending"
        v-for="engineName in pendingEngines"
        :key="'pending-' + engineName"
      >
        <div class="face-engine-header">
          <img
            class="face-engine-icon"
            :src="getEngineIconUrl(engineName)"
            @error="onIconError"
          />
          <span class="face-engine-name">{{
            getText('engineName_' + engineName)
          }}</span>
          <img
            class="face-engine-spinner"
            src="/src/assets/icons/misc/spinner.svg"
          />
        </div>
      </div>
    </div>

    <div class="grid" v-if="!isFaceMode && results.length">
      <div
        class="grid-item"
        tabindex="0"
        @keyup.enter="openPage(index)"
        :class="resultClasses"
        v-for="(item, index) in results"
        :key="index"
      >
        <div
          class="grid-item-image-wrap"
          :title="getText('buttonTooltip_viewPage')"
          @click="openPage(index)"
        >
          <img class="grid-item-image" :src="item.image" />
        </div>
        <div class="grid-item-footer">
          <div class="grid-item-footer-text" :title="item.text">
            {{ item.text }}
          </div>
          <vn-icon-button
            class="grid-item-footer-button"
            src="/src/assets/icons/misc/image.svg"
            :title="getText('buttonTooltip_viewImage')"
            @click="openImage(index)"
          ></vn-icon-button>
        </div>
      </div>
    </div>
    <div v-if="!isFaceMode && !resultsLoaded" class="page-overlay">
      <div class="error-content" v-if="error">
        <vn-icon
          class="error-icon"
          src="/src/assets/icons/misc/error.svg"
        ></vn-icon>
        <div class="error-text">{{ error }}</div>
      </div>

      <img
        v-if="showSpinner && !error"
        class="spinner"
        src="/src/assets/icons/misc/spinner.svg"
      />
    </div>
  </vn-app>
</template>

<script>
import Masonry from 'masonry-layout';
import imagesLoaded from 'imagesloaded';
import {App, Icon, IconButton} from 'vueton';

import {validateUrl, sendLargeMessage, showPage} from 'utils/app';
import {getText} from 'utils/common';
import {
  prepareImageForUpload,
  searchGoogleImages
} from 'utils/engines';

export default {
  components: {
    [App.name]: App,
    [Icon.name]: Icon,
    [IconButton.name]: IconButton
  },

  data: function () {
    return {
      dataLoaded: false,

      error: '',
      showSpinner: false,
      engine: '',
      results: [],
      resultsLoaded: false,

      // Face search mode
      isFaceMode: false,
      faceSessionId: '',
      engineResults: {},
      pendingEngines: [],
      pollTimer: null,
      pollComplete: false
    };
  },

  computed: {
    resultClasses: function () {
      return {
        'grid-item-loaded': this.resultsLoaded
      };
    },
    totalResults: function () {
      let count = 0;
      for (const engineData of Object.values(this.engineResults)) {
        count += engineData.results.length;
      }
      return count;
    }
  },

  methods: {
    getText,

    setup: async function () {
      const params = new URL(window.location.href).searchParams;

      // Check if this is a face search results page
      if (params.get('mode') === 'face') {
        this.isFaceMode = true;
        this.faceSessionId = params.get('session');
        this.dataLoaded = true;

        document.title = getText('pageTitle_faceResults');

        this.pollForResults();
        return;
      }

      const storageId = params.get('id');

      const task = await browser.runtime.sendMessage({
        id: 'storageRequest',
        asyncResponse: true,
        saveReceipt: true,
        storageId
      });

      if (task) {
        this.showSpinner = true;
        this.dataLoaded = true;

        try {
          this.engine = task.search.engine;

          document.title = getText('pageTitle', [
            getText(`optionTitle_${this.engine}`),
            getText('extensionName')
          ]);

          let image = await sendLargeMessage({
            message: {
              id: 'storageRequest',
              asyncResponse: true,
              saveReceipt: true,
              storageId: task.imageId
            },
            transferResponse: true,
            openConnection: this.$env.isSafari
          });

          if (image) {
            if (task.search.assetType === 'image') {
              try {
                image = await prepareImageForUpload({
                  image,
                  engine: this.engine,
                  target: 'api',
                  setBlob: !(this.$env.isSafari && this.$env.isMobile)
                });
              } catch (err) {
                if (err.name === 'EngineError') {
                  this.error = err.message;
                  return;
                }

                throw err;
              }
            }

            await this.search({
              session: task.session,
              search: task.search,
              image
            });
          } else {
            this.error = getText('error_invalidPageUrl');
          }
        } catch (err) {
          this.error = getText(
            'error_engine',
            getText(`engineName_${this.engine}`)
          );

          console.log(err.toString());
          throw err;
        }
      } else {
        this.error = getText('error_invalidPageUrl');
        this.dataLoaded = true;
      }
    },

    search: async function ({session, search, image} = {}) {
      if (this.engine === 'googleImages') {
        let tabUrl;
        if (this.$env.isSafari && this.$env.isMobile) {
          // Safari 15: cross-origin request from extension page is blocked on mobile.
          const rsp = await browser.runtime.sendMessage({
            id: 'searchImageImages',
            session,
            search,
            image
          });

          if (rsp.error) {
            throw new Error(rsp.error);
          }

          tabUrl = rsp.data;
        } else {
          tabUrl = await searchGoogleImages({session, search, image});
        }

        if (validateUrl(tabUrl)) {
          window.location.replace(tabUrl);
        }
      }
    },

    pollForResults: async function () {
      if (!this.faceSessionId) return;

      try {
        const data = await browser.runtime.sendMessage({
          id: 'getFaceSearchResults',
          sessionId: this.faceSessionId
        });

        if (data) {
          // Update engine results
          for (const [engineName, engineData] of Object.entries(
            data.engines || {}
          )) {
            this.engineResults[engineName] = engineData;
          }
          // Force reactivity update
          this.engineResults = {...this.engineResults};

          this.pendingEngines = (data.pendingEngines || []).filter(
            e => !this.engineResults[e]
          );
        }
      } catch (e) {
        // Background may not be ready yet
      }

      // Keep polling while there are pending engines
      if (this.pendingEngines.length > 0) {
        this.pollTimer = setTimeout(() => this.pollForResults(), 2000);
      } else if (!this.pollComplete) {
        // Do a few more polls to catch late results, then stop
        this.pollComplete = true;
        this.pollTimer = setTimeout(() => this.pollForResults(), 5000);
      }
    },

    getEngineIconUrl: function (engineName) {
      return `/src/assets/icons/engines/${engineName}.svg`;
    },

    onIconError: function (e) {
      e.target.style.display = 'none';
    },

    formatUrl: function (url) {
      try {
        const u = new URL(url);
        return u.hostname + u.pathname.substring(0, 30);
      } catch (e) {
        return url.substring(0, 40);
      }
    },

    openFaceResult: async function (result) {
      if (result.page) {
        await showPage({url: result.page});
      } else if (result.image) {
        await showPage({url: result.image});
      }
    },

    layoutGrid: function () {
      this.$nextTick(() => {
        const grid = document.querySelector('.grid');
        imagesLoaded(grid).once('always', () => {
          const masonry = new Masonry(grid, {
            itemSelector: '.grid-item',
            horizontalOrder: true,
            transitionDuration: 0,
            initLayout: false
          });
          masonry.once('layoutComplete', () => {
            this.showSpinner = false;
            this.resultsLoaded = true;
          });
          masonry.layout();
        });
      });
    },

    openPage: async function (index) {
      await this.openTab(this.results[index].page);
    },

    openImage: async function (index) {
      await this.openTab(this.results[index].image);
    },

    openTab: async function (url) {
      await showPage({url});
    }
  },

  created: function () {
    this.setup();
  },

  beforeUnmount: function () {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
  }
};
</script>

<style lang="scss">
@use 'vueton/styles' as vueton;

@include vueton.theme-base;
@include vueton.transitions;

html,
body,
.v-application,
.v-application__wrap {
  width: 100%;
}

body,
.v-application__wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 8px;
}

.spinner {
  width: 36px;
  height: 36px;
}

.error-content {
  display: flex;
  align-items: center;
  margin: auto;
  padding: 16px;

  & .error-icon {
    width: 48px;
    height: 48px;
    min-width: 48px;
    min-height: 48px;
    margin-right: 24px;
    @include vueton.theme-prop(background-color, error);
  }

  & .error-text {
    @include vueton.md2-typography(subtitle1);
    max-width: 520px;
  }
}

/* Face search results styles */
.face-results-container {
  width: 100%;
  max-width: 1200px;
  padding: 24px;
  box-sizing: border-box;
}

.face-results-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.face-results-title {
  @include vueton.md2-typography(headline5);
  margin: 0 0 8px 0;
}

.face-results-status {
  @include vueton.md2-typography(subtitle1);
  opacity: 0.7;
}

.face-results-done {
  opacity: 1;
  color: #4caf50;
}

.face-engine-section {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 12px;
  @include vueton.theme-prop(background-color, surface-variant);
}

.face-engine-pending {
  opacity: 0.6;
}

.face-engine-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.face-engine-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.face-engine-name {
  @include vueton.md2-typography(subtitle1);
  font-weight: 500;
}

.face-engine-count {
  @include vueton.md2-typography(body2);
  opacity: 0.7;
}

.face-engine-link {
  margin-left: auto;
  @include vueton.md2-typography(body2);
  text-decoration: none;
  opacity: 0.8;

  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
}

.face-engine-spinner {
  width: 20px;
  height: 20px;
  margin-left: 8px;
}

.face-engine-no-results {
  @include vueton.md2-typography(body2);
  opacity: 0.5;
  padding: 8px 0;
}

.face-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.face-result-card {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  @include vueton.theme-prop(background-color, surface);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.face-result-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.face-result-info {
  padding: 8px;
}

.face-result-url {
  @include vueton.md2-typography(caption);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: 0.7;
}

/* Original grid styles */
.grid {
  padding: 8px;

  width: 288px;
  @media (min-width: 424px) {
    width: 424px;
  }
  @media (min-width: 576px) {
    width: 448px;
  }
  @media (min-width: 768px) {
    width: 664px;
  }
  @media (min-width: 992px) {
    width: 880px;
  }
  @media (min-width: 1200px) {
    width: 1096px;
  }
}

.grid-item {
  width: 120px;
  @media (min-width: 576px) {
    width: 200px;
  }
  margin: 8px;
  padding: 16px;
  padding-bottom: 12px;
  transition: opacity 0.3s ease;
  opacity: 0;
}

.grid-item-loaded {
  opacity: 1;
}

.grid-item:focus {
  outline: 0;
}

.grid-item::before {
  content: ' ';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  @include vueton.theme-prop(background-color, surface-variant);
  border-radius: 16px;
  transition: all 0.2s ease;
  transform: scale(0.96);
  opacity: 0;
}

.grid-item:focus::before,
.grid-item:focus-within::before,
.grid-item:hover::before {
  transform: scale(1);
  opacity: 0.4;
}

.grid-item-image-wrap {
  min-height: 56px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.grid-item-image {
  display: block;
  overflow: hidden;
  max-width: 100%;
  max-height: 100%;
  object-fit: scale-down;
}

.grid-item-footer {
  display: flex;
  align-items: center;
  column-gap: 8px;
  height: 24px;
  margin-top: 12px;
  justify-content: space-between;
}

.grid-item-footer-text {
  @include vueton.md2-typography(caption);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.grid-item-footer-button {
  width: 24px;
  height: 24px;
  margin-right: -12px;

  & .vn-icon {
    opacity: 0.8;
  }
}
</style>
