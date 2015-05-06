// ==UserScript==
// @name        ic_imgur_stats
// @namespace   foo
// @include     https://community.imgur.com/*
// @version     0.3
// @grant       none
// ==/UserScript==


// hook history functions to detect "ajax site changes"
// are there any problems with this approach ? Seem to work like a charm.
// tested with ff (greasemonkey) and chrome (tampermonkey)
var lastUrl = "";
var _oldHistory_pushState = history.pushState;
history.pushState = function(){
  _oldHistory_pushState.apply(this, arguments);
  if(lastUrl != arguments[2]){ 
    lastUrl = arguments[2];
    $(history).trigger("history_state_changed", arguments);
  }
}
var _oldHistory_replaceState = history.replaceState;
history.replaceState = function(){
  _oldHistory_replaceState.apply(this, arguments);
  if(lastUrl != arguments[2]){ 
    lastUrl = arguments[2];
    $(history).trigger("history_state_changed", arguments);
  }
}


$(history).on("history_state_changed", function(evt, ob, title, url){
  window.setTimeout(function(){  // TODO: wait till loaded
    if(url.indexOf("/users/") != 0) return;
    var username = $('.primary-textual h1').html();
    if($('#imgur_link').length === 0)
     showImgurInfo(username.trim());    
  }, 1000);
  return true;
});


// inject css because why not ?
$(document).ready(function(){
  var node = document.createElement('style');
  node.innerHTML = "#imgur_stats{display: none; width: 70%;}" +
    "#imgur_link:hover #imgur_stats{display: block}";
  document.body.appendChild(node);
});


// create, inject and fill the imgur stats
function showImgurInfo(username){
  var link = $('<a target="_blank" id="imgur_link" href="http://imgur.com/user/' + username + '" ><h2>'+ username + '</h2><div id="imgur_stats"><br/></div>' + '</a>');
  $('.primary-textual h2').replaceWith(link);
  
  var CLIENT_ID = "cd0695f1226536b";
  var newBox = $('#imgur_stats');
  var tble = $('<table width="100%">' +
               '<tr><th align="center" colspan="2">Imgur statistics</th></tr>'+
               '<tr><td>Account creation</td><td align="right" id="stats_created"> - </td></tr>'+
               '<tr><td>Comments</td><td align="right"><a href="http://imgur.com/user/'+username+'/" id="stats_comments"> - </a></td></tr>'+
               '<tr><td>Submissions</td><td align="right"><a href="http://imgur.com/user/'+username+'/submitted" id="stats_submissions"> - </a></td></tr>'+
               '<tr><td>Albums</td><td align="right"><a href="http://'+username+'.imgur.com" id="stats_albums"> - </a></td></tr>'+
               '<tr><td>Images</td><td align="right"><a href="http://'+username+'.imgur.com/all" id="stats_images"> - </a></td></tr>'+
               '<tr><td>Favorites</td><td align="right"><a href="http://imgur.com/user/'+username+'/favorites" id="stats_favorites"> - </a></td></tr>'+
               '<tr><td style="color: #2B2B2B; font-size: 0.7em; border:0px;" colspan="2" align="center" id="stats_credits_user"> - </td></tr>'+
               '<tr><td style="color: #2B2B2B; font-size: 0.7em; border:0px;" colspan="2" align="center" id="stats_credits_script"> - </td></tr>'+
               '</table>');
  newBox.append(tble);

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
