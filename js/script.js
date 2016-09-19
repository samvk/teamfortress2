/* Generated by Babel */
/*jshint esversion: 6*/
/*global $, document, Image, window, setTimeout, setInterval, clearInterval*/

"use strict";

/************** Character Class **************/

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Character = (function () {
    function Character(name, clipSize, ammoCarried, bulletholeDelay, radius, bulletDelay, reloadTime, canHeadshot, points) {
        _classCallCheck(this, Character);

        this.name = name;
        this.clipSize = clipSize;
        this.ammoCarried = ammoCarried;
        this.bulletholeDelay = bulletholeDelay;
        this.radius = radius;
        this.bulletDelay = bulletDelay;
        this.reloadTime = reloadTime;
        this.canHeadshot = canHeadshot;
        this.points = points;
    }

    _createClass(Character, [{
        key: "setValues",
        value: function setValues() {
            $(".cursor, .character-icon, .character-screen").attr("data-char", activeChar.name);
            $("#gundraw").attr("src", "audio/" + this.name + "/gundraw.mp3");
            $("#gunshot0, #gunshot1").attr("src", "audio/" + this.name + "/gunshot.mp3");
            $("#reload").attr("src", "audio/" + this.name + "/reload.mp3");
            $("#no-ammo0, #no-ammo1").attr("src", "audio/" + this.name + "/no-ammo.mp3");
            $("#no").attr("src", "audio/" + this.name + "/no.mp3");
        }
    }, {
        key: "setSpeak",
        value: function setSpeak() {
            var randomLine = Math.floor(Math.random() * 3);
            $("#speak").attr("src", "audio/" + this.name + "/speak" + randomLine + ".mp3");
        }
    }]);

    return Character;
})();

var char = {
    scout: new Character("scout", 6, 32, 0, 0.4, 550, 1400, false, 10),
    soldier: new Character("soldier", 4, 20, 850, 0, 2000, 2100, false, 20),
    pyro: new Character("pyro", 200, 0, 0, 0, 100, 300, false, 2),
    demoman: new Character("demoman", 4, 16, 540, 0.4, 1450, 2050, false, 20),
    heavy: new Character("heavy", 200, 0, 0, 1.5, 100, 1650, false, 2),
    engy: new Character("engy", 6, 32, 0, 0.4, 880, 1600, false, 10),
    medic: new Character("medic", 40, 150, 0, 0.2, 120, 1200, false, 2),
    sniper: new Character("sniper", 1, 25, 0, 0, 500, 1200, true, 10),
    spy: new Character("spy", 6, 2, 0, 0.2, 770, 1890, true, 4)
};

/*************** High Score cookies **************/

var Cookie = (function () {
    function Cookie(cname) {
        _classCallCheck(this, Cookie);

        this.cname = cname;
    }

    /****************** Audio settings *****************/

    _createClass(Cookie, [{
        key: "getCookie",
        value: function getCookie() {
            var name = this.cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === " ") {
                    c = c.substring(1);
                }
                if (c.indexOf(name) === 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        }
    }, {
        key: "setCookie",
        value: function setCookie(cvalue) {
            var exdays = arguments.length <= 1 || arguments[1] === undefined ? 365 : arguments[1];

            var d = new Date();
            d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
            var expires = "expires=" + d.toUTCString();
            document.cookie = this.cname + "=" + cvalue + "; " + expires;
        }
    }]);

    return Cookie;
})();

function playAudio(audioID) {
    var delay = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    setTimeout(function () {
        audioID.currentTime = 0;
        audioID.volume = 0.1;
        audioID.play();
    }, delay);
}

/*************** TF2 global variables ***************/
//pull character names from Character class
var charNames = (function () {
    var nameArray = [];
    for (var _name in char) {
        nameArray.push(_name);
    }
    return nameArray;
})();

var activeChar = char.scout,
    screenOpen = "menu-screen",
    mouseHeldDown = undefined,
    xPosition = undefined,
    yPosition = undefined,
    headHovering = undefined,
    highscore = [],
    pointCount = undefined,
    oldHighscore = undefined;

/*************** Shooting and Reload functions *****************/

var GUN = (function () {
    //shooting variables
    var noShooting = true,
        clipLeft = undefined,
        ammoCarriedLeft = undefined,
        totalAmmoLeft = undefined;

    function updateAmmoText() {
        $(".clip").text(clipLeft);
        $(".ammo-carried").text(ammoCarriedLeft);
    }

    return {
        resetAmmo: function resetAmmo() {
            noShooting = false; //enable shooting

            //reset variables
            clipLeft = activeChar.clipSize;
            ammoCarriedLeft = activeChar.ammoCarried;
            totalAmmoLeft = clipLeft + ammoCarriedLeft;

            updateAmmoText(); //update text

            activeChar.setSpeak(); //reset spoken line when out of ammo
        },

        reloading: function reloading() {
            var canReload = clipLeft !== activeChar.clipSize && ammoCarriedLeft !== 0 && !noShooting; //non-full clip && carrying more ammo && shooting enabled

            function loadClip() {
                if (totalAmmoLeft >= activeChar.clipSize) {
                    ammoCarriedLeft = ammoCarriedLeft - (activeChar.clipSize - clipLeft);
                    clipLeft = activeChar.clipSize;
                } else {
                    clipLeft = clipLeft + ammoCarriedLeft;
                    ammoCarriedLeft = 0;
                }
            }

            if (canReload) {
                //stop and disable shooting
                clearInterval(mouseHeldDown);
                noShooting = true;

                //reenable shooting
                setTimeout(function () {
                    loadClip();
                    updateAmmoText();
                    noShooting = false;
                }, activeChar.reloadTime);

                //audio
                playAudio($("#reload")[0]);
            }
        },

        shooting: function shooting() {
            function cursorAnim() {
                $(".cursor").addClass("is-shooting").one("webkitTransitionEnd otransitionend msTransitionEnd transitionend", function () {
                    $(this).removeClass("is-shooting");
                });
            }

            function prepBullethole() {
                var bulletSpread = {
                    x: function x() {
                        return Math.random() * (2 * activeChar.radius) - activeChar.radius;
                    }, //random x-value within spread area
                    y: function y(x) {
                        var y = Math.sqrt(Math.pow(activeChar.radius, 2) - Math.pow(x, 2)); //distance formula
                        return (Math.random() * (2 * y) - y) * (16 / 9); //random y-value (limited based on x-value) within spread area (adjusted to screen ratio)
                    }
                };

                if (totalAmmoLeft > 0) {
                    var x = bulletSpread.x(),
                        y = bulletSpread.y(x);
                    $("<li class=\"bullethole\" data-char=" + activeChar.name + "></li>").appendTo(".bulletholes").css({
                        left: "calc(" + xPosition + "px - " + x + "%)",
                        top: "calc(" + yPosition + "px - " + y + "%)"
                    }).delay(activeChar.bulletholeDelay).fadeIn(0);
                    //headshot
                    if (activeChar.canHeadshot && headHovering) {
                        $("<p class=\"crit\">Critical<br>Hit!!!</p>").appendTo(".headshots").css({
                            left: xPosition,
                            top: yPosition
                        });
                        pointCount += 4; //bonus points
                        playAudio($("#headshot")[0], 200); //audio
                    }
                }
            }

            function pullTrigger() {
                totalAmmoLeft--;

                //disable/reenable shooting
                noShooting = true;
                setTimeout(function () {
                    noShooting = false;
                }, activeChar.bulletDelay);

                //audio
                var audio = totalAmmoLeft < 0 ? "no-ammo" : "gunshot";
                playAudio($("#" + audio + Math.abs(totalAmmoLeft) % 2)[0]); //rotating audio to prevent lag
                if (totalAmmoLeft < -2) {
                    playAudio($("#no")[0], 50);
                }

                //shooting (if clip loaded)
                if (totalAmmoLeft >= 0) {
                    clipLeft--;
                    pointCount += activeChar.points; //update pointscore

                    //reload on empty
                    if (clipLeft <= 0) {
                        clearInterval(mouseHeldDown);
                        setTimeout(function () {
                            GUN.reloading();
                        }, activeChar.bulletDelay);
                    }

                    //check for new high score
                    if (pointCount > oldHighscore) {
                        highscore[activeChar.name].setCookie(pointCount);
                        if (oldHighscore !== "") {
                            $(".new-highscore--hud").addClass("is-visible");
                        } //don't flash "new highscore" on first play
                    }
                }
            }

            function onLastBulletCheck() {
                if (totalAmmoLeft === 0) {
                    $(".crate").addClass("is-visible");

                    //audio
                    playAudio($("#speak")[0], 500);
                    if (activeChar === char.heavy) {
                        playAudio($("#wind-down")[0]);
                    }
                }
            }

            function showReloadLine() {
                if (activeChar.ammoCarried !== 0) {
                    $(".reload-line").addClass("is-visible");
                } //if character can reload
            }

            //init
            if (!noShooting) {
                cursorAnim();
                prepBullethole();
                pullTrigger();
                onLastBulletCheck();
                showReloadLine();
                updateAmmoText();
            }
        }
    };
})();

/**************************************************************/
/****************** Gameplay (DOM Events) *********************/
/**************************************************************/

$(document).ready(function () {

    /***************** Load events *******************/
    $(window).load(function () {
        //set highscore list
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = charNames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var charName = _step.value;

                //find each classes high score (if it exists)
                highscore[charName] = new Cookie(charName + "highscore");
                var highscoreNumber = highscore[charName].getCookie() || "0";
                $("[data-highscore=" + charName + "]").text(highscoreNumber);
            }

            //set last played date
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator["return"]) {
                    _iterator["return"]();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        var lastPlayed = new Cookie("lastPlayed");
        var lastPlayedDate = lastPlayed.getCookie();
        var today = new Date().toDateString();
        var lastPlayedMessage = "";
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
        screenOpen = "character-screen";
    });

    //character screen button
    $(".character-screen__button, [data-choose-char]").click(function () {
        //set character values
        activeChar.setValues();
        GUN.resetAmmo();

        //reset gamescreen
        $(".bullethole, .crit, .reload-line.is-visible").remove();
        $(".crate, .new-highscore--hud").removeClass("is-visible");
        $(".ammo-carried").css("opacity", activeChar.ammoCarried && 1); //hide ammo-carried if 0

        //set highscore
        oldHighscore = highscore[activeChar.name].getCookie();
        pointCount = 0;

        //open gamescreen
        screenOpen = "gamescreen";
        $(".character-screen").hide();
        playAudio($("#gundraw")[0], 300);
    });

    //enter fullscreen
    $(".go-fullscreen").click(function () {
        var b = document.body;
        (b.requestFullscreen || b.webkitRequestFullscreen || b.mozRequestFullScreen || b.msRequestFullscreen || function () {}).call(b);
    });

    /*********** Choose character screen (+ keyboard events) **************/
    $("[data-choose-char]").mouseenter(function () {
        var choice = $(this).data("choose-char");

        //Choose character (recursive for "random")
        (function chooseChar(choice) {
            if (choice === "random") {
                //prevent random from picking previous character again
                var oldChar = activeChar;
                while (activeChar === oldChar) {
                    var randomChoice = Math.floor(Math.random() * charNames.length);
                    chooseChar([charNames[randomChoice]]);
                }
                $(".character-screen").attr("data-char", "random");
            } else {
                activeChar = char[choice];
                $(".character-screen").attr("data-char", activeChar.name);
                playAudio($("#hover")[0]);
            }
        })(choice);
    });

    //choose class (key) and other keys
    $(document).keydown(function (e) {
        var key = parseInt(e.which, 10);

        if (screenOpen === "menu-screen" || screenOpen === "character-screen") {
            switch (key) {
                case 13:
                    //"enter"
                    $("button").first().focus().trigger("mousedown").trigger("click");
                    break;
            }
        }
        if (screenOpen === "character-screen") {
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
                case 48:
                    //"0"
                    var choice = charNames[key - 49] || "random"; //choose corresponding character name (minus keycode difference)
                    $("[data-choose-char=" + choice + "]").trigger("mouseenter");
                    break;
            }
        } else if (screenOpen === "gamescreen") {
            switch (key) {
                case 82:
                    //"r"
                    GUN.reloading();
                    break;
                case 188:
                    //","
                    $(".change-char__button").trigger("mousedown").trigger("click");
                    break;
                case 70:
                    //"f"
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
        if (e.which === 1) {
            //left-click
            activeChar === char.heavy ? playAudio($("#wind-up")[0]) : GUN.shooting();
            clearInterval(mouseHeldDown);
            mouseHeldDown = setInterval(GUN.shooting, activeChar.bulletDelay + 50);
        }
    }).mouseup(function (e) {
        if (e.which === 1) {
            //left-click
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
    $(".crate, .change-char__button, .fullscreen-icon").on("mousedown click", function (e) {
        e.stopPropagation();
    }).hover(function () {
        $(".cursor").toggle().removeClass("is-shooting");
    });

    //ammo crate resupply
    $(".crate").click(function () {
        $(this).removeClass("is-visible");

        //reset ammo
        setTimeout(function () {
            GUN.resetAmmo();
        }, 600 + activeChar.reloadTime);

        //audio
        playAudio($("#resupply")[0]);
        playAudio($("#reload")[0], 600);
    });

    //change classes button
    $(".change-char__button").mousedown(function (e) {
        $(".character-screen").show();
        screenOpen = "character-screen";
    });

    //disable right-click
    $(document).on("contextmenu", function () {
        return false;
    });
});