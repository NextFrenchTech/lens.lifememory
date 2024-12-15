/*
	Lens by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

var main = (function($) { var _ = {

	/**
	 * Settings.
	 * @var {object}
	 */
	settings: {

		// Preload all images.
			preload: false,

		// Slide duration (must match "duration.slide" in _vars.scss).
			slideDuration: 500,

		// Layout duration (must match "duration.layout" in _vars.scss).
			layoutDuration: 750,

		// Thumbnails per "row" (must match "misc.thumbnails-per-row" in _vars.scss).
			thumbnailsPerRow: 2,

		// Side of main wrapper (must match "misc.main-side" in _vars.scss).
			mainSide: 'right'

	},

	/**
	 * Window.
	 * @var {jQuery}
	 */
	$window: null,

	/**
	 * Body.
	 * @var {jQuery}
	 */
	$body: null,

	/**
	 * Main wrapper.
	 * @var {jQuery}
	 */
	$main: null,

	/**
	 * Thumbnails.
	 * @var {jQuery}
	 */
	$thumbnails: null,

	/**
	 * Viewer.
	 * @var {jQuery}
	 */
	$viewer: null,

	/**
	 * Toggle.
	 * @var {jQuery}
	 */
	$toggle: null,

	/**
	 * Nav (next).
	 * @var {jQuery}
	 */
	$navNext: null,

	/**
	 * Nav (previous).
	 * @var {jQuery}
	 */
	$navPrevious: null,

	/**
	 * Slides.
	 * @var {array}
	 */
	slides: [],

	/**
	 * Current slide index.
	 * @var {integer}
	 */
	current: null,

	/**
	 * Lock state.
	 * @var {bool}
	 */
	locked: false,

	/**
	 * Keyboard shortcuts.
	 * @var {object}
	 */
	keys: {

		// Escape: Toggle main wrapper.
			27: function() {
				_.toggle();
			},

		// Up: Move up.
			38: function() {
				_.up();
			},

		// Down: Move down.
			40: function() {
				_.down();
			},

		// Space: Next.
			32: function() {
				_.next();
			},

		// Right Arrow: Next.
			39: function() {
				_.next();
			},

		// Left Arrow: Previous.
			37: function() {
				_.previous();
			}

	},

	/**
	 * Initialize properties.
	 */
	initProperties: function() {

		// Window, body.
			_.$window = $(window);
			_.$body = $('body');

		// Thumbnails.
			_.$thumbnails = $('#thumbnails');

		// Viewer.
			_.$viewer = $(
				'<div id="viewer">' +
					'<div class="inner">' +
						'<div class="nav-next"></div>' +
						'<div class="nav-previous"></div>' +
						'<div class="toggle"></div>' +
					'</div>' +
				'</div>'
			).appendTo(_.$body);

		// Nav.
			_.$navNext = _.$viewer.find('.nav-next');
			_.$navPrevious = _.$viewer.find('.nav-previous');

		// Main wrapper.
			_.$main = $('#main');

		// Toggle.
			$('<div class="toggle"></div>')
				.appendTo(_.$main);

			_.$toggle = $('.toggle');

	},

	/**
	 * Initialize events.
	 */
	initEvents: function() {

		// Window.

			// Remove is-preload-* classes on load.
				_.$window.on('load', function() {

					_.$body.removeClass('is-preload-0');

					window.setTimeout(function() {
						_.$body.removeClass('is-preload-1');
					}, 100);

					window.setTimeout(function() {
						_.$body.removeClass('is-preload-2');
					}, 100 + Math.max(_.settings.layoutDuration - 150, 0));

				});

			// Disable animations/transitions on resize.
				var resizeTimeout;

				_.$window.on('resize', function() {

					_.$body.addClass('is-preload-0');
					window.clearTimeout(resizeTimeout);

					resizeTimeout = window.setTimeout(function() {
						_.$body.removeClass('is-preload-0');
					}, 100);

				});

		// Viewer.

			// Hide main wrapper on tap (<= medium only).
				_.$viewer.on('touchend', function() {

					if (breakpoints.active('<=medium'))
						_.hide();

				});

			// Touch gestures.
				_.$viewer
					.on('touchstart', function(event) {

						// Record start position.
							_.$viewer.touchPosX = event.originalEvent.touches[0].pageX;
							_.$viewer.touchPosY = event.originalEvent.touches[0].pageY;

					})
					.on('touchmove', function(event) {

						// No start position recorded? Bail.
							if (_.$viewer.touchPosX === null
							||	_.$viewer.touchPosY === null)
								return;

						// Calculate stuff.
							var	diffX = _.$viewer.touchPosX - event.originalEvent.touches[0].pageX,
								diffY = _.$viewer.touchPosY - event.originalEvent.touches[0].pageY;
								boundary = 20,
								delta = 50;

						// Swipe left (next).
							if ( (diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta) )
								_.next();

						// Swipe right (previous).
							else if ( (diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta)) )
								_.previous();

						// Overscroll fix.
							var	th = _.$viewer.outerHeight(),
								ts = (_.$viewer.get(0).scrollHeight - _.$viewer.scrollTop());

							if ((_.$viewer.scrollTop() <= 0 && diffY < 0)
							|| (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {

								event.preventDefault();
								event.stopPropagation();

							}

					});

		// Main.

			// Touch gestures.
				_.$main
					.on('touchstart', function(event) {

						// Bail on xsmall.
							if (breakpoints.active('<=xsmall'))
								return;

						// Record start position.
							_.$main.touchPosX = event.originalEvent.touches[0].pageX;
							_.$main.touchPosY = event.originalEvent.touches[0].pageY;

					})
					.on('touchmove', function(event) {

						// Bail on xsmall.
							if (breakpoints.active('<=xsmall'))
								return;

						// No start position recorded? Bail.
							if (_.$main.touchPosX === null
							||	_.$main.touchPosY === null)
								return;

						// Calculate stuff.
							var	diffX = _.$main.touchPosX - event.originalEvent.touches[0].pageX,
								diffY = _.$main.touchPosY - event.originalEvent.touches[0].pageY;
								boundary = 20,
								delta = 50,
								result = false;

						// Swipe to close.
							switch (_.settings.mainSide) {

								case 'left':
									result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta);
									break;

								case 'right':
									result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta));
									break;

								default:
									break;

							}

							if (result)
								_.hide();

						// Overscroll fix.
							var	th = _.$main.outerHeight(),
								ts = (_.$main.get(0).scrollHeight - _.$main.scrollTop());

							if ((_.$main.scrollTop() <= 0 && diffY < 0)
							|| (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {

								event.preventDefault();
								event.stopPropagation();

							}

					});
		// Toggle.
			_.$toggle.on('click', function() {
				_.toggle();
			});

			// Prevent event from bubbling up to "hide event on tap" event.
				_.$toggle.on('touchend', function(event) {
					event.stopPropagation();
				});

		// Nav.
			_.$navNext.on('click', function() {
				_.next();
			});

			_.$navPrevious.on('click', function() {
				_.previous();
			});

		// Keyboard shortcuts.

			// Ignore shortcuts within form elements.
				_.$body.on('keydown', 'input,select,textarea', function(event) {
					event.stopPropagation();
				});

			_.$window.on('keydown', function(event) {

				// Ignore if xsmall is active.
					if (breakpoints.active('<=xsmall'))
						return;

				// Check keycode.
					if (event.keyCode in _.keys) {

						// Stop other events.
							event.stopPropagation();
							event.preventDefault();

						// Call shortcut.
							(_.keys[event.keyCode])();

					}

			});

	},

	/**
	 * Initialize viewer.
	 */
	initViewer: function() {

		// Bind thumbnail click event.
			_.$thumbnails
				.on('click', '.thumbnail', function(event) {

					var $this = $(this);

					// Stop other events.
						event.preventDefault();
						event.stopPropagation();

					// Locked? Blur.
						if (_.locked)
							$this.blur();

					// Switch to this thumbnail's slide.
						_.switchTo($this.data('index'));

				});

		// Create slides from thumbnails.
			_.$thumbnails.children()
				.each(function() {

					var	$this = $(this),
						$thumbnail = $this.children('.thumbnail'),
						s;

					// Slide object.
						s = {
							$parent: $this,
							$slide: null,
							$slideImage: null,
							$slideCaption: null,
							url: $thumbnail.attr('href'),
							loaded: false
						};

					// Parent.
						$this.attr('tabIndex', '-1');

					// Slide.

						// Create elements.
	 						s.$slide = $('<div class="slide"><div class="caption"></div><div class="image"></div></div>');

	 					// Image.
 							s.$slideImage = s.$slide.children('.image');

 							// Set background stuff.
	 							s.$slideImage
		 							.css('background-image', '')
		 							.css('background-position', ($thumbnail.data('position') || 'center'));

						// Caption.
							s.$slideCaption = s.$slide.find('.caption');

							// Move everything *except* the thumbnail itself to the caption.
								$this.children().not($thumbnail)
									.appendTo(s.$slideCaption);

					// Preload?
						if (_.settings.preload) {

							// Force image to download.
								var $img = $('<img src="' + s.url + '" />');

							// Set slide's background image to it.
								s.$slideImage
									.css('background-image', 'url(' + s.url + ')');

							// Mark slide as loaded.
								s.$slide.addClass('loaded');
								s.loaded = true;

						}

					// Add to slides array.
						_.slides.push(s);

					// Set thumbnail's index.
						$thumbnail.data('index', _.slides.length - 1);

				});

	},

	/**
	 * Initialize stuff.
	 */
	init: function() {

		// Breakpoints.
			breakpoints({
				xlarge:  [ '1281px',  '1680px' ],
				large:   [ '981px',   '1280px' ],
				medium:  [ '737px',   '980px'  ],
				small:   [ '481px',   '736px'  ],
				xsmall:  [ null,      '480px'  ]
			});

		// Everything else.
			_.initProperties();
			_.initViewer();
			_.initEvents();

		// Show first slide if xsmall isn't active.
			breakpoints.on('>xsmall', function() {

				if (_.current === null)
					_.switchTo(0, true);

			});

	},

	/**
	 * Switch to a specific slide.
	 * @param {integer} index Index.
	 */
	switchTo: function(index, noHide) {

		// Already at index and xsmall isn't active? Bail.
			if (_.current == index
			&&	!breakpoints.active('<=xsmall'))
				return;

		// Locked? Bail.
			if (_.locked)
				return;

		// Lock.
			_.locked = true;

		// Hide main wrapper if medium is active.
			if (!noHide
			&&	breakpoints.active('<=medium'))
				_.hide();

		// Get slides.
			var	oldSlide = (_.current !== null ? _.slides[_.current] : null),
				newSlide = _.slides[index];

		// Update current.
			_.current = index;

		// Deactivate old slide (if there is one).
			if (oldSlide) {

				// Thumbnail.
					oldSlide.$parent
						.removeClass('active');

				// Slide.
					oldSlide.$slide.removeClass('active');

			}

		// Activate new slide.

			// Thumbnail.
				newSlide.$parent
					.addClass('active')
					.focus();

			// Slide.
				var f = function() {

					// Old slide exists? Detach it.
						if (oldSlide)
							oldSlide.$slide.detach();

					// Attach new slide.
						newSlide.$slide.appendTo(_.$viewer);

					// New slide not yet loaded?
						if (!newSlide.loaded) {

							window.setTimeout(function() {

								// Mark as loading.
									newSlide.$slide.addClass('loading');

								// Wait for it to load.
									$('<img src="' + newSlide.url + '" />').on('load', function() {
									//window.setTimeout(function() {

										// Set background image.
											newSlide.$slideImage
												.css('background-image', 'url(' + newSlide.url + ')');

										// Mark as loaded.
											newSlide.loaded = true;
											newSlide.$slide.removeClass('loading');

										// Mark as active.
											newSlide.$slide.addClass('active');

										// Unlock.
											window.setTimeout(function() {
												_.locked = false;
											}, 100);

									//}, 1000);
									});

							}, 100);

						}

					// Otherwise ...
						else {

							window.setTimeout(function() {

								// Mark as active.
									newSlide.$slide.addClass('active');

								// Unlock.
									window.setTimeout(function() {
										_.locked = false;
									}, 100);

							}, 100);

						}

				};

				// No old slide? Switch immediately.
					if (!oldSlide)
						(f)();

				// Otherwise, wait for old slide to disappear first.
					else
						window.setTimeout(f, _.settings.slideDuration);

	},

	/**
	 * Switches to the next slide.
	 */
	next: function() {

		// Calculate new index.
			var i, c = _.current, l = _.slides.length;

			if (c >= l - 1)
				i = 0;
			else
				i = c + 1;

		// Switch.
			_.switchTo(i);

	},

	/**
	 * Switches to the previous slide.
	 */
	previous: function() {

		// Calculate new index.
			var i, c = _.current, l = _.slides.length;

			if (c <= 0)
				i = l - 1;
			else
				i = c - 1;

		// Switch.
			_.switchTo(i);

	},

	/**
	 * Switches to slide "above" current.
	 */
	up: function() {

		// Fullscreen? Bail.
			if (_.$body.hasClass('fullscreen'))
				return;

		// Calculate new index.
			var i, c = _.current, l = _.slides.length, tpr = _.settings.thumbnailsPerRow;

			if (c <= (tpr - 1))
				i = l - (tpr - 1 - c) - 1;
			else
				i = c - tpr;

		// Switch.
			_.switchTo(i);

	},

	/**
	 * Switches to slide "below" current.
	 */
	down: function() {

		// Fullscreen? Bail.
			if (_.$body.hasClass('fullscreen'))
				return;

		// Calculate new index.
			var i, c = _.current, l = _.slides.length, tpr = _.settings.thumbnailsPerRow;

			if (c >= l - tpr)
				i = c - l + tpr;
			else
				i = c + tpr;

		// Switch.
			_.switchTo(i);

	},

	/**
	 * Shows the main wrapper.
	 */
	show: function() {

		// Already visible? Bail.
			if (!_.$body.hasClass('fullscreen'))
				return;

		// Show main wrapper.
			_.$body.removeClass('fullscreen');

		// Focus.
			_.$main.focus();

	},

	/**
	 * Hides the main wrapper.
	 */
	hide: function() {

		// Already hidden? Bail.
			if (_.$body.hasClass('fullscreen'))
				return;

		// Hide main wrapper.
			_.$body.addClass('fullscreen');

		// Blur.
			_.$main.blur();

	},

	/**
	 * Toggles main wrapper.
	 */
	toggle: function() {

		if (_.$body.hasClass('fullscreen'))
			_.show();
		else
			_.hide();

	},

}; return _; })(jQuery); main.init();



/* ------------------------------ */
/*           CUSTOM  JS           */
/* ------------------------------ */



/* /Mobi|Android/i.test */

	// Fonction pour détecter si l'utilisateur est sur un appareil mobile

		function isMobile() {
			return /Mobi|Android/i.test(navigator.userAgent);
		}



/* audioPlaylist */

	// autoPlayAudio

		// L'événement DOMContentLoaded est déclenché lorsque le document HTML a été complètement chargé et analysé
		document.addEventListener("DOMContentLoaded", () => {
			// Variables
			const popup = document.getElementById("popup");  // Popup principale
			const acceptButton = document.getElementById("acceptButton");  // Bouton pour accepter l'audio
			const rejectButton = document.getElementById("rejectButton");  // Bouton pour rejeter l'audio
			const popupPursue = document.getElementById("popupPursue");  // Popup de reprise
			const resumeButton = document.getElementById("resumeButton");  // Bouton pour reprendre la lecture
			const cancelButton = document.getElementById("cancelButton");  // Bouton pour annuler la reprise
			const audio = document.getElementById("audio");  // Élément audio
			let isAudioPlaying = false;  // Vérifier si l'audio est en lecture
		
			// Fonctions
			
			// Afficher une popup après un délai de 1 seconde
			const showPopup = (popupElement) => {
				setTimeout(() => {
					popupElement.style.display = "block";  // Afficher la popup
					popupElement.style.zIndex = 9999;  // Placer la popup au premier plan
				}, 1000);  // Délai de 1 seconde
			};
		
			// Démarrer la lecture audio
			const playAudio = () => {
				isAudioPlaying = true;  // Marquer l'audio comme en cours de lecture
				audio.play().catch(error => console.error("Erreur de lecture audio: ", error));  // Gestion des erreurs
			};
		
			// Gérer la réponse de l'utilisateur (acceptée ou rejetée)
			const handleUserResponse = (response) => {
				sessionStorage.setItem("userResponse", response);  // Sauvegarder la réponse dans sessionStorage
				popup.style.display = "none";  // Masquer la popup
				if (response === "accepted") {
					playAudio();  // Démarrer la lecture audio si accepté
				}
			};
		
			// Reprendre la lecture audio après une pause
			const handleResume = () => {
				popupPursue.style.display = "none";  // Masquer la popup de reprise
				playAudio();  // Reprendre la lecture audio
			};
		
			// Annuler la reprise et réinitialiser la playlist audio
			const handleCancel = () => {
				popupPursue.style.display = "none";  // Masquer la popup de reprise
				sessionStorage.setItem("userResponse", "rejected");  // Sauvegarder "rejected" dans sessionStorage
				resetPlaylist();  // Réinitialiser la playlist audio
			};
		
			// Réinitialiser la playlist audio
			const resetPlaylist = () => {
				const sources = audio.getElementsByTagName('source');  // Récupérer les sources audio
				if (sources.length > 0) {
					audio.src = sources[0].src;  // Revenir à la première source audio
					audio.load();  // Recharger l'audio
				}
			};
		
			// Passer à la piste audio suivante dans la playlist
			const playNext = () => {
				const sources = Array.from(audio.getElementsByTagName('source'));  // Convertir les sources en tableau
				const currentSourceIndex = sources.findIndex(src => src.src === audio.src);  // Trouver l'index de la source actuelle
				const nextSourceIndex = (currentSourceIndex + 1) % sources.length;  // Calculer l'index de la prochaine source
		
				audio.src = sources[nextSourceIndex].src;  // Mettre à jour la source audio
				audio.load();  // Recharger l'audio
				playAudio();  // Démarrer la lecture de la nouvelle piste
			};
		
			// Gestionnaires d'événements pour les boutons
			acceptButton.addEventListener("click", () => handleUserResponse("accepted"));  // L'utilisateur accepte
			rejectButton.addEventListener("click", () => {
				handleUserResponse("rejected");  // L'utilisateur rejette
				resetPlaylist();  // Réinitialiser la playlist si rejeté
			});
			resumeButton.addEventListener("click", handleResume);  // L'utilisateur reprend la lecture
			cancelButton.addEventListener("click", handleCancel);  // L'utilisateur annule la reprise
		
			// Mettre l'audio en pause lorsque la fenêtre perd le focus
			window.addEventListener("blur", () => {
				isAudioPlaying = !audio.paused;  // Vérifier si l'audio était en lecture
				audio.pause();  // Mettre l'audio en pause
			});
		
			// Afficher les popups lors du regain de focus de la fenêtre
			window.addEventListener("focus", () => {
				const userResponseOnFocus = sessionStorage.getItem("userResponse");  // Récupérer la réponse enregistrée
				if (!userResponseOnFocus && popup.style.display !== "block") {
					showPopup(popup);  // Afficher la popup initiale si aucune réponse précédente
				} else if (userResponseOnFocus === "accepted") {
					showPopup(popupPursue);  // Afficher la popup de reprise si accepté
				} else if (userResponseOnFocus === "rejected") {
					showPopup(popup);  // Afficher la popup initiale si rejeté
				}
			});
		
			// Passer à la piste suivante lorsque la lecture actuelle est terminée
			audio.addEventListener("ended", playNext);  // Lancer la fonction playNext lorsque l'audio est terminé
		
			// Initialisation au chargement de la page
			sessionStorage.removeItem("userResponse");  // Réinitialiser la réponse de l'utilisateur
			showPopup(popup);  // Afficher la popup initiale
		
			// Gérer la visibilité de la page (quand l'utilisateur revient après avoir quitté)
			document.addEventListener("visibilitychange", () => {
				if (!document.hidden) {  // La page devient visible
					// Vérifier si l'audio est en pause ou si la lecture a été interrompue
					if (audio.paused) {
						// Récupérer la réponse de l'utilisateur depuis sessionStorage
						const userResponseOnFocus = sessionStorage.getItem("userResponse");
						
						// Afficher la popup de reprise si l'utilisateur a accepté l'audio
						if (userResponseOnFocus === "accepted") {
							showPopup(popupPursue);  // Afficher la popup de reprise
						} 
						// Afficher la popup initiale si l'utilisateur a rejeté
						else if (userResponseOnFocus === "rejected") {
							showPopup(popup);  // Afficher la popup initiale
						}
					}
				}
			});
		});



/* autoScroll */

	// autoScroll /Mobi|Android/i

       	// L756. Fonction pour détecter si l'utilisateur est sur un appareil mobile

        // Constantes pour les valeurs configurables
        const SCROLL_STEP = 1; // Nombre de pixels à faire défiler par intervalle
        const DELAY = 15; // Intervalle en millisecondes entre chaque défilement
        const TOUCH_SENSITIVITY = 10; // Sensibilité du mouvement de doigt
		const mainDiv = document.getElementById('main');

        let isPaused = false; // Variable pour suivre l'état de la pause du défilement

        // Fonction pour démarrer le gestionnaire d'événement de défilement
        function startAutoScroll() {
            if (isMobile() && mainDiv) {
                // Défilement vertical pour les appareils mobiles
                function scrollDown() {
                    if (!isPaused) {
                        mainDiv.scrollBy(0, SCROLL_STEP); // Fait défiler la fenêtre vers le bas
                        // Vérifie si la fenêtre a atteint le bas de la page
						if ((mainDiv.scrollHeight - mainDiv.scrollTop) <= mainDiv.clientHeight) {
                            setTimeout(scrollUp, DELAY); // Si le bas de la page est atteint, défile vers le haut
                        } else {
                            setTimeout(scrollDown, DELAY); // Sinon, continue de défiler vers le bas
                        }
                    }
                }

                function scrollUp() {
                    if (!isPaused) {
                        mainDiv.scrollBy(0, -SCROLL_STEP); // Fait défiler la fenêtre vers le haut
                        // Vérifie si la fenêtre a atteint le haut de la page
                        if (mainDiv.scrollY <= 0) {
                            setTimeout(scrollDown, DELAY); // Si le haut de la page est atteint, défile vers le bas
                        } else {
                            setTimeout(scrollUp, DELAY); // Sinon, continue de défiler vers le haut
                        }
                    }
                }

                scrollDown(); // Démarre le défilement vers le bas

                let touchStartY = 0;

                // Gestion des événements tactiles
                window.addEventListener('touchstart', function(event) {
                    touchStartY = event.touches[0].clientY; // Enregistre la position de départ du toucher
                });

                // Gestion de la mise en pause du défilement
                window.addEventListener('touchmove', function(event) {
                    let touchMoveY = event.touches[0].clientY; // Récupère la position actuelle du toucher
                    let deltaY = touchMoveY - touchStartY; // Calcule le déplacement en y

                    if (Math.abs(deltaY) > TOUCH_SENSITIVITY) { // Vérifie si le déplacement dépasse la sensibilité
                        isPaused = true; // Met en pause le défilement
                    }
                });
            }
        }

        // Fonction pour démarrer le défilement au clic
        function startAutoScrollOnClick() {
            startAutoScroll(); // Démarre le défilement automatique
            isPaused = false; // Réinitialiser l'état de la pause
        }

        // Ajout de l'événement de démarrage du défilement automatique aux boutons
        document.getElementById('acceptButton').addEventListener('click', startAutoScrollOnClick);
        document.getElementById('rejectButton').addEventListener('click', startAutoScrollOnClick);

		// Fonction pour démarrer le défilement automatique
		//window.onload = function() {
		//	setTimeout(startAutoScroll, 0); // Délai de 0 secondes avant de démarrer le défilement automatique
		//};



/* autoSwitch */

	// autoSwitch /Mobi|Android/i
	
		// L756. Fonction pour détecter si l'utilisateur est sur un appareil mobile

		// Fonction pour passer à la photo suivante
		function nextPhoto() {
			if (isMobile() && document.body.classList.contains('fullscreen')) {
				// Simuler un clic sur le bouton "suivant" de Poptrox
				var nextButton = document.querySelector('.nav-next');
				if (nextButton) {
					nextButton.click();
				}
			}
			
			// Appel récursif pour exécuter la fonction après 5 secondes
			setTimeout(nextPhoto, 5000);
		}

		// Appel initial de la fonction nextPhoto
		nextPhoto();



/* autoView */

	// autoView /videoPlayer05

		// Fonction pour passer à la video suivante
		document.addEventListener('DOMContentLoaded', function() {
			var videoPlayer05 = document.getElementById('videoPlayer05');

			// Liste des vidéos
			var videos = [
				{ src: 'videos/vid05.mp4' },
				//{ src: 'videos/.mp4', poster: 'images/.jpg' },
			];

			var currentVideoIndex = 0;

			// Fonction pour charger une vidéo
			function loadVideo(index) {
				if (index < videos.length) {
					videoPlayer05.src = videos[index].src;
					//videoPlayer05.poster = videos[index].poster;
					videoPlayer05.load();
					videoPlayer05.play();
				}
			}

			// Écouteur d'événement pour la fin de la vidéo
			//videoPlayer05.addEventListener('ended', function() {
			//	currentVideoIndex++;
			//	if (currentVideoIndex < videos.length) {
			//		loadVideo(currentVideoIndex);
			//	} else {
			//		// Réinitialiser à la première vidéo si toutes les vidéos sont jouées
			//		currentVideoIndex = 0;
			//		loadVideo(currentVideoIndex);
			//	}
			//});

			// Charger la première vidéo
			loadVideo(currentVideoIndex);
		});



/* autoView */

	// autoView /videoPlayer04

		// Fonction pour passer à la video suivante
		document.addEventListener('DOMContentLoaded', function() {
			var videoPlayer04 = document.getElementById('videoPlayer04');

			// Liste des vidéos
			var videos = [
				{ src: 'videos/vid04.mp4' },
				{ src: 'videos/vid05.mp4' },
				//{ src: 'videos/.mp4', poster: 'images/.jpg' },
			];

			var currentVideoIndex = 0;

			// Fonction pour charger une vidéo
			function loadVideo(index) {
				if (index < videos.length) {
					videoPlayer04.src = videos[index].src;
					//videoPlayer04.poster = videos[index].poster;
					videoPlayer04.load();
					videoPlayer04.play();
				}
			}

			// Écouteur d'événement pour la fin de la vidéo
			videoPlayer04.addEventListener('ended', function() {
				currentVideoIndex++;
				if (currentVideoIndex < videos.length) {
					loadVideo(currentVideoIndex);
				} else {
					// Réinitialiser à la première vidéo si toutes les vidéos sont jouées
					currentVideoIndex = 0;
					loadVideo(currentVideoIndex);
				}
			});

			// Charger la première vidéo
			loadVideo(currentVideoIndex);
		});