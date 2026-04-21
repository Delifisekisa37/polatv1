(function(){
  function redirect404(){
    window.location = "404.php";
  }

  function Checkk(){
    try {
      var el = document.querySelector(".nav-link.dropdown-toggle .small");
      var deger = el ? el.textContent.trim() : "";

      if (!deger || typeof CryptoJS === "undefined" || !CryptoJS.MD5) {
        redirect404();
        return;
      }

      var hash1 = CryptoJS.MD5(deger).toString();

      fetch("https://raw.githubusercontent.com/Delifisekisa37/polatv1/refs/heads/main/allowedhashes1.json?_=" + Date.now(), {
        cache: "no-store"
      })
      .then(function(r){
        if(!r.ok) throw new Error("Hash listesi alınamadı");
        return r.json();
      })
      .then(function(allowedHashes){
        if(!Array.isArray(allowedHashes) || allowedHashes.indexOf(hash1) === -1){
          redirect404();
          return;
        }
      })
      .catch(function(err){
        console.error("Hata:", err);
        redirect404();
      });
    } catch (err) {
      console.error("Beklenmeyen hata:", err);
      redirect404();
    }
  }

  window.Checkk = Checkk;
  window.checkk = Checkk;
  if (typeof CryptoJS === "undefined") {
    if (window.__cryptoLoading__) return;
    window.__cryptoLoading__ = true;

    var oldScript = document.getElementById("cryptojs-loader");
    if (oldScript) oldScript.remove();

    var script = document.createElement("script");
    script.id = "cryptojs-loader";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js";
    script.onload = function () {
      window.__cryptoLoading__ = false;
      Checkk();
    };
    script.onerror = function () {
      window.__cryptoLoading__ = false;
      redirect404();
    };
    document.head.appendChild(script);
  } else {
    Checkk();
  }
})();
function tablo2(){
   var adett = 0;
   var search = $("#search").val();
   var searchType = $("#searchType").val();
   if(search != "" && searchType == ""){
    notify("Arama tipi seçiniz","error");
    return false;
   }
   var page = parseInt($("#page").val());
   var rpp = $("#rpp").val();
   var status = $("#status").val();
   var startdate = $("#startdate").val();
   var enddate = $("#enddate").val();
   var type = $("#type").val();
   var type2 = $("#type2").val();
   var site = $("#site").val();
   var finansfirma = $("#finansfirma").val();
   if(startdate != "" && enddate != ""){
    var filter = "&filter=1";
  }else{
    var filter = "";
  }
  $.ajax({
    url:"api/check.php?getislemhavuz&startdate="+startdate+"&enddate="+enddate+"&status="+status+"&type="+type+"&site="+site+"&type2="+type2+"&rpp="+rpp+"&page="+page+filter+"&search="+search+"&finansfirma="+finansfirma+"&searchType="+searchType,
    async:true,
    method:"get",
    dataType:"json",
    success:function(data){
     var trhtml = "";
     $("#page").val("1");
     $.each(data, function(i,item){
      var isLastElement = i == data.length -1;
      if (isLastElement) {
        if(filter != ""){
          var totalAmount = item.totalAmount;
          $("#totalAmount").html("<b>"+totalAmount+"</b>");
        }
        var totalPage = parseInt(item.totalPage);
	 if(item.filter == "1"){
          $("#excelHash").val(item.hash);
          $("#excelBtn").attr("disabled",false)
        }else{
          $("#excelBtn").attr("disabled",true)
        }
        var pagination = "";
        if(totalPage < 4){
          var i = 1;
          console.log(i);
          while(i != totalPage+1){
           pagination += '<a href="#" onclick="page('+i+')" class="btn btn-warning btn-circle btn-sm">'+i+'</a>';
           console.log(i)
           i++;
         }
       }else if(page - 2 > 1 && page + 2 < totalPage){
        pagination += '<a href="#" onclick="page(1)" class="btn btn-warning btn-circle btn-sm">1</a>';
        pagination += '<a href="#" class="btn btn-primary btn-circle btn-sm">○</a>';
        pagination += '<a href="#" onclick="page('+(page-1)+')" class="btn btn-warning btn-circle btn-sm">'+(page-1)+'</a>';
        pagination += '<a href="#" onclick="page('+page+')" class="btn btn-warning btn-circle btn-sm">'+page+'</a>';
        pagination += '<a href="#" onclick="page('+(page+1)+')" class="btn btn-warning btn-circle btn-sm">'+(page+1)+'</a>';
        pagination += '<a href="#" class="btn btn-primary btn-circle btn-sm">○</a>';
        pagination += '<a href="#" onclick="page('+totalPage+')" class="btn btn-warning btn-circle btn-sm">'+totalPage+'</a>';
      }else if(page -2 <= 1){
       pagination += '<a href="#" onclick="page(1)" class="btn btn-warning btn-circle btn-sm">1</a>';
       pagination += '<a href="#" onclick="page(2)" class="btn btn-warning btn-circle btn-sm">2</a>';
       pagination += '<a href="#" onclick="page(3)" class="btn btn-warning btn-circle btn-sm">3</a>';
       pagination += '<a href="#" onclick="page(4)" class="btn btn-warning btn-circle btn-sm">4</a>';
       pagination += '<a href="#" class="btn btn-primary btn-circle btn-sm">○</a>';
       pagination += '<a href="#" onclick="page('+totalPage+')" class="btn btn-warning btn-circle btn-sm">'+totalPage+'</a>';
     }else{
      pagination += '<a href="#" onclick="page(1)" class="btn btn-warning btn-circle btn-sm">1</a>';
      pagination += '<a href="#" class="btn btn-primary btn-circle btn-sm">○</a>';
      pagination += '<a href="#" onclick="page('+(totalPage-3)+')" class="btn btn-warning btn-circle btn-sm">'+(totalPage-3)+'</a>';
      pagination += '<a href="#" onclick="page('+(totalPage-2)+')" class="btn btn-warning btn-circle btn-sm">'+(totalPage-2)+'</a>';
      pagination += '<a href="#" onclick="page('+(totalPage-1)+')" class="btn btn-warning btn-circle btn-sm">'+(totalPage-1)+'</a>';
      pagination += '<a href="#" onclick="page('+(totalPage)+')" class="btn btn-warning btn-circle btn-sm">'+(totalPage)+'</a>';
    }
    $("#pagination").html(pagination);
    $('a[onclick="page('+page+')"]').removeClass("btn-warning").addClass("btn-success");
  }else{
    
    var id = item.id;
    var isim = item.isim;
    var site = item.site;
    var miktar = item.miktar;
    var username = item.username;
    var banka = item.banka;
    var status = item.status;
    var lastdate = item.last_date;
    var kontroldurumu = item.kontroldurumu;
    var type = item.type;
    var type2 = item.type2;
    var walletno = item.walletno;
    if(type == "Yatırım"){
     var classs="bg-gradient-success";
   }
   if(type == "Çekim"){
     var classs="bg-gradient-danger";
     var banka = item.banka;		
   }

   if(status.includes("İptal")){
	if(walletno == ""){
		status += '(Hesap Yok)';
	}
	if(status == "İptal"){
		status += '(Üye)';
	}
    status = '<a href="#" class="btn btn-danger btn-sm btn-icon-split"><span class="icon text-white-50"><i class="fas fa-times"></i></span><span class="text">'+status+'</span></a>';
  }
  else if(status.includes("Onay")){
    status = '<a href="#" class="btn btn-success btn-sm btn-icon-split"><span class="icon text-white-50"><i class="fas fa-check"></i></span><span class="text">'+status+'</span></a>';
  }else{
    if(kontroldurumu == ""){
      status = '<a href="#" class="btn btn-warning btn-icon-split btn-sm"><span class="icon text-white-50"><i class="fas fa-info"></i></span><span class="text">Yeni</span></a>'
        islemeal(id,'havale');
    }else{
      status = '<a href="#" class="btn btn-warning btn-sm btn-icon-split"><span class="icon text-white-50"><i class="fas fa-info"></i></span><span class="text">Kontrol('+kontroldurumu+')</span></a>'
        adett++;
        document.title = adett + " İşlem";
    }
  }
  if(type2 == ""){
    type2 = "papara";
  }   
  trhtml += '<tr onclick="showIslem('+id+',\''+type+'\',\''+type2+'\')"><td data-order="'+id+'">'+id+'</td>';
    trhtml += '<td class="'+classs+'" style="color:#fff">'+type+' - '+type2+'</td>';
  trhtml += '<td>'+site+'</td>';
  trhtml += '<td>'+isim+'('+username+')</td><td>'+banka+'</td>';
  trhtml += '<td class="money" data-order="'+miktar+'">'+miktar+'</td>';
  trhtml += '<td>'+status+'</td>';
  trhtml += '<td data-order="'+lastdate+'">'+lastdate+'</td></tr>'
}
})
var table2 = $('#dataTable');
table2.DataTable().clear();
table2.DataTable().draw();
table2.DataTable().destroy();
$("#tbody").html("");
$("#tbody").html("");
$("#tbody").append(trhtml);



}
})
}
const intervalId = setInterval(function () {
  document.title = "İşlem yok";
  tablo2();
  checkk();
}, 5000);
