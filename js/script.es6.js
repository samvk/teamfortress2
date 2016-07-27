/*jshint esversion: 6*/
/*global $, document, Image, window, setTimeout, setInterval, clearInterval*/
$(document).ready(function () {
    "use strict";

    /************** Character Class **************/
    class Character {
        constructor(name, ammoLeft, ammoCarried, bulletholeDelay, radius, bulletDelay, reloadTime, canHeadshot, points) {
            this.name = name;
            this.ammoLeft = ammoLeft;
            this.ammoCarried = ammoCarried;
            this.bulletholeDelay = bulletholeDelay;
            this.radius = radius;
            this.bulletDelay = bulletDelay;
            this.reloadTime = reloadTime;
            this.canHeadshot = canHeadshot;
            this.points = points;
        }

        setValues() {
            $(".cursor, .character-icon, .character-screen").attr("data-char", activeChar.name);
            $("#gundraw").attr("src", `audio/${this.name}/gundraw.mp3`);
            $("#gunshot0, #gunshot1").attr("src", `audio/${this.name}/gunshot.mp3`);
            $("#reload").attr("src", `audio/${this.name}/reload.mp3`);
            $("#no-ammo0, #no-ammo1").attr("src", `audio/${this.name}/no-ammo.mp3`);
            $("#no").attr("src", `audio/${this.name}/no.mp3`);
        }

        setSpeak() {
            const randomLine = Math.floor(Math.random() * 3);
            $("#speak").attr("src", `audio/${this.name}/speak${randomLine}.mp3`);
        }
    }

    const char = {
        scout: new Character("scout", 6, 32, 0, 8, 550, 1400, false, 10),
        soldier: new Character("soldier", 4, 20, 850, 0, 2000, 2100, false, 20),
        pyro: new Character("pyro", 200, 0, 0, 0, 100, 300, false, 2),
        demoman: new Character("demoman", 4, 16, 540, 8, 1450, 2050, false, 20),
        heavy: new Character("heavy", 20, 0, 0, 30, 100, 1650, false, 2),
        engy: new Character("engy", 6, 32, 0, 8, 880, 1600, false, 10),
        medic: new Character("medic", 40, 150, 0, 4, 120, 1200, false, 2),
        sniper: new Character("sniper", 1, 25, 0, 0, 500, 1200, true, 10),
        spy: new Character("spy", 2, 3, 0, 3, 770, 1890, true, 4)
    };

    /*************** High Score cookies **************/
    class Cookie {
        constructor(cname) {
            this.cname = cname;
        }

        getCookie() {
            const name = `${this.cname}=`;
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === " ") {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }

        setCookie(cvalue, exdays = 365) {
            const d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            const expires = `expires=${d.toUTCString()}`;
            document.cookie = `${this.cname}=${cvalue}; ${expires}`;
        }
    }

    /****************** Audio settings *****************/
    function playAudio(audioID, delay = 0) {
        setTimeout(function () {
            audioID.currentTime = 0;
            audioID.volume = 0.1;
            audioID.play();
        }, delay);
    }

    /*************** TF2 global variables ***************/
    //pull character names from Character class
    const charNames = (function () {
        let nameArray = [];
        for (let name in char) {
            nameArray.push(name);
        }
        return nameArray;
    }());

    let activeChar = char.heavy,

        characterScreenOpen = null,

        mouseHeldDown,

        xPosition,
        yPosition,

        headHovering,

        highscore = [],
        pointCount,
        oldHighscore;
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    /*************** Shooting and Reload functions *****************/

    //reload functions
    let alreadyOnLastBullet = false,
        noShooting = true,
        ammoLeft = activeChar.ammoLeft,
        ammoCarried = activeChar.ammoCarried,
        totalAmmo = ammoLeft + ammoCarried;

    const updateAmmoText = function () {
        $(".ammo").text(ammoLeft);
        $(".total-ammo").text(ammoCarried);
    };

    //////////////////////

    const reloading = (function () {

        const reloadAmmo = function () {
            if (totalAmmo >= activeChar.ammoLeft) {
                ammoCarried = ammoCarried - (activeChar.ammoLeft - ammoLeft);
                ammoLeft = activeChar.ammoLeft;
            } else {
                ammoLeft = ammoLeft + ammoCarried;
                ammoCarried = 0;
            }
        };

        return {
            init: function () {
                if (ammoLeft !== activeChar.ammoLeft && ammoCarried !== 0 && !noShooting) {
                    playAudio($("#reload")[0]);
                    noShooting = true;
                    clearInterval(mouseHeldDown);
                    setTimeout(function () {
                        noShooting = false;
                        reloadAmmo();
                        updateAmmoText();
                    }, activeChar.reloadTime);
                }
            }
        };
    }());

    const fullAmmo = (function () {
        return {
            init: function () {
                ammoLeft = activeChar.ammoLeft;
                ammoCarried = activeChar.ammoCarried;
                totalAmmo = ammoLeft + ammoCarried;
                updateAmmoText();
                alreadyOnLastBullet = false;
                noShooting = false;
                //reset spoken line when out of ammo
                activeChar.setSpeak();
            }
        };
    }());

    const reloadingCrate = (function () {
        return {
            init: function () {
                noShooting = true;
                playAudio($("#metal")[0]);
                $(".crate").removeClass("is-visible");
                playAudio($("#reload")[0], 600);
                setTimeout(() => {
                    fullAmmo.init();
                }, 600 + activeChar.reloadTime);
            }
        };
    }());

    const shooting = (function () {

        const cursorAnim = function () {
            $(".cursor").addClass("is-shooting").one("webkitTransitionEnd otransitionend msTransitionEnd transitionend", function () {
                $(this).removeClass("is-shooting");
            });
        };

        //bullet animation
        const bulletSpread = {
            x: () => Math.floor(Math.random() * (2 * activeChar.radius) - activeChar.radius), //random x-value within spread area
            y: x => {
                const y = Math.sqrt(Math.pow(activeChar.radius, 2) - Math.pow(x, 2)); //distance formula
                return Math.floor(Math.random() * (2 * y) - y); //random y-value (limited based on x-value) within spread area
            }
        };

        const setBullethole = function () {
            if (totalAmmo > 0) {
                const x = bulletSpread.x();
                $(`<li class="bullethole" data-char=${activeChar.name}></li>`).appendTo(".bulletholes").css({
                    left: xPosition - x,
                    top: yPosition - bulletSpread.y(x)
                }).delay(activeChar.bulletholeDelay).fadeIn(0);
                //headshot
                if (headHovering && activeChar.canHeadshot) {
                    $(`<p class="crit">Critical<br>Hit!!!</p>`).appendTo(".headshots").css({
                        left: xPosition,
                        top: yPosition
                    });
                    playAudio($("#headshot")[0], 200);
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
                playAudio($(`#no-ammo${Math.abs(totalAmmo) % 2}`)[0]); //rotating audio to prevent lag
                if (totalAmmo <= -3) {
                    playAudio($("#no")[0], 50);
                }
            } else {
                ammoLeft--;
                totalAmmo--;
                noShooting = true;
                pointCount += activeChar.points;
                playAudio($(`#gunshot${Math.abs(totalAmmo) % 2}`)[0]); //rotating audio to prevent lag
                setTimeout(function () {
                    noShooting = false;
                }, activeChar.bulletDelay);
                if (ammoLeft <= 0) {
                    clearInterval(mouseHeldDown);
                    setTimeout(function () {
                        reloading.init();
                    }, activeChar.bulletDelay);
                }
                //check if new high score
                if (pointCount > oldHighscore) {
                    let charName = activeChar.name;
                    highscore[charName].setCookie(pointCount);
                    //don't flash "new highscore" on first play
                    if (oldHighscore !== "") {
                        $(".new-highscore--hud").addClass("is-visible");
                    }
                }
            }
        };

        const onLastBullet = function () {
            if (totalAmmo === 0 && !alreadyOnLastBullet) {
                alreadyOnLastBullet = true;
                if (activeChar === char.heavy) {
                    playAudio($("#wind-down")[0]);
                }
                playAudio($("#speak")[0], activeChar.bulletDelay);
                const currentCharacter = activeChar;
                $(".crate").addClass("is-visible");
            }
        };

        const reloadLine = function () {
            if (activeChar.ammoCarried !== 0) { //if character can reload
                $(".reload-line").addClass("is-visible");
            }
        };

        return {
            init: function () {
                if (!noShooting) {
                    cursorAnim();
                    setBullethole();
                    shootGun();
                    onLastBullet();
                    updateAmmoText();
                    reloadLine();
                }
            }
        };
    }());

    //////////////////////

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**************************************************************/
    /****************** Gameplay (DOM Events) *********************/
    /**************************************************************/

	/***************** Load events *******************/
    $(window).load(function () {
        //hide loadscreen
        $(".loading").remove();

        //set highscore list
        for (let charName of charNames) {
            //find each classes high score (if it exists)
            highscore[charName] = new Cookie(`${charName}highscore`);
            const highscoreNumber = highscore[charName].getCookie() || "0";
            $(`[data-highscore=${charName}]`).text(highscoreNumber);
        }

        //set last played date
        const lastPlayed = new Cookie("lastPlayed");
        const lastPlayedDate = lastPlayed.getCookie();
        const today = new Date().toDateString();
        let lastPlayedMessage = "";
        if (lastPlayedDate === today) {
            lastPlayedMessage = "Today";
        } else {
            lastPlayedMessage = lastPlayedDate || "Welcome new user!";
        }
        $(".last-played-message").text(lastPlayedMessage);
        lastPlayed.setCookie(today);
    });

	/*************** Game buttons ********************/
    $("button").mousedown(function () {
        playAudio($("#button")[0]);
    });

    //menu screens buttons
    $(".welcome-screen__button, .map-screen__button").click(function () {
        $(this).parent().remove();
    });

	$(".map-screen__button").click(function () {
		characterScreenOpen = true;
	});

	//character screen button
	$(".character-screen__button, [data-choose-char]").click(function () {
        //set character values
        let charName = activeChar.name;
        activeChar.setValues();
        fullAmmo.init();

        //reset gamescreen
        $(".bullethole, .crit, .reload-line.is-visible").remove();
        $(".crate, .new-highscore--hud").removeClass("is-visible");
        $(".total-ammo").css("opacity", activeChar.ammoCarried && 1); //hide total-ammo if 0

        //set highscore
        oldHighscore = highscore[charName].getCookie();
        pointCount = 0;

        //open gamescreen
        characterScreenOpen = false;
        $(".character-screen").hide();
        playAudio($("#gundraw")[0], 300);
	});

    //enter fullscreen
    $(".go-fullscreen").click(function () {
        const b = document.body;
        (b.requestFullscreen || b.webkitRequestFullscreen || b.mozRequestFullScreen || b.msRequestFullscreen || function(){}).call(b);
    });

	/*********** Choose character screen (+ keyboard events) **************/
    $("[data-choose-char]").mouseenter(function () {
        const choice = $(this).data("choose-char");

        //Choose character (recursive for "random")
        (function chooseChar (choice) {
            if (choice === "random") {
                //prevent random from picking previous character again
                const oldChar = activeChar;
                while (activeChar === oldChar) {
                    const randomChoice = Math.floor(Math.random() * charNames.length);
                    chooseChar([charNames[randomChoice]]);
                }
                $(".character-screen").attr("data-char", "random");
            } else {
                playAudio($("#hover")[0]);
                activeChar = char[choice];
                $(".character-screen").attr("data-char", activeChar.name);
            }
        }(choice));
    });

    //choose class (key) and other keys
    $(document).keydown(function (e) {
        const key = parseInt(e.which, 10);

        if (characterScreenOpen) {
            switch (key) {
                case 49: //"1"
                case 50: //"2"
                case 51: //"3"
                case 52: //"4"
                case 53: //"5"
                case 54: //"6"
                case 55: //"7"
                case 56: //"8"
                case 57: //"9"
                case 48: //"0"
                    const choice = charNames[key - 49] || "random"; //choose corresponding character name (minus keycode difference)
                    $(`[data-choose-char=${choice}]`).trigger("mouseenter");
                    break;
                case 13: //"enter"
                    $(".character-screen__button").trigger("click");
                    break;
            }
        } else if (characterScreenOpen === false) {
            switch (key) {
                case 82: //"r"
                    reloading.init();
                    break;
                case 188: //","
                    $(".change-char__button").trigger("mousedown").trigger("click");
                    break;
                case 70: //"f"
                    $(".go-fullscreen").trigger("mousedown").trigger("click");
                    break;
            }
        }
    });

    /*************** Shooting and crosshair (Gun events) ********************/
	//cursor tracking
	$(document).mousemove(function (e) {
		xPosition = e.pageX;
		yPosition = e.pageY - $(".gamescreen").offset().top;

		$(".cursor").finish().css({
			top: yPosition,
			left: xPosition
		});
	});
	
	//check for headshot
	$("[data-headshot]").hover(function () {
        headHovering = !headHovering; //toggle headHovering truthiness
	});

    //shooting
    $(".gamescreen").mousedown(function (e) {
        if (e.which === 1) { //left-click
            activeChar === char.heavy ? playAudio($("#wind-up")[0]) : shooting.init();
            clearInterval(mouseHeldDown);
            mouseHeldDown = setInterval(shooting.init, activeChar.bulletDelay + 50);
        }
    }).mouseup(function (e) {
        if (e.which === 1) { //left-click
            clearInterval(mouseHeldDown);
            if (activeChar === char.heavy) {
                playAudio($("#wind-down")[0]);
            }
        }
    }).mouseleave(function () {
        clearInterval(mouseHeldDown);
    });

	$(document).blur(function () {
		clearInterval(mouseHeldDown);
	});

	/*************** Misc. game screen popups ********************/
	//hide crosshair
	$(".crate, .change-char__button, .fullscreen-icon").on("mousedown mouseup click", function (e) {
        e.stopPropagation();
    }).hover(function () {
		$(".cursor").toggle().removeClass("is-shooting");
	});

	//ammo crate resupply
	$(".crate").click(function (e) {
        reloadingCrate.init();
	});

	//change classes button
	$(".change-char__button").click(function (e) {
        $(".character-screen").show();
        characterScreenOpen = true;
	});

	//disable right-click
	$(document).on("contextmenu", () => false);
});