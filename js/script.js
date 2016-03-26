/*jshint esversion: 6*/
/*global $, document, Image, window, setTimeout, setInterval, clearInterval*/

$(document).ready(function () {
	"use strict";

	/************** Character Constructor **************/

	function Character(name, ammoLeft, ammoCarried, bulletholeDelay, radius, bulletDelay, reloadTime, points) {
		this.name = name;
		this.ammoLeft = ammoLeft;
		this.ammoCarried = ammoCarried;
		this.bulletholeDelay = bulletholeDelay;
		this.radius = radius;
		this.bulletDelay = bulletDelay;
		this.reloadTime = reloadTime;
		this.points = points;
	}

	const char = {
		scout: new Character("scout", 6, 32, 0, 8, 550, 1400, 10),
		soldier: new Character("soldier", 4, 20, 850, 0, 2000, 2100, 20),
		pyro: new Character("pyro", 2, 0, 0, 0, 100, 300, 2),
		demoman: new Character("demoman", 4, 16, 540, 8, 1450, 2050, 20),
		heavy: new Character("heavy", 200, 0, 0, 30, 100, 1650, 2),
		engy: new Character("engy", 6, 32, 0, 8, 880, 1600, 10),
		medic: new Character("medic", 40, 150, 0, 4, 120, 1200, 2),
		sniper: new Character("sniper", 1, 25, 0, 0, 500, 1200, 10),
		spy: new Character("spy", 6, 24, 0, 3, 770, 1890, 4)
	};


	/*************** High Score cookies **************/

	function setCookie(cname, cvalue, exdays) {
		const d = new Date();
		d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
		const expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}

	function getCookie(cname) {
		const name = cname + "=";
		const ca = document.cookie.split(';');
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) === " ") {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}
	
	/****************** Audio settings *****************/

	function playAudio(audioID) {
		audioID.currentTime = 0;
		audioID.volume = 0.1;
		audioID.play();
	}

	/***************** TF2 global variables ******************/

	const charName = ["scout", "soldier", "pyro", "demoman", "heavy", "engy", "medic", "sniper", "spy"];

	let activeChar = char.heavy,

		characterScreenOpen = true,

		mouseHeldDown,

		xPosition,
		yPosition,

		headHovering,

		pointCount,
		oldHighScore;

	/**************** Preloads *******************/

	const load = (function () {

		const setHighScore = function () {
			//high score list
			for (let i = 0; i < charName.length; i++) {
				//find each classes high score (if it exists)
				const highscoreNumber = getCookie(charName[i] + "highscore") !== "" ? getCookie(charName[i] + "highscore") : "0";
				$("#" + charName[i] + "-highscore").text(highscoreNumber);
			}

			//last played date
			const lastPlayed = getCookie("lastPlayed");
			const today = new Date().toDateString();
			let lastPlayedText = "";
			if (lastPlayed === "") {
				lastPlayedText = "Welcome new user!";
			} else if (lastPlayed === today) {
				lastPlayedText = "Today";
			} else {
				lastPlayedText = lastPlayed;
			}
			$("#last-played").after("<p id='last-played-date'>" + lastPlayedText + "</p>");
			setCookie("lastPlayed", today, 365);
		};

		const imagePreloader = function () {
			let imageList = [];

			$.each(charName, function (i) {
				imageList.push("img/cursors/" + charName[i] + ".png");
				imageList.push("img/bulletholes/" + charName[i] + ".png");
				imageList.push("img/hud/" + charName[i] + ".png");
			});

			let newImage = [];
			for (let i = 0; i < imageList.length; i++) {
				newImage[i] = new Image();
				newImage[i].src = imageList[i];
			}
		};

		return {
			init: function () {
				$(".loading").remove();
				$(".full-text").addClass("flashing");
				setHighScore();
				imagePreloader();
			}
		};
	}());

	/************** TF2 Main Game Screen functions *****************/

	const screen = (function () {

		const setValue = function () {
			$("#cursor").attr("src", "img/cursors/" + activeChar.name + ".png");
			$("#hud").attr("src", "img/hud/" + activeChar.name + ".png");
			$("#draw").attr("src", "audio/" + activeChar.name + "/gundraw.mp3");
			$("#gunshot").attr("src", "audio/" + activeChar.name + "/shoot.mp3");
			$("#gunshot2").attr("src", "audio/" + activeChar.name + "/shoot.mp3");
			$("#reload").attr("src", "audio/" + activeChar.name + "/reload.mp3");
			$("#no-ammo").attr("src", "audio/" + activeChar.name + "/noammo.mp3");
			$("#no-ammo2").attr("src", "audio/" + activeChar.name + "/noammo.mp3");
			$("#no").attr("src", "audio/" + activeChar.name + "/no.mp3");
			//see fullAmmo() for #speak line (allows for different lines on each no ammo)
		};

		var reloadLine = function () {
			$(".background").one("mousedown", function () {
				$("<div class='reload-line'><p>Hit 'R' to reload</p></div>").appendTo(".ammo-info");
			});
			//run only once
			reloadLine = function () {};
		};

		return {
			openGameScreen: function () {
				setValue();
				$(".character-selection").hide();
				characterScreenOpen = false;
				//in case random is selected
				$("#random").removeClass("active");
				setTimeout(function () {
					playAudio($("#draw")[0]);
				}, 300);
				if (activeChar !== char.pyro && activeChar !== char.heavy && activeChar !== char.sniper) {
					reloadLine();
				}
				if (activeChar === char.pyro || activeChar === char.heavy) {
					$(".total-ammo").css("opacity", 0);
				} else {
					$(".total-ammo").css("opacity", 1);
				}
				oldHighScore = getCookie(activeChar.name + "highscore");
				pointCount = 0;
			},
			openCharacterScreen: function () {
				$(".character-selection").show();
				characterScreenOpen = true;
				$(".bullet").hide();
				$("#crate").hide();
				$(".reload-line").remove();
				$("#cursor").attr("src", ""); //remove cursor to prevent character screen lag
				$("#hud").attr("src", ""); //remove old HUD to prevent it appearing before new one loads
				$(".highscore-text").removeClass("highscore-animate");
			}
		};
	}());

	/*************** Shooting and Reload functions *****************/

	const shoot = (function () {

		//reload functions
		let	alreadyOnLastBullet = false,
			noShooting = true,
			ammoLeft = activeChar.ammoLeft,
			ammoCarried = activeChar.ammoCarried,
			totalAmmo = ammoLeft + ammoCarried;


		const reloadAmmo = function () {
			if (totalAmmo >= activeChar.ammoLeft) {
				ammoCarried = ammoCarried - (activeChar.ammoLeft - ammoLeft);
				ammoLeft = activeChar.ammoLeft;
			} else {
				ammoLeft = ammoLeft + ammoCarried;
				ammoCarried = 0;
			}
		};

		const updateText = function () {
			$(".ammo").text(ammoLeft);
			$(".total-ammo").text(ammoCarried);
		};

		//bullet animation
		const xSpread = function () {
			return Math.floor(Math.random() * (2 * activeChar.radius) - activeChar.radius); //random x-value within spread area
		};

		const ySpread = function (x) {
			const y = Math.sqrt((Math.pow(activeChar.radius, 2)) - Math.pow(x, 2)); //distance formula
			return Math.floor(Math.random() * (2 * y) - y); //random y-value (within set limits based on x-value) within spread area
		};

		const cursorAnim = function () {
			$("#cursor").stop().animate({
				width: "168px",
				height: "168px",
				left: "-=10px",
				top: "-=10px"
			}, 0).animate({
				width: "148px",
				height: "148px",
				left: "+=10px",
				top: "+=10px"
			}, 80);
		};

		const setBulletHole = function () {
			if (totalAmmo > 0) {
				//bullet spread placements (45px and 81px account for .bullet image-size centering)
				const x = xSpread();
				$("<div class='bullet fade-out'></div>").css({
					left: xPosition - (45 + x),
					top: yPosition - (81 + ySpread(x))
				}).appendTo(".background");
				//bullet fade-away
				setTimeout(function () {
					$(".fade-out:first").removeClass("fade-out").fadeOut(600, function () {
						$(this).remove();
					});
				}, 20000);
				//headshot
				if (headHovering && (activeChar === char.spy || activeChar === char.sniper)) {
					$("<p class='crit'>Critical<br>Hit!!!</p>").appendTo(".headshot").css({
						left: xPosition - 56,
						top: yPosition - 100
					});
					setTimeout(function () {
						$(".crit:first").fadeOut(340, function () {
							$(this).remove();
						});
					}, 430);
					setTimeout(function () {
						playAudio($("#headshot")[0]);
					}, 200);
					pointCount += 4;
				}
			}
		};

		//shooting
		const shootGun = function () {
			if (totalAmmo <= 0) {
				totalAmmo--;
				noShooting = true;
				setTimeout(function () {
					noShooting = false;
				}, activeChar.bulletDelay);
				//rotating audio to prevent lag
				if (totalAmmo % 2) {
					playAudio($("#no-ammo")[0]);
				} else {
					playAudio($("#no-ammo2")[0]);
				}
				if (totalAmmo <= -3) {
					setTimeout(function () {
						playAudio($("#no")[0]);
					}, 50);
				}
			} else {
				ammoLeft--;
				totalAmmo--;
				noShooting = true;
				pointCount += activeChar.points;
				//prevent audio delay by flipping between audio tags
				if (totalAmmo % 2) {
					playAudio($("#gunshot")[0]);
				} else {
					playAudio($("#gunshot2")[0]);
				}
				setTimeout(function () {
					noShooting = false;
				}, activeChar.bulletDelay);
				if (ammoLeft <= 0) {
					clearInterval(mouseHeldDown);
					setTimeout(function () {
						shoot.reloading();
					}, activeChar.bulletDelay);
				}
				//check if new high score
				if (pointCount > oldHighScore) {
					setCookie(activeChar.name + "highscore", pointCount, 365);
					//don't flash "new highscore" on first play
					if (oldHighScore !== "") {
						$(".highscore-text").addClass("highscore-animate");
					}
				}
			}
		};

		const updateBullet = function () {
			setTimeout(function () {
				$(".bullet").css("background", "url(img/bulletholes/" + activeChar.name + ".png)");
			}, activeChar.bulletholeDelay);
		};

		const onLastBullet = function () {
			if (totalAmmo === 0 && !alreadyOnLastBullet) {
				alreadyOnLastBullet = true;
				if (activeChar === char.heavy) {
					playAudio($("#wind-down")[0]);
				}
				setTimeout(function () {
					playAudio($("#speak")[0]);
				}, activeChar.bulletDelay);
				const currentCharacter = activeChar;
				setTimeout(function () {
					if (currentCharacter === activeChar) {
						$("#crate").fadeIn(600);
					}
				}, 2000);
			}
		};

		return {
			fullAmmo: function () {
				ammoLeft = activeChar.ammoLeft;
				ammoCarried = activeChar.ammoCarried;
				totalAmmo = ammoLeft + ammoCarried;
				updateText();
				alreadyOnLastBullet = false;
				noShooting = false;
				//reset spoken line when out of ammo
				$("#speak").attr("src", "audio/" + activeChar.name + "/speak" + Math.floor(Math.random() * 3) + ".mp3");
			},

			reloading: (function () {
				let alreadyReloading = false;
				
				return function () {
					if (!alreadyReloading && ammoLeft !== activeChar.ammoLeft && ammoCarried !== 0 && !noShooting) {
						alreadyReloading = true;
						playAudio($("#reload")[0]);
						noShooting = true;
						clearInterval(mouseHeldDown);
						setTimeout(function () {
							noShooting = false;
							alreadyReloading = false;
							reloadAmmo();
							updateText();
						}, activeChar.reloadTime);
					}
				};
			}()),

			reloadingCrate: function () {
				noShooting = true;
				playAudio($("#metal")[0]);
				$("#crate").fadeOut(200);
				setTimeout(function () {
					playAudio($("#reload")[0]);
				}, 600);
				setTimeout(() => {
					this.fullAmmo();
				}, 600 + activeChar.reloadTime);
			},

			shooting: function () {
				if (!noShooting) {
					cursorAnim();
					setBulletHole();
					shootGun();
					updateBullet();
					onLastBullet();
					updateText();
				}
			}
		};
	}());


	/********************* jQuery Events **************************/
	/**************************************************************/

	/*************** Load events ********************/

	//loading screen
	$(window).load(function () {
		load.init();
	});

	/*************** Start screen(s) ********************/

	//continue button show/hide & continue
	$(".continue-button").hover(function () {
		$(this).css("opacity", "1");
	}, function () {
		$(this).css("opacity", "0");
	});

	$(".load-continue-button").click(function () {
		$(this).parent().empty();
		$(".highscore-list").css("opacity", 1);
		playAudio($("#button")[0]);
	});

	$(".map-continue-button").click(function () {
		$(this).parent().empty();
		$(".flashing").remove();
		$(".highscore-list").remove();
		playAudio($("#button")[0]);
	});

	//select screen continue
	$(".select-continue-button, .choose-character > div").click(function () {
		screen.openGameScreen();
		shoot.fullAmmo();
	});

	/*********** Choose character screen (mouse & keyboard) **************/
	(function () {

		function chooseChar(charChoice) {
			if (charChoice === "random") {
				//prevent random from picking previous character again
				const oldChar = activeChar;
				while (activeChar === oldChar) {
					const randomChoice = Math.floor(Math.random() * charName.length);
					chooseChar([charName[randomChoice]]);
				}
				$("#random").addClass("active");
			} else {
				$(".active").removeClass("active");
				$("#" + charChoice).addClass("active");
				activeChar = char[charChoice];
				playAudio($("#hover")[0]);
			}
		}

		$(".choose-character div").mouseenter(function () {
			const charChoice = $(this).data("char");
			chooseChar(charChoice);
		});

		//choose class (key) and other keys
		$(document).keydown(function (key) {
			if (characterScreenOpen) {
				switch (parseInt(key.which, 10)) {
				case 49: //"1"
					chooseChar("scout");
					break;
				case 50: //"2"
					chooseChar("soldier");
					break;
				case 51: //"3"
					chooseChar("pyro");
					break;
				case 52: //"4"
					chooseChar("demoman");
					break;
				case 53: //"5"
					chooseChar("heavy");
					break;
				case 54: //"6"
					chooseChar("engy");
					break;
				case 55: //"7"
					chooseChar("medic");
					break;
				case 56: //"8"
					chooseChar("sniper");
					break;
				case 57: //"9"
					chooseChar("spy");
					break;
				case 48: //"0"
					chooseChar("random");
					break;
				case 13: //"enter"
					screen.openGameScreen();
					shoot.fullAmmo();
					break;
				}
			} else if (!characterScreenOpen) {
				switch (parseInt(key.which, 10)) {
				case 188: //","
					screen.openCharacterScreen();
					break;
				case 82: //"r"
					shoot.reloading();
					break;
				}
			}
		});

	}());

	/*************** Crosshair and shooting (Mouse events) ********************/

	//cursor tracking
	$(document).mousemove(function (e) {
		xPosition = e.pageX;
		yPosition = e.pageY;
		$("#cursor").finish().css({
			left: xPosition - 74,
			top: yPosition - 74
		});
	});

	//shooting
	$(".background").mousedown(function (e) {
		switch (e.which) {
		case 1:
			if (!characterScreenOpen) {
				if (activeChar === char.heavy) {
					playAudio($("#wind-up")[0]);
				} else {
					shoot.shooting();
				}
				clearInterval(mouseHeldDown);
				mouseHeldDown = setInterval(shoot.shooting, activeChar.bulletDelay + 50);
				break;
			}
		}
	});

	//check for headshot
	$(".headshot > div").hover(function () {
		headHovering = true;
	}, function () {
		headHovering = false;
	});

	/***************Clear Interval Events (stop shooting) ********************/

	$(document).blur(function () {
		clearInterval(mouseHeldDown);
	});

	$(".background").mouseleave(function () {
		clearInterval(mouseHeldDown);
	});

	$(".background").mouseup(function () {
		clearInterval(mouseHeldDown);
		if (!characterScreenOpen && activeChar === char.heavy) {
			playAudio($("#wind-down")[0]);
		}
	});

	/*************** Misc. Game Screen popups ********************/

	//hide crosshair
	$("#crate, .class-button").hover(function () {
		$("#cursor").toggle();
	});

	//ammo crate resupply
	$("#crate").mousedown(function (e) {
		switch (e.which) {
		case 1: //left-click
			shoot.reloadingCrate();
			break;
		}
	});

	//change classes button
	$(".class-button").mousedown(function (e) {
		switch (e.which) {
		case 1: //left-click
			playAudio($("#button")[0]);
			screen.openCharacterScreen();
			break;
		}
	});

	//disable right click
	$(document).on("contextmenu", function () {
		return false;
	});

});