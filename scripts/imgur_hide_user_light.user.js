// ==UserScript==
// @name        imgur_hide_user_light
// @namespace   imgur_stuff
// @include     https://imgur.com/account/*
// @include     http://imgur.com/account/*
// @include     https://imgur.com/gallery/*
// @include     http://imgur.com/gallery/*
// @include     https://imgur.com/user/*
// @include     http://imgur.com/user/*
// @version     1.4
// @grant       none
// ==/UserScript==

/*
* TODO
* - Add list to settings -> mod section (or inject into imgurs message block list ?)
* - Renove from gallery view
* - Navigate away when direct calling an blocked post ?
* - Block tags
* - Support imgur internals blocking (messages and replies)
*/



var blocked = {
  9730847: [1, 1, 1]
};
// post, comment, reply, last seen username
blocked = $.parseJSON(localStorage.getItem('blocked_user')) || {};
// update blocked structure to point to arrays now
$.each(blocked, function(k, v){
  if(! $.isArray(v))
    blocked[k] = [0, 1, blocked[k], "?"];
  else if(v.length != 4)
    blocked[k] = [blocked[k][0], blocked[k][1], blocked[k][2], "?"];
});
localStorage.setItem("blocked_user", JSON.stringify(blocked));

var captions = undefined;
var captioninstance = undefined;




function inject_mod_menu(){
	if($('#_mod_menu_button').length > 0){
		return $('#mod_settings');
	}
	var btn = $('<li id="_mod_menu_button" data-type="mods">Mods</li>');
	$('#leftside-nav ul').append(btn);
	var space = $('<div class="nodisplay mod_settings" id="mod_settings"></div>');
	$('.settings-content').append(space);
	btn.click(function(){
		btn.addClass("active");
		btn.parent().children().not('[data-type=mods]').removeClass('active');
		space.css('display', 'block');
		space.parent().children().not('#mod_settings').css('display', 'none');
	});
	btn.parent().children().not('[data-type=mods]').click(function(){
		space.css('display', 'none');
	});
	return space;
}

function setup_settings_gui(){
  blocked = $.parseJSON(localStorage.getItem('blocked_user')) || {};
  var space = inject_mod_menu();
  var content = $('<div class="section"></div>');
  var user_table = $('<table style="width:100%"><tr class="app"><td>User name</td><td>Posts</td><td>Comments</td><td>Replies</td><td>Remove</td></tr></table>');
  $.each(blocked, function(k, v){
    if(k == null || v == null) return;
      console.log(k , v);
    var row = $('<tr class="app"><td></td><td></td><td></td><td></td><td></td></tr>');
    row.find('td').get(0).innerHTML = '<a href="/user/'+v[3]+'">'+v[3]+'</a>';
    row.find('td').get(1).innerHTML = v[0] == 1 ? 'Blocked' : 'Shown';
    row.find('td').get(2).innerHTML = v[1] == 1 ? 'Blocked' : 'Shown';
    row.find('td').get(3).innerHTML = v[2] == 1 ? 'Blocked' : 'Shown';
    var delbtn = $('<a data-id="'+k+'" href="">delete</a>');
    delbtn.click(function(){
      delete blocked[$(this).attr('data-id')];
      localStorage.setItem("blocked_user", JSON.stringify(blocked));
      $(this).parent().parent().remove();
      return false;
    });
    row.find('td').eq(4).append(delbtn);
    user_table.append(row);
  });
  /*  // This was used when reddit post would appear on imgrue posted as "reddit" user. TODO: trash
  var show_crossposts = $('<a>'+(blocked.hasOwnProperty("null") ? 'Show' : 'Hide')+' crossposts</a>');
  show_crossposts.click(function(){
    if(blocked.hasOwnProperty("null")){
      delete blocked[null];
      localStorage.setItem("blocked_user", JSON.stringify(blocked));
      show_crossposts.text('Hide crossposts');
    }else{
      blocked[null] = [1, 0, 0, null];
      localStorage.setItem("blocked_user", JSON.stringify(blocked));
      show_crossposts.text('Show crossposts');
    }
  });
  */

  var exinport = $('<span><button class="btn-small btn-gray">Export blocklist</button> <button class="btn-small btn-main">Import blocklist</button> <button class="btn-small btn-destructive">Clear blocklist</button></span>');
  $(exinport.find("button")[0]).click(function(){
    var _ui = $('<div><textarea readonly=""></textarea><br/><button class="btn-small btn-destructive">Close</button></div>');
    _ui.css({background: "gray", padding: "2px", position: "absolute", "width": "400px", "height": "300px", "margin-left": "-200px", left: "50%", top: "0px"});
    _ui.find("textarea").css({width: "100%", height: "100%"});
    _ui.find(".btn-destructive").click(function(){_ui.remove();});
    _ui.find("textarea").val(JSON.stringify(blocked)).select();
    content.append(_ui);
  });

  $(exinport.find("button")[1]).click(function(){
    var _ui = $('<div><textarea></textarea><br/><button class="btn-small btn-main">Load</button> <button class="btn-small btn-destructive">Close</button></div>');
    _ui.css({background: "gray", padding: "2px", position: "absolute", "width": "400px", "height": "300px", "margin-left": "-200px", left: "50%", top: "0px"});
    _ui.find("textarea").css({width: "100%", height: "100%"});
    _ui.find(".btn-main").click(function(){
        blocked = $.parseJSON(localStorage.getItem('blocked_user')) || {};
        var data = $.parseJSON(_ui.find("textarea").val()) || {};
        $.each(data, function(k, v){
            if(! $.isArray(v))
                blocked[k] = [0, 1, data[k], "?"];
            else if(v.length != 4)
                blocked[k] = [data[k][0], data[k][1], data[k][2], "?"];
            else
                blocked[k] = data[k];
        });
        localStorage.setItem("blocked_user", JSON.stringify(blocked));
        content.remove();
        setup_settings_gui();
    });
    _ui.find(".btn-destructive").click(function(){_ui.remove();});
    content.append(_ui);
  });

  $(exinport.find("button")[2]).click(function(){
    if(window.confirm("Are you sure you want to delete all blocked user ?")){
        localStorage.setItem("blocked_user", "{}");
        content.remove();
        setup_settings_gui();
    }
  });

  content.append('<h2>Blocked user</h2>');
  content.append(user_table);
  content.append('<br/><h3>Misc.</h3>');
  content.append(exinport);
  space.append(content);
}


// All the gui setup to add/remove blocked user
function setup_block_gui(){
  // TODO: make this look nicer
  var block_gui = $(
   '<div style="float:right; margin-bottom: 5px;" class="textbox button">' + // TODO: use lables here instead....
    '<span><input style="margin-left:5px;" type="checkbox" id="block_posts" />Block posts</span>' +
    '<span><input style="margin-left:10px;" type="checkbox" id="block_comments" />Block comments</span>' +
    '<span><input style="margin-left:10px;" type="checkbox" id="block_replies" />Block replies</span>' +
    '<span style="margin-left: 20px"><img src="https://s.imgur.com/images/loaders/ddddd1_181817/48.gif" style="max-width:25px; max-height:25px; border:0px;" /></span>'+
   '</div>'
  ).insertBefore('.panel-header');
  $('.panel-header').css('clear', 'right');
  block_gui.find('span').css('color', 'gray').find('input').prop('disabled', true);
  // Get user id via imgur api form username (TODO: find a way without the api. It need to be there somewhere on the page already)
  var CLIENT_ID = 'cd0695f1226536b';
  var username = window.location.pathname.split('/', 4) [2];
  var endpoint = 'https://api.imgur.com/3/account/' + username;

  $.ajax({
    url: endpoint,
    method: 'GET',
    headers: {
      Authorization: 'Client-ID ' + CLIENT_ID,
      Accept: 'application/json'
    },
    success: function(response){
      // TODO: handle failed requests
      if(response.success){
        // post, comment, reply, last seen username
        var checkbox_post = block_gui.find('#block_posts');
        var checkbox_comment = block_gui.find('#block_comments');
        var checkbox_reply = block_gui.find('#block_replies');
        if(blocked.hasOwnProperty(response.data.id)){
          var user = blocked[response.data.id];
          // update name (if necessarry)
          if(user[3] != username){
            user[3] = username;
            localStorage.setItem("blocked_user", JSON.stringify(blocked));
          }
          checkbox_post.prop('checked', blocked[response.data.id][0] == 1);
          checkbox_comment.prop('checked', blocked[response.data.id][1] == 1);
          checkbox_reply.prop('checked', blocked[response.data.id][2] == 1);
        }else{
          checkbox_post.prop('checked', false);
          checkbox_comment.prop('checked', false);
          checkbox_reply.prop('checked', false);
        }
        block_gui.find('img').hide();
        block_gui.find('span').css('color', 'white').find('input').prop('disabled', false);

        function _set_flags(userid, index, state){
            // post, commment, reply, last seen, username
            blocked = $.parseJSON(localStorage.getItem('blocked_user')) || {};
            var user = blocked[userid] || [0, 0, 0, username];
            user[index] = state;
            if(user[0] + user[1] + user[2] == 0){
                delete blocked[userid];
            } else {
                blocked[userid] = user;
            }
            localStorage.setItem("blocked_user", JSON.stringify(blocked));
        }
        // Block posts ?
        checkbox_post.change(function(){
          _set_flags(response.data.id, 0, checkbox_post.prop('checked') ? 1 : 0);
        });
        // Block comments ?
        checkbox_comment.change(function(){
          _set_flags(response.data.id, 1, checkbox_comment.prop('checked') ? 1 : 0);
        });
        // Block replies ?
        checkbox_reply.change(function(){
          _set_flags(response.data.id, 2, checkbox_reply.prop('checked') ? 1 : 0);
        });
      }
    },
    error: undefined
  });
}



/*
* Yadda yadda
*/
function handle_blocked_comments(blocked_cb) {
  var insideNav = Imgur.InsideNav._instance;
  captioninstance = insideNav._.captionInstance;
  captions = captioninstance._.captions[insideNav._.hash];
  var blocked_captions = captioninstance.getCaptionIdsByFilter(insideNav._.hash, function (caption) {
    return blocked.hasOwnProperty(caption.author_id) && blocked[caption.author_id][1] == 1;
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



function hookit_pre(parent, funcname, callback){
  var _ori = parent[funcname];
  parent[funcname] = function(){
    arguments = callback.apply(this, arguments);
    return _ori.apply(this, arguments);
  }
}
function hookit_post(parent, funcname, callback){
  var _ori = parent[funcname];
  parent[funcname] = function(){
    var _ret = _ori.apply(this, arguments);
    _ret = callback.apply(this, [arguments, _ret]);
    return _ret;
  };
}

// Are we on the settings page ?
if (window.location.pathname.indexOf('/account/settings') == 0) {
  setup_settings_gui();
}
// Show hide and show buttons on user profile
else if (window.location.pathname.indexOf('/user/') == 0 && window.location.pathname.indexOf('/favorites/') == - 1) {
  // Why would you block yourself ?
  if(imgur._.auth.url != window.location.pathname.split('/', 4) [2]){
   setup_block_gui();
  }
}
// Filter posts and comments
 else {
   // TODO: navigate away when first load is blocked ?
   // Filter posts:
   /* TODO: try this for the initial load 
   hookit_pre(Imgur.InsideNav._instance._.sideGallery, '_loadPage', function(){
     console.log('asd load', arguments);
     return arguments;
   });
   */
   // This works sometimes for the initial load, but always for every load after that
   hookit_pre(Imgur.InsideNav._instance._.sideGallery, '_ajaxSuccess', function(args){
     arguments[0]['data'] = $.grep(arguments[0]['data'], function(v){
       return !(blocked.hasOwnProperty(v.account_id) && blocked[v.account_id][0] == 1);
     });
     return arguments;
   });
   imgur._.emitter.callbacks['sidegalleryPageLoad'].push({f:function(){
     // pretty dirty but the values are overwritten soemwehere after the event
     // TODO: ...
     window.setTimeout(function(){
       Imgur.InsideNav._instance._.sideGallery.state.items = $.grep(Imgur.InsideNav._instance._.sideGallery.state.items, function(v){
         //if((blocked.hasOwnProperty(v.account_id) && blocked[v.account_id][0] == 1))
         // console.log('asd block', v);
         return !(blocked.hasOwnProperty(v.account_id) && blocked[v.account_id][0] == 1);
       });
       // recreate the box (TODO: Read that code)
       Imgur.InsideNav._instance._.sideGallery._onScroll();
     }, 1000);
   }, this_arg:{}});

  // Filter comments
  // I didn't found a fitting  event to filter the comments, so lets just hook the process comments function
  // TODO: try to run earlier or run once at site load for already loaded comments
  var _pcaptions = Imgur.InsideNav._instance.processCaptions;
  function process_captions_hook(ori, ori_this) {
    handle_blocked_comments(function (comment) {
      //if(blocked[comment.author_id][1] == 0)
        //return;
      //console.log('asd removed before render:', comment);
      if (blocked[comment.author_id][2] == 1 || !has_nonblocked_childs(comment)) {
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
      if (blocked[comment.author_id][2] == 1 || !has_nonblocked_childs(comment)) {
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
