const cloudId = '';
const cloud = tcb.init({
	env: cloudId
})
const auth = cloud.auth();
let initFlag = false;
let uid = null;
let imagearray = {};
let pushinarray = {};
let maxlength = 5;
let submitflag = false;
let advicelist = {};

init();

function init(){
    signInAnonymously();
}

function signInAnonymously() {
    auth.signOut();
    auth.signInAnonymously().then(function() {
        auth.getLoginState().then(function() {
            initFlag = true;
            uid = JSON.parse(window.localStorage.getItem('anonymous_uuid_'+cloudId)).content;
            initlist();
        });
    }).catch(function(err) {
        console.log('初始化失败',err);
        alert('云开发初始化失败，请稍后刷新重试！');
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
        name: 'init'
    })
    .then((res) => {
        refreshlist(res.result.list);
    });
}

function deladvice(id){
    if(confirm('是否要删除这个意见？')){
        cloud.database().collection('advice').where({
            _id:id
        }).remove(
        function(err, res) {
            let tempimgs = advicelist[id].imgs;
            if(tempimgs!=null && tempimgs.length!=0){
                cloud.deleteFile({
                  fileList: tempimgs
                })
                .then(res => {
                    alert('删除成功！');
                    initlist()
                });
            }
            else{
                alert('删除成功！');
                initlist();
            }
        });
    }
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

        if(tempitem.retext!=null&&tempitem.retext!=""){
            let itemretext = document.createElement('div');
            itemretext.setAttribute('class','list-item-retext');
            itemretext.innerText = tempitem.retext;
            listitem.appendChild(itemretext);
        }

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

        let itemdel = document.createElement('div');
        itemdel.setAttribute('class','list-item-del');
        itemdel.setAttribute('onclick','deladvice("'+tempitem._id+'")');
        itemdel.innerText = '删除';
        listitem.appendChild(itemdel);
        
        el.appendChild(listitem);
    }
}

function chooseimage(obj){
    let files = obj.files;
    let imageKeys = Object.keys(imagearray);
    let savenum = maxlength - imageKeys.length;
    if(savenum==0&&files.length!=0){
        alert('最多只能上传5张图片')
    }
    savenum = files.length > savenum ? savenum : files.length;
    for (var i = 0; i < savenum; i++) {
        imagearray[files[i].lastModified]=files[i];
    }
    RefreshImage();
}

function deleteImg(id){
    delete imagearray[id];
    RefreshImage();
}

function RefreshImage() {
    let el = document.getElementById("imgcontent");
    for (let n in pushinarray){
        pushinarray[n].flag = false;
    }
    for (var i in imagearray) {
        if(pushinarray[i]==null){
            const tempimg = imagearray[i];
            pushinarray[i] = tempimg;
            pushinarray[i].flag = true;
            let imgcover = document.createElement('div');
            imgcover.setAttribute('class','imgcover');
            imgcover.setAttribute('id',i);

            let img = document.createElement('img');
            img.setAttribute('onclick','previewimg('+i+')');
            img.setAttribute('id',i+'-img');

            let delicon = document.createElement('div');
            delicon.setAttribute('onclick','deleteImg('+i+')');
            delicon.setAttribute('class','delicon');

            imgcover.appendChild(delicon);
            imgcover.appendChild(img);
            el.appendChild(imgcover);
            var reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
            }
            reader.readAsDataURL(tempimg);
        }
        else{
            pushinarray[i].flag = true;
        }
    }
    for (let n in pushinarray){
        if(pushinarray[n].flag == false){
            let idObject = document.getElementById(n);
            if (idObject != null) idObject.parentNode.removeChild(idObject);
        }
    }
}

function submit(){
    if(cloudCheck()){
        if(submitflag==false){
            let advicetext = document.getElementById('advicetext').value;
            if(advicetext.length>=20){
                submitflag = true;
                document.getElementById('submitbtn')
                let submitbtn = document.getElementById('submitbtn')
                submitbtn.style="cursor:no-drop;";
                submitbtn.innerText="提交中";
                for(let item in imagearray){
                    cloudupload(imagearray[item]);
                }
                let imageKeys = Object.keys(imagearray);
                if(imageKeys.length==0){
                    submittext();
                }
            }
            else{
                alert('建议至少需要20字才可提交！')
            }
        }
    }
}

function submittext(){
    let imgs=[];
    console.log(imagearray);
    for(let item in imagearray){
        if(imagearray[item].upload!=true){
            return;
        }
        imgs.push(imagearray[item].cloud);
    }
    let number = document.getElementById('number').value;
    let advicetext = document.getElementById('advicetext').value;
    console.log(advicetext,number,imgs);
    cloud.database().collection('advice').add({
        advice:advicetext,
        number:number,
        imgs:imgs,
        adddue:new Date()
    }, function(err, res) {
        document.getElementById('number').value = "";
        document.getElementById('advicetext').value = "";
        document.getElementById('imgcontent').innerHTML="";
        imagearray = {};
        pushinarray = {};
        initlist();
        alert('意见提交成功！');
        submitflag = false;
        let submitbtn = document.getElementById('submitbtn')
        submitbtn.style="";
        submitbtn.innerText="提交反馈";
    });
}

function cloudupload(file,check){
    cloud.uploadFile({
        cloudPath: 'advice/'+uid+'/'+file.lastModified+'-'+file.name,
        filePath: file
    },
    function(err, res){
        if(res){
            imagearray[file.lastModified].upload = true;
            imagearray[file.lastModified].cloud = res.fileID;
            submittext();
        }
        
    });
}