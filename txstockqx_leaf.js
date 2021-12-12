/*
╭┉┉╮╭╮╭╮╭┉┉╮╭┉┉╮╭┉┉╮╭┉┉╮╭╮╭╮
╰╮╭╯┋╰╯┋┋╭┉╯╰╮╭╯┋╭╮┋┋╭┉╯┋╰╯┋
 ┋┋ ╰╮╭╯┋╰┉╮ ┋┋ ┋┋┋┋┋┋  ┋ ╭╯
 ┋┋ ╭╯╰╮╰┉╮┋ ┋┋ ┋┋┋┋┋┋  ┋ ╰╮
 ┋┋ ┋╭╮┋╭┉╯┋ ┋┋ ┋╰╯┋┋╰┉╮┋╭╮┋
 ╰╯ ╰╯╰╯╰┉┉╯ ╰╯ ╰┉┉╯╰┉┉╯╰╯╰╯

腾讯自选股 APP&微信小程序
改自@CenBoMin大佬的脚本
重写: https://wzq.tenpay.com/cgi-bin/activity_task_daily.fcgi?   txstockqx_leaf.js
MITM: wzq.tenpay.com

重写食用
TxStockAppUrl与TxStockAppHeader：打开APP，点击头像->右上角金币->获取金币
TxStockWxHeader：打开小程序，我的->猜涨跌->下方兑换->获取金币
*/
const jsname = '腾讯自选股'
const $ = Env(jsname)
const logs = 0; //0为关闭日志，1为开启,默认为0
const notifyInterval = 1; //0为关闭通知，1为所有通知,默认为0

let rndtime = Math.round(new Date().getTime()) //毫秒
let signday = formatDateTime(new Date());
var cash = $.getval('cash') || 5; //0为不自动提现,1为自动提现1元,5为自动提现5元,

const appUrlArr = [];
let appUrlArrVal = "";

const appHeaderArr = [];
let appHeaderArrVal = "";

const wxHeaderArr = [];
let wxHeaderArrVal = "";

let coinInfo = 0

let i = 0
let j = 0
let k = 0
let NOT_PRINT = 0
let PRINT = 1
let scanList = []

//APP任务
let appDailyArray = [1100, 1101, 1103, 1104, 1105, 1109, 1110, 1111, 1112, 1113];
let appNewbieArray = [1030];
let appBullArray = [1105];
let appTaskArray = [];

//微信小程序任务
let wxDailyArray = [1100, 1101, 1103, 1104, 1105, 1109, 1110, 1111, 1112, 1113];
let wxNewbieArray = [1031];
let wxBullArray = [1106];
let wxTaskArray = [];


///////////////////////////////////////////////////////////////////

!(async () => {

	if(typeof $request !== "undefined")
	{
		if($request.url.indexOf("activity_task_daily.fcgi?") > -1) {
			if($request.url.indexOf("openid=") > -1)
			{
				//APP包
				$.setdata($request.url,'TxStockAppUrl')
				$.log(`获取TxStockAppUrl成功: ${$request.url}`)
				$.setdata(JSON.stringify($request.headers),'TxStockAppHeader')
				$.log(`获取TxStockAppHeader成功: ${JSON.stringify($request.headers)}`)
			}
			else
			{
				//微信包
				$.setdata($request.headers,'TxStockWxHeader')
				$.log(`获取TxStockWxHeader成功: ${JSON.stringify($request.headers)}`)
			}
		}
	}
	else
	{
		await Jsname()
		
		appUrlArr.push($.getdata('TxStockAppUrl'));
		appHeaderArr.push($.getdata('TxStockAppHeader'));
		wxHeaderArr.push($.getdata('TxStockWxHeader'));
		
		//暂时不支持多用户
		await getEnvParam(0)

		////扫描可查询的任务列表,
		//await scanAppTaskList(1000,1400,"task_daily","routine",NOT_PRINT)
		//await scanWxTaskList(1000,1400,"task_daily","routine",NOT_PRINT) //每个大概花费86ms
		
		await userhome(); //金币查询
		coinStart = coinInfo

		await signStatus()

		await initTaskList()

		for(j=0; j<appTaskArray.length; j++)
		{
			await appTaskList(appTaskArray[j]);
		}

		for(j=0; j<wxTaskArray.length; j++)
		{
			await wxTaskList(wxTaskArray[j]);
		}

		await userhome(); //第二次金币查询
		coinEnd = coinInfo
		rewardCoin = coinStart - coinEnd;
		$.log(`本次运行获得${rewardCoin}金币`)

		if(cash != 0)
		{
			await orderQuery()
		}
		
	}
  

})()
.catch((e) => $.logErr(e))
  .finally(() => $.done())
  
function getEnvParam(userNum)
{
	appUrlArrVal = appUrlArr[userNum];
	appHeaderArrVal = JSON.parse(appHeaderArr[userNum]);
	wxHeaderArrVal = JSON.parse(wxHeaderArr[userNum]);
	
	app_openid = appUrlArrVal.match(/&openid=([\w-]+)/)[1]
	app_fskey = appUrlArrVal.match(/&fskey=([\w-]+)/)[1]
	app_token = appUrlArrVal.match(/&access_token=([\w-]+)/)[1]
	app_appName = appUrlArrVal.match(/&_appName=([\w\.,-]+)/)[1]
	app_appver = appUrlArrVal.match(/&_appver=([\w\.,-]+)/)[1]
	app_osVer = appUrlArrVal.match(/&_osVer=([\w\.,-]+)/)[1]
	app_devId = appUrlArrVal.match(/&_devId=([\w-]+)/)[1]
	
	app_ck = appHeaderArrVal["Cookie"]
	app_UA = appHeaderArrVal["User-Agent"]
	
	wx_ck = wxHeaderArrVal["Cookie"]
	wx_UA = wxHeaderArrVal["User-Agent"]
}

function initTaskList() {
	$.log(`开始初始化任务列表`)
	let taskItem = {}
	
	//默认不做新手任务
	/*
	for(i=0; i<appNewbieArray.length; i++){
		taskItem = {"taskName":"APP新手任务","activity":"task_continue","type":"app_new_user","actid":appNewbieArray[i]}
		appTaskArray.push(taskItem)
	}
	*/
	
	//todo: 长牛任务
	/*
	for(i=0; i<appBullArray.length; i++){
		taskItem = {"taskName":"APP长牛任务","activity":"year_party","type":"bullish","actid":appBullArray[i]}
		appTaskArray.push(taskItem)
	}
	*/
	
	for(i=0; i<appDailyArray.length; i++){
		taskItem = {"taskName":"APP日常任务","activity":"task_daily","type":"routine","actid":appDailyArray[i]}
		appTaskArray.push(taskItem)
	}
	
	//默认不做新手任务
	/*
	for(i=0; i<wxNewbieArray.length; i++){
		taskItem = {"taskName":"微信新手任务","activity":"task_continue","type":"wzq_welfare_growth","actid":wxNewbieArray[i]}
		wxTaskArray.push(taskItem)
	}
	*/
	
	//todo: 长牛任务
	/*
	for(i=0; i<wxBullArray.length; i++){
		taskItem = {"taskName":"微信长牛任务","activity":"year_party","type":"bullish","actid":wxBullArray[i]}
		wxTaskArray.push(taskItem)
	}
	*/
	
	for(i=0; i<wxDailyArray.length; i++){
		taskItem = {"taskName":"微信日常任务","activity":"task_daily","type":"routine","actid":wxDailyArray[i]}
		wxTaskArray.push(taskItem)
	}
}

//扫描可查询的APP任务列表
async function scanAppTaskList(actidStart,actidEnd,activity,type,debugPrint) {
	console.log(`开始查询APP任务列表, activity=${activity}, type=${type}, from ${actidStart} to ${actidEnd}`)
	for(i=actidStart; i<actidEnd; i++){
		titem = {"taskName":`扫描任务${i}`,"activity":activity,"type":type,"actid":i}
		await appTaskListQuery(titem,debugPrint);
		await $.wait(100)
	}
	console.log(`查询结束，得到列表：`)
	console.log(scanList)
}

//扫描可查询的微信任务列表
async function scanWxTaskList(actidStart,actidEnd,activity,type,debugPrint) {
	console.log(`开始查询微信任务列表, activity=${activity}, type=${type}, from ${actidStart} to ${actidEnd}`)
	for(i=actidStart; i<actidEnd; i++){
		titem = {"taskName":`扫描任务${i}`,"activity":activity,"type":type,"actid":i}
		await wxTaskListQuery(titem,debugPrint);
		await $.wait(20)
	}
	console.log(`查询结束，得到列表：`)
	console.log(scanList)
}

///////////////////////////////////////////////////////////////////
//签到信息查询
async function signStatus() {
  return new Promise((resolve) => {
    let signurl = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_sign_task.fcgi?actid=2002&channel=1&type=welfare_sign&action=home&_=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `application/json, text/plain, */*`,
        'Connection': `keep-alive`,
        'Referer': `https://wzq.tenpay.com/activity/page/welwareCenter/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-cn`
      },
    };
    $.get(signurl, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
			//console.log(data);
            if (data.retcode == 0) {
			  $.log(`已连续签到${data.task_pkg.continue_sign_days}天，总签到天数${data.task_pkg.total_sign_days}天`);
			  for(i=0; i<data.task_pkg.tasks.length; i++){
				  resultItem = data.task_pkg.tasks[i]
				  if(resultItem.date == signday){
					  if(resultItem.status == 0){
						  //今天未签到，去签到
						  await $.wait(200);
						  await signtask();
					  } else {
						  //今天已签到
						  $.log(`签到:今天已签到`);
					  }
				  }
			  }
            } else {
              console.log(`任务完成失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//签到
async function signtask() {
  return new Promise((resolve) => {
    let signurl = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_sign_task.fcgi?actid=2002&channel=1&action=signdone&date=${signday}&_=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `application/json, text/plain, */*`,
        'Connection': `keep-alive`,
        'Referer': `https://wzq.tenpay.com/activity/page/welwareCenter/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-cn`
      },
    };
    $.get(signurl, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.retcode == 0) {
              $.log(`签到:获得 ${data.reward_desc}`);
              $.log(`签到时间:` + time(rndtime));
              await $.wait(5000); //等待5秒
            } else {
              console.log(`任务完成失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//APP任务列表
async function appTaskList(taskItem) {
  return new Promise((resolve) => {
    let url = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_${taskItem.activity}.fcgi?action=home&type=${taskItem.type}&actid=${taskItem.actid}&invite_code=&_=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `application/json, text/plain, */*`,
        'Connection': `keep-alive`,
        'Referer': `https://wzq.tenpay.com/activity/page/welwareCenter/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-cn`
      },
    };
    $.get(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
			//console.log(data)
            if (data.retcode == 0) {
			  if(data.task_pkg != null && data.task_pkg.length > 0){
				  for(i=0; i<data.task_pkg[0].tasks.length; i++){
					  resultItem = data.task_pkg[0].tasks[i]
					  //console.log(resultItem)
					  task_id = resultItem.id
					  task_tid = resultItem.tid
					  if(resultItem.status == 0)
					  {
						await appTaskticket(taskItem); //申请票据
						await appTaskDone(taskItem,ticket,task_id,task_tid);
					  } else {
						$.log(`${taskItem.taskName}[actid:${taskItem.actid},id:${task_id},tid:${task_tid}]已完成`);
						await $.wait(100);
					  }
				  }
			  }
            } else {
              console.log(`${taskItem.taskName}查询失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//APP票据申请
function appTaskticket(taskItem) {
  return new Promise((resolve, reject) => {
    let testurl = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_task.fcgi?action=taskticket&channel=1&actid=${taskItem.actid}&_rndtime=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `*/*`,
        'Connection': `keep-alive`,
        'Referer': `http://zixuanguapp.finance.qq.com`,
        'Accept-Encoding': `gzip,deflate`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-Hans-CN;q=1, en-CN;q=0.9`
      },
    }
    $.get(testurl, async (error, resp, data) => {
      let test2 = JSON.parse(data)
      //$.log(`本次验证时间：` + time(rndtime));
      //$.log(`本次验证票据：${test2.task_ticket}`);
      ticket = test2.task_ticket

      resolve()
    })
  })
}

//APP任务列表查询
async function appTaskListQuery(taskItem,printDebug=0) {
  return new Promise((resolve) => {
    let url = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_${taskItem.activity}.fcgi?action=home&type=${taskItem.type}&actid=${taskItem.actid}&channel=1&invite_code=&_=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `application/json, text/plain, */*`,
        'Connection': `keep-alive`,
        'Referer': `https://wzq.tenpay.com/activity/page/welwareCenter/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-cn`
      },
    };
    $.get(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.retcode == 0) {
			  if(data.task_pkg != null && data.task_pkg.length > 0){
				  scanList.push(taskItem.actid)
				  if(printDebug) {
					  //console.log(data)
					  console.log(`===================== actid=${taskItem.actid} start ======================`)
					  for(i=0; i<data.task_pkg[0].tasks.length; i++){
						  resultItem = data.task_pkg[0].tasks[i]
						  console.log(resultItem)
					  }
					  console.log(`===================== actid=${taskItem.actid} end ======================`)
				  }
			  }
            } else {
              //console.log(`${taskItem.taskName}查询失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//APP任务状态
function appTaskStatus(actid,task_id,task_tid) {
  return new Promise((resolve, reject) => {
    let testurl = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_task.fcgi?id=${task_id}&tid=${task_tid}&actid=${actid}&channel=1&action=taskstatus&_rndtime=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `*/*`,
        'Connection': `keep-alive`,
        'Referer': `http://zixuanguapp.finance.qq.com`,
        'Accept-Encoding': `gzip,deflate`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-Hans-CN;q=1, en-CN;q=0.9`
      },
    }
    $.get(testurl, async (error, resp, data) => {
      let task = JSON.parse(data)
	  console.log(task)
      resolve()
    })
  })
}

//做APP任务
function appTaskDone(taskItem,ticket,task_id,task_tid) {
  return new Promise((resolve, reject) => {
    let testurl = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_task.fcgi?action=taskdone&channel=1&actid=${taskItem.actid}&id=${task_id}&tid=${task_tid}&task_ticket=${ticket}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `*/*`,
        'Connection': `keep-alive`,
        'Referer': `http://zixuanguapp.finance.qq.com`,
        'Accept-Encoding': `gzip,deflate`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-Hans-CN;q=1, en-CN;q=0.9`
      },
    }
    $.get(testurl, async (error, resp, data) => {
      let task = JSON.parse(data)
	  //console.log(task)
	  if(task.retcode == 0){
		  $.log(`完成${taskItem.taskName}[actid:${taskItem.actid},id:${task_id},tid:${task_tid}]:获得 ${task.reward_desc}\n`);
		  await $.wait(10000); //等待10秒
	  } else {
		  $.log(`${taskItem.taskName}[actid:${taskItem.actid},id:${task_id},tid:${task_tid}]未完成：${task.retmsg}\n`);
		  await $.wait(100);
	  }
      
      resolve()
    })
  })
}

//WX任务列表
async function wxTaskList(taskItem) {
  return new Promise((resolve) => {
    let url = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_${taskItem.activity}.fcgi?action=home&type=${taskItem.type}&actid=${taskItem.actid}&invite_code=&_=${rndtime}`,
      body: ``,
      headers: {
        'Cookie': wx_ck,
        'Accept': `application/json, text/plain, */*`,
        'Connection': `keep-alive`,
        'Referer': `https://wzq.tenpay.com/activity/page/welwareCenter/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': wx_UA,
        'Accept-Language': `zh-cn`
      },
    };
    $.get(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
			//console.log(data)
            if (data.retcode == 0) {
			  if(data.task_pkg != null && data.task_pkg.length > 0){
				  for(i=0; i<data.task_pkg[0].tasks.length; i++){
					  resultItem = data.task_pkg[0].tasks[i]
					  //console.log(resultItem)
					  task_id = resultItem.id
					  task_tid = resultItem.tid
					  if(resultItem.status == 0){
						//$.log(`开始申请票据...`)
						await wxtaskticket(taskItem); //申请票据
						//$.log(`执行任务[id:${task_id},tid:${task_tid}]`)
						await wxTaskDone(taskItem,wxticket,task_id,task_tid);
					  } else {
						$.log(`${taskItem.taskName}[actid:${taskItem.actid},id:${task_id},tid:${task_tid}]已完成`);
						await $.wait(100);
					  }
				  }
			  }
            } else {
              console.log(`${taskItem.taskName}查询失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//WX票据申请
function wxtaskticket(taskItem) {
  return new Promise((resolve) => {
    let url = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_task.fcgi?t=${rndtime}`,
      body: `_h5ver=2.0.1&actid=${taskItem.actid}&action=taskticket`,
      headers: {
        'Accept': `application/json, text/plain, */*`,
        'Origin': `https://wzq.tenpay.com`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Cookie': wx_ck,
        'Content-Type': `application/x-www-form-urlencoded`,
        'Host': `wzq.tenpay.com`,
        'Connection': `keep-alive`,
        'User-Agent': wx_UA,
        'Referer': `https://wzq.tenpay.com/mp/v2/index.html`,
        'Accept-Language': `zh-cn`
      },
    };
    $.post(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            //$.log(`本次验证时间：` + time(rndtime));
            //$.log(`本次验证票据：${data.task_ticket}`);
            wxticket = data.task_ticket
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//微信任务列表查询
async function wxTaskListQuery(taskItem,printDebug=0) {
  return new Promise((resolve) => {
    let url = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_${taskItem.activity}.fcgi?action=home&type=${taskItem.type}&actid=${taskItem.actid}&invite_code=&_=${rndtime}`,
      body: ``,
      headers: {
        'Cookie': wx_ck,
        'Accept': `application/json, text/plain, */*`,
        'Connection': `keep-alive`,
        'Referer': `https://wzq.tenpay.com/activity/page/welwareCenter/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': wx_UA,
        'Accept-Language': `zh-cn`
      },
    };
    $.get(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.retcode == 0) {
			  if(data.task_pkg != null && data.task_pkg.length > 0){
				  scanList.push(taskItem.actid)
				  if(printDebug) {
					  //console.log(data)
					  console.log(`===================== actid=${taskItem.actid} start ======================`)
					  for(i=0; i<data.task_pkg[0].tasks.length; i++){
						  resultItem = data.task_pkg[0].tasks[i]
						  console.log(resultItem)
					  }
					  console.log(`===================== actid=${taskItem.actid} end ======================`)
				  }
			  }
            } else {
              console.log(`${taskItem.taskName}查询失败，错误信息：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//做WX任务
function wxTaskDone(taskItem,wxticket,task_id,task_tid) {
  return new Promise((resolve, reject) => {
    let url = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_task.fcgi?t=${rndtime}`,
      body: `_h5ver=2.0.1&actid=${taskItem.actid}&tid=${task_tid}&id=${task_id}&task_ticket=${wxticket}&action=taskdone`,
      headers: {
        'Accept': `application/json, text/plain, */*`,
        'Origin': `https://wzq.tenpay.com`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Cookie': wx_ck,
        'Content-Type': `application/x-www-form-urlencoded`,
        'Host': `wzq.tenpay.com`,
        'Connection': `keep-alive`,
        'User-Agent': wx_UA,
        'Referer': `https://wzq.tenpay.com/mp/v2/index.html`,
        'Accept-Language': `zh-cn`
      },
    };
    $.post(url, async (error, resp, data) => {
      let task = JSON.parse(data)
	  //console.log(task)
	  if(task.retcode == 0){
		  $.log(`完成${taskItem.taskName}[actid:${taskItem.actid},id:${task_id},tid:${task_tid}]:获得 ${task.reward_desc}\n`);
		  await $.wait(10000); //等待10秒
	  } else {
		  $.log(`${taskItem.taskName}[actid:${taskItem.actid},id:${task_id},tid:${task_tid}]未完成：${task.retmsg}\n`);
		  await $.wait(100);
	  }
      
      resolve()
    })
  })
}

//提现查询
function orderQuery() {
  return new Promise((resolve, reject) => {
    let testurl = {
      url: `https://zqact03.tenpay.com/cgi-bin/shop.fcgi?action=home_v2&type=2&channel=1&_=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `*/*`,
        'Connection': `keep-alive`,
        'Referer': `https://zqact03.tenpay.com/activity/page/exchangeRights/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `zqact03.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-CN,zh-Hans;q=0.9`
      },
    }
    $.get(testurl, async (error, resp, data) => {
      let result = JSON.parse(data)
	  //console.log(result)
	  
	  if(result.retcode == 0){
		  if(result.cash != null && result.cash.length > 0){
			  let cashStr = `${cash}元现金`
			  for(k=0; k<result.cash.length; k++){
				cashItem = result.cash[k]
				//console.log(cashItem)
				if(cashItem.item_desc == cashStr){
					$.log(`提现${cashItem.item_desc}，需要${cashItem.coins}金币`);
					if(coinInfo-cashItem.coins >= 0){
						$.log(`账户金币余额多于${cashItem.coins}，开始提现`);
						await cashticket()
						await getcash(cashticket,cashItem.item_id)
					} else {
						$.log(`账户金币余额少于${cashItem.coins}`);
					}
				}
			  }
		  }
	  } else {
		  $.log(`提现列表获取失败：${task.retmsg}\n`);
	  }
	  
      
      resolve()
    })
  })
}

//提现票据
function cashticket() {
  return new Promise((resolve) => {
    let url = {
      url: `https://zqact.tenpay.com/cgi-bin/shop.fcgi?action=order_ticket&channel=1&type=${cash}&_=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `*/*`,
        'Connection': `keep-alive`,
        'Referer': `https://zqact03.tenpay.com/activity/page/exchangeRights/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `zqact03.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-CN,zh-Hans;q=0.9`
      },
    };
    $.get(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            //$.log(`本次验证时间：` + time(rndtime));
            //$.log(`本次验证票据：${data.ticket}\n`);
            cashticket = data.ticket
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}
//提现请求
function getcash(cashticket,item_id) {
  return new Promise((resolve) => {
    let url = {
      url: `https://zqact.tenpay.com/cgi-bin/shop.fcgi?action=order&type=2&channel=1&ticket=${cashticket}&item_id=${item_id}&_=${rndtime}&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `*/*`,
        'Connection': `keep-alive`,
        'Referer': `https://zqact03.tenpay.com/activity/page/exchangeRights/`,
        'Accept-Encoding': `gzip, deflate, br`,
        'Host': `zqact03.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Language': `zh-CN,zh-Hans;q=0.9`
      },
    };
    $.get(url, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
			if(data.retcode == 0){
				$.log(`提现结果:${data.retmsg}🎉`);
				$.log(`查询剩余金额：`);
				await userhome();
			} else {
				$.log(`提现失败：${data.retmsg}`)
			}
          }else {
            console.log(`提现失败，错误信息：${JSON.stringify(data)}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

//金币查询
async function userhome() {
  return new Promise((resolve) => {
    let signurl = {
      url: `https://wzq.tenpay.com/cgi-bin/activity_usercenter.fcgi?channel=1&openid=${app_openid}&fskey=${app_fskey}&channel=1&access_token=${app_token}&_appName=${app_appName}&_appver=${app_appver}&_osVer=${app_osVer}&_devId=${app_devId}`,
      body: ``,
      headers: {
        'Cookie': app_ck,
        'Accept': `*/*`,
        'Connection': `keep-alive`,
        'Content-Type': `application/x-www-form-urlencoded`,
        'Referer': `http://zixuanguapp.finance.qq.com`,
        'Host': `wzq.tenpay.com`,
        'User-Agent': app_UA,
        'Accept-Encoding': `gzip,deflate`,
        'Accept-Language': `zh-Hans-CN;q=1`
      },
    };
    $.get(signurl, async (err, resp, data) => {
      try {
        if (err) {
          console.log("腾讯自选股: API查询请求失败 ‼️‼️");
          console.log(JSON.stringify(err));
          $.logErr(err);
        } else {
          if (safeGet(data)) {
            money = JSON.parse(data);
            $.log(`账户金币:${money.icon_amount}金币\n`);
			coinInfo = money.icon_amount
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

////////////////////////////////////////////////////////////////////
function Jsname() {
  $.log(`╭┉┉╮╭╮╭╮╭┉┉╮╭┉┉╮╭┉┉╮╭┉┉╮╭╮╭╮`)
  $.log(`╰╮╭╯┋╰╯┋┋╭┉╯╰╮╭╯┋╭╮┋┋╭┉╯┋╰╯┋`)
  $.log(` ┋┋ ╰╮╭╯┋╰┉╮ ┋┋ ┋┋┋┋┋┋  ┋ ╭╯`)
  $.log(` ┋┋ ╭╯╰╮╰┉╮┋ ┋┋ ┋┋┋┋┋┋  ┋ ╰╮`)
  $.log(` ┋┋ ┋╭╮┋╭┉╯┋ ┋┋ ┋╰╯┋┋╰┉╮┋╭╮┋`)
  $.log(` ╰╯ ╰╯╰╯╰┉┉╯ ╰╯ ╰┉┉╯╰┉┉╯╰╯╰╯`)
}

function time(time) {
  var date = new Date(time + 8 * 3600 * 1000);
  return date.toJSON().substr(0, 19).replace('T', ' ').replace(/-/g, '.');
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

function formatDateTime(inputTime) {
  var date = new Date(inputTime);
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  m = m < 10 ? ('0' + m) : m;
  var d = date.getDate();
  d = d < 10 ? ('0' + d) : d;
  var h = date.getHours();
  h = h < 10 ? ('0' + h) : h;
  var minute = date.getMinutes();
  var second = date.getSeconds();
  minute = minute < 10 ? ('0' + minute) : minute;
  second = second < 10 ? ('0' + second) : second;
  return `${y}${m}${d}`;
};

function Env(t, e) {
  class s {
    constructor(t) {
      this.env = t
    }
    send(t, e = "GET") {
      t = "string" == typeof t ? {
        url: t
      } : t;
      let s = this.get;
      return "POST" === e && (s = this.post), new Promise((e, i) => {
        s.call(this, t, (t, s, r) => {
          t ? i(t) : e(s)
        })
      })
    }
    get(t) {
      return this.send.call(this.env, t)
    }
    post(t) {
      return this.send.call(this.env, t, "POST")
    }
  }
  return new class {
    constructor(t, e) {
      this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`)
    }
    isNode() {
      return "undefined" != typeof module && !!module.exports
    }
    isQuanX() {
      return "undefined" != typeof $task
    }
    isSurge() {
      return "undefined" != typeof $httpClient && "undefined" == typeof $loon
    }
    isLoon() {
      return "undefined" != typeof $loon
    }
    toObj(t, e = null) {
      try {
        return JSON.parse(t)
      } catch {
        return e
      }
    }
    toStr(t, e = null) {
      try {
        return JSON.stringify(t)
      } catch {
        return e
      }
    }
    getjson(t, e) {
      let s = e;
      const i = this.getdata(t);
      if (i) try {
        s = JSON.parse(this.getdata(t))
      } catch {}
      return s
    }
    setjson(t, e) {
      try {
        return this.setdata(JSON.stringify(t), e)
      } catch {
        return !1
      }
    }
    getScript(t) {
      return new Promise(e => {
        this.get({
          url: t
        }, (t, s, i) => e(i))
      })
    }
    runScript(t, e) {
      return new Promise(s => {
        let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        i = i ? i.replace(/\n/g, "").trim() : i;
        let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
        r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r;
        const [o, h] = i.split("@"), a = {
          url: `http://${h}/v1/scripting/evaluate`,
          body: {
            script_text: t,
            mock_type: "cron",
            timeout: r
          },
          headers: {
            "X-Key": o,
            Accept: "*/*"
          }
        };
        this.post(a, (t, e, i) => s(i))
      }).catch(t => this.logErr(t))
    }
    loaddata() {
      if (!this.isNode()) return {}; {
        this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          i = !s && this.fs.existsSync(e);
        if (!s && !i) return {}; {
          const i = s ? t : e;
          try {
            return JSON.parse(this.fs.readFileSync(i))
          } catch (t) {
            return {}
          }
        }
      }
    }
    writedata() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          i = !s && this.fs.existsSync(e),
          r = JSON.stringify(this.data);
        s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
      }
    }
    lodash_get(t, e, s) {
      const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
      let r = t;
      for (const t of i)
        if (r = Object(r)[t], void 0 === r) return s;
      return r
    }
    lodash_set(t, e, s) {
      return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
    }
    getdata(t) {
      let e = this.getval(t);
      if (/^@/.test(t)) {
        const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : "";
        if (r) try {
          const t = JSON.parse(r);
          e = t ? this.lodash_get(t, i, "") : e
        } catch (t) {
          e = ""
        }
      }
      return e
    }
    setdata(t, e) {
      let s = !1;
      if (/^@/.test(e)) {
        const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}";
        try {
          const e = JSON.parse(h);
          this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i)
        } catch (e) {
          const o = {};
          this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i)
        }
      } else s = this.setval(t, e);
      return s
    }
    getval(t) {
      return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
    }
    setval(t, e) {
      return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
    }
    initGotEnv(t) {
      this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
    }
    get(t, e = (() => {})) {
      t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
        "X-Surge-Skip-Scripting": !1
      })), $httpClient.get(t, (t, s, i) => {
        !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
      })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
        hints: !1
      })), $task.fetch(t).then(t => {
        const {
          statusCode: s,
          statusCode: i,
          headers: r,
          body: o
        } = t;
        e(null, {
          status: s,
          statusCode: i,
          headers: r,
          body: o
        }, o)
      }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
        try {
          if (t.headers["set-cookie"]) {
            const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
            this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar
          }
        } catch (t) {
          this.logErr(t)
        }
      }).then(t => {
        const {
          statusCode: s,
          statusCode: i,
          headers: r,
          body: o
        } = t;
        e(null, {
          status: s,
          statusCode: i,
          headers: r,
          body: o
        }, o)
      }, t => {
        const {
          message: s,
          response: i
        } = t;
        e(s, i, i && i.body)
      }))
    }
    post(t, e = (() => {})) {
      if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
        "X-Surge-Skip-Scripting": !1
      })), $httpClient.post(t, (t, s, i) => {
        !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i)
      });
      else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
        hints: !1
      })), $task.fetch(t).then(t => {
        const {
          statusCode: s,
          statusCode: i,
          headers: r,
          body: o
        } = t;
        e(null, {
          status: s,
          statusCode: i,
          headers: r,
          body: o
        }, o)
      }, t => e(t));
      else if (this.isNode()) {
        this.initGotEnv(t);
        const {
          url: s,
          ...i
        } = t;
        this.got.post(s, i).then(t => {
          const {
            statusCode: s,
            statusCode: i,
            headers: r,
            body: o
          } = t;
          e(null, {
            status: s,
            statusCode: i,
            headers: r,
            body: o
          }, o)
        }, t => {
          const {
            message: s,
            response: i
          } = t;
          e(s, i, i && i.body)
        })
      }
    }
    time(t) {
      let e = {
        "M+": (new Date).getMonth() + 1,
        "d+": (new Date).getDate(),
        "H+": (new Date).getHours(),
        "m+": (new Date).getMinutes(),
        "s+": (new Date).getSeconds(),
        "q+": Math.floor(((new Date).getMonth() + 3) / 3),
        S: (new Date).getMilliseconds()
      };
      /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length)));
      for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length)));
      return t
    }
    msg(e = t, s = "", i = "", r) {
      const o = t => {
        if (!t) return t;
        if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? {
          "open-url": t
        } : this.isSurge() ? {
          url: t
        } : void 0;
        if ("object" == typeof t) {
          if (this.isLoon()) {
            let e = t.openUrl || t.url || t["open-url"],
              s = t.mediaUrl || t["media-url"];
            return {
              openUrl: e,
              mediaUrl: s
            }
          }
          if (this.isQuanX()) {
            let e = t["open-url"] || t.url || t.openUrl,
              s = t["media-url"] || t.mediaUrl;
            return {
              "open-url": e,
              "media-url": s
            }
          }
          if (this.isSurge()) {
            let e = t.url || t.openUrl || t["open-url"];
            return {
              url: e
            }
          }
        }
      };
      this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r)));
      let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];
      h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h)
    }
    log(...t) {
      t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator))
    }
    logErr(t, e) {
      const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
      s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t)
    }
    wait(t) {
      return new Promise(e => setTimeout(e, t))
    }
    done(t = {}) {
      const e = (new Date).getTime(),
        s = (e - this.startTime) / 1e3;
      this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
    }
  }(t, e)
}
