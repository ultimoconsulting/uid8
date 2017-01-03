function adjustVideo() {
  var wWidth = $(window).width();
  //standard tablet
  if(wWidth > 768) {
    $('#vid-kartki').attr("autoplay", "autoplay");
    //$('#vid-smietnik').attr("autoplay", "autoplay");
    $('#vid-kartki').get(0).play();
    //$('#vid-smietnik').get(0).play();
  } 
  else {
    $('#vid-kartki').attr("preload", "none");
    $('#vid-smietnik').attr("preload", "none");
    $('#vid-kartki').get(0).load();
    $('#vid-smietnik').get(0).load();
  }
}
/*** end adjustVideo() ***/


var videoStarted = false;
var tolerancePixel = 40;

function checkMedia(){ 
  //get current browser top and bottom
  var scrollTop = $(window).scrollTop() + tolerancePixel;
  var scrollBottom = $(window).scrollTop() + $(window).height() - tolerancePixel;
  var wWidth = $(window).width();
  var media = $("#vid-smietnik");

  media.each(function(index, el) {        
    var yTopMedia = $(this).offset().top;
    var yBottomMedia = $(this).height() + yTopMedia;

    if(scrollTop < yBottomMedia && scrollBottom > yTopMedia && videoStarted == false && wWidth > 768){ 
      //view explaination in `In brief` section above
      $(this).get(0).play();
      videoStarted = true;
      } 
    else {
      // $(this).get(0).pause();
    }
  });
}           
/*** end checkMedia() ***/

//document scroll
$(window).trigger('scroll');
$(document).on('scroll', checkMedia);

//reposition text depending on screen width
$(window).resize(function() {
  adjustVideo();
  var smietnikHeight = $('#vid-smietnik').height();
  $('.2nddsec').css('margin-top', smietnikHeight-250 +'px');
});


/*** start $(document).ready() ***/
$(document).ready(function() {
  adjustVideo();
  var currentActive; var nextActive; var previousActive;

  //currect active feature in meet uid8
  function detectCurrentFreature() {
    currentActive = $(".gallery-container").children(".active");
    nextActive = currentActive.next();
    previousActive = currentActive.prev();
            
    //doesn't have a previous gallery-feature sibling
    if (previousActive.length == 0) {
      previousActive = $(".gallery-feature").last();
    }
    //doesn't have a next gallery-feature sibling
    if (nextActive.attr("class") == "arrow-back") {
      nextActive = $(".gallery-feature").first();
    }
  }
  /*** end detectCurrentFreature() ***/

  $('.arrow-back').click(function(){
    detectCurrentFreature();
    currentActive.removeClass("active");
    previousActive.addClass("active");
  });

  $('.arrow-next').click(function(){
    detectCurrentFreature();
    currentActive.removeClass("active");
    nextActive.addClass("active");
  });

  //carousel for features
  $('.gallery-feature').click(function(){
    var id = $(this).attr("id").substr(4);
    var prevActive = $(".gallery-container").children(".active").attr("id").substr(4);
    
    if(id != prevActive) {
      $("#pic-"+id).css("z-index", "50");
      $("#pic-"+prevActive).fadeTo(1000, 0.1, function(){
        $(".screens > div").not("#pic-"+id).css("z-index", "1");
        $("#pic-"+id).css("z-index", "100");  
        $("#pic-"+prevActive).fadeTo(0, 1);
      });
      $(".gallery-feature").removeClass("active");
      $(this).addClass("active");  
    }
  });
});