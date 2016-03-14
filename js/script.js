/*jslint vars: true plusplus: true */
/*global $, document, Image, window, setTimeout, setInterval, clearInterval */

$(document).ready(function () {
	"use strict";

	/**************Character Constructor**************/

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

	var char = {
		scout: new Character("scout", 6, 32, 0, 8, 550, 1400, 10),
		soldier: new Character("soldier", 4, 20, 850, 0, 2000, 2100, 20),
		pyro: new Character("pyro", 200, 0, 0, 0, 100, 300, 2),
		demoman: new Character("demoman", 4, 16, 540, 8, 1450, 2050, 20),
		heavy: new Character("heavy", 200, 0, 0, 30, 100, 1650, 2),
		engy: new Character("engy", 6, 32, 0, 8, 880, 1600, 10),
		medic: new Character("medic", 40, 150, 0, 4, 120, 1200, 2),
		sniper: new Character("sniper", 1, 25, 0, 0, 500, 1200, 10),
		spy: new Character("spy", 6, 24, 0, 3, 770, 1890, 4)
	};


	/***************High Score cookies**************/

	function setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
		var expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for (var i = 0, caLength = ca.length; i < caLength; i++) {
			var c = ca[i];
			while (c.charAt(0) === " ") {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	/*****************TF2 variables******************/

	var activeChar = char.heavy,

		charName = ["scout", "soldier", "pyro", "demoman", "heavy", "engy", "medic", "sniper", "spy"],

		ammoLeft,
		ammoCarried,
		totalAmmo,


		characterScreenOpen = false,

		noShooting = true,

		alreadyReloading = false,
		alreadyOnLastBullet = false,

		mouseHeldDown,

		xPosition,
		yPosition,

		headHovering,

		pointCount,
		oldHighScore;

	/****************Preload images*******************/

	//preload images after start screen loads
	function imagePreloader() {
		var imageList = [];

		$.each(charName, function (i) {
			imageList.push("img/cursors/" + charName[i] + ".png");
			imageList.push("img/bulletholes/" + charName[i] + ".png");
			imageList.push("img/hud/" + charName[i] + ".png");
		});

		var newImage = [];
		for (var i = 0, imageListLength = imageList.length; i < imageListLength; i++) {
			newImage[i] = new Image();
			newImage[i].src = imageList[i];
		}
	}

	/******************TF2 functions*****************/

	//loading screen
	$(window).load(function () {
		$(".full-text").addClass("flashing");
		$(".loading").remove();
		imagePreloader();
	});

	//highscore(map) screen
	(function setHighScore() {
		//high score list
		for (var i = 0, charNameLength = charName.length; i < charNameLength; i++) {
			//find each classes high score (if it exists)
			var highscoreNumber = getCookie(charName[i] + "highscore") !== "" ? getCookie(charName[i] + "highscore") : "0";
			$("#" + charName[i] + "-highscore").text(highscoreNumber);
		}

		//last played date
		var lastPlayed = getCookie("lastPlayed");
		var lastPlayedText;
		var today = new Date().toDateString();
		if (lastPlayed === "") {
			lastPlayedText = "Welcome new user!";
		} else if (lastPlayed === today) {
			lastPlayedText = "Today";
		} else {
			lastPlayedText = lastPlayed;
		}
		$("#last-played").after("<p id='last-played-date'>" + lastPlayedText + "</p>");
		setCookie("lastPlayed", today, 365);
	}());

	//play audio
	function playAudio(audio) {
		audio.currentTime = 0;
		audio.volume = 0.1;
		audio.play();
	}

	//update ammo text
	function updateText() {
		$(".ammo").text(ammoLeft);
		$(".total-ammo").text(ammoCarried);
	}

	//reload functions
	function reloadAmmo() {
		if (totalAmmo >= activeChar.ammoLeft) {
			ammoCarried = ammoCarried - (activeChar.ammoLeft - ammoLeft);
			ammoLeft = activeChar.ammoLeft;
		} else {
			ammoLeft = ammoLeft + ammoCarried;
			ammoCarried = 0;
		}
	}

	function reloading() {
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
	}

	//update/change speak line
	function rollSpeak() {
		$("#speak").attr("src", "audio/" + activeChar.name + "/speak" + Math.floor(Math.random() * 3) + ".mp3");
	}

	//update sound/cursor/bullethole
	function setValue() {
		$("#cursor").attr("src", "img/cursors/" + activeChar.name + ".png");
		$("#hud").attr("src", "img/hud/" + activeChar.name + ".png");
		$("#draw").attr("src", "audio/" + activeChar.name + "/gundraw.mp3");
		$("#gunshot").attr("src", "audio/" + activeChar.name + "/shoot.mp3");
		$("#gunshot2").attr("src", "audio/" + activeChar.name + "/shoot.mp3");
		$("#reload").attr("src", "audio/" + activeChar.name + "/reload.mp3");
		$("#no-ammo").attr("src", "audio/" + activeChar.name + "/noammo.mp3");
		$("#no-ammo2").attr("src", "audio/" + activeChar.name + "/noammo.mp3");
		$("#no").attr("src", "audio/" + activeChar.name + "/no.mp3");
		rollSpeak();
	}

	//update bullethole
	function updateBullet() {
		setTimeout(function () {
			$(".bullet").css("background", "url(img/bulletholes/" + activeChar.name + ".png)");
		}, activeChar.bulletholeDelay);
	}

	//full ammo function
	function fullAmmo() {
		ammoLeft = activeChar.ammoLeft;
		ammoCarried = activeChar.ammoCarried;
		totalAmmo = ammoLeft + ammoCarried;
		updateText();
		rollSpeak();
		alreadyOnLastBullet = false;
	}

	//cursor tracking
	$(document).mousemove(function (e) {
		xPosition = e.pageX;
		yPosition = e.pageY;
		$("#cursor").css({
			left: xPosition - 74,
			top: yPosition - 74
		});
	});

	//check for headshot
	$(".headshot > div").hover(function () {
		headHovering = true;
	}, function () {
		headHovering = false;
	});

	//reload line animation
	function reloadLine() {
		$(".background").one("mousedown", function () {
			$("<div class='reload-line'><p>Hit 'R' to reload</p></div>").appendTo(".ammo-info");
		});
		//run only once
		reloadLine = function () {};
	}

	/****************TF2 Main Game Screens*******************/

	//open game screen
	function openGameScreen() {
		noShooting = false;
		setValue();
		fullAmmo();
		$(".character-selection").hide();
		setTimeout(function () {
			playAudio($("#draw")[0]);
		}, 300);
		characterScreenOpen = false;
		//in case random is selected
		$("#random").removeClass("active");
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
	}

	//open character choice screen
	function openCharacterScreen() {
		$(".character-selection").show();
		characterScreenOpen = true;
		$(".bullet").hide();
		$("#crate").hide();
		$(".reload-line").remove();
		$("#cursor").attr("src", ""); //remove cursor to prevent character screen lag
		$("#hud").attr("src", ""); //remove old HUD to prevent it appearing before new one loads
		$(".highscore-text").removeClass("highscore-animate");
	}

	/***********************************/

	//continue button show/hide & continue
	$(".continue-button").hover(function () {
		$(this).css("opacity", "1");
	}, function () {
		$(this).css("opacity", "0");
	});

	$(".load-continue-button").click(function () {
		$(this).parent().empty();
		playAudio($("#button")[0]);
		$(".highscore-list").css("opacity", 1);
	});

	$(".map-continue-button").click(function () {
		$(this).parent().empty();
		playAudio($("#button")[0]);
		$(".flashing").remove();
		$(".highscore-list").remove();
		characterScreenOpen = true;
	});

	//select screen continue
	$(".select-continue-button, .choose-character > div").click(function () {
		openGameScreen();
	});

	/*****************Shoot and Reload Functions (and more)*******************/

	//shoot gun functions
	function shootGun() {
		if (totalAmmo <= 0) {
			totalAmmo--;
			noShooting = true;
			setTimeout(function () {
				noShooting = false;
			}, activeChar.bulletDelay);
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
			pointCount += activeChar.points;
			//prevent audio delay by flipping between audio tags
			if (totalAmmo % 2) {
				playAudio($("#gunshot")[0]);
			} else {
				playAudio($("#gunshot2")[0]);
			}
			noShooting = true;
			setTimeout(function () {
				noShooting = false;
			}, activeChar.bulletDelay);
			if (ammoLeft <= 0) {
				clearInterval(mouseHeldDown);
				setTimeout(function () {
					reloading();
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
	}

	//on & after final shot
	function onLastBullet() {
		if (totalAmmo === 0 && !alreadyOnLastBullet) {
			alreadyOnLastBullet = true;
			if (activeChar === char.heavy) {
				playAudio($("#wind-down")[0]);
			}
			setTimeout(function () {
				playAudio($("#speak")[0]);
			}, activeChar.bulletDelay);
			var currentCharacter = activeChar;
			setTimeout(function () {
				if (currentCharacter === activeChar) {
					$("#crate").fadeIn(600);
				}
			}, 2000);
		}
	}

	//random circle bullet spread
	function xSpread() {
		return Math.floor(Math.random() * (2 * activeChar.radius) - activeChar.radius); //random x-value within spread area
	}

	function ySpread(x) {
		var y = Math.sqrt((Math.pow(activeChar.radius, 2)) - Math.pow(x, 2)); //y-value = hypotenouse^2 minus x-value^2
		return Math.floor(Math.random() * (2 * y) - y); //random y-value (within set limits based on x-value) within spread area
	}

	//shooting
	function shooting() {
		if (!noShooting) {
			//cursor animation
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
			//bullet placement & fade-away
			if (totalAmmo > 0) {
				//bullet spread placements (45px and 81px account for .bullet image-size centering)
				var x = xSpread();
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
			shootGun();
			updateText();
			updateBullet();
			onLastBullet();
		}
	}

	/***********************************/

	//Choose character screen for mouse and keyboard

	//choose Character functions

	function chooseChar(charChoice) {
		$(".active").removeClass("active");
		$("#" + charChoice).addClass("active");
		activeChar = char[charChoice];
		playAudio($("#hover")[0]);
	}

	function chooseRandom() {
		//prevent random from picking previous character again
		var oldChar = activeChar;
		while (activeChar === oldChar) {
			var randomChoice = Math.floor(Math.random() * charName.length);
			chooseChar([charName[randomChoice]]);
		}
		$("#random").addClass("active");
	}

	$(".scout").mouseenter(function () {
		chooseChar("scout");
	});

	$(".soldier").mouseenter(function () {
		chooseChar("soldier");
	});

	$(".pyro").mouseenter(function () {
		chooseChar("pyro");
	});

	$(".demoman").mouseenter(function () {
		chooseChar("demoman");
	});

	$(".heavy").mouseenter(function () {
		chooseChar("heavy");
	});

	$(".engy").mouseenter(function () {
		chooseChar("engy");
	});

	$(".medic").mouseenter(function () {
		chooseChar("medic");
	});

	$(".sniper").mouseenter(function () {
		chooseChar("sniper");
	});

	$(".spy").mouseenter(function () {
		chooseChar("spy");
	});

	$(".random").mouseenter(function () {
		chooseRandom();
	});

	//choose class (key) and other keys
	$(document).keydown(function (key) {
		if (characterScreenOpen) {
			switch (parseInt(key.which, 10)) {
				//"1"
			case 49:
				chooseChar("scout");
				break;
				//"2"
			case 50:
				chooseChar("soldier");
				break;
				//"3"
			case 51:
				chooseChar("pyro");
				break;
				//"4"
			case 52:
				chooseChar("demoman");
				break;
				//"5"
			case 53:
				chooseChar("heavy");
				break;
				//"6"
			case 54:
				chooseChar("engy");
				break;
				//"7"
			case 55:
				chooseChar("medic");
				break;
				//"8"
			case 56:
				chooseChar("sniper");
				break;
				//"9"
			case 57:
				chooseChar("spy");
				break;
				//"0"
			case 48:
				chooseRandom();
				break;
				//"enter/return"
			case 13:
				openGameScreen();
				break;
			}
		} else if (!characterScreenOpen) {
			switch (parseInt(key.which, 10)) {
				//","
			case 188:
				openCharacterScreen();
				break;
				//"r"
			case 82:
				reloading();
				break;
			}
		}
	});

	/***********************************/

	$(".background").mousedown(function (e) {
		switch (e.which) {
		case 1:
			if (!characterScreenOpen && activeChar === char.heavy) {
				playAudio($("#wind-up")[0]);
			} else {
				shooting();
			}
			clearInterval(mouseHeldDown);
			mouseHeldDown = setInterval(shooting, activeChar.bulletDelay + 50);
			break;

		}
	});

	//prevent cursor lag
	$(document).mousemove(function () {
		$("#cursor").finish();
	});

	//clear interval events    
	$(document).on("blur", function () {
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

	//ammo crate resupply
	$("#crate").mousedown(function (e) {
		switch (e.which) {
		case 1:
			noShooting = true;
			playAudio($("#metal")[0]);
			$(this).fadeOut(200);
			setTimeout(function () {
				playAudio($("#reload")[0]);
			}, 600);
			setTimeout(function () {
				fullAmmo();
				noShooting = false;
			}, 600 + activeChar.reloadTime);
			break;
		}
	});

	//change classes button
	$(".class-button").mousedown(function (e) {
		switch (e.which) {
		case 1:
			playAudio($("#button")[0]);
			openCharacterScreen();
			break;
		}
	});

	//hide cursor
	$("#crate, .class-button").hover(function () {
		$("#cursor").toggle();
	});

	//disable right click
	$(document).on("contextmenu", function () {
		return false;
	});

});