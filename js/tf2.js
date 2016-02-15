/*global $ */
$(document).ready(function () {
    "use strict";
    //Character constructor
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

    var character = {
        scout : new Character("scout", 6, 32, 0, 8, 550, 1400, 10),
        soldier : new Character("soldier", 4, 20, 850, 0, 2000, 2100, 20),
        pyro : new Character("pyro", 200, 0, 0, 0, 100, 300, 2),
        demoman : new Character("demoman", 4, 16, 540, 8, 1450, 2050, 20),
        heavy : new Character("heavy", 200, 0, 0, 30, 100, 1650, 2),
        engy : new Character("engy", 6, 32, 0, 8, 880, 1600, 10),
        medic : new Character("medic", 40, 150, 0, 4, 120, 1200, 2),
        sniper : new Character("sniper", 1, 25, 0, 0, 500, 1200, 10),
        spy : new Character("spy", 6, 24, 0, 3, 770, 1890, 4)
    };

    /***********************************/
	
    //tf2 variables
    var activeCharacter = character.heavy,

        ammoLeft,
        ammoCarried,
        totalAmmo,
		

        characterScreen = null,

        noShooting = true,

        alreadyReloading = false,
        alreadyOnLastBullet = false,

        mouseHeldDown,

        xPosition,
        yPosition,

        headCheck,
		
		pointCount,
		oldHighScore;
	
	/***********************************/

    //TF2 functions

	//loading screen
    $(window).load(function () {
        $(".full-text").addClass("flashing");
        $(".loading").remove();
		imagePreloader();
		setHighScore();
    });
	
	
	function setHighScore() {
		//high score list
		var className = ["scout", "soldier", "pyro", "demoman", "heavy", "engy", "medic", "sniper", "spy"];
		var highscoreNumber;
		var i;
		for (i = 0; i < className.length; i++) {
			if (getCookie(className[i] + "highscore") !== "") {
				highscoreNumber = getCookie(className[i] + "highscore");
			} else {
				highscoreNumber = "0";
			}
			$("#" + className[i] + "-highscore").text(highscoreNumber);
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
	}
	
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
        if (totalAmmo >= activeCharacter.ammoLeft) {
            ammoCarried = ammoCarried - (activeCharacter.ammoLeft - ammoLeft);
            ammoLeft = activeCharacter.ammoLeft;
        } else {
            ammoLeft = ammoLeft + ammoCarried;
            ammoCarried = 0;
        }
    }

    function reloading() {
        if (alreadyReloading === false && ammoLeft !== activeCharacter.ammoLeft && ammoCarried !== 0 && noShooting === false) {
            alreadyReloading = true;
            playAudio($("#reload")[0]);
            noShooting = true;
            clearInterval(mouseHeldDown);
            setTimeout(function () {noShooting = false; alreadyReloading = false; reloadAmmo(); updateText(); }, activeCharacter.reloadTime);
        }
    }

    //update/change speak line
    function rollSpeak() {
        $("#speak").attr("src", "audio/" + activeCharacter.name + "/speak" + Math.floor(Math.random() * 3) + ".mp3");
    }

    //update sound/cursor/bullethole
    function setValue() {
		$("#cursor").attr("src", "img/cursors/" + activeCharacter.name + ".png");
        $("#hud").attr("src", "img/hud/" + activeCharacter.name + ".png");
		$("#draw").attr("src", "audio/" + activeCharacter.name + "/gundraw.mp3");
        $("#gunshot").attr("src", "audio/" + activeCharacter.name + "/shoot.mp3");
        $("#gunshot2").attr("src", "audio/" + activeCharacter.name + "/shoot.mp3");
        $("#reload").attr("src", "audio/" + activeCharacter.name + "/reload.mp3");
        $("#no-ammo").attr("src", "audio/" + activeCharacter.name + "/noammo.mp3");
        $("#no-ammo2").attr("src", "audio/" + activeCharacter.name + "/noammo.mp3");
        $("#no").attr("src", "audio/" + activeCharacter.name + "/no.mp3");
        rollSpeak();
    }

    //update bullethole
    function updateBullet() {
        setTimeout(function () { $(".bullet").css("background", "url(img/bulletholes/" + activeCharacter.name + ".png)"); }, activeCharacter.bulletholeDelay);
    }

    //full ammo function
    function fullAmmo() {
        ammoLeft = activeCharacter.ammoLeft;
        ammoCarried = activeCharacter.ammoCarried;
        totalAmmo = ammoLeft + ammoCarried;
        updateText();
        rollSpeak();
        alreadyOnLastBullet = false;
    }

    //cursor tracking
    $(document).mousemove(function (e) {
        xPosition = e.pageX;
        yPosition = e.pageY;
        $("#cursor").css({left: xPosition - 74, top: yPosition - 74});
    });

    //check for headshot
    $(".headshot > div").hover(function () {headCheck = true; }, function () {headCheck = false; });

    //reload line animation
    function reloadLine() {
        $(".background").one("mousedown", function () {
            $("<div class='reload-line'><p>Hit 'R' to reload</p></div>").appendTo(".ammo-info");
        });
        //run only once
        reloadLine = function () {};
    }

    /***********************************/

    //open game screen
    function openGameScreen() {
        noShooting = false;
        setValue();
        fullAmmo();
        $(".character-selection").hide();
        setTimeout(function () { playAudio($("#draw")[0]); }, 300);
        characterScreen = false;
        //in case random is selected
        $("#random").removeClass("active");
        if (activeCharacter !== character.pyro && activeCharacter !== character.heavy && activeCharacter !== character.sniper) {
            reloadLine();
        }
        if (activeCharacter === character.pyro || activeCharacter === character.heavy) {
            $(".total-ammo").css("opacity", 0);
        } else {
            $(".total-ammo").css("opacity", 1);
        }
		oldHighScore = getCookie(activeCharacter.name + "highscore");
		pointCount = 0;
    }

    //open character choice screen
    function openCharacterScreen() {
        $(".character-selection").show();
        characterScreen = true;
        $(".bullet").hide();
        $("#crate").hide();
        $(".reload-line").remove();
		$("#cursor").attr("src", ""); //remove cursor to prevent character screen lag
		$("#hud").attr("src", ""); //remove old HUD to prevent it appearing before new one loads
		$(".highscore-text").removeClass("highscore-animate");
    }

    /***********************************/

    //continue button show/hide & continue
    $(".continue-button").hover(function () {$(this).css("opacity", "1"); }, function () {$(this).css("opacity", "0"); });

    $(".load-continue-button").click(function () {
        $(this).parent().empty();
        playAudio($("#button")[0]);
		$(".highscore-list").show();
    });

    $(".map-continue-button").click(function () {
		$(this).parent().empty();
        playAudio($("#button")[0]);
        $(".flashing").remove();
		$(".highscore-list").remove();
        characterScreen = true;
    });

    //select screen continue
    $(".select-continue-button, .choose-character > div").click(function () {
        openGameScreen();
    });

    /***********************************/

    //shoot and reload functions (and more)
    function shootGun() {
        if (totalAmmo <= 0) {
            totalAmmo--;
            noShooting = true;
            setTimeout(function () {noShooting = false; }, activeCharacter.bulletDelay);
            if (totalAmmo % 2) {
                playAudio($("#no-ammo")[0]);
            } else {
                playAudio($("#no-ammo2")[0]);
            }
            if (totalAmmo <= -3) {
                setTimeout(function () {playAudio($("#no")[0]); }, 50);
            }
        } else {
            ammoLeft--;
            totalAmmo--;
			pointCount += activeCharacter.points;
            //prevent audio delay by flipping between audio tags
            if (totalAmmo % 2) {
                playAudio($("#gunshot")[0]);
            } else {
                playAudio($("#gunshot2")[0]);
            }
            noShooting = true;
            setTimeout(function () {noShooting = false; }, activeCharacter.bulletDelay);
            if (ammoLeft <= 0) {
                clearInterval(mouseHeldDown);
                setTimeout(function () {reloading(); }, activeCharacter.bulletDelay);
            }
			//check if new high score
			if (pointCount > oldHighScore) {
				setCookie(activeCharacter.name + "highscore", pointCount, 365);
				$(".highscore-text").addClass("highscore-animate");
			}
        }
    }

    //on/after final shot
    function onLastBullet() {
        if (totalAmmo === 0 && alreadyOnLastBullet === false) {
            alreadyOnLastBullet = true;
            if (activeCharacter === character.heavy) {
                playAudio($("#wind-down")[0]);
            }
            setTimeout(function () {playAudio($("#speak")[0]); }, activeCharacter.bulletDelay);
            var currentCharacter = activeCharacter;
            setTimeout(function () { if (currentCharacter === activeCharacter) {$("#crate").fadeIn(600); } }, 2000);
        }
    }

    //random circle bullet spread
    function xSpread() {
        return Math.floor(Math.random() * (2 * activeCharacter.radius) - activeCharacter.radius); //random x-value within spread area
    }

    function ySpread(x) {
        var y = Math.sqrt((Math.pow(activeCharacter.radius, 2)) - Math.pow(x, 2)); //y-value = hypotenouse^2 minus x-value^2
        return Math.floor(Math.random() * (2 * y) - y); //random y-value (within set limits based on x-value) within spread area
    }

    //shooting
    function shooting() {
        if (noShooting === false) {
            //cursor animation
            $("#cursor").stop().animate({ width: "168px", height: "168px", left: "-=10px", top: "-=10px"}, 0).animate({ width: "148px", height: "148px", left: "+=10px", top: "+=10px"}, 80);
            //bullet placement & fade-away
            if (totalAmmo > 0) {
                //bullet spread placements (45px and 81px account for .bullet image-size centering)
                var x = xSpread();
                $("<div class='bullet fade-out'></div>").css({left: xPosition - (45 + x), top: yPosition - (81 + ySpread(x))}).appendTo(".background");
                //bullet fade-away
                setTimeout(function () { $(".fade-out:first").removeClass("fade-out").fadeOut(600, function () {$(this).remove(); }); }, 20000);
                //headshot
                if (headCheck === true && (activeCharacter === character.spy || activeCharacter === character.sniper)) {
                    $("<p class='crit'>Critical<br>Hit!!!</p>").appendTo(".headshot").css({left: xPosition - 56, top: yPosition - 100});
                    setTimeout(function () { $(".crit:first").fadeOut(340, function () {$(this).remove(); }); }, 430);
                    setTimeout(function () { playAudio($("#headshot")[0]); }, 200);
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
    function removeActive() {
        $(".active").removeClass("active");
        playAudio($("#hover")[0]);
    }

    function chooseScout() {
        removeActive();
        activeCharacter = character.scout;
        $("#scout").addClass("active");
    }

    function chooseSoldier() {
        removeActive();
        activeCharacter = character.soldier;
        $("#soldier").addClass("active");
    }

    function choosePyro() {
        removeActive();
        activeCharacter = character.pyro;
        $("#pyro").addClass("active");
    }

    function chooseDemoman() {
        removeActive();
        activeCharacter = character.demoman;
        $("#demoman").addClass("active");
    }

    function chooseHeavy() {
        removeActive();
        activeCharacter = character.heavy;
        $("#heavy").addClass("active");
    }

    function chooseEngy() {
        removeActive();
        activeCharacter = character.engy;
        $("#engy").addClass("active");
    }

    function chooseMedic() {
        removeActive();
        activeCharacter = character.medic;
        $("#medic").addClass("active");
    }

    function chooseSniper() {
        removeActive();
        activeCharacter = character.sniper;
        $("#sniper").addClass("active");
    }

    function chooseSpy() {
        removeActive();
        activeCharacter = character.spy;
        $("#spy").addClass("active");
    }

    function chooseRandom() {
        var classList = [chooseScout, chooseSoldier, choosePyro, chooseDemoman, chooseHeavy, chooseEngy, chooseMedic, chooseSniper, chooseSpy],
            oldCharacter = activeCharacter;
		//prevent random from picking previous character again
        while (activeCharacter === oldCharacter) {
            classList[Math.floor(Math.random() * 9)]();
        }
        $("#random").addClass("active");
    }

    $(".scout").mouseenter(function () {chooseScout(); });
    $(".soldier").mouseenter(function () {chooseSoldier(); });
    $(".pyro").mouseenter(function () {choosePyro(); });
    $(".demoman").mouseenter(function () {chooseDemoman(); });
    $(".heavy").mouseenter(function () {chooseHeavy(); });
    $(".engy").mouseenter(function () {chooseEngy(); });
    $(".medic").mouseenter(function () {chooseMedic(); });
    $(".sniper").mouseenter(function () {chooseSniper(); });
    $(".spy").mouseenter(function () {chooseSpy(); });
    $(".random").mouseenter(function () {chooseRandom(); });

    //chooses class on double keydown
    function chooseClassKey(activeClass, chooseClass) {
        if ($(activeClass).hasClass("active")) {
            openGameScreen();
        } else {
            chooseClass();
        }
    }

    //choose class (key)
    $(document).keydown(function (key) {
        if (characterScreen === true) {
            switch (parseInt(key.which, 10)) {
            case 49:
                chooseClassKey("#scout", chooseScout);
                break;
            case 50:
                chooseClassKey("#soldier", chooseSoldier);
                break;
            case 51:
                chooseClassKey("#pyro", choosePyro);
                break;
            case 52:
                chooseClassKey("#demoman", chooseDemoman);
                break;
            case 53:
                chooseClassKey("#heavy", chooseHeavy);
                break;
            case 54:
                chooseClassKey("#engy", chooseEngy);
                break;
            case 55:
                chooseClassKey("#medic", chooseMedic);
                break;
            case 56:
                chooseClassKey("#sniper", chooseSniper);
                break;
            case 57:
                chooseClassKey("#spy", chooseSpy);
                break;
            case 48:
                chooseClassKey("#random", chooseRandom);
                break;
            case 13:
                openGameScreen();
                break;
            }
        } else if (characterScreen === false) {
            switch (parseInt(key.which, 10)) {
            case 188:
                openCharacterScreen();
                break;
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
            if (activeCharacter === character.heavy && characterScreen === false) {
                playAudio($("#wind-up")[0]);
            } else {
                shooting();
            }
            clearInterval(mouseHeldDown);
            mouseHeldDown = setInterval(shooting, activeCharacter.bulletDelay + 50);
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
        if (activeCharacter === character.heavy && characterScreen === false) {
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
            setTimeout(function () {playAudio($("#reload")[0]); }, 600);
            setTimeout(function () {fullAmmo(); noShooting = false; }, 600 + activeCharacter.reloadTime);
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
    $("#crate, .class-button").hover(function () {$("#cursor").toggle(); });

    //disable right click
    $(document).on("contextmenu", function () {
        return false;
    });
	
	/****************Preload images*******************/

	//preload images after start screen loads
	function imagePreloader() {
		var imageList = [
			//cursors
			"img/cursors/scout.png",
			"img/cursors/soldier.png",
			"img/cursors/pyro.png",
			"img/cursors/demoman.png",
			"img/cursors/heavy.png",
			"img/cursors/engy.png",
			"img/cursors/medic.png",
			"img/cursors/sniper.png",
			"img/cursors/spy.png",
			//bulletholes
			"img/bulletholes/scout.png",
			"img/bulletholes/soldier.png",
			"img/bulletholes/pyro.png",
			"img/bulletholes/demoman.png",
			"img/bulletholes/heavy.png",
			"img/bulletholes/engy.png",
			"img/bulletholes/medic.png",
			"img/bulletholes/sniper.png",
			"img/bulletholes/spy.png",
			//HUDs
			"img/hud/scout.png",
			"img/hud/soldier.png",
			"img/hud/pyro.png",
			"img/hud/demoman.png",
			"img/hud/heavy.png",
			"img/hud/engy.png",
			"img/hud/medic.png",
			"img/hud/sniper.png",
			"img/hud/spy.png"
		];
		var newImage = new Array();
		var i;
		for (i = 0; i < imageList.length; i++) {
			newImage[i] = new Image();
			newImage[i].src = imageList[i];
		}
	}
	
	/**********High Score cookie**********/
	
	function setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
		var expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires;
	}

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		var i;
		for(i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') c = c.substring(1);
			if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
		}
		return "";
	}
});