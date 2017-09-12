// ==UserScript==
// @name        imgur_community_mute
// @namespace   someName
// @include     https://community.imgur.com/*
// @version     0.6a
// @grant       none
// ==/UserScript==

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
  var HIDE_FULL_POST = true;
  var HIDE_AVATAR = true;
  var HIDE_NAME = true;
  
  var GR_COOKIE_NAME = 'imgur_community_mute';
  var hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}'));
  
  function gen_prefixed_css(data, prefixes, values){
     // ahhhhhh
    var ret = "";
    for(i=0; i<prefixes.length; ++i){
      var tmp = data;
      for(j=0; j<values.length; ++j){
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
    "}\n";
  console.log(css.innerHTML);
  document.addEventListener('animationstart', handle_post, true);
  document.addEventListener('mozAnimationstart', handle_post, true);
  document.addEventListener('webkitAnimationstart', handle_post, true);

  function hide_post(article){
    if(HIDE_FULL_POST){
      article.parentNode.style.display = "none";
      return;
    }
    article = $(article);
    if(HIDE_AVATAR) article.find('.avatar').css('visibility', 'hidden');
    if(HIDE_NAME) article.find('.names').hide();
    article.find('.contents').hide();
  }

  function handle_post(event){
    if (event.animationName != 'nodeInserted') return;
    var post = event.target;
    var user_id = parseInt(post.getAttribute('data-user-id'));
    if(hide_ids[user_id]){
      var user_name = $(post).find('.username a').text();
      // Update our cached names.
      if(! $.isArray(hide_ids[user_id]) || hide_ids[user_id][0] != user_name){
        console.log("Update username for", user_id, user_name);
        hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')); // in case another tab changed it
        hide_ids[user_id] = [user_name, new Date().getTime() / 1000];
        GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
      }
      hide_post(post);
      return;
    }

    var node = $(post);
    if(node.find('.mute_btn').length > 0) return;
    var btn = $('<button title="Mute this user." style="background: none;" class="mute_btn btn-icon"><i class="fa fa-microphone-slash"></i></button>');;
    btn.insertBefore(node.find('.create').last());
    btn.click(on_mute_user);
  }

  function on_mute_user(evt){
    var user_id = $(this).parents('article');
    // We don't handle the case of multiple authors of a post (wiki).
    var username = user_id.find('.username a').text();
    user_id = parseInt(user_id[0].getAttribute('data-user-id'));
    if (confirm("Mute " + username + " ?")){
     hide_ids = $.parseJSON(GM_getValue(GR_COOKIE_NAME, '{}')) // in case another tab changed it
     hide_ids[user_id] = [username, new Date().getTime() / 1000];
     GM_setValue(GR_COOKIE_NAME, JSON.stringify(hide_ids));
     $('article[data-user-id="'+user_id+'"]').each(function(_,a){hide_post(a)});
    }
    return false;
  }

  /*
  * UI stuff follows
  */
  Discourse.PageTracker.current().on('change', function(url){
    setup_settings_ui();
  });
  function _lookup_user(user_id, user, cb){
    // TODO: Does the store cache data ? Or is there some user cache somewhere we can use ?
    var user_id = user_id;
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
    a = store.find('user', user_name).catch(function(){
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
          last_seen = age >= 60*60 ? parseInt(age/60/60) + " hours ago" : parseInt(age/60) + " minutes ago";
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
    var data = $.parseJSON(data);
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
