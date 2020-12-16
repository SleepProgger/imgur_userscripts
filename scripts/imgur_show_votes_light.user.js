// ==UserScript==
// @name         Imgur_show_votes
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Userscript to show the up/down votes on old design when hovering over the comment score
// @author       You
// @match        https://imgur.com/gallery/*
// @match        https://imgur.com/user/*
// @match        https://imgur.com/account/*
// @grant        none
// ==/UserScript==

// This script should run at "document-start" so we really don't render the images on the first post,
// but it might just work(TM)
function _code_to_inject() {

  var _flag = "_hooked_imgur_show_votes"
  // We want to ensure we hook it as soon as possible, so lets use MutationObserver to wait for scripts.
  var config = {
    attributes: false,
    childList: true,
    subtree: false,
    characterData: false
  };
  var observer = new MutationObserver(function (mutationsList) {
    for (var mutation of mutationsList) {
      var addedNodes = mutation.addedNodes;
      if (!addedNodes) continue;
      for (var i = 0; i < addedNodes.length; i++) {
        if (addedNodes[i].tagName !== 'SCRIPT') continue;
        var script = addedNodes[i];
        script.onload = script.onreadystatechange = function () {
          if (window.Imgur && Imgur.Comment) {
            _inject();
            observer.disconnect();
          }
        }
      }
    }
  });
  function _inject() {
      console.log("Init show votes");
    init();
  }
  function do_observe() {
    if (window.Imgur && Imgur.Comment)
    _inject();
     else
    observer.observe(document.body, config);
  }
  // Depending on browser and userscript executor the body migh not exists yet.
  if (!document.body) {
    document.onreadystatechange = function () {
      if (document.body) {
        do_observe();
        document.onreadystatechange = null; // TODO: do this nicer
      }
    }
  } else {
    do_observe();
  }

  function hookit(parent, name, func) {
    var o = parent[name];
      if(o['__unhook__']){
          console.log("Already hooked. Skip");
          return;
      }
    var f = function () {
      var x = func.apply(this, [
        o,
        arguments
      ]);
      return x
    };
    parent[name] = f;
    f.__o__ = o;
    f.__unhook__ = function () {
      parent[name] = f.__o__;
    }
  };
  function comment_render_hook(o, args) {
    var x = o.apply(this, args);
    //delete x.props['autoPlay'];
      //console.log("Hook response -> ", this.props);
      //console.log("Visible point ref", this.refs.visible_points);
      if(! this.refs['visible_points'])
          return x;
      this.refs.visible_points.title = " + " + this.props.comment.ups + " - " + this.props.comment.downs;
    return x;
  }
  function init() {
      if(window[_flag]){
          console.log("Already loaded. Skip");
          return;
      }
      window[_flag] = 1;
      console.log("Init");
      hookit(Imgur.Comment.prototype, 'render', comment_render_hook);
    /*if (_hide_imgs)
      hookit(Imgur.Linkifier.prototype, 'grab', linkifier_grab_hook);
    if (!_autoplay)
      hookit(Imgur.Linkifier.prototype, 'reactionVideo', linkifier_reactionVideo_hook);*/
  }
}
var s = document.createElement('script');
s.textContent = '(' + _code_to_inject + ')()';
console.log("Inject into", document.location, ":", s.textContent);
document.head.appendChild(s);
