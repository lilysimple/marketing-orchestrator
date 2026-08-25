/* ЦЕХ · поведение страницы.
   Два независимых блока: логика интерфейса и оркестровка движения. */

(function(){
  "use strict";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function track(n,p){try{
    if(window.plausible) window.plausible(n,{props:p});
    if(window.dataLayer) window.dataLayer.push(Object.assign({event:n},p||{}));
    if(window.ym && window.YM_ID) window.ym(window.YM_ID,'reachGoal',n);
  }catch(e){}}
  document.addEventListener('click',function(e){
    var el=e.target.closest('[data-cta]'); if(el) track('cta_click',{place:el.getAttribute('data-cta')});
  });

  /* ---------- появление ---------- */
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(en){en.forEach(function(x){
      if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{rootMargin:'0px 0px -10% 0px'});
    document.querySelectorAll('.rv').forEach(function(n){io.observe(n);});
  } else { document.querySelectorAll('.rv').forEach(function(n){n.classList.add('in');}); }

  /* ---------- лента 1920 → 2026 ---------- */
  var tl=document.getElementById('tl'), fill=document.getElementById('tlFill'),
      spark=document.getElementById('tlSpark'), sts=[].slice.call(document.querySelectorAll('[data-st]'));
  function vert(){ return window.matchMedia('(max-width:1000px)').matches; }
  function drawTL(){
    if(!tl) return;
    var r=tl.getBoundingClientRect(), vh=window.innerHeight;
    var p=(vh*0.86-r.top)/(vh*0.58+r.height*0.55);
    p=Math.max(0,Math.min(1,p));
    if(vert()){ fill.style.height=(p*100)+'%'; fill.style.width='100%'; spark.style.top=(p*100)+'%'; spark.style.left='7.5px'; }
    else { fill.style.width=(p*100)+'%'; fill.style.height='100%'; spark.style.left=(p*100)+'%'; spark.style.top='50%'; }
    var reached=Math.round(p*sts.length);
    sts.forEach(function(s,i){ s.classList.toggle('on', i<reached); });
  }
  if(reduce){ sts.forEach(function(s){s.classList.add('on');}); if(fill) fill.style.width='100%'; if(spark) spark.style.display='none'; }
  else { window.addEventListener('scroll',drawTL,{passive:true}); window.addEventListener('resize',drawTL); drawTL(); }

  /* ---------- чат-демо конвейера ---------- */
  var SCRIPT=[
    {s:0,who:'you',t:'Собери мне неделю по новой линейке печей.'},
    {s:0,who:'РАСПАКОВКА',t:'Читаю чертёж бренда. Голос: спокойный инженер, говорим цифрами и допусками. В стоп-листе 14 запретов. Сегмент недели: дизайнеры интерьеров.',att:'core.md · 9 разделов'},
    {s:1,who:'ПЛАН',g:1,t:'Узкое место воронки: осознание проблемы. Беру три темы, каждая на свой этап. Первая идёт с хуком «Кто сказал, что печь обязана быть чёрной?»',att:'plan.json · 3 позиции'},
    {s:1,who:'you',t:'Первую беру. Вторую замени.'},
    {s:1,who:'ПЛАН',g:1,t:'Заменил. Вместо неё разбор допусков по выбросам для тех, кто выбирает по спецификации.'},
    {s:2,who:'ТЕКСТ',t:'Черновик для Telegram, 1 140 знаков. Прогнал по стоп-листу: чисто.',pv:{h:'Кто сказал, что печь обязана быть чёрной?',b:'Чёрный цвет достался печам по наследству. Корпуса красили жаростойкой эмалью, а она держала температуру только в тёмных пигментах.'}},
    {s:2,who:'you',t:'Убери второй абзац, слишком длинно.'},
    {s:2,who:'ТЕКСТ',t:'Убрал. Стало 840 знаков, ритм собрался плотнее.'},
    {s:3,who:'ВИЗУАЛ',g:1,t:'Обложка и карусель на 6 карточек в вашей палитре, подпись на месте.',pvm:1},
    {s:3,who:'you',t:'Годится.'},
    {s:4,who:'ПУБЛИКАЦИЯ',t:'Поставил на четверг 12:00 по алгоритму площадки. Статус темы в плане: в очереди.',att:'plan.json · статус обновлён'},
    {s:5,who:'АНАЛИТИКА',g:1,t:'В пятницу пришлю ведомость: сколько вышло, что собрало переходы, какую тему повторить. Цифры уйдут обратно в план.',att:'report.md · неделя 04.09'}
  ];

  var body=document.getElementById('demoBody'), bar=document.getElementById('demoBar'), replay=document.getElementById('replay');
  var bars=bar?[].slice.call(bar.querySelectorAll('b')):[];
  var timer=null, played=false;

  function node(step){
    var d=document.createElement('div');
    d.className='msg '+(step.who==='you'?'you':'ag'+(step.g?' g':''));
    var who=step.who==='you'?'Вы':'Агент · '+step.who;
    var h='<span class="msg-who">'+who+'</span><div class="msg-b">'+step.t;
    if(step.att) h+='<div class="att"><i></i>'+step.att+'</div>';
    if(step.pv) h+='<div class="pv"><b>'+step.pv.h+'</b>'+step.pv.b+'</div>';
    if(step.pvm) h+='<div class="pvm"><div class="a">108 цветов</div><div class="b">Наследство</div><div class="c">КПД 72%</div></div>';
    d.innerHTML=h+'</div>';
    return d;
  }
  function typing(){
    var d=document.createElement('div');
    d.className='msg ag'; d.id='typing';
    d.innerHTML='<div class="msg-b" style="padding:0"><span class="typing"><i></i><i></i><i></i></span></div>';
    return d;
  }
  function setStage(s){
    bars.forEach(function(b,i){ b.classList.toggle('on', i===s); b.classList.toggle('done', i<s); });
  }
  function toBottom(){ body.scrollTop=body.scrollHeight; }

  function play(){
    if(timer) clearTimeout(timer);
    body.innerHTML=''; setStage(0);
    if(reduce){
      SCRIPT.forEach(function(st){ body.appendChild(node(st)); });
      bars.forEach(function(b){ b.classList.add('done'); });
      return;
    }
    var i=0;
    (function next(){
      if(i>=SCRIPT.length){ setStage(5); bars.forEach(function(b){b.classList.add('done');}); return; }
      var st=SCRIPT[i];
      setStage(st.s);
      if(st.who==='you'){
        body.appendChild(node(st)); toBottom(); i++;
        timer=setTimeout(next, 900);
      } else {
        var tp=typing(); body.appendChild(tp); toBottom();
        timer=setTimeout(function(){
          tp.remove(); body.appendChild(node(st)); toBottom(); i++;
          timer=setTimeout(next, st.pv||st.pvm?2300:1500);
        }, 850);
      }
    })();
  }

  if(body){
    if(reduce) play();
    else if('IntersectionObserver' in window){
      var dio=new IntersectionObserver(function(en){en.forEach(function(x){
        if(x.isIntersecting && !played){ played=true; play(); dio.disconnect(); }});},{threshold:.25});
      dio.observe(document.getElementById('demo'));
    } else play();
    if(replay) replay.addEventListener('click',function(){ played=true; play(); track('demo_replay',{}); });
  }

  /* ---------- выпуск: вкладки ---------- */
  var tabs=[].slice.call(document.querySelectorAll('[role="tab"]'));
  function pick(i){
    tabs.forEach(function(t,k){
      var on=k===i;
      t.setAttribute('aria-selected',on?'true':'false');
      t.tabIndex=on?0:-1;
      var pane=document.getElementById(t.getAttribute('aria-controls'));
      pane.classList.toggle('on',on);
      if(on) pane.removeAttribute('hidden'); else pane.setAttribute('hidden','');
    });
  }
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){ pick(i); track('release_tab',{i:i}); });
    t.addEventListener('keydown',function(e){
      var n=null;
      if(e.key==='ArrowDown'||e.key==='ArrowRight') n=(i+1)%tabs.length;
      if(e.key==='ArrowUp'||e.key==='ArrowLeft') n=(i-1+tabs.length)%tabs.length;
      if(n!==null){ e.preventDefault(); pick(n); tabs[n].focus(); }
    });
  });

  /* ---------- липкая кнопка ---------- */
  var stick=document.getElementById('stick'), zone=document.getElementById('zayavka');
  window.addEventListener('scroll',function(){
    var near = zone && zone.getBoundingClientRect().top < window.innerHeight;
    if(window.scrollY>640 && !near) stick.classList.add('on'); else stick.classList.remove('on');
  },{passive:true});

  /* ---------- глубина ---------- */
  var m={25:0,50:0,75:0,100:0};
  window.addEventListener('scroll',function(){
    var h=document.body.scrollHeight-window.innerHeight; if(h<=0) return;
    var p=Math.round(window.scrollY/h*100);
    [25,50,75,100].forEach(function(k){ if(!m[k]&&p>=k){m[k]=1;track('scroll_depth',{depth:k});} });
  },{passive:true});

  /* ---------- калькулятор тарифа ----------
     НАСТРОЙКА: подставьте адрес своего чат-бота.
     Параметры уходят в него в payload после ?start=,
     например t.me/имя_бота?start=p3f5v2g1e0 */
  var BOT_URL="https://t.me/tseh_lab_bot";

  var calc=document.getElementById('kalkulyator');
  if(calc){
    var state={p:1,f:3,v:1,g:0,e:0};
    var labels={p:'1 площадка',f:'3 в неделю',v:'обложки',g:'не нужна',e:'не нужно'};
    var out={p:document.getElementById('sumP'),f:document.getElementById('sumF'),
             v:document.getElementById('sumV'),g:document.getElementById('sumG'),
             e:document.getElementById('sumE')};
    var vol=document.getElementById('calcVol'), go=document.getElementById('calcGo');

    function volume(){
      /* 3 публикации в неделю на одной площадке дают 12 материалов в месяц.
         Каждая следующая площадка берёт ту же тему и добавляет примерно треть объёма. */
      var n=state.f*4*(1+0.35*(state.p-1));
      if(state.v>1) n+=state.f;
      if(state.g) n+=4;
      return Math.round(n/2)*2;
    }
    function draw(){
      for(var k in out){ if(out[k]) out[k].textContent=labels[k]; }
      vol.innerHTML='≈ '+volume()+' материалов<small>в месяц при этих параметрах</small>';
      /* Кнопка ведёт в чат на этой же странице. Телеграм остаётся запасным
         путём: если скрипт чата не загрузился, ссылка откроет бота. */
      var payload='p'+state.p+'f'+state.f+'v'+state.v+'g'+state.g+'e'+state.e;
      if(document.getElementById('chat')){ go.href='#zayavka'; go.removeAttribute('target'); }
      else if(BOT_URL){ go.href=BOT_URL+'?start='+payload; go.target='_blank'; }
      else { go.href='#zayavka'; go.removeAttribute('target'); }
    }
    [].slice.call(calc.querySelectorAll('.cg')).forEach(function(group){
      var key=group.getAttribute('data-k');
      var btns=[].slice.call(group.querySelectorAll('button'));
      btns.forEach(function(b){
        b.addEventListener('click',function(){
          btns.forEach(function(x){ x.setAttribute('aria-pressed', x===b?'true':'false'); });
          state[key]=parseInt(b.getAttribute('data-v'),10);
          labels[key]=b.getAttribute('data-l');
          draw();
        });
      });
    });
    go.addEventListener('click',function(){
      track('calc_submit',{p:state.p,f:state.f,v:state.v,g:state.g,e:state.e});
      if(window.TSEH_CHAT) window.TSEH_CHAT.fromCalc(state);
    });
    draw();
  }

})();

(function(){
  "use strict";
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(!('IntersectionObserver' in window)) return;

  var root=document.documentElement;
  root.classList.add('js-anim');

  var STEP=0.07;      /* пауза каскада, с */
  var MAX_DELAY=0.45; /* дальше задержка читается как тормоз, а не как каскад */

  /* Сетки, у которых оживает не коробка целиком, а ячейки по одной. */
  var GRIDS=[
    ['.money','.mo'], ['.thes','li'], ['.qc',':scope>div'],
    ['.asm','.asm-c'], ['.minis','.mini']
  ];
  /* Блоки, где цифры набираются на счётчике. Только метрики:
     цены в тарифах человек читает, а не смотрит, как они крутятся. */
  var COUNTERS='.hero-strip b, .dfn-r b, .mo-p';

  function gridItems(el){
    for(var i=0;i<GRIDS.length;i++){
      if(el.matches(GRIDS[i][0])) return [].slice.call(el.querySelectorAll(GRIDS[i][1]));
    }
    return null;
  }
  function mark(el,d){
    el.classList.add('rv');
    if(d) el.style.setProperty('--d',Math.min(d,MAX_DELAY).toFixed(3)+'s');
  }

  /* ---------- счётчики ---------- */
  var SEP=/[\s  ]/;
  function prepNums(scope){
    [].slice.call(scope.querySelectorAll(COUNTERS)).forEach(function(el){
      if(el.dataset.num) return;
      el.dataset.num='1';
      var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null), texts=[], n;
      while((n=w.nextNode())) texts.push(n);
      texts.forEach(function(t){
        if(!/\d/.test(t.nodeValue)) return;
        var frag=document.createDocumentFragment(), re=/\d+(?:[\s  ]\d{3})*/g, last=0, m;
        while((m=re.exec(t.nodeValue))){
          if(m.index>last) frag.appendChild(document.createTextNode(t.nodeValue.slice(last,m.index)));
          var sp=document.createElement('span');
          sp.className='num'; sp.dataset.raw=m[0]; sp.textContent=m[0];
          frag.appendChild(sp); last=m.index+m[0].length;
        }
        if(last<t.nodeValue.length) frag.appendChild(document.createTextNode(t.nodeValue.slice(last)));
        t.parentNode.replaceChild(frag,t);
      });
    });
  }
  function runNums(scope){
    [].slice.call(scope.querySelectorAll('.num')).forEach(function(sp){
      if(sp.dataset.ran) return; sp.dataset.ran='1';
      var raw=sp.dataset.raw, hit=raw.match(SEP), sep=hit?hit[0]:'';
      var to=parseInt(raw.replace(/[\s  ]/g,''),10);
      if(!isFinite(to)||to<3) return;
      var len=String(to).length;
      /* стартуем с числа той же разрядности: строка не меняет ширину,
         соседние блоки не дёргаются на каждом кадре */
      var from=len>1?Math.pow(10,len-1):0;
      var dur=Math.min(1300,500+len*160), t0=0;
      function fmt(v){var s=String(v);return sep?s.replace(/\B(?=(\d{3})+(?!\d))/g,sep):s;}
      function step(ts){
        if(!t0) t0=ts;
        var p=Math.min(1,(ts-t0)/dur), e=1-Math.pow(1-p,4);
        sp.textContent=p<1?fmt(Math.round(from+(to-from)*e)):raw;
        if(p<1) requestAnimationFrame(step); else sp.classList.remove('run');
      }
      sp.classList.add('run');
      sp.textContent=fmt(from);
      requestAnimationFrame(step);
    });
  }

  /* ---------- наблюдатель ----------
     Одного isIntersecting мало. При резкой прокрутке (флик на телефоне,
     переход по якорю, Home/End) блок успевает войти в кадр и выйти между
     двумя колбэками, и наблюдатель докладывает уже «не виден» — элемент
     остался бы невидимым навсегда. Поэтому проявляем всё, что оказалось
     выше нижней кромки экрана, плюс держим редкую подметалку. */
  var pending=[];
  function show(el){
    el.classList.add('in');
    runNums(el);
    io.unobserve(el);
    var i=pending.indexOf(el);
    if(i>-1) pending.splice(i,1);
  }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(x){
      var edge=x.rootBounds?x.rootBounds.bottom:window.innerHeight;
      if(x.isIntersecting||x.boundingClientRect.top<edge) show(x.target);
    });
  },{rootMargin:'0px 0px -8% 0px'});

  function watch(el){ pending.push(el); io.observe(el); }

  var sweeping=false;
  function sweep(){
    sweeping=false;
    if(!pending.length) return;
    var edge=window.innerHeight*0.94;
    pending.slice().forEach(function(el){
      if(el.getBoundingClientRect().top<edge) show(el);
    });
  }
  function queueSweep(){
    if(sweeping||!pending.length) return;
    sweeping=true;
    setTimeout(sweep,220);
  }

  /* ---------- разметка секций ---------- */
  [].slice.call(document.querySelectorAll('main .sec')).forEach(function(sec){
    if(sec.classList.contains('hero')) return;

    /* линейка секции прочерчивается вместе с её содержимым */
    if(/\brule/.test(sec.className)) watch(sec);

    var box=sec.querySelector(':scope>.wrap, :scope>.narrow');
    if(!box) return;

    var d=0;
    [].slice.call(box.children).forEach(function(child){
      var items=gridItems(child);
      if(items && items.length){
        items.forEach(function(it){ mark(it,d); d+=STEP*0.8; watch(it); });
      } else {
        mark(child,d); d+=STEP; watch(child);
      }
    });
    prepNums(sec);
  });

  /* ---------- герой: играет сразу, ждать прокрутки нечего ---------- */
  var hero=document.querySelector('.hero');
  if(hero){
    [].slice.call(hero.querySelectorAll('h1 i')).forEach(function(line,k){
      var s=document.createElement('span');
      s.className='ln';
      while(line.firstChild) s.appendChild(line.firstChild);
      line.appendChild(s);
      s.style.setProperty('--d',(0.1+k*0.09).toFixed(2)+'s');
    });

    var seq=[['.h1-sub',0.02,0],['.hero-lead',0.46,0],['.noneed li',0.54,0.04],
             ['.chain span',0.66,0.035],['.hero-cta',0.78,0],['.risk',0.84,0],
             ['.hero-strip div',0.9,0.05],['.hero-foot',1.06,0]];
    seq.forEach(function(row){
      [].slice.call(hero.querySelectorAll(row[0])).forEach(function(el,i){
        el.classList.add('rv');
        el.style.setProperty('--d',(row[1]+i*row[2]).toFixed(3)+'s');
      });
    });

    prepNums(hero);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        hero.classList.add('in');
        [].slice.call(hero.querySelectorAll('.rv')).forEach(function(el){ el.classList.add('in'); });
        setTimeout(function(){ runNums(hero); },900);
      });
    });
  }

  /* ---------- прогресс прокрутки и шапка ---------- */
  var prog=document.createElement('div');
  prog.className='prog';
  document.body.appendChild(prog);

  var hdr=document.querySelector('.hdr'), queued=false;
  function frame(){
    queued=false;
    var h=document.documentElement.scrollHeight-window.innerHeight;
    prog.style.transform='scaleX('+(h>0?Math.min(1,Math.max(0,window.scrollY/h)):0)+')';
    if(hdr) hdr.classList.toggle('stuck',window.scrollY>8);
    queueSweep();
  }
  window.addEventListener('scroll',function(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(frame);
  },{passive:true});
  frame();
})();

/* ================= ЧАТ-БОТ ЦЕХА =================
   Один сценарий на кнопках, две ветки:
     · расчёт тарифа  — те же пять параметров, что в калькуляторе;
     · сборка          — бриф из четырёх вопросов.
   Сервер не нужен: диалог живёт в браузере, заявка уходит одним POST.

   НАСТРОЙКА (три строки ниже):
   CHAT_ENDPOINT · адрес веб-приложения Google Apps Script.
                   Пока пусто, заявка уходит в Telegram-бота и на почту.
   CHAT_BOT      · адрес Telegram-бота, запасной путь и «продолжить в телеграме».
   CHAT_MAIL     · почта, куда падает письмо, если не сработало ничего.
*/
(function(){
  "use strict";

  var CHAT_ENDPOINT = "";
  var CHAT_BOT      = "https://t.me/tseh_lab_bot";
  var CHAT_MAIL     = "lily@simpleasmagic.com";
  var PRIVACY       = "/privacy.html";

  var log = document.getElementById('chatLog');
  var act = document.getElementById('chatAct');
  if(!log || !act) return;

  function track(n,p){try{
    if(window.plausible) window.plausible(n,{props:p});
    if(window.dataLayer) window.dataLayer.push(Object.assign({event:n},p||{}));
    if(window.ym && window.YM_ID) window.ym(window.YM_ID,'reachGoal',n);
  }catch(e){}}

  var CALM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAUSE = CALM ? 0 : 420;

  /* ---------- прайс · единственное место, где меняются деньги.
       Значения должны совпадать с bot.py, иначе сайт и телеграм
       назовут человеку разные цены. ---------- */
  var BASE = 10000;
  var PLATFORM_STEP = 3500;
  var FREQ = {2:-1500, 3:0, 5:4000, 7:7000};
  var VISUAL = {1:0, 2:3000, 3:5000};
  var GENERATION = 2900;
  var ERP = 15000;

  var TITLES = {p:'Площадки', f:'Ритм', v:'Визуал', g:'Фото и видео', e:'Учёт и ERP'};
  var LABELS = {
    p:{1:'1 площадка',2:'2 площадки',3:'3 площадки',4:'4 и больше'},
    f:{2:'2 в неделю',3:'3 в неделю',5:'каждый будний день',7:'каждый день'},
    v:{1:'обложки',2:'обложки и карусели',3:'обложки, карусели, сценарии видео'},
    g:{0:'не нужна',1:'нужна'},
    e:{0:'не нужно',1:'нужно'}
  };

  var state = {p:1,f:3,v:1,g:0,e:0};
  var lead  = {branch:'', link:'', contact:'', tier:'', name:''};
  var opened = Date.now();
  var sent = false;

  function money(n){
    var s = String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    return (n<0?'−':'')+s+' ₽';
  }
  function plural(n,one,few,many){
    var h=n%100; if(h>=11&&h<=14) return many;
    var t=n%10; if(t===1) return one; if(t>=2&&t<=4) return few; return many;
  }
  function price(s){
    var total=BASE, lines=['Базовый тариф · '+money(BASE)];
    var extra=s.p-1;
    if(extra>0){ var a=extra*PLATFORM_STEP; total+=a;
      lines.push('+'+extra+' '+plural(extra,'площадка','площадки','площадок')+' · '+money(a)); }
    var fr=FREQ[s.f]||0;
    if(fr){ total+=fr; lines.push('Ритм '+LABELS.f[s.f]+' · '+(fr>0?'+':'')+money(fr)); }
    var vi=VISUAL[s.v]||0;
    if(vi){ total+=vi; lines.push('Визуал '+LABELS.v[s.v]+' · +'+money(vi)); }
    if(s.g){ total+=GENERATION; lines.push('Генерация фото и видео · +'+money(GENERATION)); }
    if(s.e){ total+=ERP; lines.push('Подключение к учёту и ERP · +'+money(ERP)); }
    return {total:total, lines:lines};
  }
  function volume(s){
    var n=s.f*4*(1+0.35*(s.p-1));
    if(s.v>1) n+=s.f;
    if(s.g) n+=4;
    return Math.round(n/2)*2;
  }
  function payload(s){ return 'p'+s.p+'f'+s.f+'v'+s.v+'g'+s.g+'e'+s.e; }

  /* ---------- вывод ---------- */
  function scroll(){ log.scrollTop = log.scrollHeight; }
  function add(who, html){
    var m=document.createElement('div');
    m.className='msg msg-'+who;
    m.innerHTML=html;
    log.appendChild(m); scroll();
    return m;
  }
  function typing(){
    var t=document.createElement('div');
    t.className='msg msg-b msg-typing';
    t.innerHTML='<i></i><i></i><i></i>';
    log.appendChild(t); scroll();
    return t;
  }

  var queue = Promise.resolve();
  function bot(html){
    queue = queue.then(function(){
      return new Promise(function(done){
        if(!PAUSE){ add('b',html); return done(); }
        var t=typing();
        setTimeout(function(){ t.parentNode && t.parentNode.removeChild(t); add('b',html); done(); }, PAUSE);
      });
    });
    return queue;
  }
  function me(text){ add('m', esc(text)); }
  function then(fn){ queue=queue.then(fn); return queue; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* ---------- органы управления ---------- */
  function clear(){ act.innerHTML=''; }
  function choices(items){
    then(function(){
      clear();
      items.forEach(function(it){
        var b=document.createElement('button');
        b.type='button';
        b.className='chat-b'+(it.soft?' chat-b-soft':'');
        b.textContent=it.t;
        b.addEventListener('click',function(){
          if(it.echo!==false) me(it.echo || it.t);
          clear();
          it.go();
        });
        act.appendChild(b);
      });
      scroll();
    });
  }
  function ask(opts){
    /* строка ввода: placeholder, проверка, что дальше */
    then(function(){
      clear();
      var wrap=document.createElement('form');
      wrap.className='chat-in';
      var i=document.createElement('input');
      i.type=opts.type||'text';
      i.placeholder=opts.ph||'';
      if(opts.mode) i.setAttribute('inputmode',opts.mode);
      if(opts.auto) i.setAttribute('autocomplete',opts.auto);
      var b=document.createElement('button');
      b.type='submit'; b.className='chat-b chat-b-go'; b.textContent=opts.btn||'Дальше';
      wrap.appendChild(i); wrap.appendChild(b);
      if(opts.skip){
        var s=document.createElement('button');
        s.type='button'; s.className='chat-b chat-b-soft'; s.textContent=opts.skip;
        s.addEventListener('click',function(){ clear(); opts.onSkip(); });
        wrap.appendChild(s);
      }
      wrap.addEventListener('submit',function(e){
        e.preventDefault();
        var v=i.value.trim();
        if(opts.check && !opts.check(v)){ i.classList.add('bad'); i.focus(); return; }
        me(v); clear(); opts.next(v);
      });
      act.appendChild(wrap);
      scroll();
      if(!CALM) setTimeout(function(){ i.focus({preventScroll:true}); },80);
    });
  }

  /* ---------- сценарий · вход ---------- */
  function hello(){
    bot('Здравствуйте. Я бот ЦЕХа: считаю тариф и принимаю заявки. Отвечаю сразу, кнопками.');
    bot('С чего начнём?');
    choices([
      {t:'Собрать свой тариф', go:calcStart},
      {t:'Пробный выпуск бесплатно', go:function(){ lead.tier='Пробный выпуск, бесплатно'; briefStart('probny'); }},
      {t:'Разбор на встрече 40 минут', go:function(){ lead.tier='Разбор на встрече 40 минут'; briefStart('razbor'); }}
    ]);
  }

  /* ---------- ветка · расчёт тарифа ---------- */
  var STEPS = [
    {k:'p', q:'Сколько площадок ведём?', o:[1,2,3,4]},
    {k:'f', q:'Сколько публикаций в неделю?', o:[2,3,5,7]},
    {k:'v', q:'Что нужно из визуала?', o:[1,2,3]},
    {k:'g', q:'Нужна генерация фото и видео?', o:[0,1]},
    {k:'e', q:'Подключаем учёт и ERP?', o:[0,1]}
  ];

  function calcStart(){
    lead.branch='расчёт';
    track('chat_calc_start');
    bot('Пять вопросов, меньше минуты. Ответы потом можно поправить.');
    step(0);
  }
  function step(i){
    if(i>=STEPS.length) return result();
    var s=STEPS[i];
    bot(esc(s.q));
    choices(s.o.map(function(v){
      return {t: LABELS[s.k][v], go: function(){ state[s.k]=v; step(i+1); }};
    }));
  }
  function result(){
    var r=price(state), vol=volume(state);
    var body=r.lines.map(function(l){ return '<li>'+esc(l)+'</li>'; }).join('');
    var params=['p','f','v','g','e'].map(function(k){
      return '<li><span>'+TITLES[k]+'</span><b>'+esc(LABELS[k][state[k]])+'</b></li>'; }).join('');
    bot('<b class="msg-sum">'+money(r.total)+' в месяц</b>'+
        '<span class="msg-sub">Примерно '+vol+' '+plural(vol,'материал','материала','материалов')+' в месяц</span>'+
        '<em class="msg-h">Из чего сложилось</em><ul class="msg-l">'+body+'</ul>'+
        '<em class="msg-h">Параметры</em><ul class="msg-p">'+params+'</ul>');
    bot('Сборка цеха входит в тариф. Первые три дня пробные: не подошло — возвращаем деньги целиком. Цена расчётная, точную подтвердим после разбора вашего канала.');
    then(function(){ track('chat_calc_done',{sum:price(state).total, params:payload(state)}); });
    choices([
      {t:'Оставить заявку', go:function(){ lead.tier='Свой тариф · '+money(price(state).total)+' в месяц'; briefStart('svoy'); }},
      {t:'Поправить параметры', soft:true, go:function(){ bot('Хорошо, пройдём заново.'); step(0); }},
      {t:'Продолжить в телеграме', soft:true, go:openBot}
    ]);
  }

  /* ---------- ветка · сборка (бриф) ---------- */
  function briefStart(tier){
    lead.branch = lead.branch || 'сборка';
    lead.tierCode = tier;
    track('chat_brief_start',{tier:tier});
    bot('Соберём заявку. Четыре коротких вопроса.');
    bot('Ссылка на канал или сайт — посмотрю, о чём вы.');
    ask({
      ph:'t.me/… или сайт', mode:'url',
      check:function(v){ return v.length>=3; },
      next:function(v){ lead.link=v; askContact(); }
    });
  }
  function askContact(){
    bot('Куда прислать ответ: телеграм или почта?');
    ask({
      ph:'@username или mail@company.com', auto:'email',
      check:function(v){ return v.length>=3; },
      next:function(v){ lead.contact=v; askTier(); }
    });
  }
  function askTier(){
    if(lead.tier){ askName(); return; }
    bot('Что нужно?');
    choices([
      {t:'Пробный выпуск, бесплатно', go:function(){ lead.tier='Пробный выпуск, бесплатно'; askName(); }},
      {t:'Разбор на встрече 40 минут', go:function(){ lead.tier='Разбор на встрече 40 минут'; askName(); }},
      {t:'Базовый тариф · от 10 000 ₽', go:function(){ lead.tier='Базовый тариф · от 10 000 ₽ / мес'; askName(); }},
      {t:'Свой тариф · нужен расчёт', soft:true, go:function(){ lead.tier=''; calcStart(); }}
    ]);
  }
  function askName(){
    bot('Как вас зовут?');
    ask({
      ph:'Имя', auto:'name', skip:'Пропустить',
      check:function(v){ return v.length>0; },
      next:function(v){ lead.name=v; consent(); },
      onSkip:function(){ lead.name=''; consent(); }
    });
  }
  function consent(){
    bot('Последнее. Данные нужны, чтобы ответить на заявку: третьим лицам не передаём, '+
        'в рассылку без спроса не добавляем. <a href="'+PRIVACY+'" target="_blank" rel="noopener">Политика конфиденциальности</a>.');
    choices([
      {t:'Согласен, отправить', echo:'Согласен', go:send},
      {t:'Не сейчас', soft:true, go:function(){
        bot('Понимаю. Если удобнее письмом: <a href="mailto:'+CHAT_MAIL+'">'+CHAT_MAIL+'</a>.');
        choices([{t:'Начать заново', soft:true, go:restart}]);
      }}
    ]);
  }

  /* ---------- отправка ---------- */
  function data(){
    return {
      source:'сайт · чат',
      branch:lead.branch,
      link:lead.link,
      contact:lead.contact,
      tier:lead.tier,
      name:lead.name,
      params:payload(state),
      params_text:['p','f','v','g','e'].map(function(k){ return TITLES[k]+': '+LABELS[k][state[k]]; }).join('; '),
      sum:(lead.branch==='расчёт'?price(state).total:''),
      consent:true,
      page:location.href,
      seconds:Math.round((Date.now()-opened)/1000)
    };
  }
  function mailFallback(d){
    var s=encodeURIComponent('Заявка с сайта ЦЕХ · '+(d.name||d.contact));
    var b=encodeURIComponent(
      'Канал или сайт: '+d.link+'\nКонтакт: '+d.contact+'\nЧто нужно: '+d.tier+
      '\nИмя: '+(d.name||'не указано')+'\nПараметры: '+d.params_text+'\nСтраница: '+d.page);
    window.location.href='mailto:'+CHAT_MAIL+'?subject='+s+'&body='+b;
  }
  function done(){
    if(sent) return; sent=true;
    bot('<b class="msg-sum">Принято</b><span class="msg-sub">Наш менеджер свяжется с вами в течение рабочего дня</span>');
    choices([
      {t:'Продолжить в телеграме', go:openBot},
      {t:'Начать заново', soft:true, go:restart}
    ]);
  }
  function send(){
    then(function(){
      var d=data();
      track('chat_lead',{branch:d.branch, tier:d.tier});
      if(!CHAT_ENDPOINT){ mailFallback(d); done(); return; }
      /* text/plain — чтобы браузер не слал preflight: Apps Script его не обрабатывает */
      fetch(CHAT_ENDPOINT,{
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify(d)
      }).then(done).catch(function(){ mailFallback(d); done(); });
    });
  }
  function openBot(){
    var url = CHAT_BOT + (lead.branch==='расчёт' ? '?start='+payload(state) : '?start=brief');
    window.open(url,'_blank','noopener');
  }
  function restart(){
    sent=false; opened=Date.now();
    state={p:1,f:3,v:1,g:0,e:0};
    lead={branch:'',link:'',contact:'',tier:'',name:''};
    log.innerHTML=''; clear();
    hello();
  }

  /* ---------- вход из калькулятора ---------- */
  window.TSEH_CHAT = {
    fromCalc:function(s){
      sent=false; opened=Date.now();
      state={p:s.p,f:s.f,v:s.v,g:s.g,e:s.e};
      lead={branch:'расчёт',link:'',contact:'',tier:'',name:''};
      log.innerHTML=''; clear();
      track('chat_from_calc',{params:payload(state)});
      bot('Принял параметры из калькулятора.');
      result();
    },
    open:function(){ if(!log.children.length) hello(); }
  };

  hello();
})();
