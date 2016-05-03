jQuery(document).ready(function() {
    "use strict";
	// Django��Ҫ��֤csrf��Ϣ��֤�ύ����ݣ���δ�����룬��Ҫ���빫��JS
	// csrf��Ϣ��ʼ
		function getCookie(name) {
			var cookieValue = null;
			if (document.cookie && document.cookie != '') {
				var cookies = document.cookie.split(';');
				for (var i = 0; i < cookies.length; i++) {
					var cookie = jQuery.trim(cookies[i]);
					// Does this cookie string begin with the name we want?
					if (cookie.substring(0, name.length + 1) == (name + '=')) {
						cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
						break;
					}
				}
			}
			return cookieValue;
		}
		var csrftoken = getCookie('csrftoken');
	
		function csrfSafeMethod(method) {
			// these HTTP methods do not require CSRF protection
			return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
		}
		$.ajaxSetup({
			beforeSend: function(xhr, settings) {
				if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
					xhr.setRequestHeader("X-CSRFToken", csrftoken);
				}
			}
		});
		// csrf��Ϣ����
});


/***
	Common functions
***/
$(function(){
    $.ajaxSetup ({
        cache: false //�ر�AJAX����
    });
});

//�����ĵ���ajax����
function imycartAjaxCall(url,object,is_show_message_box,message){
	var encodedata = $.toJSON(object);
	$.ajax({
			type : 'POST',
			contentType : 'application/json',
			dataType : 'json',
			url : url,
			data : encodedata,
			success : function(result) {
				if(result.success==true){
					if(is_show_message_box){
						if(message==null){
							message = "Your opration is success."
						}
						$("#infoMessage").html(message);
					}
				}else{
					if(message==null){
							message = "Your opration is failed."
					}
					$("#infoMessage").html(message);
				}
				$("#myModal").modal('toggle');
			},
			error : function(result) {
				alert(result.success);
			}
	});
};
//���ص�������ajax����ͨ�÷���
function imycartAjaxCallWithCallback(url,object,callback,triggerControl,extraInfo){
	var encodedata = $.toJSON(object);
	$.ajax({
			type : 'POST',
			contentType : 'application/json',
			dataType : 'json',
			url : url,
			data : encodedata,
			success : function(result) {
				callback(result,triggerControl,extraInfo)
			},
			error : function(result) {
				alert(result.success);
			}
	});
};

//ÿҳ��ʾ��������
jQuery(".pageSize").click(function(){
	event.preventDefault();
	var url = location.href;
	var newurl = changeURLArg(url,"pageSize",$(this).data("page-size"));
	location.href = newurl;//��ת����Ӧ��ҳ��
});


//ҳ������л�
jQuery(".pageChage").click(function(){
	event.preventDefault();//��ֹA��ǩ��ת
	var url = location.href;
	var pageNo = $.getUrlParam("page");
	var tag = $(this).attr("data-tag");
	if(tag=="Previous"){
		//��ǰ�������ǰ���ǵ�һҳ������ǰ��ҳ
		if(pageNo>1){
			pageNo--;
			var newurl = changeURLArg(url,"page",pageNo);
			location.href = newurl;//��ת����Ӧ��ҳ��
		}
	}else if(tag=="Next"){
		//��������ǰ�������һҳ����ҳ
		var pages = $(this).data("page-range");
		if(pageNo<pages){
			pageNo++;
			var newurl = changeURLArg(url,"page",pageNo);
			location.href = newurl;//��ת����Ӧ��ҳ��
		}
	}else{
			var page = $(this).data("page");
			var newurl = changeURLArg(url,"page",page);
			location.href = newurl;//��ת����Ӧ��ҳ��
	}
});

//��ĳ������
jQuery(".orderBy").click(function(){
	event.preventDefault();//��ֹA��ǩ��ת
	var url = location.href;
	var newurl = changeURLArg(url,"sort_by",$(this).data("column"));
	location.href = newurl;//��ת����Ӧ��ҳ��
});

//������
jQuery(".sortDirection").click(function(event) {
	event.preventDefault();//��ֹA��ǩ��ת
	var url = location.href;
	var sp = $(this).find("span");
 	//var css = sp.attr("class");
	if(sp.hasClass("glyphicon-arrow-up")){
		var newurl = changeURLArg(url,"direction","desc");
		sp.removeClass("glyphicon-arrow-up");
		sp.addClass("glyphicon-arrow-down");
		location.href = newurl;//��ת����Ӧ��ҳ��
	}else{
		var newurl = changeURLArg(url,"direction","asc");
		sp.removeClass("glyphicon-arrow-down");
		sp.addClass("glyphicon-arrow-up");
		location.href = newurl;//��ת����Ӧ��ҳ��
	}
});

//ˢ����֤��
jQuery(".next-captcha").click(function(){
	event.preventDefault();
	$.getJSON('/refresh-captcha', function(json) {  
		// This should update your captcha image src and captcha hidden input  
		// debugger; 
		var status = json['status'];  
		var new_cptch_key = json['new_cptch_key'];  
		var new_cptch_image = json['new_cptch_image'];  
		id_captcha_0 = $("#id_reg_captcha_0");  
		img = $(".captcha");  
		id_captcha_0.attr("value", new_cptch_key);  
		img.attr("src", new_cptch_image);  
	});   
});

//ajax��֤��֤��
jQuery('.form-control-captcha').blur(function(){
	key_id = $(this).data('captcha-key')
	json_data={'response':$(this).val(),  
		// ��ȡ�����������ֶ�id_captcha_0����ֵ            
			'hashkey':$('#' + key_id).val()        
	};
	
	$.getJSON('/ajax_val_captcha', json_data, function(data){ //ajax����            
		$('#captcha_status').remove();            
		if(data['success'] == true){ //status����1Ϊ��֤����ȷ�� status����0Ϊ��֤����� �������ĺ���д����ʾ��Ϣ               
			//alert(data['message']);        
		}else{
			//alert(data['message']);
			//$(this).after('<span id="captcha_status" >*' + data['message'] + '</span>')     
		}        
	});     
});

/***
 ***   ҳ����ת�࿪ʼ
 ***/
jQuery("#CreateAccount").click(function(event) {
		location.href = "/user/register";
}); 

jQuery(".return-to-cart").click(function() {
	var url = "/cart/show";
	location.href = url;
});
/***
 ***   ҳ����ת�����
 ***/
 
 

/***
 ***  �鿴���ﳵ��ϸҳ��ʹ�õķ�����ʼ ***
 ***/
function imycartModifyCart(method,cart_id,quantity,triggerControl){
	url = '/cart/modify';
	var cart = new Object();
	cart.method = method;
	cart.cart_id = cart_id;
	cart.quantity = quantity;
	
	extraInfo = new Object();
	extraInfo.method = method;
	imycartAjaxCallWithCallback(url,cart,imycartModifyCartCallback,triggerControl,extraInfo);
}

function imycartModifyCartCallback(result,triggerControl,extraInfo){
	if(extraInfo.method=="set"){
		//�Ȼ�ȡ�����¼��������ؼ��ԱߵĽ���ֶε�span�ؼ�
		var td = triggerControl.parent().siblings("[name=subTotalTd]");
		var subTotal = td.find("span");
		subTotal.html("$ " + result.cart_product_total.toFixed(2));
	}else if(extraInfo.method == "del"){
		var tr = triggerControl.parent().parent();	
		tr.remove();
	}else if(extraInfo.method == "clear"){
		//�����
		$("#shopping-cart-table").find("tbody").find("tr").remove();
		$("#shopping-cart-table").find("tbody").html("<tr><td class='a-center'><span><span>Your shopping cart is empty!</span></span></td></tr>");
	}

	//�����ܽ��
	imycartUpdateTotalAmount(result.sub_total,result.sub_total);
}

function imycartUpdateTotalAmount(totalAmount,totalPrice){
	//������Ʒ�ܼۡ����˷ѡ��ܽ��
	$("#totalPrice").html("$ " + totalPrice.toFixed(2));
	$("#totalAmount").html("$ " + totalAmount.toFixed(2));
}
/***
 ***  �鿴���ﳵ��ϸҳ��ʹ�õķ������� ***
 ***/
//���ť
jQuery(".order-pay-button").click(function(event) {
	var url = '/cart/payment/' + $(this).data("id");
	location.href = url;
}); 
 
 
//ȡ������
jQuery(".order-cancel-button").click(function(event) {
	var url = '/order/cancel';
	var object = new Object();
	object.order_id = $(this).data("id");
	
	var extraInfo = new Object();
	extraInfo.method = 'cancel';
	extraInfo.order_id = object.order_id;
	imycartAjaxCallWithCallback(url,object,imycartChangeOrderCallBack,$(this),extraInfo)	
}); 


function imycartChangeOrderCallBack(result,triggerControl,extraInfo){
	if(extraInfo.method=='cancel'){
		//ɾ���Լ���һ��
		condition = "[title=" + "container_order_" + extraInfo.order_id + "]";
		$(condition).remove();
	}
}


//����Ʒ��ӵ����ﳵ	
jQuery("#addToCartBtn").click(
	function() {
		var productId = $(this).data("product-id");
		var product_attribute_id = $("#product-attribute-id").val();
		imycartAddProductToCartaddProductToCart(productId,product_attribute_id,$("#qty").val());
	}
);

function imycartAddProductToCartaddProductToCart(product_id,product_attribute_id,quantity){
		var url = "/cart/add";
		var cart = new Object();
		cart.product_id = product_id;
		cart.product_attribute_id = product_attribute_id;
		cart.quantity = quantity;
		imycartAjaxCall(url,cart,true,null);
};

//����Ʒ��ӵ�Ը���嵥
jQuery("#addToWishList").click(
	function() {
		event.preventDefault();
		imycartAddProductToWishlist($(this).data("product-id"));
	}
);
function imycartAddProductToWishlist(product_id) {
	var url = "/wishlist/add";
	var wish = new Object();
	wish.product_id = product_id;
	imycartAjaxCall(url,wish,true,null);
};

//ѡ������Ʒĳ����������
jQuery(".product-attribute-item").click(function(){
		var product_to_get = new Object();
		product_to_get.product_id = $(this).data("product-id");
		condition = ".product-attribute-group-selected[title=" + $(this).data("group-code") + "]";		
		$(condition).val($(this).data("attribute-id"));
		var attr_list = new Array();
		$(".product-attribute-group-selected").each(function(){
			if($(this).val() != ""){
				attr_list.push($(this).val());
			}
			
		});
		product_to_get.attr_list = attr_list;
		var url = '/product/get-product-extra/'
		var encodedata = $.toJSON(product_to_get);
		$.ajax({
				type : 'POST',
				contentType : 'application/json',
				dataType : 'json',
				url : url,
				data : encodedata,
				success : function(result) {
						if(result.success==true){
							$("#product-attribute-id").val(result.message.pa_id);
							//ȷ���۸�
							$("#product-price-main").text("$" + result.message.price.toFixed(2));
						}else{
							//�趨����ѡ��������б�
							//alert('Attributs avaliable to select are:' + result.message)
						
						}
						//alert('pa_id:' + $("input[name=product-attribute-id]").val());
				},
				error : function(result) {
					alert(result.success);
				}
		});
});


/* 
* url Ŀ��url 
* arg ��Ҫ�滻�Ĳ������� 
* arg_val �滻��Ĳ�����ֵ 
* return url �����滻���url 
*/ 
function changeURLArg(url,arg,arg_val){ 
	if(url.endWith("#")){
		url = url.replace("#","");
	}
    var pattern=arg+'=([^&]*)'; 
    var replaceText=arg+'='+arg_val; 
    if(url.match(pattern)){ 
        var tmp='/('+ arg+'=)([^&]*)/gi'; 
        tmp=url.replace(eval(tmp),replaceText); 
        return tmp; 
    }else{ 
        if(url.match('[\?]')){ 
            return url+'&'+replaceText; 
        }else{ 
            return url+'?'+replaceText; 
        } 
    } 
    return url+'\n'+arg+'\n'+arg_val; 
};

String.prototype.endWith=function(s){
	  if(s==null||s==""||this.length==0||s.length>this.length)
	     return false;
	  if(this.substring(this.length-s.length)==s)
	     return true;
	  else
	     return false;
	  return true;
};

String.prototype.startWith=function(s){
	  if(s==null||s==""||this.length==0||s.length>this.length)
	   return false;
	  if(this.substr(0,s.length)==s)
	     return true;
	  else
	     return false;
	  return true;
};

//Ϊjquery��չһ����ȡ��url��ĳ�������ķ���
(function ($) {
    $.getUrlParam = function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    }
})(jQuery);