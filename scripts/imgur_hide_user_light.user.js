// ==UserScript==
// @name        ImgurHideUser
// @namespace   imgur_stuff
// @include     https://imgur.com/account/*
// @include     http://imgur.com/account/*
// @include     https://imgur.com/gallery/*
// @include     http://imgur.com/gallery/*
// @include     https://imgur.com/user/*
// @include     http://imgur.com/user/*
// @version     1
// @grant       none
// ==/UserScript==

//if (!localStorage.caption_filter) localStorage.caption_filter = {};
var blocked = {
  9730847: 0
};
blocked = $.parseJSON(localStorage.getItem('caption_filter')) || {};
var captions = undefined;
var captioninstance = undefined;


/*
* Yadda yadda
*/
function handle_blocked_comments(blocked_cb) {
  var insideNav = Imgur.InsideNav._instance;
  captioninstance = insideNav._.captionInstance;
  captions = captioninstance._.captions[insideNav._.hash];
  var blocked_captions = captioninstance.getCaptionIdsByFilter(insideNav._.hash, function (caption) {
    return blocked.hasOwnProperty(caption.author_id);
  });
  $.grep(blocked_captions, function (v) {
    blocked_cb(captions.set[v]);
  });
}

/*
* Traverse the comment replies and test if there are any non blocked comments
*/
function has_nonblocked_childs(caption) {
  if (captions.children[caption.id] == null)
  return false
  for (var i = 0; i < captions.children[caption.id].length; ++i) {
    var child = captions.set[captions.children[caption.id][i]];
    if (!blocked.hasOwnProperty(child.author_id))
    return true;
    if (has_nonblocked_childs(child))
    return true;
  }
  return false;
}


// All the gui setup to add/remove blocked user
function setup_block_gui(){
  // TODO: make this look nicer
  var block_gui = $('<div style="float:right; margin-bottom: 5px;" class="textbox button"><input style="margin-left:5px;" type="checkbox" />Block child replies' + 
                    '<span style="margin-left: 20px"><img src="https://s.imgur.com/images/loaders/ddddd1_181817/48.gif" style="max-width:25px; max-height:25px; border:0px;" /></span></div>').insertBefore('.panel-header');
  $('.panel-header').css('clear', 'right');
  // Get user id via imgur api form username (TODO: find a way without the api. It need to be there somewhere on the page already)
  var CLIENT_ID = 'cd0695f1226536b';
  var endpoint = 'https://api.imgur.com/3/account/' + window.location.pathname.split('/', 4) [2];
  $.ajax({
    url: endpoint,
    method: 'GET',
    headers: {
      Authorization: 'Client-ID ' + CLIENT_ID,
      Accept: 'application/json'
    },
    success: function(response){
      if(response.success){
        var btn = $('<button style="margin-left:20px;"></button>');
        var checkbox = block_gui.find('input');
        if(blocked.hasOwnProperty(response.data.id)){
          btn.text("Unblock user");
          checkbox.prop('checked', blocked[response.data.id] == 1);
        }else{
          btn.text("Block user");
          checkbox.prop('checked', false);
        }
        block_gui.find('img').replaceWith(btn);
        // Add/remove blocked user
        btn.click(function(){
          if(! blocked.hasOwnProperty(response.data.id)){
            blocked[response.data.id] = checkbox.prop('checked') ? 1 : 0;
            btn.text("Unblock user");
          }else{
            delete blocked[response.data.id];
            btn.text("Block user");
          }
          localStorage.setItem("caption_filter", JSON.stringify(blocked));
        });
        // Remove all childs ?
        checkbox.change(function(){
          if(blocked.hasOwnProperty(response.data.id)){
           blocked[response.data.id] = checkbox.prop('checked') ? 1 : 0;
           localStorage.setItem("caption_filter", JSON.stringify(blocked));
          }
        });
      }
    },
    error: undefined
  });
}

/*
* captioninstance.deleteCaption sometimes doesn't work (why ever), So lets just rewrite that
*/
function deleteCaption(caption_id) {
  captions.children[captions.parent[caption_id]] = $.grep(captions.children[captions.parent[caption_id]], function (child_id) {
    return child_id != caption_id;
  });
  delete captions.parent[caption_id];
  delete captions.set[caption_id];
  //delete captions.children[caption_id];
}



// Are we on the settings page ?
if (window.location.pathname.indexOf('/account/settings') == 0) {
  // TODO: implement
}
// Show hide and show buttons on user profile
else if (window.location.pathname.indexOf('/user/') == 0 && window.location.pathname.indexOf('/favorites/') == - 1) {
  setup_block_gui();
}
// Filter posts and comments
 else {
// I didn't found a fitting  event to filter the comments, so lets just hook the process comments function
// TODO: try to run earlier or run once at site load for already loaded comments
var _pcaptions = Imgur.InsideNav._instance.processCaptions;
function process_captions_hook(ori, ori_this) {
  handle_blocked_comments(function (comment) {
    //console.log('asd removed before render:', comment);
    if (blocked[comment.author_id] == 1 || !has_nonblocked_childs(comment)) {
      deleteCaption(comment.id);
    } else {
      comment.caption = 'Blocked';
    }
  });
  ori.call(Imgur.InsideNav._instance);
}
Imgur.InsideNav._instance.processCaptions = process_captions_hook.bind(this, _pcaptions, Imgur.InsideNav._instance);
/*
* Remove all already rendered comments. Used for the initial load.
*/
function remove_rendered_comments() {
  handle_blocked_comments(function (comment) {
    //console.log('asd Removed after render:', comment);
    if (blocked[comment.author_id] == 1 || !has_nonblocked_childs(comment)) {
      captioninstance.deleteCaption(comment.id);
      $('.caption').filter('[data-id="' + comment.id + '"]').hide();
    } else {
      comment.caption = 'Blocked';
      $('.caption').filter('[data-id="' + comment.id + '"]').find('.usertext p span').text('Blocked');
    }
  });
}
remove_rendered_comments();
}
