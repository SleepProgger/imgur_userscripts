// ==UserScript==
// @name        imgur_community_mute
// @namespace   someName
// @include     https://community.imgur.com/*
// @version     0.81a
// @grant       none
// ==/UserScript==

/*
* Hides user on discourse software.
* Known bugs:
*  - After a click on the "replied to" button (top right) the post is made visible again.
*  - The settings UI only might requires a F5 press on the account page to be visible
*/

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

$(document).ready(function(){
  // After how long we try to update the user name. (Only relevant for the settings UI)
  var GET_USER_DATA_AFTER = 60*60;
  // Hide the full post like it was never there.
  var HIDE_FULL_POST = false;
  var HIDE_AVATAR = true;
  var HIDE_NAME = false;
  // Ad a butotn to hidden posts (if HIDE_FULL_POST == false) to temporary show the post.
  var ADD_TMP_SHOW_BUTTON = true;
  // Icons to use
  var ICON_MUTE = "microphone-slash"; //"fa-microphone-slash";
  var ICON_UNMUTE = "microphone";
  var ICON_TMP_SHOW = "far-eye";
  var ICON_TMP_HIDE = "far-eye-slash";
  // Styles to use for the buttons
  var BTN_STYLE = "background: none; font-size: 1.3em; vertical-align:top; border:none;";
  var GR_COOKIE_NAME = 'imgur_community_mute';

  var hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}'));

  function gen_prefixed_css(data, prefixes, values){
     // ahhhhhh
    var ret = "";
    for(var i=0; i<prefixes.length; ++i){
      var tmp = data;
      for(var j=0; j<values.length; ++j){
        // js... why is everything so complicated ?
        tmp = tmp.split(values[j]).join(prefixes[i]);
      }
      ret += tmp;
    }
    return ret;
  }
  // inject CSS "MutationObserver" (see http://www.backalleycoder.com/2012/04/25/i-want-a-damnodeinserted/)
  var css = document.createElement('style');
  css.type = 'text/css';
  document.body.appendChild(css);
  css.innerHTML = gen_prefixed_css("@keyframes nodeInserted { from {outline-color: #fff} to {outline-color: #000} }\n", ['keyframes', '-webkit-keyframes'], ['keyframes']) +
    "article[data-user-id] {" +
    gen_prefixed_css("animation: nodeInserted 0.01s;\n", ['animation', '-webkit-animation'], ['animation']) +
    "}\n" +
     ".pref-avatar {" +
      gen_prefixed_css("animation: nodeInserted 0.01s;\n", ['animation', '-webkit-animation'], ['animation']) +
    "}\n";
  document.addEventListener('animationstart', handle_post, true);
  document.addEventListener('mozAnimationstart', handle_post, true);
  document.addEventListener('webkitAnimationstart', handle_post, true);
  // Add missing svg icons:
  var own_icons = $('<div id="own_svg_foo"><svg xmlns="http://www.w3.org/2000/svg" style="display:none"></svg></div>');
  $(document.body).append(own_icons);
  own_icons.find('svg').append('<symbol viewBox="0 0 640 512" id="microphone"><path d="M237.541,328.897c25.128,0,46.632-8.946,64.523-26.83c17.888-17.884,26.833-39.399,26.833-64.525V91.365 c0-25.126-8.938-46.632-26.833-64.525C284.173,8.951,262.669,0,237.541,0c-25.125,0-46.632,8.951-64.524,26.84 c-17.893,17.89-26.838,39.399-26.838,64.525v146.177c0,25.125,8.949,46.641,26.838,64.525 C190.906,319.951,212.416,328.897,237.541,328.897z"/> <path d="M396.563,188.15c-3.606-3.617-7.898-5.426-12.847-5.426c-4.944,0-9.226,1.809-12.847,5.426 c-3.613,3.616-5.421,7.898-5.421,12.845v36.547c0,35.214-12.518,65.333-37.548,90.362c-25.022,25.03-55.145,37.545-90.36,37.545 c-35.214,0-65.334-12.515-90.365-37.545c-25.028-25.022-37.541-55.147-37.541-90.362v-36.547c0-4.947-1.809-9.229-5.424-12.845 c-3.617-3.617-7.895-5.426-12.847-5.426c-4.952,0-9.235,1.809-12.85,5.426c-3.618,3.616-5.426,7.898-5.426,12.845v36.547 c0,42.065,14.04,78.659,42.112,109.776c28.073,31.118,62.762,48.961,104.068,53.526v37.691h-73.089 c-4.949,0-9.231,1.811-12.847,5.428c-3.617,3.614-5.426,7.898-5.426,12.847c0,4.941,1.809,9.233,5.426,12.847 c3.616,3.614,7.898,5.428,12.847,5.428h182.719c4.948,0,9.236-1.813,12.847-5.428c3.621-3.613,5.431-7.905,5.431-12.847 c0-4.948-1.81-9.232-5.431-12.847c-3.61-3.617-7.898-5.428-12.847-5.428h-73.08v-37.691 c41.299-4.565,75.985-22.408,104.061-53.526c28.076-31.117,42.12-67.711,42.12-109.776v-36.547 C401.998,196.049,400.185,191.77,396.563,188.15z"/></symbol>');
  // Hackish way to get the svg to display. Not sure if that'll work in all browsers.... If all else fails, simply use base64 encoded png....
  $("#own_svg_foo").html($("#own_svg_foo").html());

  function hide_post(article){
    if(HIDE_FULL_POST){
      article.parentNode.style.display = "none";
      return;
    }
    article = $(article);
    if(HIDE_AVATAR) article.find('.topic-avatar').css('visibility', 'hidden');
    if(HIDE_NAME) article.find('.names').hide();
    article.find('.contents').hide();
    article.find('.mute_btn').attr('title', 'Unmute user.').find('svg use').attr('xlink:href', '#'+ICON_UNMUTE);
    if(ADD_TMP_SHOW_BUTTON) article.find('.show_post_btn').show();
  }

  function unhide_post(article){
    article = $(article);
    article.find('.topic-avatar').css('visibility', 'visible');
    article.find('.names, .contents').show();
    article.find('.mute_btn').attr('title', 'Mute user.').find('svg use').attr('xlink:href', '#'+ICON_MUTE);
    if(ADD_TMP_SHOW_BUTTON) article.find('.show_post_btn').attr('title', "Show post.").hide();
  }

  function handle_post(event){
    if (event.animationName != 'nodeInserted') return;
    if($(event.target).hasClass("pref-avatar")){
      setup_settings_ui();
      return;
    }
    var post = event.target;
    var user_id = parseInt(post.getAttribute('data-user-id'));
    var _btn_title = "Mute this user.";
    var _btn_class = ICON_MUTE;
    if(hide_ids[user_id]){
      var user_name = $(post).find('.username a').text();
      // Update our cached names.
      if(! $.isArray(hide_ids[user_id]) || hide_ids[user_id][0] != user_name){
        console.log("Update username for", user_id, user_name);
        hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')); // in case another tab changed it
        hide_ids[user_id] = [user_name, new Date().getTime() / 1000];
        GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
      }
      if(HIDE_FULL_POST){
        hide_post(post);
        return;
      }
      _btn_title = "Unmute user."
      _btn_class = ICON_UNMUTE;
    }
    // Add buttons
    var node = $(post);
    if(node.find('.mute_btn').length > 0) return;
    var btn = $('<button title="'+_btn_title+'" style="'+BTN_STYLE+'" class="mute_btn"><svg class="fa d-icon d-icon-ellipsis-h svg-icon svg-node"><use xlink:href="#'+ICON_MUTE+'"></use></svg></button>');
    btn.insertBefore(node.find('.post-date').last());
    if(ADD_TMP_SHOW_BUTTON){
      var btn_tmp = $('<button title="Show post." style="display:none; '+BTN_STYLE+'" class="show_post_btn"><svg class="fa d-icon d-icon-ellipsis-h svg-icon svg-node"><use xlink:href="#'+ICON_TMP_SHOW+'"></use></svg></button>');
      btn_tmp.click(function(){
        if(this.title == "Show post."){ // dirty
          node.find('.contents').show()
          this.title = "Hide post."; // TODO: switch to svg usage
          btn_tmp.find('svg use').attr('xlink:href', '#'+ICON_TMP_HIDE);
        }else{
          node.find('.contents').hide()
          this.title = "Show post.";
          btn_tmp.find('svg use').attr('xlink:href', '#'+ICON_TMP_SHOW);
        }
      });
      btn_tmp.insertBefore(btn);
    }
    btn.click(on_mute_user);
    if(hide_ids[user_id])hide_post(post);
  }

  function on_mute_user(evt){
    var article = $(this).parents('article');
    // We don't handle the case of multiple authors of a post (wiki).
    var username = article.find('.username a').text();
    var user_id = parseInt(article[0].getAttribute('data-user-id'));
    var _question = "Mute ";
    var _func = hide_post;
    if(hide_ids[user_id]){
      _question = "Unmute ";
      _func = unhide_post;
    }
    if (confirm(_question + username + " ?")){
     hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')) // in case another tab changed it
     if(hide_ids[user_id]) delete hide_ids[user_id];
     else hide_ids[user_id] = [username, new Date().getTime() / 1000];
     GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
     jumpToPost(article[0].getAttribute('data-post-id'));
     $('article[data-user-id="'+user_id+'"]').each(function(_,a){_func(a)});
    }
    return false;
  }

  function jumpToPost(postid){
    var topic = Discourse.__container__.lookup('controller:topic');
    topic._jumpToPostId(postid);
  }
  /*
  * UI stuff follows
  */
  // Removed and i am too lazy to do it properly
  /*Discourse.PageTracker.current().on('change', function(url){
    setup_settings_ui();
  });*/
  /*function _wait_for_settings(){
    if(!!window.location.pathname.match('/preferences(/account/?)?$')){
      if($('.pref-avatar').length){
        setup_settings_ui();
      }else{
        console.log("Wait for settings");
        window.setTimeout(_wait_for_settings, 250);
      }
    }
  }
  _wait_for_settings();*/


  function _lookup_user(user_id, user, cb){
    // TODO: Does the store cache data ? Or is there some user cache somewhere we can use ?
    var user_name = user[0];
    if(user_name.length == 0){
      cb(user_id, "", -1, false);
      return false;
    }
    var age = (new Date().getTime() / 1000) - user[1];
    if(age <= GET_USER_DATA_AFTER){
      cb(user_id, user_name, age, true);
      return;
    }
    var store = Discourse.__container__.lookup('store:main');
    var a = store.find('user', user_name).catch(function(){
      // Prevent error report from being generated
      console.log('lookup_user', user_id, "Invalid username");
      // TODO: we could search the first x pages of the user endpoint
      // to see if we find the user.
      cb(user_id, user_name, age, false);
    }).then(function(data){
      if(data.id === user_id){
        cb(user_id, user_name, 0, true);
        return;
      }
      cb(user_id, user_name, age, false);
    });
  }

  function setup_settings_ui(){
    if(!window.location.pathname.match('/preferences(/account/?)?$') ) {
      return;
    }
      console.log("Settings UI");
    var settings_pane = $('.pref_cfg_mute_user');
    var blocked_count = Object.keys(hide_ids).length;
    var box;
    if(settings_pane.length > 0){
      settings_pane.attr('data-user-count', blocked_count).find('select').html("");
      box = settings_pane.find('select');
    }else{
      settings_pane = $('<div class="pref_cfg_mute_user control-group" data-user-count="'+blocked_count+'"></div>');
      settings_pane.insertBefore($('.save-button').last());
      box = $('<select size="5"></select>');
      var btn_del = $('<button class"btn-secondary btn ember-view">Unhide</button>');
      var btn_import = $('<button class"btn-secondary btn ember-view">Import</button>');
      var btn_export = $('<button class"btn-secondary btn ember-view">Export</button>');
      settings_pane.append('<label class="control-label">Muted user</label>');
      settings_pane.append(btn_import, btn_export, '</br>', box, '</br>', btn_del);
      btn_import.click(on_import);
      btn_export.click(function(){
        hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')) // in case another tab changed it
        var data = JSON.stringify(hide_ids);
        prompt("Select all and copy the data:", data);
        return false;
      });
      btn_del.click(function(){
        var selected = box.val();
        if(selected != -1){
          selected = parseInt(selected);
          var option = box.find('option:selected');
          if (confirm("Unmute " + option.text())){
            hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')) // in case another tab changed it
            delete hide_ids[selected];
            GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
            option.remove();
          }
        }
        return false;
      });
    }
    hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')) // in case another tab changed it
    for(var i in hide_ids){
      i = parseInt(i);
      if(! $.isArray(hide_ids[i])){
        hide_ids[i] = ["", new Date().getTime() / 1000]
      }
      var option = $('<option value="'+i+'">Loading info</option>');
      box.append(option);
      _lookup_user(i, hide_ids[i], function(user_id, user_name, age, success){
        var now = new Date().getTime() / 1000;
        hide_ids[user_id] = [user_name, now-age];
        GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
        option = box.find('option[value="'+user_id+'"]');
        if(!success){
          option.text("User id: " + user_id);
          // TODO: Ask if we should crawl the first x userpages via the API to find the username.
          var last_seen = age >= 60*60 ? parseInt(age/60/60) + " hours ago" : parseInt(age/60) + " minutes ago";
          if(user_name.length) last_seen += " as user " + user_name;
          option.css('color', 'red').attr('title', "Couldn't find username.\nLast seen "+last_seen+".\nSimply continuing to browse might fix this.");
        }else{
          option.text(user_name);
        }
      });
    }
  }

  function on_import(){
    hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')) // in case another tab changed it
    var data = prompt("Paste your exported data:");
    if(!data || data.length < 5) return false;
    data = $.parseJSON(data);
    for(var i in data){
      i = parseInt(i);
      if(data.hasOwnProperty(i)){
        var old_data = hide_ids[i];
        if(!old_data)
          hide_ids[i] = data[i];
        else{
          if( !$.isArray(data[i]) || old_data[1] >= data[i][1] )
            hide_ids[i] = old_data;
          else
            hide_ids[i] = data[i];
        }
      }
    }
    GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
    setup_settings_ui();
    return false;
  }
});
