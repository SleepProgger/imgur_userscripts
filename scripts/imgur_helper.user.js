// ==UserScript==
// @name        imgur_helper
// @namespace   someName
// @include     http://imgur.com/*
// @include     https://imgur.com/*
// @exclude		http://imgur.com/ads*
// @exclude		https://imgur.com/ads*
// @version     0.1
// @grant       none
// ==/UserScript==


function init_imgur_helper(){
	window.observer_callbacks = []; // contains [filter:func, exec:func, OPTIONAL tagNames:[]]
	window._imgur_helper_loaded = false;
	window.gallery_navigated_listener = [];
	
	window.observer = new MutationObserver(function(mutations) {
		for(var i=0; i < mutations.length; ++i){
			var mutation = mutations[i];
			for(var j=0; j < mutation.addedNodes.length; ++j){	
				var node = mutation.addedNodes[j];
				if(node.nodeName == "#text") continue;
				// galery navigation
				if(node.className != undefined && node.className === "point-info-container left"){
					for(var k=0; k < gallery_navigated_listener.length; gallery_navigated_listener[k](), ++k);
				}
				//console.log(node);
				// all other handler
				for(var k=0; k < observer_callbacks.length; ++k){ // oh my gosh is this aweful
					if( observer_callbacks[k].tagNames != undefined && ( node.tagName === undefined || observer_callbacks[k].tagNames[node.tagName] === undefined) ){
						//console.log("Skipped because of tagname ", node.tagName);
						continue;
					}
					if( observer_callbacks[k].filter(node) ){
						observer_callbacks[k].exec(node);
					}
				}
			}
		}
	});
	var target = document.querySelector('body');
	observer.observe(target, { subtree: true, childList: true});
	
	// init mod gui
	if(window.location.pathname.indexOf('/account/settings') === 0){
		var btn = $('<div class="textbox button" data-type="mods"><h2>Mods</h2><div class="active"></div><div>');
		$('.right .panel').append(btn);
		var space = $('<div class="nodisplay mod_settings" id="mod_settings"></div>');
		$('.panel').filter('.left').append(space);
		btn.click(function(){
			btn.addClass("selected");
			btn.parent().children().not('[data-type=mods]').removeClass('selected');
			space.css('display', 'block');
			space.parent().children().not('#mod_settings').css('display', 'none');
			// we don't rewrite the url bar for now, as a reload would lead to a 404. (Could be fixed withhin this script though)
			// history.pushState(null, "page 2", '/account/settings/mods');
		});
		btn.parent().children().not('[data-type=mods]').click(function(){
			space.css('display', 'none');
		});
	}
	
	window._imgur_helper_loaded = true;
}

function addJS_Node (text, s_URL) {
    var scriptNode                      = document.createElement ('script');
    scriptNode.type                     = "text/javascript";
    if (text)  scriptNode.textContent   = text;
    if (s_URL) scriptNode.src           = s_URL;
    var targ    = document.getElementsByTagName('head')[0] 
                || document.body || document.documentElement;
    targ.appendChild (scriptNode);
}

console.log('Here is ' + window.location.href);
addJS_Node(init_imgur_helper.toString())
init_imgur_helper();
