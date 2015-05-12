// ==UserScript==
// @name        imgur_speed_up
// @namespace   foo
// @include     http://imgur.com/*
// @include     https://imgur.com/*
// @exclude     http://community.imgur.com*
// @exclude     https://community.imgur.com*
// @version     0.1
// @grant       none
// ==/UserScript==

$(document).ready(function(){
  var _old_fetch = Imgur.InsideNav._instance.fetchCaptions;
  var add_foo = undefined;
  var _load_comments = false;
  var load_comments = _load_comments;
  
  // fire a custom event everytime the url changes via history.push/replaceState
  var lastUrl = "";
  var _oldHistory_pushState = history.pushState;
  history.pushState = function(){
    _oldHistory_pushState.apply(this, arguments);
    if(lastUrl !== arguments[2]){ 
      $(history).trigger("history_state_changed", arguments);
      lastUrl = arguments[2];
    }
  };
  var _oldHistory_replaceState = history.replaceState;
  history.replaceState = function(){
    _oldHistory_replaceState.apply(this, arguments);
    if(lastUrl !== arguments[2]){ 
      $(history).trigger("history_state_changed", arguments);
      lastUrl = arguments[2];
    }
  };
  
  
   // reset stop loading (if requested) when navigating to a new post
  $(history).on("history_state_changed", function(evt, ob, title, url){
    if(!_load_comments){
      load_comments = false;
      //console.log("move away");
    }
  });
      
  
  // Here we hook
  Imgur.InsideNav._instance.fetchCaptions = function(a, b){
    //console.log("fetch", this, a, b, load_comments, a != Imgur.InsideNav._instance.getHash(), Imgur.InsideNav._instance.getHash());
    if(load_comments){
      var x = _old_fetch.apply(Imgur.InsideNav._instance, [a, b]);
      return x;
    } 
    if(a != Imgur.InsideNav._instance.getHash()) return;
    //comments-loaded
    add_foo = b;
    $('#comments-container').hide();
    if($('#hide_comment_ctrl').length === 0)
      $('<div class="stats-link left"><a align="center" id="hide_comment_ctrl">Load comments</a></div>').click(function(){
        load_it();
        return false;
      }).insertAfter($('.stats-link'));
  };
  
  function load_it(){
    load_comments = true;
    _old_fetch.apply(Imgur.InsideNav._instance, [Imgur.InsideNav._instance.getHash(), add_foo]);
    $('#comments-container').show();
  }
});
