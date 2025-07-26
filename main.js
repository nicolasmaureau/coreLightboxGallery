class coreLightboxGallery {
	constructor(API, name, config) {
		this.API = API;
		this.name = name;
		this.config = config;

		this.API.addModifier('htmlOutput', this.modifyHTML.bind(this), 1, this);
		this.API.addInsertion('customHeadCode', this.addStyles.bind(this), 1, this);
		this.API.addInsertion('customFooterCode', this.addScripts.bind(this), 1, this);
	}

	modifyHTML(rendererInstance, htmlCode) {
		const galleryRegex = /<div class="gallery.*?<\/div>/gis;
		const dataSizeRegex = /<a .*?href="[^"]+".*?data-size="[^"]*"/g;

		return htmlCode.replace(galleryRegex, galleryMarkup => {
			return galleryMarkup.replace(dataSizeRegex, anchorTag => {
				const sizeMatch = anchorTag.match(/data-size="(\d+)x(\d+)"/);
				if (sizeMatch) {
					const [_, width, height] = sizeMatch;
					return anchorTag.replace(/data-size="[^"]*"/, `data-pswp-width="${width}" data-pswp-height="${height}" data-pswp-tile-type="deepzoom" data-pswp-tile-url="path/to/tiles/{z}/{x}_{y}.jpeg"`);
				}
				return anchorTag;
			});
		});
	}

	addStyles(rendererInstance, context) {
		if (!context.post?.hasGallery && !context.page?.hasGallery && !context.tag) return '';

		const bgColor = this.config.bgColor || '#000000';
		const placeholderBgColor = this.config.placeholderBgColor || 'rgba(38, 40, 44, 1)';
		const uiBgColor = this.config.uiBgColor || 'rgba(38, 40, 44, .5)';
		const uiElementsColor = this.config.uiElementsColor || '#fff';
		const iconStrokeWidth = this.config.iconStrokeWidth || '1.5px';
		const iconSize = this.config.iconSize || '24px';

		return `
			<link rel="stylesheet" href="${rendererInstance.siteConfig.domain}/media/plugins/coreLightboxGallery/photoswipe.min.css" />
			<style>
			   :root {
		       	 --pswp-bg: ${bgColor};
					 --pswp-placeholder-bg: ${placeholderBgColor};
					 --pswp-ui-bg: ${uiBgColor};
                --pswp-ui-color: ${uiElementsColor};
                --pswp-icon-stroke-width: ${iconStrokeWidth};
                --pswp-icon-size: ${iconSize}px;
            }

				.pswp--zoomed-in .pswp__zoom-icn-bar-v {
					display: none;
				}
			</style>
		`;
	}

	addScripts(rendererInstance, context) {
		if (!context.post?.hasGallery && !context.page?.hasGallery && !context.tag) return '';

		const isPreviewMode = rendererInstance.previewMode || false;
		const baseURL = rendererInstance.siteConfig.domain.replace(/\\/g, '/');
		const showHideAnimationType = this.config.transitionEffect || 'zoom';
		const showAnimationDuration = parseInt(this.config.showAnimationDuration, 10) || 333;
		const hideAnimationDuration = parseInt(this.config.hideAnimationDuration, 10) || 333;
		const easing = this.config.easing || 'cubic-bezier(.4,0,.22,1)';
		const initialZoomLevel = this.config.initialZoomLevel || 'fit';

		const rawSecondaryZoomLevel = parseFloat(this.config.secondaryZoomLevel);
		const secondaryZoomLevelValue = rawSecondaryZoomLevel === 1 ? "'fill'" : rawSecondaryZoomLevel;

		const imageClickAction = this.config.imageClickAction || 'zoom-or-close';
		const spacing = parseFloat(this.config.spacing) || 0.1;
		const loop = this.config.loop !== false;
		const wheelToZoom = !!this.config.wheelToZoom;
		const escKey = this.config.escKey !== false;
		const arrowKeys = this.config.arrowKeys !== false;
		const bgColorOpacity = this.config.bgColorOpacity || '0.6';


		let padding = {};
		try {
			padding = this.config.padding
				.split(',')
				.reduce((acc, val) => {
					const [key, value] = val.split(':').map(s => s.trim());
					acc[key] = parseInt(value, 10) || 0;
					return acc;
				}, {});
		} catch (error) {
			console.warn('Invalid padding format. Falling back to default.', error);
			padding = { top: 0, bottom: 0, left: 0, right: 0 };
		}

		const iconSets = {
			set1: {
				arrowPrevSVG: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5"></path></svg>`,
				closeSVG: `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426"></path></svg>`,
				zoomSVG: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="pswp__icn" aria-hidden="true"><path d="M8 11H14"></path><path class="pswp__zoom-icn-bar-v" d="M11 8V14"></path><path d="M17 17L21 21"></path><path d="M3 11C3 15.4183 6.58172 19 11 19C13.213 19 15.2161 18.1015 16.6644 16.6493C18.1077 15.2022 19 13.2053 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11Z"></path></svg>`,
				downloadSVG: `<svg stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" fill="none" class="pswp__icn" aria-hidden="true"><path d="M6 20L18 20"></path><path d="M12 4V16M12 16L15.5 12.5M12 16L8.5 12.5"></path></svg>`
			},
			set2: {
				arrowPrevSVG: `<svg class="pswp__icn" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
				closeSVG: `<svg class="pswp__icn" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
				zoomSVG: `<svg class="pswp__icn" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line class="pswp__zoom-icn-bar-v" x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>`,
				downloadSVG: `<svg class="pswp__icn" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`
			},
			set3: {
				arrowPrevSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l4 4" /><path d="M5 12l4 -4" /></svg>`,
				arrowNextSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M5 12l14 0" /><path d="M5 12l4 4" /><path d="M5 12l4 -4" /></svg>`,
				closeSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M3 5a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14z" /><path d="M9 9l6 6m0 -6l-6 6" /></svg>`,
				zoomSVG: `<svg  viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16 16l-2.5 -2.5" /></svg>`,
				downloadSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>`
			},
			set4: {
				arrowPrevSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><line x1="2.5" y1="12" x2="23.5" y2="12"></line><polyline points="10.14 4.36 2.5 12 10.14 19.64"></polyline></svg>`,
				arrowNextSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><line x1="2.5" y1="12" x2="23.5" y2="12"></line><polyline points="10.14 4.36 2.5 12 10.14 19.64"></polyline></svg>`,
				closeSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><polyline points="13.89 15.82 13.89 22.5 1.48 22.5 1.48 1.5 13.89 1.5 13.89 8.18"></polyline><line x1="8.16" y1="12" x2="21.52" y2="12"></line><polyline points="16.75 16.77 21.52 12 16.75 7.23"></polyline></svg>`,
				zoomSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><circle cx="9.14" cy="9.14" r="7.64"></circle><line x1="22.5" y1="22.5" x2="14.39" y2="14.39"></line><line  x1="5.32" y1="9.14" x2="12.95" y2="9.14"></line><line class="pswp__zoom-icn-bar-v" x1="9.14" y1="5.32" x2="9.14" y2="12.95"></line></svg>`,
				downloadSVG: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none" class="pswp__icn" aria-hidden="true"><path d="M12,22.54V16.79h6.71a3.83,3.83,0,0,0,2.72-1.13,3.9,3.9,0,0,0,1.11-2.45V13a3.84,3.84,0,0,0-3.84-3.84h-1V7.2a5.69,5.69,0,0,0-1.69-4.07A5.66,5.66,0,0,0,12,1.44H11.8A5.75,5.75,0,0,0,7,4.41l-.13.26A6.5,6.5,0,0,0,6.27,7.2h0A4.78,4.78,0,0,0,1.46,12a1.27,1.27,0,0,0,0,.2,4.79,4.79,0,0,0,4.78,4.6H9.13"></path><polyline points="9.13 19.66 12.01 22.54 14.89 19.66"></polyline></svg>`
			}
		};

		const iconSetChoice = this.config.iconSet || 'set1';
		let { arrowPrevSVG, closeSVG, zoomSVG, downloadSVG } = this.config;

		arrowPrevSVG = typeof arrowPrevSVG === 'string' ? arrowPrevSVG : '';
		closeSVG = typeof closeSVG === 'string' ? closeSVG : '';
		zoomSVG = typeof zoomSVG === 'string' ? zoomSVG : '';
		downloadSVG = typeof downloadSVG === 'string' ? downloadSVG : '';

		if (iconSetChoice !== 'custom') {
			const selectedSet = iconSets[iconSetChoice] || iconSets.set1;
			arrowPrevSVG = selectedSet.arrowPrevSVG || '';
			closeSVG = selectedSet.closeSVG || '';
			zoomSVG = selectedSet.zoomSVG || '';
			downloadSVG = selectedSet.downloadSVG || '';
		} else {
			const enforceCustomSVGAttributes = (svg) => {
				return svg.replace(/<svg[^>]*>/i, (match) => {
					let cleaned = match
						.replace(/\sclass\s*=\s*"[^"]*"/gi, '')
						.replace(/\saria-hidden\s*=\s*"[^"]*"/gi, '');
					return cleaned.replace(/<svg/i, '<svg class="pswp__icn" aria-hidden="true"');
				});
			};

			const getCustomOrDefault = (customSVG, defaultSVG) => {
				return customSVG ? enforceCustomSVGAttributes(customSVG) : defaultSVG;
			};

			const defaultSet = iconSets.set1;
			arrowPrevSVG = getCustomOrDefault(arrowPrevSVG, defaultSet.arrowPrevSVG);
			closeSVG = getCustomOrDefault(closeSVG, defaultSet.closeSVG);
			zoomSVG = getCustomOrDefault(zoomSVG, defaultSet.zoomSVG);
			downloadSVG = getCustomOrDefault(downloadSVG, defaultSet.downloadSVG);
		}

		const arrowNextSVG = arrowPrevSVG;
		const enableArrows = !!this.config.enableArrows;
		const enableZoom = !!this.config.enableZoomButton;
		const allowPanToNext = !!this.config.allowPanToNext;
		const allowMouseDrag = !!this.config.allowMouseDrag;

		const enableClose = !!this.config.enableCloseButton;
		const enableCounter = !!this.config.enableCounter;
		const enableDownload = !!this.config.enableDownloadButton;
		const enableCaption = !!this.config.enableCaption;

		// Code for preview mode (UMD) due to CORS restrictions
		const configLines = [
			`gallery: gallery`,
			`children: 'figure'`,
			`mainClass: 'pswp--custom-bg'`,
			`showHideAnimationType: '${showHideAnimationType}'`,
			`showAnimationDuration: ${showAnimationDuration}`,
			`hideAnimationDuration: ${hideAnimationDuration}`,
			`easing: '${easing}'`,
			`initialZoomLevel: '${initialZoomLevel}'`,
			`secondaryZoomLevel: ${secondaryZoomLevelValue}`,
			`imageClickAction: '${imageClickAction}'`,
			`spacing: ${spacing}`,
			`loop: ${loop}`,
			`wheelToZoom: ${wheelToZoom}`,
			`escKey: ${escKey}`,
			`arrowKeys: ${arrowKeys}`,
			`padding: ${JSON.stringify(padding)}`,
			`arrowPrev: ${enableArrows}`,
			`arrowNext: ${enableArrows}`,
			`close: ${enableClose}`,
			`zoom: ${enableZoom}`,
			`allowPanToNext: ${allowPanToNext}`,
			`allowMouseDrag: ${allowMouseDrag}`,
			`counter: ${enableCounter}`,
			`preload: [1, 2]`,
			`bgOpacity: ${bgColorOpacity}`
		];

		if (enableArrows && arrowPrevSVG && arrowNextSVG) {
			configLines.push(`arrowPrevSVG: \`${arrowPrevSVG}\``);
			configLines.push(`arrowNextSVG: \`${arrowNextSVG}\``);
		}

		if (enableClose && closeSVG) {
			configLines.push(`closeSVG: \`${closeSVG}\``);
		}

		if (enableZoom && zoomSVG) {
			configLines.push(`zoomSVG: \`${zoomSVG}\``);
		}

		//Generate a configuration string for the production version (ESM).
		// The configuration lines from the `configLines` array are joined into a single string,
		// separated by a comma and a newline, to form a valid configuration object
		const configString = configLines.join(isPreviewMode ? ',\n' : ',\n');

		const uiRegisterLines = [];
		if (enableDownload && downloadSVG) {
			uiRegisterLines.push(`
				 lightbox.pswp.ui.registerElement({
					  name: 'download-button',
					  order: 8,
					  isButton: true,
					  tagName: 'a',
					  html: \`${downloadSVG}\`,
					  onInit: (el, pswp) => {
							el.setAttribute('download', '');
							el.setAttribute('target', '_blank');
							el.setAttribute('rel', 'noopener');
							pswp.on('change', () => {
								 el.href = pswp.currSlide.data.src;
							});
					  }
				 });
			`);
		}
		if (enableCaption) {
			uiRegisterLines.push(`
				 lightbox.pswp.ui.registerElement({
					  name: 'custom-caption',
					  order: 9,
					  isButton: false,
					  appendTo: 'root',
					  html: '',
					  onInit: (el, pswp) => {
							pswp.on('change', () => {
								 const currSlideElement = pswp.currSlide.data.element.closest('figure');
								 let captionHTML = '';
								 if (currSlideElement) {
									  const figCaption = currSlideElement.querySelector('figcaption');
									  if (figCaption) {
											captionHTML = figCaption.innerHTML;
									  } else {
											captionHTML = currSlideElement.querySelector('img')?.getAttribute('alt') || '';
									  }
								 }
								 if (captionHTML.trim()) {
									  el.innerHTML = captionHTML;
									  el.classList.remove('hidden-caption-content'); 
								 } else {
									  el.innerHTML = '';
									  el.classList.add('hidden-caption-content'); 
								 }
							});
					  }
				 });
			`);
		}

		let uiRegisterScript = '';
		if (uiRegisterLines.length > 0) {
			uiRegisterScript = `
				 lightbox.on('uiRegister', () => {
					  ${uiRegisterLines.join('\n')}
				 });
			`;
		}

		// Code for preview mode (UMD) due to CORS restrictions
		if (isPreviewMode) {
			return `
				 <script src="${baseURL}/media/plugins/coreLightboxGallery/photoswipe.umd.min.js"></script>
				 <script src="${baseURL}/media/plugins/coreLightboxGallery/photoswipe-lightbox.umd.min.js"></script>
				 <script src="${baseURL}/media/plugins/coreLightboxGallery/photoswipe-deep-zoom-plugin.esm.min.js"></script>
				 <script type="text/javascript">
					  var galleries = document.querySelectorAll('.gallery');
					  galleries.forEach(gallery => {
							var lightbox = new PhotoSwipeLightbox({
								 ${configString},
								 pswpModule: PhotoSwipe
							});
							${uiRegisterScript}

							const deepZoomPlugin = new PhotoSwipeDeepZoom(lightbox, {
								// deep zoom plugin options, for example:
								tileSize: 256
							});

							lightbox.init();
					  });
				 </script>
			`;
		}

		// Code for production version (ESM)
		return `
			<script type="module">
				 import PhotoSwipeLightbox from '${baseURL}/media/plugins/coreLightboxGallery/photoswipe-lightbox.esm.min.js';
				 import PhotoSwipeDeepZoom from '${baseURL}/media/plugins/coreLightboxGallery/photoswipe-deep-zoom-plugin.esm.min.js';
				 const galleries = document.querySelectorAll('.gallery');
				 galleries.forEach(gallery => {
					  const lightbox = new PhotoSwipeLightbox({
							${configString},
                    pswpModule: () => import('${baseURL}/media/plugins/coreLightboxGallery/photoswipe.esm.min.js'),

					  });
					  ${uiRegisterScript}

					  const deepZoomPlugin = new PhotoSwipeDeepZoom(lightbox, {
						// deep zoom plugin options, for example:
						tileSize: 256
					  });

					  lightbox.init();
				 });
			</script>
	  `;
	}
}

module.exports = coreLightboxGallery;
