// ==UserScript==
// @name        imgur_show_user_stats_light
// @namespace   someName
// @include     http://imgur.com/user/*
// @include     https://imgur.com/user/*
// @version     0.1c
// @grant       none
// ==/UserScript==

$( window ).load(function() {
	var CLIENT_ID = "cd0695f1226536b";

	if(window.location.pathname.indexOf('/user/') === 0 && $('.button').filter('.comments').length > 0){
		var newBox = $('<div id="statsBox" class="textbox"></div>');
		var tble = $('<table width="100%">' +
								 '<tr><td>Account creation</td><td align="right" id="stats_created"> - </td></tr>'+
								 '<tr><td>Comments</td><td align="right" id="stats_comments"> - </td></tr>'+
								 '<tr><td>Submissions</td><td align="right" id="stats_submissions"> - </td></tr>'+
								 '<tr><td>Albums</td><td align="right" id="stats_albums"> - </td></tr>'+
								 '<tr><td>Images</td><td align="right" id="stats_images"> - </td></tr>'+
								 '<tr><td>Favorites</td><td align="right" id="stats_favorites"> - </td></tr>'+
								 '<tr><td style="color: #2B2B2B;" colspan="2" align="center" id="stats_credits_user"> - </td></tr>'+
								 '<tr><td style="color: #2B2B2B;" colspan="2" align="center" id="stats_credits_script"> - </td></tr>'+
								 '</table>');
		newBox.append(tble);
		newBox.insertBefore( $('.icons').filter('.textbox') );
		var username = window.location.pathname.split("/", 3)[2];

		// get coments / submission stats
		$.ajax({
			url: 'https://api.imgur.com/3/account/'+username+'/gallery_profile',
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result, status, request) {
				console.log(request.getAllResponseHeaders());
				//console.log(result);
				$('#stats_comments').html(result.data.total_gallery_comments.toLocaleString());
				$('#stats_submissions').html(result.data.total_gallery_submissions.toLocaleString());
				$('#stats_favorites').html(result.data.total_gallery_favorites.toLocaleString());
			},
			error: function(a, b, c){
				console.log('Failed to load', a, b, c);
			}
		});

		// get the excat join date. TODO: I bet i messed up the time(zones) here.
		$.ajax({
			url: 'https://api.imgur.com/3/account/'+username,
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result, status, request) {
				console.log(request.getAllResponseHeaders());
				$('#stats_created').html( new Date(result.data.created * 1000).toLocaleDateString() );
			},
			error: function(a, b, c){
				console.log('Failed to load', a, b, c);
			}
		});


		// album count (inklusive not submitted to gallery), if album settings are set to public.
		$.ajax({
			url: 'https://api.imgur.com/3/account/'+username + '/albums/count',
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result, status, request) {
				$('#stats_albums').html( result.data.toLocaleString() );
			},
			error: function(a, b, c){
				console.log('Failed to load', a, b, c);
				$('#stats_albums').html( "private" );
			}
		});

		// image count (inklusive not submitted to gallery), if image settings are set to public.
		$.ajax({
			url: 'https://api.imgur.com/3/account/'+username + '/images/count',
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result, status, request) {
				$('#stats_images').html( result.data.toLocaleString() );
			},
			error: function(a, b, c){
				console.log('Failed to load', a, b, c);
				$('#stats_images').html( "private" );
			}
		});


		// creadits remaining
		$.ajax({
			url: 'https://api.imgur.com/3/credits',
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result, status, request) {
				console.log( result.data );
				$('#stats_credits_user').html( "User Credits: " + result.data.UserRemaining + " / " + result.data.UserLimit);
				$('#stats_credits_script').html( "Script Credits: : " +  result.data.ClientRemaining + " / " + result.data.ClientLimit);
			},
			error: function(a, b, c){
				console.log('Failed to load', a, b, c);
				$('#stats_images').html( "private" );
			}
		});
	}
});
