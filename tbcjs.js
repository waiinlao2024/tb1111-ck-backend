function runTask1() {

    var pvStr = 'jaZmGBk';
    var endStr = 'jYO5Mc1';
    var gStr = 'jYO5Mc1';

    var taobaoScheme = {
      scheme:"taobao",
      main:"taobao://m.taobao.com/tbopen/index.html?h5Url=https://m.taobao.com",
      start: "taobao://m.tb.cn/h." + pvStr,
      end:"taobao://m.tb.cn/h." + endStr,
      gwc:"taobao://m.tb.cn/h." + gStr,

    }

    var scheme = taobaoScheme;
    if (!DB){
      DB = {
        run:0,
        keys:{},
        items:[],
      }
    }
    DB.run = DB.run + 1;
    var taskList = ALLDATA.activity.taskList
    var oneTask = ALLDATA.taskData[taskList[0]];
    var itme = oneTask.task.ckItem;
    var outItme = oneTask.task.outItem ? oneTask.task.outItem : [];
    var ckUrl = oneTask.task.ckurl
    var wait = oneTask.task.wait
    var paramObj = oneTask.task.param
    var nowToken = ""
    if (data.ret && data.ret[0] == "SUCCESS::调用成功" && data.data && data.data.model) {
      var items = []
      var urlItem = []
      var baseUrl = scheme.scheme + ckUrl;

      for (var item of data.data.model) {
        if (item.progress.needTimes !== '0') {
          var num = item.progress.needTimes * 1
          var index = item.progress.times

          var deliveryId = item.taskParams.deliveryId
          var implId = item.taskParams.implId
          var fromToken = item.taskParams.fromToken
          nowToken = fromToken;
          if(!DB.keys[deliveryId]){
            

            //获取key
            if (!(outItme.includes(deliveryId))){
                 if (num < 3){
                  DB.keys[deliveryId] = true;
                 }
                 if(num >= 3){
                    num = 3
                 }
              for (var i = 0; i < num ; i++){
                var nowImplId = implId
                var b = nowImplId.split('_');
                b.pop();
                nowImplId = b.join('_') + '_' +(index*1 + i)
                DB.items.push(`${deliveryId} ${nowImplId}`)
                var url =  baseUrl + `&implId=${nowImplId}&deliveryId=${deliveryId}&fromToken=${fromToken}`

                for (var key in paramObj){

                  var paramArr = paramObj[key]
                  var reg = new RegExp(`${key}`,'g')
                  var str = paramArr[Math.floor((Math.random()*paramArr.length))]
                  url = url.replace(reg,str);
                }
                urlItem.push({
                  url:url,
                  wait:wait
                })
              }
            

            
            }

           

          }


        }
      }
      var urlD = [ ]
      if (DB.run == 1){

       urlD.push({
          url:scheme.end,
          wait:8
        })

        urlD.push({
            url:scheme.start,
            wait:5
          })
        
       

        
        
        urlD.push({
          url:scheme.main,
          wait:5
        })
      }


      if (DB.run == 1 && nowToken){

        var baseUrl = oneTask.task.ckitemUrl
        itme.map((v,i) => {

          var str = v;
          var params = str.split(' ');
          var url = baseUrl + '&fromToken=' + nowToken;


          for (var key in paramObj){

            var paramArr = paramObj[key]
            var reg = new RegExp(`${key}`,'g')
            var str = paramArr[Math.floor((Math.random()*paramArr.length))]
            url = url.replace(reg,str);
          }
          //替换参数2
          params.map((v,i) => {
            if (v){
              var num = i+1;
              var reg = new RegExp(`占位参数${num}`,'g')
              url = url.replace(reg,v);
            }
          });

          urlItem.push({
            url:scheme.type ? scheme.scheme + encodeURIComponent('https' + url):scheme.scheme + url,
            wait:wait
          })

        })
      }

      urlItem.map((v,i) => {
        urlD.push(v)
        if (i !== 0 && i % 2 === 0){
          urlD.push({
            url:scheme.main,
            wait:5
          })
        }
      })

      var dd = {
        succes: 'ok',
        data:urlD,
        db:DB,
      };
      if (nowToken){
        dd.token = nowToken;
      }
      if (urlItem.length === 0){
        dd.end = scheme.gwc;
      }

      return JSON.stringify(dd);
    }else {
      return ;
    }

  }



function runTask() {
    

    var pvStr = 'jaZmGBk';
    var endStr = 'jYO5Mc1';
    var gStr = 'jYO5Mc1';

    var taobaoScheme = {
      scheme:"taobao",
      main:"taobao://m.taobao.com/tbopen/index.html?h5Url=https://m.taobao.com",
      start: "taobao://m.tb.cn/h." + pvStr,
      end:"taobao://m.tb.cn/h." + endStr,
      gwc:"taobao://m.tb.cn/h." + gStr,

    }

    var scheme = taobaoScheme;
    if (!DB){
      DB = {
        run:0,
        keys:{},
        items:[],
      }
    }
    DB.run = DB.run + 1;
    var taskList = ALLDATA.activity.taskList
    var oneTask = ALLDATA.taskData[taskList[0]];
    var itme = oneTask.task.ckItem;
    var outItme = oneTask.task.outItem ? oneTask.task.outItem : [];
    var ckUrl = oneTask.task.ckurl
    var wait = oneTask.task.wait
    var paramObj = oneTask.task.param
    var nowToken = ""
    if (data) {
      var items = []
      var urlItem = []
      var baseUrl = scheme.scheme + ckUrl;

      for (var item of data) {
        if (item.needTimes !== '0') {
          var num = item.needTimes * 1
          var index = item.index

          var deliveryId = item.deliveryId
          var implId = item.implId
          var fromToken = item.fromToken
          nowToken = fromToken;
          if(!DB.keys[deliveryId]){
            

            //获取key
            if (!(outItme.includes(deliveryId))){
                 if (num <= 3){
                  DB.keys[deliveryId] = true;
                 }
                 if(num > 3){
                    num = 3
                 }
              for (var i = 0; i < num ; i++){
                var nowImplId = implId
                var b = nowImplId.split('_');
                b.pop();
                nowImplId = b.join('_') + '_' +(index*1 + i)
                DB.items.push(`${deliveryId} ${nowImplId}`)
                var url =  baseUrl + `&implId=${nowImplId}&deliveryId=${deliveryId}&fromToken=${fromToken}`

                for (var key in paramObj){

                  var paramArr = paramObj[key]
                  var reg = new RegExp(`${key}`,'g')
                  var str = paramArr[Math.floor((Math.random()*paramArr.length))]
                  url = url.replace(reg,str);
                }
                urlItem.push({
                  url:url,
                  wait:wait
                })
              }
            

            
            }

           

          }


        }
      }
      var urlD = [ ]
      if (DB.run == 1){

       urlD.push({
          url:scheme.end,
          wait:10
        })

        urlD.push({
            url:scheme.start,
            wait:5
          })
        
       

        
        
        urlD.push({
          url:scheme.main,
          wait:5
        })
      }


      if (DB.run == 1 && nowToken){

        var baseUrl = oneTask.task.ckitemUrl
        itme.map((v,i) => {

          var str = v;
          var params = str.split(' ');
          var url = baseUrl + '&fromToken=' + nowToken;


          for (var key in paramObj){

            var paramArr = paramObj[key]
            var reg = new RegExp(`${key}`,'g')
            var str = paramArr[Math.floor((Math.random()*paramArr.length))]
            url = url.replace(reg,str);
          }
          //替换参数2
          params.map((v,i) => {
            if (v){
              var num = i+1;
              var reg = new RegExp(`占位参数${num}`,'g')
              url = url.replace(reg,v);
            }
          });

          urlItem.push({
            url:scheme.type ? scheme.scheme + encodeURIComponent('https' + url):scheme.scheme + url,
            wait:wait
          })

        })
      }

      urlItem.map((v,i) => {
        urlD.push(v)
        if ( i % 1 === 0){
          urlD.push({
            url:scheme.main,
            wait:5
          })
        }
      })

      var dd = {
        succes: 'ok',
        data:urlD,
        db:DB,
      };
      if (nowToken){
        dd.token = nowToken;
      }
      if (urlItem.length === 0){
        dd.end = scheme.gwc;
      }

      return JSON.stringify(dd);
    }else {
      return ;
    }

  }

function run () {
    var tag = ALLDATA.tag
    var ck = cookies.replace(/\s+/g,"");
    var t = getCookie(ck,"_m_h5_tk");
    if (t){
      var dd = {
        succes: 'ok',
        data:{
          ck:ck,
          url:`https://service-qd1gmnyf-1257225808.sh.apigw.tencentcs.com/release/getUrl?t=${t}&k=${tag}`
        }
      };

      return JSON.stringify(dd);
    }
    return ""

  }

  
  function getCookie2 () {
    var cookie = str.match(/Cookie: (.+)/)[1];

    var setCkArr = str.match(/Set-Cookie: (.+)/g);


    if(setCkArr ){


        let cookieArr = cookie.split(";");
        let obj = {}
        cookieArr.forEach((i) => {
        let arr = i.split("=");
        
        obj[arr[0]] =arr[1];
        });

        setCkArr.map((v,i) => {
            var kv = v.slice(12).split(";")[0].split("=")
            
            if(kv[1]){
                var keyStr = " " + kv[0]
                obj[keyStr] = kv[1]
            }
        })
        var rc = '';
        for (let key in obj) {
            rc = rc + `${key}=${obj[key]};`
        }
        return rc
    }else{
        return cookie
    }
  }
  
  function getCookie(cookie,name) {
    let cookieArr = cookie.split(";");
    let obj = {}
    cookieArr.forEach((i) => {
      let arr = i.split("=");
      obj[arr[0]] =arr[1];
    });
    return obj[name]
  }
 