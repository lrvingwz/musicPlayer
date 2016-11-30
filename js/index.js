;$(function(){
	//获取元素
	var ePlayer = $('footer');
	var eList = $('.list');
	var btnPlay = ePlayer.find('#btnPlay');
	var btnPrev = ePlayer.find('#btnPrev');
	var btnNext = ePlayer.find('#btnNext');
	var btnVolume = ePlayer.find('#btnVolume');
	var eTitle = ePlayer.find('h1.title');
	var eProgress = $('progress');
	var eModel = ePlayer.find('.play-model');
	var btnSearch = $('#btnSearch');
	var eTxt = btnSearch.siblings('input');
	var mySongs = $('.mySongs');
	var album = mySongs.find('.album');
	var singer = mySongs.find('.singer');
	var source = mySongs.find('.source');
	var lyric = mySongs.find('.lyric');
	var btnLike = $('#btnLike');

	var playing = $('.playing');
	var ul = playing.find('ul');

	var eAlbum = btnPlay.siblings('img');
	var eTime = eProgress.siblings('time');
	// 全局变量
	var playlist = [];
	var index = 0;
	var model = 2;//0:单曲播放,1:单曲循环,2:列表播放,3:列表循环,4:随机播放
	var player = new Audio();
	var arr=[];//新建一个数组存放最后结果

	var datalist = $('<datalist/>');
	datalist.attr('id','music_list');
	//获取歌曲列表
	$.ajax({
		url:'http://tingapi.ting.baidu.com/v1/restserver/ting',
		data:{
			method: 'baidu.ting.billboard.billList',
            type: 1,
            size: 50,
            offset: 0
		},
		 dataType: 'jsonp',
		success:function(res){
			res.song_list.forEach(function(item) {
				playlist.push(item);
				var option = $('<option/>');
				option.attr('idx',item.song_id);
				option.html(item.author + ' - ' + item.title);
				option.val(item.author + ' - ' + item.title);

				datalist.append(option);
			});
			eList.append(datalist);
			init();
		}
	});
	eList.on('singleTap','option',function(){
		index = $(this).index();
		play();
	});


	// 2）播放/暂停歌曲
	btnPlay.on('singleTap',function(){
		//如果当前处于暂停状态，就播放
		if(player.paused){
			player.play();
			
		}else{
			player.pause();
			
		}
	});

	// 上一曲/下一曲
	btnPrev.on('singleTap',function(){
		index--;
		play();
	});
	btnNext.on('singleTap',function(){
		index++;
		play();
	})

	btnVolume.on('singleTap',function(){
		player.muted = !player.muted;
		if(player.muted){
			$(this).addClass('icon-mute');
		}else{
			$(this).removeClass('icon-mute');
		}
	});
	// 6）点击进度条改变播放进度
	eProgress.on('click',function(e){
		player.currentTime = (e.offsetX/$(this).width())*player.duration;
	});

	// 播放时触发
	player.onplay = function(){
		btnPlay.addClass('icon-pause');

		// 图片旋转效果
		eAlbum.addClass('playing');
		eAlbum.css('animationPlayState','running');

		// 给当前播放歌曲添加高亮效果
		var option = eList.find('option');
		option.each(function(idx, ele) {
			if(idx===index){
				ele.classList.add('active');
				ele.scrollIntoView();
			}else{
				ele.classList.remove('active');
			}
		});
		

		// 改变标题
		eTitle.html(playlist[index].author + ' - ' + playlist[index].title);

		// 专辑图片
		eAlbum.attr('src',playlist[index].pic_small);

		btnLike.removeClass('active');
		ul.find('li').each(function(idx, ele) {
		  	if(ele.innerHTML == eTitle.html()){
		  		btnLike.addClass('active');
		  	}
		});
	}

	// 暂停时触发
	player.onpause = function(){
		btnPlay.removeClass('icon-pause');

		// 移除图片旋转效果
		// eAlbum.classList.remove('playing');
		eAlbum.css('animationPlayState','paused');
	}

	// 播放进度改变时触发
	// 播放过程一直触发
	player.ontimeupdate = function(){
		updateTime();
	}

	// 歌曲能播放时
	player.oncanplay = function(){
		init();
	}

	// 8）播放模式
	// 当前歌曲播放完毕后，下一步做什么
	player.onended = function(){
		// 判断播放模式
		// 0:单曲播放,1:单曲循环,2:列表播放,3:列表循环,4:随机播放
		switch(model){
			case 1:
				play();
				break;
			case 2:
				if(index<playlist.length-1){
					index++;
					play();
				}
				break;
			case 3:
				index++;
				play();
				break;
			case 4:
				index = Math.round(Math.random()*playlist.length);
				play();
				break;
		}
	}

	// 点击改变播放模式
	eModel.on('singleTap','span',function(e){
		// 判断是否点击了模式按钮
		if(e.target.classList.contains('iconfont')){
			model = parseInt(e.target.dataset.model);
		}

		// 高亮显示播放模式
		var span = eModel.find('span');
		span.each(function(idx, ele) {
			span.removeClass('active');
		});
		e.target.classList.add('active');
	});

	//歌曲搜索
	btnSearch.on('singleTap',function(){
		var option = eList.find('option');
		option.each(function(idx, ele) {
			if(eTxt.val()===ele.value){
				index = idx;
				play();
			}
		});
	});

	function play(){
		if(index<0){
			index = playlist.length-1;
		}else if(index > playlist.length-1){
			index = 0;
		}
		$.ajax({
			url: 'http://tingapi.ting.baidu.com/v1/restserver/ting',
			dataType: 'jsonp',
			data: {
				method: 'baidu.ting.song.play',
				songid:playlist[index].song_id
			},
			success:function(res){
				player.src = res.bitrate.file_link;
				player.play();
			}
		});
		
	}
	function init(){
		// 改变标题
		eTitle.html(playlist[index].author + ' - ' + playlist[index].title);
		mySongs.css('background-image', 'url('+playlist[index].pic_big+')');
		album.html('专辑：'+playlist[index].album_title);
		singer.html('歌手：'+playlist[index].author);
		source.html('来源：'+playlist[index].style);

		// 专辑图片
		eAlbum.attr('src',playlist[index].pic_small);

		// 播放模式
		var span = eModel.find('span');
		span.each(function(idx, ele) {
			if(ele.dataset.model == model){
				ele.classList.add('active');
			}
		});
		if(player.src == ''){
			$.ajax({
				url: 'http://tingapi.ting.baidu.com/v1/restserver/ting',
				dataType: 'jsonp',
				data: {
					method: 'baidu.ting.song.play',
					songid:playlist[0].song_id
				},
				success:function(res){
					player.src = res.bitrate.file_link;
					updateTime();
					lrcTxt(playlist[index].song_id);
				}
			});
		}else{

			// 更新时间
			updateTime();
			lrcTxt(playlist[index].song_id);
		}

	}

	function updateTime(){
		// 时间
		// 剩余总时间
		var leftTime = player.duration - player.currentTime;
		// 剩余多少分
		var minLeft = parseInt(leftTime/60);
		var secLeft = parseInt(leftTime%60);

		eTime.html('-' + minLeft + ':' + (secLeft<10 ? '0' : '') + secLeft);


		// 进度条
		eProgress.val(player.currentTime/player.duration*100);
		var li = lyric.find('li');
		for(var i=0;i<arr.length;i++){
			if(arr[i] <= parseFloat(player.currentTime.toFixed(3)) && arr[i+1] >= parseFloat(player.currentTime.toFixed(3))){
				li.eq(i).addClass('active');
				// if(mySongs.is('.swiper-slide-active')){
				// 	li[i].scrollIntoView();
				// }
				if(i > 6){
					lyric.css('margin-top', -li.eq(0).height()*(i-6));

				}
			}else{
				li.eq(i).removeClass('active');
			}
		}
	}

	function lrcTxt(id,time){
		$.ajax({
			url: 'http://tingapi.ting.baidu.com/v1/restserver/ting',
			dataType: 'jsonp',
			data: {
				method: 'baidu.ting.song.lry',
				songid:id
			},
			success:function(res){
				arr = [];
				lyric.find('ul').remove();
				var lrcContent = res.lrcContent.split('\n');
				var length = lrcContent.length;
				var $ul = $('<ul/>');
				for(i=0;i<length;i++) {
				    var d = lrcContent[i].match(/\[\d{2}:\d{2}\.\d{2}\]/g);  //正则匹配播放时间
					var t = lrcContent[i].substring(10,lrcContent[i].length);
					var $li = $('<li/>').html(t).appendTo($ul); 
					if(parseInt(String(d).split(':')[0].substring(1)) <= 9){
						var _d = parseInt(String(d).split(':')[0].substring(1))*60 + parseInt(String(d).split(':')[1].split('.')[0]) + parseInt(String(d).split(':')[1].split('.')[1])/1000;
					}
					arr.push(_d);
				}
				$ul.appendTo(lyric);
			}
		});
	}

	//切换分页
	var mySwiper = new Swiper('.swiper-container', {
		speed:500,
	    onSlideChangeStart: function(){
	      $("#header .active").removeClass('active')
	      $("#header div").eq(mySwiper.activeIndex).addClass('active')  
	    }
	});
	$("#header div").on('touchstart mousedown',function(e){
	    e.preventDefault()
	    $("#header .active").removeClass('active')
	    $(this).addClass('active')
	    mySwiper.slideTo( $(this).index() )
  })
  $("#header div").click(function(e){
  	  e.preventDefault()
  }); 

  //添加我的音乐
  btnLike.on('touchstart',function(){
  		if(btnLike.is('.active')){
  			btnLike.removeClass('active');
  			var enLike = ul.find('li');
  			enLike.each(function(idx, ele) {
  				if(eTitle.html() == ele.innerHTML){
  					$(this).remove();
  				}
  			});
  		}else{
  			btnLike.addClass('active');
  			var li = $('<li/>').html(eTitle.html()).attr('idx',playlist[index].song_id).appendTo(ul);
  			console.log(li.html());
  		}
  });

	
});