const cloudId = '';
const cloud = tcb.init({
	env: cloudId
})
const auth = cloud.auth();
let initFlag = false;
let uid = null;
let advicelist = {};

init();

function init(){
    let clouduid = window.sessionStorage.getItem('refresh_token_'+cloudId);
    if(clouduid==null){
        let id = prompt("请输入管理ID","");
        if(id){
            let ik = prompt("请输入管理IK","");
            if(ik){
                calls({
                    url: 'https://'+cloudId+'.service.tcloudbase.com/adminlogin',
                    data: {
                        ID:id,
                        IK:ik
                    },
                    success(res) {
                        console.log(res);
                        if (res.code == 0) {
                            signInWithTicket(res.ticket);
                        } else {
                            alert('身份验证错误，登录失败！');
                        }
                    },
                    fail(e) {
                        console.log(e);
                    }
                })
            }
        }
    }
    else{
        initFlag = true;
        initlist();
    }
}

function signInWithTicket(ticket) {
	auth.signInWithTicket(ticket).then(res => {
        initFlag = true;
        initlist();
    });
}

function cloudCheck(){
    if(initFlag == false){
        alert('云开发还未初始化，请稍后再试或刷新页面！');
    }
    return initFlag;
}

function initlist(){
    cloud.callFunction({
        name: 'init-admin'
    })
    .then((res) => {
        refreshlist(res.result.list);
    });
}

function refreshlist(list){
    let el = document.getElementById("list");
    el.innerHTML="";
    advicelist = {};
    for(let i in list){
        let tempitem = list[i];
        advicelist[tempitem._id] = tempitem;
        let listitem = document.createElement('div');
        listitem.setAttribute('class','list-item');
        listitem.setAttribute('id',tempitem._id);

        let itemadvice = document.createElement('div');
        itemadvice.setAttribute('class','list-item-advice');
        itemadvice.innerText = tempitem.advice;
        listitem.appendChild(itemadvice);

        let itemretext = document.createElement('div');
        itemretext.setAttribute('class','list-item-retext');
        itemretext.setAttribute('id',tempitem._id+'-retext');
        itemretext.innerText = tempitem.retext||'';
        listitem.appendChild(itemretext);

        if(tempitem.imgs!=null && tempitem.imgs.length!=0){
            let itemimages = document.createElement('div');
            itemimages.setAttribute('class','list-item-images');

            for(let n in tempitem.imgs){
                let img = document.createElement('img');
                img.src = cloudtohttp(tempitem.imgs[n]);
                img.setAttribute('onclick','previewnetimg("'+img.src+'")');
                itemimages.appendChild(img);
            }
            listitem.appendChild(itemimages);
        }

        let itemdate = document.createElement('div');
        itemdate.setAttribute('class','list-item-date');
        itemdate.innerText = dateFormat("YYYY-mm-dd HH:MM",new Date(tempitem.adddue));
        listitem.appendChild(itemdate);

        let itemre = document.createElement('div');
        itemre.setAttribute('class','list-item-re');
        itemre.setAttribute('onclick','readvice("'+tempitem._id+'")');
        itemre.innerText = '回复';
        listitem.appendChild(itemre);
        
        el.appendChild(listitem);
    }
}

function readvice(id){
    let remodel = document.getElementById(id+'-retext');
    remodel.innerHTML="";

    let reinput = document.createElement('textarea');
    reinput.setAttribute('id',id+'-input');
    reinput.value = advicelist[id].retext||'';
    remodel.appendChild(reinput);

    let resubmit = document.createElement('button');
    resubmit.setAttribute('onclick','submitretext("'+id+'")');
    resubmit.setAttribute('class','submit');
    resubmit.innerText="提交回复";
    remodel.appendChild(resubmit);

    let recancel = document.createElement('button');
    recancel.setAttribute('onclick','cancelretext("'+id+'")');
    recancel.innerText="取消回复";
    remodel.appendChild(recancel);
}

function submitretext(id){
    let retext = document.getElementById(id+'-input').value;
    cloud.callFunction({
        name: 'retext',
        data:{
            id:id,
            retext:retext
        }
    })
    .then((res) => {
        if(res.result.code==0){
            let remodel = document.getElementById(id+'-retext');
            remodel.innerText=retext;
        }
    });
}

function cancelretext(id){
    let remodel = document.getElementById(id+'-retext');
    remodel.innerText=advicelist[id].retext||'';
}

function calls(obj) {
    let xml = new XMLHttpRequest();
    let url = obj.url + '?';
    for (let item in obj.data) {
        url += (item + '=' + obj.data[item] + '&');
    }
    xml.open('GET', url, true);
    xml.send();
    xml.onreadystatechange = function () {
        if (xml.readyState === 4 && xml.status === 200) {
            obj.success(JSON.parse(xml.responseText))
        } else {
            obj.fail(xml.status);
        }
    }
}