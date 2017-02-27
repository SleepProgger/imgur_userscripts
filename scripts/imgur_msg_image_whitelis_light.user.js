// ==UserScript==
// @name        imgur_message_img_whitelist
// @namespace   imgur
// @include     http://imgur.com/account/messages
// @version     1
// @grant       none
// ==/UserScript==

//
// TODO: we could check if the user is on the whitelist when switching user and not all the time, but this is good enough for now.
// TODO: also there should be some event we could register to in the layer api. That would be way nicer as the mutationobserver.
// This way we also would get the userid for free (i guess)
//

// TODO init from local storage
var whitelist = $.parseJSON(localStorage.getItem('imgur_img_whitelist')) || {};
var uid_map = {};

var __init = false;
var whitelist_btn = $('<li class="js-message-conversation-heading-whitelist">Whitelist user images</li>');

// super hacky but meh
// Searches for the userid of the given conversation partner.
// Updates all username to userid mapping on the way.
function get_other_user_id(){
  var username = $('.message-conversation-heading strong a').text();
  if( username in uid_map ){
    return uid_map[username];
  }
  // Get the userid from the las layer queries
  var uid = -1;
  //var idents = layerQueries['layer:///conversations/617d3205-bd58-44d7-a1e3-a47754da70fb'].client._identitiesHash;
  for (var conv_key in layerQueries) {
    if (layerQueries.hasOwnProperty(conv_key)) {
      var idents = layerQueries[conv_key].client._identitiesHash;
      for (var ident_key in idents) {
       if (idents.hasOwnProperty(ident_key)) {
         console.log("Update user", idents[ident_key].displayName, idents[ident_key].__userId);
         uid_map[idents[ident_key].displayName] = idents[ident_key].__userId;
         if(idents[ident_key].displayName == username)
           uid = uid_map[idents[ident_key].displayName];
       }
      }
    }
  }
  return uid;
}

// Replaces button with image again.
function _show_img(){
  var me = $(this);
  var new_a = $('<a target="_blank"></a>');
  var child = undefined;
  if(me.attr('data-is-video') == "1")
    child = $('<video autoplay="" muted="" loop=""></video>');
  else
    child = $('<img>');
  new_a.attr('href', me.attr('data-link-url')).append(child);
  child.attr('src', me.attr('data-child-url'));
  me.replaceWith(new_a);
}
// Replaces image and videos with button.
function _hide_img(){
  var me = $(this);
  var new_btn = $('<button>Show image</button>');
  var child = me.find('img,video');
  new_btn.attr('data-link-url', me.attr('href'));
  new_btn.attr('data-child-url', child.attr('src'));
  new_btn.attr('data-is-video', child.is('video')?"1":"0");
  me.replaceWith(new_btn);
  new_btn.click(_show_img);
}


// Setup observer to detect changes. Registering for an api.layer event would be preferable.
var observer = new MutationObserver(function(mutations) {
  for(var i=0; i < mutations.length; ++i){
    var mutation = mutations[i];
    for(var j=0; j < mutation.addedNodes.length; ++j){
      if(mutation.addedNodes[j].nodeName != "DIV") continue;
      var node = $(mutation.addedNodes[j]).filter('div.message-conversation-blurb:not(.from-user)');
      node = node.find('.message-conversation-blurb-body-image a').find('img,video').parent();
      if(node.length < 1) continue;
      if(!__init){ _init(); }
      var userid = get_other_user_id();
      if(!(userid in whitelist)){
        _hide_img.call(node[0]);
        // Update whitelist menu text (dirty)
        whitelist_btn.text("Whitelist user images");
      }else{
        whitelist_btn.text("Remove from image whitelist");
      }
    }
  }
});

// Set up whitelisting dialog
function _init(){
  __init = true;
  whitelist_btn.click(function(){
    var userid = get_other_user_id();
    // reload from local storage
    whitelist = $.parseJSON(localStorage.getItem('imgur_img_whitelist')) || {};
    if(userid in whitelist){
      delete whitelist[userid];
      whitelist_btn.text("Whitelist user images");
      $('.message-conversation-blurb:not(.from-user) .message-conversation-blurb-body-image a').find('img, video').parent().each(function(k,v){ _hide_img.call(v) });
      console.log("Removed user with userid "+userid+" from image whitelist.");
    }else{
      whitelist[userid] = 1;
      whitelist_btn.text("Remove from image whitelist");
      $('.message-conversation-blurb:not(.from-user) .message-conversation-blurb-body-image button').each(function(k,v){ _show_img.call(v) });
      console.log("Added user with userid "+userid+" to image whitelist.");
    }
    // save back to local storage
    localStorage.setItem('imgur_img_whitelist', JSON.stringify(whitelist));
  });
  $('.message-conversation-heading-options-items').append(whitelist_btn);  
  // import and export btn
  var btn_export = $('<li style="font-size:0.7em;">export whitelist</li>');
  btn_export.click(function(){
    whitelist = $.parseJSON(localStorage.getItem('imgur_img_whitelist')) || {};
    prompt("Copy to clipboard: Ctrl+C, Enter", JSON.stringify(whitelist));
  });
  var btn_import = $('<li style="font-size:0.7em;">import whitelist</li>');
  btn_import.click(function(){
    whitelist = $.parseJSON(localStorage.getItem('imgur_img_whitelist')) || {};
    var data = prompt("Paste your exported data:");
    try {
        data = JSON.parse(data);
    } catch(e) {
      alert("Could not parse the inserted data. Sorry.");
      return;
    }
    if (!confirm('Do you want to merge the whitelist ?')) {
      whitelist = {};
    }
    // TODO: we should maybe check if the key is valid (parseable as int)
    for (var attrname in data) {
      whitelist[attrname] = data[attrname];
    }
    localStorage.setItem('imgur_img_whitelist', JSON.stringify(whitelist));
  });
  $('.message-conversation-heading-options-items').append(btn_export).append(btn_import);
}


observer.observe($('.message-conversation')[0], { subtree: true, childList: true });
