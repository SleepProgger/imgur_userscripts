// ==UserScript==
// @name        imgur_hide_repostStatistics_light
// @namespace   someName
// @include     http://imgur.com/*
// @include     https://imgur.com/*
// @version     1
// @grant       none
// ==/UserScript==

// we don't want to run on user pages, only on galery, favorites, tags...
if(window.location.pathname.indexOf('/user/') === 0 && window.location.pathname.indexOf('/favorites/') <= -1){
	return; 
}
$('.author[data-author="9730847"]').parent().parent().hide();
var observer = new MutationObserver(function(mutations) {
	for(var i=0; i < mutations.length; ++i){
		var mutation = mutations[i];
		for(var j=0; j < mutation.addedNodes.length; ++j){	
			var node = mutation.addedNodes[j];
			$(node).find('.author[data-author="9730847"]').parent().parent().hide();
		}
	}
});
var target = document.querySelector('body');
observer.observe(target, { subtree: true, childList: true});
