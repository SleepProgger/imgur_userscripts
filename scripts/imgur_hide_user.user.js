// ==UserScript==
// @name        imgur_hide_user
// @namespace   someName
// @include     http://imgur.com/*
// @version     0.1a
// @grant       none
// ==/UserScript==

/*
* BUGS:
*	
* TODO:
* - Add flag for active/deactivated state
* - remove "bad replies" label when removed one was the last
*/

var GR_COOKIE_NAME = 'imgur_hide_user';
var hide_ids = {};

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

// wait for the helper functions (observer, gui) to be initialised.
function wait_for_helper(){
	if(window._imgur_helper_loaded) return run();
	window.setTimeout(wait_for_helper, 100);
}

function init_config_GUI(){
	var space = $('#mod_settings');
	var content = $('<div class="textbox"></div>');
	// TODO: add better gui
	var table = $('<table style="width:100%;"><tr><th>ID</th><th>Supposed user</th><th>Delete</th></tr>');
	for(var id in hide_ids){
		var btn = $('<button>X</button>');
		btn.click(function(){
			var uid = $(this).parent().parent().children().first().html();
			console.log('remove uid: ', uid);
			delete hide_ids[uid];
			//window.setTimeout(function(){GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids))}, 0);			
			GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));			
			//console.log(JSON.stringify(hide_ids));
			$(this).parent().parent().remove();
		});
		var row = $('<tr><td>'+id+'</td><td><a href="http://imgur.com/user/'+hide_ids[id]+'">'+hide_ids[id]+'</a></td><td></td></tr>');
		row.children().last().append(btn);
		table.append(row);
	}
	table.append('</table>');
	content.append(table);
	space.append("<h2>User currently hidden</h2>");
	space.append(content);
	space.append("<br />");
}

function add_user(){
	var author = $(this).parent().parent().parent();
	if($(this).attr('name') === "auh"){
		hide_ids[author.attr('data-author')] = author.find('a').first().html();		
		GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));			
		console.log('add user ', author.find('a').html());
		$(this).attr('name', 'ruh');
		$(this).html('Show user');
		alert('User coments hidden. Please reload.'); // TODO: Remove the comments to hide from the current page.
	}else{
		delete hide_ids[author.attr('data-author')];
		GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));			
		console.log('remove user ', author.find('a').html());
		$(this).attr('name', 'ahu');
		$(this).html('Hide user');
		alert('User comments shown again. Please reload or navigate to another submission.');
	}
}

function handleComment(n){
	//console.log('handle', n);
	n.setAttribute("dirty_h", "1");
	var $n = $(n);
	var author = $n.find('.author').filter('[data-author]').first();
	var uid = author.attr('data-author');
	var add_btn = $('<div class="item"></div>');
	add_btn.click(add_user);
	author.find('.options').append(add_btn);
	if(uid && hide_ids[uid] != undefined){
		add_btn.attr('name', 'ruh');
		add_btn.html('Show user');
		var uname = author.find('a').html();
		if(hide_ids[uid] != uname){
			hide_ids[uid] = uname;
			console.log("update name for id ", uid, " : ", uname);
			GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
		}
		return window.location.pathname.indexOf('/user/') != 0;		
	}else{
		add_btn.attr('name', 'auh');
		add_btn.html('Hide user');
	}
	return false;
}

function hideComment(n){
	n.setAttribute("dirty_h", "1");
	$(n).hide();
}

// and here we go
wait_for_helper(); // calls run when ready
function run(){
	//TODO: clean this up. Its horrible.
	hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}'));
	if( window.location.pathname.indexOf("/account/settings") == 0){
		init_config_GUI();
		return;
	}	
	// just in case there are already coments loaded (user/comments for example)
	$('.comment').each(function(i){
		//console.log('foo ', this);
		if(this.dirty_h === undefined && handleComment(this)){
			hideComment(this);
			//$(this).parent().prepend($(this));	
		}	
	});
	// register for all dynamically loaded comment divs
	window.observer_callbacks.push( {filter:function(n){
		//console.log('foo2 ', n);
		if ( n.className === undefined || n.className != "comment"){
			// galeries appends the comment div, while replies for example wraps them.
			//if(n.className === undefined || n.className != "comment-item"){
				var childs = $(n).find('.comment');
				if(childs.length == 0) return false;
				childs.each(function(){
					//console.log('Has child ', n, this);
					if (! this.hasAttribute('dirty_h') && handleComment(this)){
						hideComment(this);
					}
				});
			//}
			return false;
		}
		if (! n.hasAttribute('dirty_h') )
			return handleComment(n);
		return false;		
	}, exec:function(n){
		hideComment(n);
	}, tagNames:{'DIV':true}});
}
