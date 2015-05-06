// ==UserScript==
// @name        ic_logo_to_latest
// @namespace   foo
// @include     https://community.imgur.com*
// @include     http://community.imgur.com*
// @version     0.3
// @grant       none
// ==/UserScript==


var home_path = "/latest";


/*
* Patch for GM_getValue and GM_SetValue support for chrome (actually used with greasemonkey, too if the GM_* funcs are not granted ?!)
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


// load choosen path
home_path = GM_getValue("IC_HOME_PATH", home_path);


// fire a custom event everytime the url changes via history.push/replaceState
var lastUrl = "";
var _oldHistory_pushState = history.pushState;
history.pushState = function(){
  _oldHistory_pushState.apply(this, arguments);
  if(lastUrl !== arguments[2]){ 
    $(history).trigger("history_state_changed", arguments);
    lastUrl = arguments[2];
  }
}
var _oldHistory_replaceState = history.replaceState;
history.replaceState = function(){
  _oldHistory_replaceState.apply(this, arguments);
  if(lastUrl !== arguments[2]){ 
    $(history).trigger("history_state_changed", arguments);
    lastUrl = arguments[2];
  }
}


// replace the logo click handler
$(window).ready(function(){
  $('.title a').attr("href", home_path).click(function(){Discourse.URL.routeTo(home_path); return false});
});


// settings for the "home" page
$(history).on("history_state_changed", function(evt, ob, title, url){
  if( url.indexOf("/users/" + Discourse.User.current().username.toLowerCase() + "/preferences") === 0 ){
    // we need to wait for the dynamic content to load. This is an utterly shitty approach, but lets hope its good enough for now
    // TODO: check in interval if releavant part is loaded ?
    // TODO: or is there some element i can observe ?
    window.setTimeout(function(){ 
      // just in case it got changed in another tab
      home_path = GM_getValue("IC_HOME_PATH", home_path);
      $(".other").append('<div class="control-group pref-home_page"><label class="control-label">Logo redirect</label><div class="controls"><input class="ember-view ember-text-field input-xxlarge" id="logo_redirect" type="text" value="'+home_path+'"></div></div>');
      $('.btn-primary').click(function(){
        home_path = $("#logo_redirect").val();
        GM_setValue("IC_HOME_PATH", home_path);
        $('.title a').attr("href", home_path);
        return true;
      });
    }, 2000);
    //});
  }
});
