// ==UserScript==
// @name        imgur_comunity_mute
// @namespace   someName
// @include     https://community.imgur.com/t/*
// @version     1
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


$('body').ready(function(){
	var GR_COOKIE_NAME = 'imgur_community_mute';
	var hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}'));

	function handle_post_node(node){
		var tid = node.getAttribute('data-user-id');
		function mute_foo(){
			console.log("mute_foo");
			this.innerHTML = "Unmute";
			$(node).find('.contents').hide();
			$(this).unbind('click', mute_foo);
			$(this).click(umute_foo);
			hide_ids[tid] = 1;
			GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
			$('[data-user-id="'+tid+'"]').find('.mute_btn').remove();
			$('[data-user-id="'+tid+'"]').each(function(){ handle_post_node(this) });
		}
		function umute_foo(){
			console.log("umute_foo", this);
			this.innerHTML = "Mute";
			$(node).find('.contents').show();
			$(this).unbind('click', umute_foo);
			$(this).click(mute_foo);
			delete hide_ids[tid];
			GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
			$('[data-user-id="'+tid+'"]').find('.umute_btn').remove();
			$('[data-user-id="'+tid+'"]').each(function(){ $(this).find('.contents').show(); handle_post_node(this) });
		}
		if(hide_ids[tid]){			
			$(node).find('.contents').hide();
			if($(node).find('.umute_btn').length > 0) return;
			var btn = $('<button style="float: right; margin-right: 2px; border-radius:20px" class="umute_btn">Unmute</button>');
			$(node).find('.topic-meta-data').append(btn);
			btn.click(umute_foo);
		}else {
			if($(node).find('.mute_btn').length > 0) return;
			var btn = $('<button style="float: right; margin-right: 2px; border-radius:20px" class="mute_btn">Mute</button>');
			$(node).find('.topic-meta-data').append(btn);
			btn.click(mute_foo);
		}
	}
	
	$('article').each(function(){handle_post_node(this)});
	var observer = new MutationObserver(function(mutations) {
		for(var i=0; i < mutations.length; ++i){
			var mutation = mutations[i];
			for(var j=0; j < mutation.addedNodes.length; ++j){	
				var node = mutation.addedNodes[j];
				if(node.nodeName == "article" && node.getAttribute('data-user-id')){
					handle_post_node(node);	
				}
			}
		}
	});
	observer.observe($('body').get(0), { subtree: true, childList: true});
});
