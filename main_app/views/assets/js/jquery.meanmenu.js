! function($) {
    "use strict";
    $.fn.meanmenu = function(e) {
        var n = {
            meanMenuTarget: $(this),
            meanMenuContainer: ".trifles-responsive-menu",
            meanMenuClose: "X",
            meanMenuCloseSize: "18px",
            meanMenuOpen: "<span></span><span></span><span></span>",
            meanRevealPosition: "right",
            meanRevealPositionDistance: "0",
            meanRevealColour: "",
            meanScreenWidth: "480",
            meanNavPush: "",
            meanShowChildren: !0,
            meanExpandableChildren: !0,
            meanExpand: "+",
            meanContract: "-",
            meanRemoveAttrs: !1,
            onePage: !1,
            meanDisplay: "block",
            removeElements: ""
        };
        e = $.extend(n, e);
        var a = window.innerWidth || document.documentElement.clientWidth;
        return this.each(function() {
            var n = e.meanMenuTarget,
                t = e.meanMenuContainer,
                r = e.meanMenuClose,
                i = e.meanMenuCloseSize,
                s = e.meanMenuOpen,
                u = e.meanRevealPosition,
                m = e.meanRevealPositionDistance,
                l = e.meanRevealColour,
                o = e.meanScreenWidth,
                c = e.meanNavPush,
                v = ".meanmenu-reveal",
                h = e.meanShowChildren,
                d = e.meanExpandableChildren,
                y = e.meanExpand,
                j = e.meanContract,
                Q = e.meanRemoveAttrs,
                f = e.onePage,
                g = e.meanDisplay,
                p = e.removeElements,
                C = !1;
            (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/Blackberry/i) || navigator.userAgent.match(/Windows Phone/i)) && (C = !0), (navigator.userAgent.match(/MSIE 8/i) || navigator.userAgent.match(/MSIE 7/i)) && $("html").css("overflow-y", "scroll");
            var w = "",
                x = function() {
                    if ("center" === u) {
                        var e = window.innerWidth || document.documentElement.clientWidth,
                            n = e / 2 - 22 + "px";
                        w = "left:" + n + ";right:auto;", C ? $(".meanmenu-reveal").animate({
                            left: n
                        }) : $(".meanmenu-reveal").css("left", n)
                    }
                },
                A = !1,
                E = !1;
            "right" === u && (w = "right:" + m + ";left:auto;"), "left" === u && (w = "left:" + m + ";right:auto;"), x();
            var M = "",
                P = function() {
                    M.html($(M).is(".meanmenu-reveal.meanclose") ? r : s)
                },
                W = function() {
                    $(".mean-bar,.mean-push").remove(), $(t).removeClass("mean-container"), $(n).css("display", g), A = !1, E = !1, $(p).removeClass("mean-remove")
                },
                b = function() {
                    var e = "background:" + l + ";color:" + l + ";" + w;
                    if (o >= a) {
                        $(p).addClass("mean-remove"), E = !0, $(t).addClass("mean-container"), $(".mean-container").prepend('<div class="mean-bar"><a href="#nav" class="meanmenu-reveal" style="' + e + '">Show Navigation</a><nav class="mean-nav"></nav></div>');
                        var r = $(n).html();
                        $(".mean-nav").html(r), Q && $("nav.mean-nav ul, nav.mean-nav ul *").each(function() {
                            $(this).is(".mean-remove") ? $(this).attr("class", "mean-remove") : $(this).removeAttr("class"), $(this).removeAttr("id")
                        }), $(n).before('<div class="mean-push" />'), $(".mean-push").css("margin-top", c), $(n).hide(), $(".meanmenu-reveal").show(), $(v).html(s), M = $(v), $(".mean-nav ul").hide(), h ? d ? ($(".mean-nav ul ul").each(function() {
                            $(this).children().length && $(this, "li:first").parent().append('<a class="mean-expand" href="#" style="font-size: ' + i + '">' + y + "</a>")
                        }), $(".mean-expand").on("click", function(e) {
                            e.preventDefault(), $(this).hasClass("mean-clicked") ? ($(this).text(y), $(this).prev("ul").slideUp(300, function() {})) : ($(this).text(j), $(this).prev("ul").slideDown(300, function() {})), $(this).toggleClass("mean-clicked")
                        })) : $(".mean-nav ul ul").show() : $(".mean-nav ul ul").hide(), $(".mean-nav ul li").last().addClass("mean-last"), M.removeClass("meanclose"), $(M).click(function(e) {
                            e.preventDefault(), A === !1 ? (M.css("text-align", "center"), M.css("text-indent", "0"), M.css("font-size", i), $(".mean-nav ul:first").slideDown(), A = !0) : ($(".mean-nav ul:first").slideUp(), A = !1), M.toggleClass("meanclose"), P(), $(p).addClass("mean-remove")
                        }), f && $(".mean-nav ul > li > a:first-child").on("click", function() {
                            $(".mean-nav ul:first").slideUp(), A = !1, $(M).toggleClass("meanclose").html(s)
                        })
                    } else W()
                };
            C || $(window).resize(function() {
                a = window.innerWidth || document.documentElement.clientWidth, a > o, W(), o >= a ? (b(), x()) : W()
            }), $(window).resize(function() {
                a = window.innerWidth || document.documentElement.clientWidth, C ? (x(), o >= a ? E === !1 && b() : W()) : (W(), o >= a && (b(), x()))
            }), b()
        })
    }
}($);