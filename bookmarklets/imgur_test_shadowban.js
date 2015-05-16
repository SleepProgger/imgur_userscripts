// Version: 0.2
(function(){
  // from http://stackoverflow.com/a/2548133/4830897
  String.prototype.endsWith = function(suffix) {
      return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };

  function has_comment(data, comment_id){
    for(var i=0; i < data.length; ++i){
      if(data[i].id == comment_id) return true;
      if(data[i].children.length > 0 && has_comment(data[i].children, comment_id)) return true;
    }
    return false;
  }

  var _m1 = "Can't detect shadowban status. Sorry.";
  $(document).ready(function (){
    if(! location.pathname.endsWith('/index/newest')){
      alert("Please sort by newest first and click the bookmarklet again.");
      return;
    }
    var CLIENT_ID = "cd0695f1226536b";
    var comment = $('.comment-item');
    if(comment.length === 0){
      alert("The user need comments. " + _m1);
      return;
    }
    comment = comment.first();
    username = comment.find('.author a').html();
    if(username.length === 0){
      alert("Invalid username. " + _m1);
      return;
    }
    var commentid  = comment.find('.permalink-caption-link').attr('href').split('/');
    commentid  = commentid[commentid.length - 1];
    var link = comment.find('.image a').attr('href');
    $.ajax({
      url: 'https://api.imgur.com/3'+link+'/comments',
      method: 'GET',
      headers: {
        Authorization: 'Client-ID ' + CLIENT_ID,
        Accept: 'application/json'
      },
      success: function(result, status, request) {
        console.log(result);
        if(! result.success){
         alert("Problem talking to imgurs api. " +  _m1);
         return; 
        }
        if(has_comment(result.data, commentid)){
          alert("You are NOT shadow banned.");
        }else{
          alert("You seem to be shadow banned.");
        }
      },
      error: function(a, b, c){
        alert("I failed to connect imgurs API. " + _m1);
      }
    });
  });
})();
