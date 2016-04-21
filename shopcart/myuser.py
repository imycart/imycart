#coding=utf-8
from django.shortcuts import render,redirect,render_to_response
from shopcart.models import System_Config,MyUser,Cart,Product,Cart_Products,Wish,Reset_Password,Address,Order,Order_Products,Abnormal_Order
from shopcart.utils import System_Para,my_pagination,add_captcha,my_send_mail,get_serial_number
from django.contrib import auth
from django.core.urlresolvers import reverse
from django.core.context_processors import csrf
from django.http import HttpResponse,JsonResponse
from django.contrib.auth.decorators import login_required
from shopcart.forms import register_form,captcha_form,address_form
import json,uuid,datetime
from django.db import transaction
import requests
from six import b
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.http import Http404
# import the logging library
import logging
# Get an instance of a logger
logger = logging.getLogger('imycart.shopcart')

# Create your views here.
def register(request):
	ctx = {}
	ctx.update(csrf(request))
	ctx['system_para'] = System_Para.get_default_system_parameters()
	ctx = add_captcha(ctx) #添加验证码
	if request.method == 'GET':
		#GET请求，直接返回页面
		return render(request,System_Config.get_template_name() + '/register.html',ctx)
	else:
		form = register_form(request.POST) # 获取Post表单数据
		if form.is_valid():# 验证表单,会自动验证验证码
			myuser = MyUser.objects.create_user(username=None,email=form.cleaned_data['email'],password=form.cleaned_data['password'])
			return redirect('/user/login')
		else:
			ctx['reg_result'] = _('Registration faild.')
			return render(request,System_Config.get_template_name() + '/register.html',ctx)

def info(request):
	ctx = {}
	ctx.update(csrf(request))
	ctx['system_para'] = System_Para.get_default_system_parameters()	
	if request.method == 'GET':
		#GET请求，直接返回页面
		return render(request,System_Config.get_template_name() + '/user_info.html',ctx)
	else:
		pass

def login(request):
	ctx = {}
	ctx['system_para'] = System_Para.get_default_system_parameters()
	ctx = add_captcha(ctx) #添加验证码
	if request.method == 'GET':
		#GET请求，直接返回页面
		if 'next' in request.GET:
			ctx['next'] = request.GET['next']
		return render(request,System_Config.get_template_name() + '/login.html',ctx)
	else:
				
		ctx.update(csrf(request))
		form = captcha_form(request.POST) # 获取Post表单数据
		if 'next' in request.POST:
			next = request.POST['next']
			ctx['next'] = next
		
		if form.is_valid():# 验证表单,会自动验证验证码
			myuser = auth.authenticate(username = request.POST['email'], password = request.POST['password'])
			if myuser is not None:
				auth.login(request,myuser)
				mycart = merge_cart(request)
				redirect_url = reverse('product_view_list')
				if 'next' in request.POST:
					if len(request.POST['next']) > 0:
						redirect_url = request.POST['next']
				
				response = redirect(redirect_url)
				response.set_cookie('cart_id',mycart.id)
				response.set_cookie('imycartuser',myuser.email)
				return response
			else:
				ctx['login_result'] = _('Your email or password is not correct.')
				return render(request,System_Config.get_template_name() + '/login.html',ctx)
		else:
			ctx['login_result'] = _('Please check you input.')
			return render(request,System_Config.get_template_name() + '/login.html',ctx)
			

def merge_cart(request):
	#检查cookie中是否有cart_id，如果没有，直接用user的cart_id替代
	cart = None
	if 'cart_id' in request.COOKIES:
		try:
			cart = Cart.objects.get(id=request.COOKIES['cart_id'])
		except:
			cart = None
	
	mycart = None
	try:
		mycart = Cart.objects.get(user=request.user)
	except:
		mycart = None
	
	if cart == None and mycart == None:
		mycart = Cart.objects.create(user=request.user)
		return mycart
	elif cart == None and mycart != None:
		return mycart
	elif cart != None and mycart == None:
		cart.user = request.user
		cart.save()
		return cart
	else:
		#两个购物车都不为空，则要合并
		for p in cart.cart_products.all():
			#print("当前的p：" + str(p.id) + ",p代表的product:" + str(p.product.id))
			has_p = False
			for mp in mycart.cart_products.all():
				#print("当前的mp：" + str(mp.id) + ",mp代表的product:" + str(mp.product.id))
				if mp.product == p.product and mp.product_attribute == p.product_attribute:
					#print("判断条件为真，开始合并数量.")
					mp.quantity = mp.quantity + p.quantity
					mp.save()
					p.delete()
					has_p = True
					#print("删除p")
					break;
			#print("循环结束，没有匹配的，说明没有同类项，把cart中的项目转移到mycart中")		
			if has_p == False:
				p.cart = mycart
				p.save()
		#print("将空的cart删除")
		cart.delete()
		return mycart
			
def logout(request):
	auth.logout(request)
	return redirect(reverse('myuser_login'))

	
def forget_password(request):
	ctx = {}
	ctx['system_para'] = System_Para.get_default_system_parameters()
	ctx = add_captcha(ctx) #添加验证码
	if request.method == 'GET':
		ctx['form_display'] = 'block'
		return render(request,System_Config.get_template_name() + '/forget_password.html',ctx)
	else:
		form = captcha_form(request.POST) # 获取Post表单数据
		if form.is_valid():
			ctx['form_display'] = 'none'
			ctx.update(csrf(request))
			s_uuid = str(uuid.uuid4())
			reset_password = Reset_Password.objects.create(email=request.POST['email'],validate_code=s_uuid,apply_time=datetime.datetime.now(),expirt_time=(datetime.datetime.now() + datetime.timedelta(hours=24)),is_active=True)
			mail_ctx = {}
			mail_ctx['reset_url'] =  System_Config.get_base_url() + "/user/reset-password?email=" + reset_password.email + "&validate_code=" + reset_password.validate_code
			my_send_mail(useage='reset_password',ctx=mail_ctx,send_to=reset_password.email,title=_('You are resetting you password in %(site_name)s .') % {'site_name':System_Config.objects.get(name='site_name').val})
			ctx['apply_message'] = _('Your password reset apply is succeed.Please check your mail box.')
		else:
			ctx['apply_message'] = _('Please check your verify code.')
		return render(request,System_Config.get_template_name() + '/forget_password.html',ctx)

def reset_password(request):
	ctx = {}
	ctx['system_para'] = System_Para.get_default_system_parameters()
	if request.method == 'GET':
		try:
			#日期大小与比较要用 "日期字段名__gt=" 表示大于
			reset_password = Reset_Password.objects.filter(expirt_time__gt=datetime.datetime.now()).get(email=request.GET['email'],validate_code=request.GET['validate_code'],is_active=True)
			ctx['email'] = reset_password.email
			ctx['validate_code'] = reset_password.validate_code
			return render(request,System_Config.get_template_name() + '/reset_password.html',ctx)
		except:
			raise Http404
			#ctx['form_display'] = 'none'
			#ctx['reset_message'] = _('Can not find the password reset apply request.')
	else:
		try:
			reset_password = Reset_Password.objects.filter(expirt_time__gt=datetime.datetime.now()).get(email=request.POST['email'],validate_code=request.POST['validate_code'],is_active=True)
			myuser = MyUser.objects.get(email=reset_password.email)
			myuser.set_password(request.POST['password'])
			reset_password.is_active = False
			reset_password.save()
			myuser.save()
			ctx['form_display'] = 'none'
			ctx['reset_message'] = _('The password has been reseted.')
		except:
			ctx['form_display'] = 'none'
			ctx['reset_message'] = _('Opration faild.')		
		return render(request,System_Config.get_template_name() + '/reset_password.html',ctx)
		
@login_required
@transaction.atomic()
def address(request,method):
	ctx = {}
	ctx['system_para'] = System_Para.get_default_system_parameters()
	result = False
	message = 'System Error'
	if request.method == 'POST':
		if method == 'add' or method == 'modify':
			address,created = Address.objects.get_or_create(user=request.user,useage=request.POST['useage'])
			form = address_form(request.POST,instance=address)
			if form.is_valid():
				address.save()				
				result = True
				message=_('Address successfully saved.')
			else:
				logger.error('address parameter error.' + str(request.POST))
		elif method == 'del':
			print('TDDO: Delete address')
		else:
			pass
	else:
		ctx['form'] = address_form()
		return render(request,System_Config.get_template_name() + '/test.html',ctx)
	return HttpResponse(message)
			
			
			
			
			
			
			
			
			
			
			