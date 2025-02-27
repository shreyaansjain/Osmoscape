/*global osmo:true $:true*/

/**
 * ------------------------------------------------
 * AUTHOR: Mike Cj (mikecj184)
 * Copyright 2020 - 2021 Timeblur
 * This code is licensed under MIT license (see LICENSE file for more details)
 * ------------------------------------------------
 */

'use strict';
export default class {}

window.osmo = window.osmo || {};
/**
 * ------------------------------------------------
 * class:  popupInteraction
 * desc:
 * ------------------------------------------------
 */
osmo.popupInteraction = class {

  constructor(){
    console.log('osmo.popupInteraction - constructor');
    //
    this.PAPER = osmo.scroll.PAPER;
    this.LEGENDSVG = osmo.legendsvg;
    this.DATASVG = osmo.datasvg;
    //
    this.currentFocus = null;
    this.dragMode = false;
    this.isDragging = false;
    this.loadingStage = null;
    //
  }

  init(){
    //
    let self = this;
    $('#popcancel').click(function(){
      self.close();
    });
    //
    let playerinterval = null;
    $('#focused_waveform_state').click(function(){
      let curr_val = $('#focused_waveform_state').html();
      let curr_focus = '#'+self.currentFocus+'_audio';
      if(curr_val == '▶'){
        $('#focused_waveform_state').html('<b>Ⅱ</b>');
        //-webkit-mask-image: linear-gradient(to right, #ffff, #ffff 10%, #fff6 10%, #fff6 100%);
        console.log(curr_focus);
        $(curr_focus).trigger('play');
        jQuery({volume: 0}).animate({volume: 1},{
          duration: $(curr_focus)[0].duration*0.005,
          step: function(val) {
            console.log(val);
            $(curr_focus)[0].volume = val;
            //console.log( 'Currently @ ' + this.property );
          }
        });
        //
        playerinterval = setInterval(function(){

          //if(curr_val == '▶'){
          //  clearInterval(playerinterval);
          //  playerinterval = null;
          //}
          //
          let percentage = 100 * $(curr_focus)[0].currentTime / $(curr_focus)[0].duration;
          let now = percentage.toFixed(2).toString() + '%';
          if(percentage < 99.5){
            let next = (percentage+0.5).toFixed(2).toString() + '%';
            $('#focused_waveforms').css('-webkit-mask-image','linear-gradient(to right, #ffff, #ffff '+now+', #fff6 '+next+', #fff6 100%)');
            //
          }else{
            clearInterval(playerinterval);
            playerinterval = null;
            //
            jQuery({volume: 1}).animate({volume: 0},{
              duration: $(curr_focus)[0].duration*0.004,
              step: function(val) {
                console.log(val);
                $(curr_focus)[0].volume = val;
              }
            });
            //
            setTimeout(function(){
              $('#focused_waveform_state').html('▶');
              $('#focused_waveform_state').click();
            }, $(curr_focus)[0].duration*0.005);
            //
          }
        },50);
      }
      if(curr_val == '<b>Ⅱ</b>'){
        $('#focused_waveform_state').html('▶');
        clearInterval(playerinterval);
        playerinterval = null;
        $('#focused_waveforms').css('-webkit-mask-image', 'linear-gradient(to right, #fff6, #fff6 100%)');
        $(curr_focus).trigger('pause');
      }
    });
    //
    //
    //
    document.getElementById('popup_volslider').oninput = (event) => {
      let present = $('#popup_volslider').val();
      $('#popup_volslider_inverted').val(100-present);
    };
    document.getElementById('popup_volslider_inverted').oninput = (event) => {
      let present = $('#popup_volslider_inverted').val();
      $('#popup_volslider').val(100-present);
    };
    //
    $('#focused-info').mouseenter(function(){
      $('#cursor').hide();
    });
    $('#focused-info').mouseleave(function(){
      $('#cursor').show();
    });
    //
  }

  close(){
    let legendsvg = this.LEGENDSVG;
    $('.nav').show();
    // FIX ME!!!
    // ALSO MAKE SURE TO STOP PLAYING WAVEFORM
    //
    let curr_val = $('#focused_waveform_state').html();
    let curr_focus = '#'+this.currentFocus+'_audio';
    if(curr_val == '<b>Ⅱ</b>'){
      $('#focused_waveform_state').html('▶');
      //clearInterval(playerinterval);
      //playerinterval = null;
      $('#focused_waveforms').css('-webkit-mask-image', 'linear-gradient(to right, #fff6, #fff6 100%)');
      $(curr_focus).trigger('pause');
    }
    //
    $('#focused-cta').hide();
    $('#focused-info').hide();
    $('#'+this.currentFocus+'_waveform').hide();
    //
    if(this.loadingStage != null)
      clearTimeout(this.loadingStage);
    this.loadingStage = null;
    //
    $('.cursor-pointer').css('border', '2px solid white');
    $('.cursor-loading').hide();
    $('.cursor-loading-full').hide();
    $('.cursor-pointer-dot').hide();
    $('.cursor-txt').html('');
    $('.cursor-txt').hide();
    this.dragMode = false;
    this.isDragging = false;
    //document.body.style.cursor = 'default';
    //
    let fac = 1.005/(this.PAPER.view.zoom*this.PAPER.view.zoom);
    let currentCenter = this.PAPER.view.center;
    let newCenter = osmo.scroll.prevBoundsCenter;
    let zoomFac = osmo.scroll.prevZoom;
    //
    //let zoomFac = 1;
    if(legendsvg.popupBBoxes.hasOwnProperty(this.currentFocus)){
      let count = legendsvg.popupBBoxes[this.currentFocus]['paths'].length;
      console.log(count);
      for(let i=0; i < count; i++){
        legendsvg.popupBBoxes[this.currentFocus]['paths'][i].selected = false;
        legendsvg.popupBBoxes[this.currentFocus]['paths'][i].visible = false;
      }
      console.log('Decided zoom - ' + zoomFac);
    }
    //
    this.currentFocus = null;
    osmo.scroll.hitPopupMode = 'hovering';
    this.hitMaskEffect(new this.PAPER.Point(0,0), 'exit');
    //
    let deltaValX = newCenter.x - currentCenter.x;
    let deltaValY = newCenter.y - currentCenter.y;
    //
    this.PAPER.view.zoom = osmo.pzinteract.changeZoom(this.PAPER.view.zoom, 1, zoomFac, false);
    this.PAPER.view.center = osmo.pzinteract.changeCenter(this.PAPER.view.center, deltaValX, deltaValY, fac);
    //
  }

  /**
   * ------------------------------------------------
   * mouseClicked
   * ------------------------------------------------
   */
  mouseClicked(event){
    let legendsvg = this.LEGENDSVG;
    $('.nav').hide();
    /*
    if(document.body.style.cursor == 'zoom-in'){
      console.log('Zoom-in at this place');
      this.PAPER.view.zoom = osmo.pzinteract.changeZoom(this.PAPER.view.zoom, -1, 1.015, false);
    }
    */
    if(this.dragMode){
      this.isDragging = true;
      $('#cursor').hide();
    }


    //
    if(osmo.scroll.loaded.HQimage && osmo.scroll.loaded.svgdata){
      if(osmo.scroll.hitPopupMode != 'focused'){
        this.hitMaskEffect(event.point, 'click');
      }
    }
    //
  }

  /**
   * ------------------------------------------------
   * mouseMoved
   * ------------------------------------------------
   */
  mouseMoved(deltaValX, deltaValY){
    //
    if(this.dragMode && this.isDragging){
      let fac = 1.005/(osmo.scroll.PAPER.view.zoom*osmo.scroll.PAPER.view.zoom);
      //console.log(deltaValX + ' ' + deltaValY + ' ' + fac);
      this.PAPER.view.center = osmo.pzinteract.changeCenter(this.PAPER.view.center, deltaValX, deltaValY, fac, false);
    }
    //
  }


  mouseUp(event){
    if(this.dragMode){
      this.isDragging = false;
      $('#cursor').show();
    }
  }

  reset_animation(_id, _class) {
    /*
    var el = document.getElementById(_id);
    console.log(el);
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = null;
    */
    //
    let $target = $('#'+_id);
    $target.removeClass(_class);
    setTimeout( function(){
      $target.addClass(_class);
    },100);
    //
  }

  /**
   * ------------------------------------------------
   * hitMaskEffect
   * ------------------------------------------------
   */
  hitMaskEffect(pt, ctype){
    let legendsvg = this.LEGENDSVG;
    //
    let fromOpacity = osmo.datasvg.backgroundLayer.opacity, toOpacity;
    let fromColor = new this.PAPER.Color($('body').css('background-color')), toColor;
    let tweening = false;
    let dur = 800;
    let lg;
    //
    let hitResult = legendsvg.maskLayer.hitTest(pt, osmo.scroll.maskHitOptions);
    if(hitResult != null){
      //
      legendsvg.legendLayer.visible = true;
      lg = this.PAPER.project.getItem({name: hitResult.item.data.legendName});
      if(lg == null)  return;
      //
      if(ctype == 'click'){
        $('#focused-info').animate({ right:'0px'}, 1200);
        //
        toOpacity = 0;
        toColor =  new this.PAPER.Color('#24292b');
        //
        osmo.scroll.hitPopupMode = 'focused';
        legendsvg.maskLayer.visible = false;
        //
        if(this.loadingStage != null)
          clearTimeout(this.loadingStage);
        this.loadingStage = null;
        // Also make sure it's not in loading stage
        $('.cursor-pointer').css('border', 'none');
        $('.cursor-loading-full').show();
        $('.cursor-pointer-dot').hide();
        $('.cursor-txt').hide();
        //this.reset_animation('cursor-clcf', 'cursor-loading-circle');
        //this.reset_animation('cursor-clf', 'cursor-loading-full');
        this.dragMode = false;
        this.isDragging = false;
        //
        let self = this;
        this.loadingStage = setTimeout(function(){
          //
          if(this.loadingStage != null)
            clearTimeout(this.loadingStage);
          this.loadingStage = null;
          //
          $('.cursor-loading-full').hide();
          $('.cursor-pointer-dot').show();
          $('.cursor-txt').html('Click & drag');
          $('.cursor-txt').show();
          self.dragMode = true;
          self.isDragging = false;
        },4000);
        //
        //document.body.style.cursor = 'zoom-in';
        //
        this.currentFocus = parseInt(hitResult.item.data.legendName.replace('legend-', ''));
        console.log('Focused on: ' + this.currentFocus );
        //
        //
        $('#focused-heading').text(legendsvg.datasets[this.currentFocus].title);
        $('#focused-description').html(legendsvg.datasets[this.currentFocus].desc + '<br><br><br><br><br><br><br><br><br><br><br>');
        //
        $('#focused-cta').show();
        $('#focused-info').show();
        $('#'+this.currentFocus+'_waveform').show();
        //
        if($('#'+this.currentFocus+'_waveform').length)
          $('#focused_waveform_state').show();
        else
          $('#focused_waveform_state').hide();
        if(legendsvg.popupBBoxes.hasOwnProperty(this.currentFocus)){
          let count = legendsvg.popupBBoxes[this.currentFocus]['paths'].length;
          for(let i=0; i < count; i++){
            legendsvg.popupBBoxes[this.currentFocus]['paths'][i].visible = false;// true to show rect box
            legendsvg.popupBBoxes[this.currentFocus]['paths'][i].selected = false;
          }
          //
          // Zoom into selected area!
          let fac = 1.005/(this.PAPER.view.zoom*this.PAPER.view.zoom);
          let currentViewCenter = this.PAPER.view.bounds.center;
          let newViewCenter = legendsvg.popupBBoxes[this.currentFocus]['paths'][0].bounds.center;
          let zoomFac = fac * 0.5 * osmo.scroll.paperWidth / (1.0 * legendsvg.popupBBoxes[this.currentFocus]['paths'][0].bounds.width);
          let deltaValX = newViewCenter.x - currentViewCenter.x + 250.0/zoomFac;
          let deltaValY = -(newViewCenter.y - currentViewCenter.y);
          //
          osmo.scroll.prevBoundsCenter = new this.PAPER.Point(this.PAPER.view.center.x, this.PAPER.view.center.y);
          this.PAPER.view.center = osmo.pzinteract.changeCenter(this.PAPER.view.center, deltaValX, deltaValY, fac, false);
          //
          //
          osmo.scroll.prevZoom = zoomFac;
          this.PAPER.view.zoom = osmo.pzinteract.changeZoom(this.PAPER.view.zoom, -1, zoomFac, false);
          //
        }
      }
      //
      //
    }else{
      toOpacity = 1.0;
      toColor =  new this.PAPER.Color('#b5ced5');
      //
      $('#focused-info').animate({ right:'-500px'}, 100);
      //
      legendsvg.legendLayer.visible = false;
      //document.body.style.cursor = 'default';
      $('.cursor-pointer').css('border', '2px solid white');
      $('.cursor-loading').hide();
      $('.cursor-loading-full').hide();
      $('.cursor-pointer-dot').hide();
      $('.cursor-txt').hide();
      this.dragMode = false;
      this.isDragging = false;
      //
      for(let i=0; i<legendsvg.legendLayer.children.length; i++){
        let child = legendsvg.legendLayer.children[i];
        child.visible = false;
      }
      //
    }
    //
    if(!tweening){
      setTimeout(function(){tweening = false;}, dur*1.2);
      osmo.datasvg.backgroundTweenItem.tween(
        { val: 1.0 },
        { val: 0.0 },
        { easing: 'easeInOutQuad', duration: dur }
      ).onUpdate = function(event) {
        tweening = true;
        //
        let currentVal = osmo.datasvg.backgroundTweenItem.val;
        let lerpedColor = new osmo.scroll.PAPER.Color(
          toColor.red+(fromColor.red-toColor.red)*currentVal,
          toColor.green+(fromColor.green-toColor.green)*currentVal,
          toColor.blue+(fromColor.blue-toColor.blue)*currentVal);
        //
        osmo.datasvg.backgroundLayer.opacity = toOpacity + (fromOpacity - toOpacity) * currentVal;
        $('body').css('background-color',  lerpedColor.toCSS(true));
        //
        if(typeof lg !== 'undefined'){
          if(!lg.visible && currentVal == 0){
            for(let i=0; i<legendsvg.legendLayer.children.length; i++){
              let child = legendsvg.legendLayer.children[i];
              child.visible = false;
            }
            lg.visible = true;
          }
        }
        //
      };
    }
    //
  }

};