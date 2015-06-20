// ==UserScript==
// @name        Change_loading
// @namespace   someName
// @include     http://imgur.com/*
// @include     https://imgur.com/*
// @version     0.2a
// @grant       none
// ==/UserScript==

/*
* Patch for GM_getValue and GM_SetValue support for chrome
* credits to: www.devign.me/greasemonkey-gm_getvaluegm_setvalue-functions-for-google-chrome/
*/
if (!this.GM_getValue || (this.GM_getValue.toString && this.GM_getValue.toString().indexOf("not supported")>-1)) {
    this.GM_getValue=function (key,def) {
        return localStorage[key] || def;
    };
    this.GM_setValue=function (key,value) {
        return localStorage[key]=value;
    };
    this.GM_deleteValue=function (key) {
        return delete localStorage[key];
    };
}
// why do i have to implement that by myself ?
if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function(str){
		return this.lastIndexOf(str, 0) === 0;
	};
}

var GR_COOKIE_NAME = 'imgur_loading_gif';
var image = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}'));
if(! ('src' in image)){
	image = null;
}

function set_up_gui(){
	console.log("init_gui");
	var btn = $('[data-type="mods"]');
	var space = $('#mod_settings');
	// only one script creates the content div and the button
	if( btn.length < 1 ){
		btn = $('<li data-type="mods">mods</li>');
		$('#leftside-nav ul').append(btn);
		space = $('<div class="nodisplay mod_settings" id="mod_settings"></div>');
		$('.settings-content').append(space);
		btn.click(function(){
			btn.addClass("active");
			btn.parent().children().not('[data-type=mods]').removeClass('active');
			space.css('display', 'block');
			space.parent().children().not('#mod_settings').css('display', 'none');
		});
		btn.parent().children().not('[data-type=mods]').click(function(){
			space.css('display', 'none');
		});
	}
	
	// append our content here
	var content = $('<div class="textbox"></div>');
	var txtUrl = $('<input type="text"></input>');
	var txtWidth = $('<input type="text"></input>');
	var txtHeight = $('<input type="text"></input>');
	var btn_change = $('<button class="button-big">Change it</button>');
	var btn_reset = $('<button class="button-big">Reset</button>');
	var loading_gif = $('<div></div>');
	if(image != null){
		txtUrl.attr('value', image.src);
		txtWidth.attr('value', image.width);
		txtHeight.attr('value', image.height);
		loading_gif.append($('<img src="'+image.src+'" width="'+image.width+'" height="'+image.height+'"></img>'));
	}else{
		txtUrl.attr('value', 'http://i.imgur.com/4Ie1pM6.gif');
		txtWidth.attr('value', '100px');
		txtHeight.attr('value', '100px');
		loading_gif.append('Using the default image');
	}
	btn_reset.click(function(){
		window.setTimeout(function(){GM_deleteValue(GR_COOKIE_NAME)}, 0);
		loading_gif.empty();
		loading_gif.append('Using the default image');
	});
	btn_change.click(function(){
		//TODO save base64 encoded for a faster response
		image = { src: txtUrl.attr('value'), width: txtWidth.attr('value'), height: txtHeight.attr('value') };
		window.setTimeout(function(){GM_setValue(GR_COOKIE_NAME, JSON.stringify(image))}, 0);
		loading_gif.empty();
		loading_gif.append($('<img src="'+image.src+'" width="'+image.width+'" height="'+image.height+'"></img>'));
	});
	content.append('<h3>Current loading gif:</h3>');
	content.append(loading_gif);
	content.append('<h3>Url:</h3> For best results convert the image to a data-uri (For example <a href="http://www.askapache.com/online-tools/base64-image-converter/">here</a> (paste the content of the "raw" field))');
	content.append(txtUrl);
	content.append('<h3>Width:</h3>');
	content.append(txtWidth);
	content.append('<h3>Height:</h3>');
	content.append(txtHeight);
	content.append(btn_change);
	content.append(btn_reset);
	space.append("<h2>Loading GIF</h2>");
	space.append(content);
	space.append("<br />");
}

function replace_loading_gif(){
	// This needs some more performance as if we just search for all known loader classes, but it is more stable this way.
	var imgs = $('img');
	var fo = imgs.filter('[src^="/images/loaders/"]')
		.add(imgs.filter('[src^="/s.imgur.com/images/loaders/"]'))
		.add(imgs.filter('[src^="//s.imgur.com/images/loaders/"]'))
		.add(imgs.filter('[src^="http://s.imgur.com/images/loaders"]'))
		.add(imgs.filter('[src^="https://s.imgur.com/images/loaders"]'))
	;
	fo.attr('src', image.src);
	fo.css('width', image.width);
	fo.css('height', image.height);
	
	var loader = $('[class*=loader]').filter(function(){
		var jqThis = $(this)
		if(jqThis.css('background-image').startsWith('url("/images/loaders/')
			|| jqThis.css('background-image').startsWith('url("//s.imgur.com/images/loaders/')
			|| jqThis.css('background-image').startsWith('url("http://s.imgur.com/images/loaders')
			){
				jqThis.width(image.width);
				jqThis.height(image.height);
				jqThis.css('background-color', '#ed00fe');
				this.style.setProperty( 'background-image', 'url("'+image.src+'")', 'important' );
				return true;
			}
		return false;
	});
}


// show the settings if we are on the settings page
if( window.location.pathname.startsWith("/account/settings") ){
	set_up_gui();
	return;
}

// if no image is set we don't need to do anything
if( image === null ){
	return;
}

var observer = new MutationObserver(function(mutations) {
	// We always reset the loading image when anything get added.
	// This way it should work even if imgur changes.
	// The nice way would be to only check for relevant updates (or search only in mutations ?), but meh...
	var imgs = $('img');
	replace_loading_gif();
});
var target = document.querySelector('body');
observer.observe(target, { subtree: true, childList: true});
replace_loading_gif();
