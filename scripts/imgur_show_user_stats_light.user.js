// ==UserScript==
// @name        imgur_show_user_stats_light
// @namespace   someName
// @include     http://imgur.com/user/*
// @include     https://imgur.com/user/*
// @version     0.1a
// @grant       none
// ==/UserScript==

$( window ).load(function() {
	var CLIENT_ID = "cd0695f1226536b";
	if(window.location.pathname.indexOf('/user/') === 0 && $('.button').filter('.comments').length > 0){
		var newBox = $('<div id="statsBox" class="textbox"></div>');
		var tble = $('foo<table width="100%"></table>');
		newBox.append(tble);
		newBox.insertBefore( $('.icons').filter('.textbox') );
		var username = window.location.pathname.split("/", 3)[2];
		console.log("send request for", username);
		$.ajax({
			url: 'https://api.imgur.com/3/account/'+username+'/gallery_profile',
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result) {
				console.log(result);
				tble.append($('<tr><td>Comments</td><td>'+result.data.total_gallery_comments+'</td></tr>'));
				tble.append($('<tr><td>Submissions</td><td>'+result.data.total_gallery_submissions+'</td></tr>'));
				tble.append($('<tr><td>Favorites</td><td>'+result.data.total_gallery_favorites+'</td></tr>'));
			},
			error: function(a, b, c){
				console.log('Failed to load', a, b, c);
			}
		}); 
	}
});
