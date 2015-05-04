// ==UserScript==
// @name        imgur_show_user_stats_light
// @namespace   someName
// @include     http://imgur.com/user/*
// @include     https://imgur.com/user/*
// @version     0.1e
// @grant       none
// ==/UserScript==


// TODO: Think about useable version numbers...
// TODO: Add support for username.imgur.com style urls
// TODO: Show errors and handle no credits remaining ?

$( window ).ready(function() {
	var CLIENT_ID = "cd0695f1226536b";

	if(window.location.pathname.indexOf('/user/') === 0 && $('.button').filter('.comments').length > 0){
		var username = window.location.pathname.split("/", 3)[2]; // TODO: look for a more stable way (is there an imgur js var maybe ?)
		var newBox = $('<div id="statsBox" class="textbox"></div>');
		var tble = $('<table width="100%">' +
								 '<tr><td>Totals / Links</td><td align="right" id="links_created"> - </td><td>' +
								 '<tr><td>Account creation</td><td align="right" id="stats_created"> - </td></tr>'+
								 '<tr><td>Comments</td><td align="right"><a href="http://imgur.com/user/'+username+'/" id="stats_comments"> - </a></td></tr>'+
								 '<tr><td>Submissions</td><td align="right"><a href="http://imgur.com/user/'+username+'/submitted" id="stats_submissions"> - </a></td></tr>'+
								 '<tr><td>Albums</td><td align="right"><a href="http://'+username+'.imgur.com" id="stats_albums"> - </a></td></tr>'+
								 '<tr><td>Images</td><td align="right"><a href="http://'+username+'.imgur.com/all" id="stats_images"> - </a></td></tr>'+
								 '<tr><td>Favorites</td><td align="right"><a href="http://imgur.com/user/'+username+'/favorites" id="stats_favorites"> - </a></td></tr>'+
								 '<tr><td style="color: #2B2B2B;" colspan="2" align="center" id="stats_credits_user"> - </td></tr>'+
								 '<tr><td style="color: #2B2B2B;" colspan="2" align="center" id="stats_credits_script"> - </td></tr>'+
								 '</table>');
		newBox.append(tble);
		newBox.insertBefore( $('.icons').filter('.textbox') );
		

		$('#links_created').html('<a target="_blank" href="http://imgur.com/user/'+username+'">imgur</a>, <a target="_blank" href="http://'+username+'.imgur.com">albums</a>, <a target="_blank" href="http://community.imgur.com/users/'+username+'/activity">ic</a>');

		// get coments / submission stats
		$.ajax({
			url: 'https://api.imgur.com/3/account/'+username+'/gallery_profile',
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result, status, request) {
				$('#stats_comments').html(result.data.total_gallery_comments.toLocaleString());
				$('#stats_submissions').html(result.data.total_gallery_submissions.toLocaleString());
				$('#stats_favorites').html(result.data.total_gallery_favorites.toLocaleString());
			},
			error: function(a, b, c){
				console.log('Failed to load', a, b, c);
			}
		});

		// get the exact (*) join date. TODO: I bet i messed up the time(zones) here.
		$.ajax({
			url: 'https://api.imgur.com/3/account/'+username,
			method: 'GET',
			headers: {
				Authorization: 'Client-ID ' + CLIENT_ID,
				Accept: 'application/json'
			},
			success: function(result, status, request) {
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


		// creadits remaining (TODO: Remove as soon as imgur api allows the credit fields per CORS)
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
