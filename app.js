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
     Считает цену на месте и передаёт параметры в форму заявки.
     НАСТРОЙКА: BOT_URL — запасной путь, если скрипт формы не загрузился.

     ПРАЙС · единственное место, где меняются деньги. Значения должны
     совпадать с bot.py, иначе сайт и телеграм назовут разные цены. */
  var BOT_URL="https://t.me/tseh_lab_bot";

  var BASE=10000, PLATFORM_STEP=3500;
  var FREQ={2:-1500, 3:0, 5:4000, 7:7000};
  var VISUAL={1:0, 2:3000, 3:5000};
  var GENERATION=2900, ERP=15000;
  var TITLES={p:'Площадки', f:'Ритм', v:'Визуал', g:'Фото и видео', e:'Учёт и ERP'};

  function money(n){
    var s=String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    return (n<0?'−':'')+s+' ₽';
  }

  var calc=document.getElementById('kalkulyator');
  if(calc){
    var state={p:1,f:3,v:1,g:0,e:0};
    var labels={p:'1 площадка',f:'3 в неделю',v:'обложки',g:'не нужна',e:'не нужно'};
    var out={p:document.getElementById('sumP'),f:document.getElementById('sumF'),
             v:document.getElementById('sumV'),g:document.getElementById('sumG'),
             e:document.getElementById('sumE')};
    var vol=document.getElementById('calcVol'), go=document.getElementById('calcGo');
    var priceBox=document.getElementById('calcPrice');

    function price(){
      var total=BASE;
      total += (state.p-1)*PLATFORM_STEP;
      total += FREQ[state.f]||0;
      total += VISUAL[state.v]||0;
      if(state.g) total+=GENERATION;
      if(state.e) total+=ERP;
      return total;
    }
    function payload(){ return 'p'+state.p+'f'+state.f+'v'+state.v+'g'+state.g+'e'+state.e; }
    function paramsText(){
      return ['p','f','v','g','e'].map(function(k){ return TITLES[k]+': '+labels[k]; }).join('; ');
    }

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
      if(priceBox) priceBox.innerHTML=money(price())+'<small>в месяц, сборка входит</small>';
      /* Кнопка ведёт в форму на этой же странице. Телеграм остаётся запасным
         путём: если скрипт формы не загрузился, ссылка откроет бота. */
      if(document.getElementById('leadForm')){ go.href='#zayavka'; go.removeAttribute('target'); }
      else if(BOT_URL){ go.href=BOT_URL+'?start='+payload(); go.target='_blank'; }
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
      track('calc_submit',{p:state.p,f:state.f,v:state.v,g:state.g,e:state.e,sum:price()});
      if(window.TSEH_FORM) window.TSEH_FORM.fromCalc({
        payload:payload(), text:paramsText(), sum:price(), sumText:money(price())
      });
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

/* ================= ФОРМА ЗАЯВКИ =================
   Простая форма: пять полей, согласие, одна кнопка.
   Заявка уходит одним POST на роут /lead в боте.

   НАСТРОЙКА (четыре строки ниже):
   LEAD_ENDPOINT · адрес роута /lead. Пока пусто, заявка уходит почтой через
                   mailto — это запасной путь, а не рабочий: на телефоне и в
                   веб-почте mailto часто не открывается.
   LEAD_BOT      · телеграм-бот, запасной путь, если форма не достучалась.
   LEAD_MAIL     · почта для того же случая.

   ВАЖНО: токен бота сюда класть нельзя. Файл отдаётся всем, кто открыл сайт,
   а публичные токены Telegram отзывает автоматически. Заявку принимает роут
   на стороне бота, токен остаётся там.
*/
(function(){
  "use strict";

  var LEAD_ENDPOINT = "";
  var LEAD_BOT      = "https://t.me/tseh_lab_bot";
  var LEAD_MAIL     = "lily@simpleasmagic.com";

  var TIMEOUT  = 12000;   /* сколько ждём ответа роута */
  var MIN_SECS = 3;       /* быстрее человек форму не заполнит */
  var DRAFT    = 'tseh_lead_draft';

  var form = document.getElementById('leadForm');
  if(!form) return;

  var f = {
    link:    document.getElementById('lf-link'),
    contact: document.getElementById('lf-contact'),
    tier:    document.getElementById('lf-tier'),
    name:    document.getElementById('lf-name'),
    note:    document.getElementById('lf-note'),
    consent: document.getElementById('lf-consent'),
    trap:    form.querySelector('.lf-trap'),
    go:      document.getElementById('lfGo'),
    status:  document.getElementById('lfStatus'),
    calc:    document.getElementById('lfCalc')
  };

  var opened = Date.now();
  var busy = false, sent = false;
  var fromCalc = null;   /* параметры, приехавшие из калькулятора */

  function track(n,p){try{
    if(window.plausible) window.plausible(n,{props:p});
    if(window.dataLayer) window.dataLayer.push(Object.assign({event:n},p||{}));
    if(window.ym && window.YM_ID) window.ym(window.YM_ID,'reachGoal',n);
  }catch(e){}}

  /* ---------- проверка ответов ----------
     Правило одно: пропускаем всё, на что менеджер сможет ответить,
     и отбиваем то, по чему связаться нельзя. Строже нельзя — потеряем
     живые заявки на ровном месте.
     Домены бывают кириллические и в punycode: цех.запуск.рф и xn--e1a6ab… */
  var RE_MAIL  = /^[^\s@]+@[^\s@]+\.(xn--[a-z0-9\-]{2,}|[a-zа-яё]{2,})$/i;
  var RE_TG    = /^@[a-z0-9_]{4,32}$/i;
  var RE_PHONE = /^\+?[\d][\d\s\-()]{9,17}$/;

  function okContact(v){
    v = v.replace(/^(https?:\/\/)?(t\.me\/|telegram\.me\/)/i,'@');
    return RE_MAIL.test(v) || RE_TG.test(v) || RE_PHONE.test(v);
  }
  function okLink(v){
    if(/\s/.test(v.trim()) && !/^https?:\/\//i.test(v)) return false;
    v = v.trim().replace(/^https?:\/\//i,'').replace(/^www\./i,'');
    if(/^@[a-z0-9_]{4,32}$/i.test(v)) return true;           /* @канал */
    return /^[a-z0-9а-яё][a-z0-9а-яё.\-]*\.(xn--[a-z0-9\-]{2,}|[a-zа-яё]{2,})(\/|$)/i.test(v);
  }

  /* ---------- ошибки под полями ---------- */
  function fail(el, id, text){
    var box=document.getElementById(id);
    if(box){ box.textContent=text; box.hidden=false; }
    if(el){ el.classList.add('bad'); el.setAttribute('aria-invalid','true'); }
  }
  function clearErr(el, id){
    var box=document.getElementById(id);
    if(box){ box.hidden=true; box.textContent=''; }
    if(el){ el.classList.remove('bad'); el.removeAttribute('aria-invalid'); }
  }
  function clearAll(){
    clearErr(f.link,'err-link');
    clearErr(f.contact,'err-contact');
    clearErr(f.consent,'err-consent');
  }
  [['link','err-link'],['contact','err-contact']].forEach(function(p){
    f[p[0]].addEventListener('input',function(){ clearErr(f[p[0]],p[1]); });
  });
  f.consent.addEventListener('change',function(){ clearErr(f.consent,'err-consent'); });

  function validate(){
    clearAll();
    var bad=null;
    if(!okLink(f.link.value.trim())){
      fail(f.link,'err-link','Нужна ссылка: t.me/канал, @канал или адрес сайта. Нет ни того, ни другого — напишите на '+LEAD_MAIL+'.');
      bad=bad||f.link;
    }
    if(!okContact(f.contact.value.trim())){
      fail(f.contact,'err-contact','Не разобрал контакт. Нужен @username, почта или телефон — иначе ответ не дойдёт.');
      bad=bad||f.contact;
    }
    if(!f.consent.checked){
      fail(null,'err-consent','Без согласия на обработку данных мы не можем вам ответить.');
      f.consent.setAttribute('aria-invalid','true');
      bad=bad||f.consent;
    }
    if(bad){ bad.focus({preventScroll:false}); return false; }
    return true;
  }

  /* ---------- заявка ---------- */
  function data(){
    return {
      source:'сайт · форма',
      branch: fromCalc ? 'расчёт' : 'форма',
      link:    f.link.value.trim(),
      contact: f.contact.value.trim(),
      tier:    f.tier.value,
      tier_code: f.tier.selectedIndex >= 0 ? String(f.tier.selectedIndex) : '',
      name:    f.name.value.trim(),
      note:    f.note.value.trim(),
      params:      fromCalc ? fromCalc.payload : '',
      params_text: fromCalc ? fromCalc.text : '',
      sum:         fromCalc ? fromCalc.sum : '',
      consent: true,
      page: location.href,
      ref: document.referrer||'',
      seconds: Math.round((Date.now()-opened)/1000)
    };
  }

  /* черновик переживает неудачную отправку и перезагрузку страницы */
  function saveDraft(d){ try{ localStorage.setItem(DRAFT, JSON.stringify({d:d, at:Date.now()})); }catch(e){} }
  function dropDraft(){ try{ localStorage.removeItem(DRAFT); }catch(e){} }
  function restoreDraft(){
    try{
      var raw=localStorage.getItem(DRAFT); if(!raw) return;
      var o=JSON.parse(raw);
      if(!o||!o.d||!o.d.contact) return;
      if(Date.now()-o.at > 7*24*3600*1000){ dropDraft(); return; }   /* неделя и всё */
      f.link.value=o.d.link||''; f.contact.value=o.d.contact||'';
      f.name.value=o.d.name||''; f.note.value=o.d.note||'';
      if(o.d.tier) f.tier.value=o.d.tier;
      /* параметры калькулятора тоже возвращаем, иначе повторная отправка
         уйдёт без цены, которую человек уже посчитал */
      if(o.d.params){
        fromCalc={payload:o.d.params, text:o.d.params_text, sum:o.d.sum, sumText:''};
        if(o.d.params_text){
          f.calc.hidden=false;
          f.calc.textContent='Из калькулятора: '+o.d.params_text;
        }
      }
      say('Это ваша прошлая заявка — она не ушла. Проверьте и отправьте ещё раз.','wait');
    }catch(e){}
  }

  function mailFallback(d){
    var s=encodeURIComponent('Заявка с сайта ЦЕХ · '+(d.name||d.contact));
    var b=encodeURIComponent(
      'Канал или сайт: '+d.link+'\nКонтакт: '+d.contact+'\nЧто нужно: '+d.tier+
      '\nИмя: '+(d.name||'не указано')+
      (d.note?'\nО задаче: '+d.note:'')+
      (d.params_text?'\nПараметры: '+d.params_text:'')+'\nСтраница: '+d.page);
    window.location.href='mailto:'+LEAD_MAIL+'?subject='+s+'&body='+b;
  }

  function say(text, kind){
    f.status.textContent=text;
    f.status.className='lf-st'+(kind?' lf-st-'+kind:'');
  }
  function lock(on){
    busy=on;
    f.go.disabled=on;
    f.go.textContent=on?'Отправляю…':'Отправить заявку';
  }
  function done(){
    if(sent) return; sent=true; lock(false); dropDraft();
    form.innerHTML='<div class="lf-ok"><b>Принято</b>'+
      '<span>Ответим в течение рабочего дня на '+
      f.contact.value.replace(/[&<>"']/g,'')+'</span>'+
      '<a class="btn btn-li btn-blk" href="'+LEAD_BOT+'" target="_blank" rel="noopener">Продолжить в телеграме</a></div>';
    track('lead_done');
  }
  function failed(d){
    /* Врать «Принято», когда заявка не ушла, нельзя: человек будет ждать
       ответа, которого никто не получил. */
    lock(false);
    saveDraft(d);
    track('lead_failed');
    say('Не отправилось: цех не ответил. Заявка сохранена в этом браузере — нажмите ещё раз '+
        'или напишите на '+LEAD_MAIL+'.','bad');
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(busy||sent) return;
    if(!validate()) return;

    var d=data();

    /* спам-скрипт: ловушка заполнена или форма отправлена быстрее
       человеческого. Показываем успех, никуда не шлём. */
    if(f.trap.value || d.seconds < MIN_SECS){ track('lead_trap'); done(); return; }

    track('lead_submit',{tier:d.tier, branch:d.branch});

    if(!LEAD_ENDPOINT){ saveDraft(d); mailFallback(d); done(); return; }

    lock(true); say('Отправляю…','wait');

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function(){ ctrl && ctrl.abort(); }, TIMEOUT);

    /* text/plain — чтобы браузер не слал preflight */
    fetch(LEAD_ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(d),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function(r){
      clearTimeout(timer);
      if(!r.ok) throw new Error('HTTP '+r.status);
      done();
    }).catch(function(){
      clearTimeout(timer);
      failed(d);
    });
  });

  /* ---------- вход из калькулятора ---------- */
  window.TSEH_FORM = {
    fromCalc:function(c){
      fromCalc=c;
      f.tier.value='Свой тариф · нужен расчёт';
      f.calc.hidden=false;
      f.calc.textContent='Из калькулятора: '+c.sumText+' в месяц · '+c.text;
      var first = f.link.value.trim() ? f.contact : f.link;
      setTimeout(function(){ first.focus({preventScroll:true}); },400);
    }
  };

  restoreDraft();
})();
