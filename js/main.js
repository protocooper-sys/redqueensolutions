/* --- Analytics -------------------------------------------------------------
   Set GA_ID to your GA4 Measurement ID (looks like G-XXXXXXXXXX) to switch on
   Google Analytics site-wide. Left as the placeholder it stays fully dormant —
   no script loads, no cookies set, no requests made. Privacy note: GA4 uses
   cookies, so if you turn it on you may want a small consent notice. */
(function(){
  var GA_ID='G-XXXXXXXXXX';
  if(!GA_ID || GA_ID.indexOf('XXXX')>-1) return;      // not configured → do nothing
  var s=document.createElement('script'); s.async=true;
  s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);
  document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){dataLayer.push(arguments);};
  gtag('js', new Date());
  gtag('config', GA_ID);
})();

/* Red Queen Solutions — shared site behaviour */
(function(){
  var r=document.documentElement;
  var SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/></svg>';
  var MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>';

  var accentBtn=document.getElementById('accentBtn'),
      accentSw=document.getElementById('accentSw'),
      accentLabel=document.getElementById('accentLabel'),
      modeBtn=document.getElementById('modeBtn');
  function paint(){
    var accent=r.getAttribute('data-accent'), mode=r.getAttribute('data-mode');
    if(accentLabel) accentLabel.textContent = accent==='crimson' ? 'Pip-Boy' : 'Red Queen';
    if(accentSw) accentSw.style.color = accent==='crimson' ? '#2bff88' : '#e11d48';
    if(modeBtn) modeBtn.innerHTML = mode==='dark' ? SUN : MOON;
  }
  paint();
  if(accentBtn) accentBtn.addEventListener('click',function(){
    var a=r.getAttribute('data-accent')==='crimson'?'pip':'crimson';
    r.setAttribute('data-accent',a); try{localStorage.setItem('rq-accent',a);}catch(e){} paint();
  });
  if(modeBtn) modeBtn.addEventListener('click',function(){
    var m=r.getAttribute('data-mode')==='dark'?'light':'dark';
    r.setAttribute('data-mode',m); try{localStorage.setItem('rq-mode',m);}catch(e){} paint();
  });

  /* mobile menu */
  var burger=document.getElementById('burger'), menu=document.getElementById('menu');
  if(burger&&menu){
    burger.addEventListener('click',function(){
      var open=menu.classList.toggle('open');
      burger.setAttribute('aria-expanded',open?'true':'false');
    });
    menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');});});
  }

  /* nav ground on scroll */
  var nav=document.getElementById('nav');
  if(nav) addEventListener('scroll',function(){nav.classList.toggle('scrolled',scrollY>40);},{passive:true});

  var ok=document.getElementById('formok');

  /* --- Enquiry delivery -----------------------------------------------------
     The site is fully static (no PHP), so enquiries are sent via Web3Forms —
     a free forwarding service. The public access key lives in a hidden field
     on each form; swap the placeholder for your real key to go live. Until then
     (and in the local preview) we short-circuit to the friendly confirmation so
     the form never errors. A filled honeypot is silently accepted, not sent. */
  var WEB3='https://api.web3forms.com/submit';
  function placeholderKey(form){var k=form.querySelector('[name=access_key]');return !k || !k.value || /PASTE|YOUR_|xxxx/i.test(k.value);}
  function isSpam(form){var h=form.querySelector('[name=company]');return !!(h && h.value);}

  /* Simple contact form — the quick enquiry on the home page. */
  var f=document.getElementById('rqform');
  if(f) f.addEventListener('submit',function(e){
    e.preventDefault();
    if(!f.checkValidity()){f.reportValidity();return;}
    var b=f.querySelector('button[type=submit]'), orig=b?b.textContent:'';
    if(b){b.disabled=true;b.textContent='Sending…';}
    function done(success){
      if(success){ if(ok)ok.style.display='block'; try{f.reset();}catch(_){} if(b)b.textContent='Sent ✓';
        if(ok)setTimeout(function(){ok.scrollIntoView({behavior:'smooth',block:'center'});},60); }
      else { if(b){b.disabled=false;b.textContent=orig;} alert('Sorry — that didn’t send. Please try again in a moment.'); }
    }
    if(isSpam(f)){done(true);return;}                 /* honeypot → silently accept */
    if(placeholderKey(f)){done(true);return;}         /* no key yet / preview → friendly confirm */
    fetch(f.getAttribute('action')||WEB3,{method:'POST',body:new FormData(f)})
      .then(function(r){return r.json().catch(function(){return {success:r.ok};});})
      .then(function(d){done(!!(d&&d.success));})
      .catch(function(){done(false);});
  });

  /* Enquiry wizard: a short multi-step form that compiles every answer into a single
     structured message and POSTs to contact.php. In a preview there's no PHP, so the
     request fails and we still show the friendly confirmation. */
  var enq=document.getElementById('enq');
  if(enq){
    var steps=[].slice.call(enq.querySelectorAll('.wiz-step'));   /* raw fieldsets 0..3 */
    var bar=document.getElementById('wizbar'), lbl=document.getElementById('wizsteps');
    var back=document.getElementById('wizback'), next=document.getElementById('wiznext'), sub=document.getElementById('wizsubmit');
    var hwBlock=enq.querySelector('.wiz-hw');   /* industry + quantity — hardware only */
    var pos=0;                                  /* index into the active-step list */
    var active=[0,1,3];                         /* which raw steps are in play; recomputed from the type */
    function el(n){return enq.elements[n];}
    function isHardware(){ var t=enq.querySelector('input[name=type]:checked'); return !!(t&&t.hasAttribute('data-hw')); }
    function refreshActive(){
      var hw=isHardware();
      active = hw ? [0,1,2,3] : [0,1,3];        /* hardware/robotics adds the standards & compliance step */
      if(hwBlock) hwBlock.hidden=!hw;           /* industry & quantity only make sense for hardware */
      if(pos>active.length-1) pos=active.length-1;
    }
    function show(p,noScroll){
      pos=p; var raw=active[p];
      steps.forEach(function(s,n){s.hidden=n!==raw;});
      if(bar) bar.style.width=Math.round((p+1)/active.length*100)+'%';
      if(lbl) lbl.textContent='Step '+(p+1)+' of '+active.length;
      if(back) back.hidden=p===0;
      if(next) next.hidden=p===active.length-1;
      if(sub) sub.hidden=p!==active.length-1;
      if(!noScroll){
        var wz=enq.closest('.wiz')||enq;
        try{wz.scrollIntoView({behavior:'smooth',block:'start'});}catch(_){}
      }
    }
    function validate(p){
      var raw=active[p];
      if(raw===0){
        var t=enq.querySelector('input[name=type]:checked'), e1=document.getElementById('err1');
        if(e1) e1.hidden=!!t; return !!t;
      }
      if(raw===3){
        var nm=el('name').value.trim(), em=el('email').value.trim(), ms=el('message').value.trim();
        var good=nm&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)&&ms;
        var e4=document.getElementById('err4'); if(e4) e4.hidden=!!good; return !!good;
      }
      return true;
    }
    /* recompute the path live as the enquiry type is picked (updates the "Step 1 of N" cue) */
    enq.querySelectorAll('input[name=type]').forEach(function(rb){
      rb.addEventListener('change',function(){ refreshActive(); show(pos,true); });
    });
    if(next) next.addEventListener('click',function(){ if(validate(pos)&&pos<active.length-1) show(pos+1); });
    if(back) back.addEventListener('click',function(){ if(pos>0) show(pos-1); });

    /* Enter in a single-line field advances the step rather than submitting early */
    enq.addEventListener('keydown',function(e){
      if(e.key==='Enter' && e.target.tagName==='INPUT' && e.target.type!=='checkbox' && e.target.type!=='radio' && pos<active.length-1){
        e.preventDefault(); if(validate(pos)) show(pos+1);
      }
    });

    /* IPC class only applies if soldering must meet a standard */
    var ipc=document.getElementById('ipcclass');
    enq.querySelectorAll('input[name=solder]').forEach(function(rb){
      rb.addEventListener('change',function(){
        var s=enq.querySelector('input[name=solder]:checked');
        if(ipc) ipc.hidden=!s||s.value!=='Yes';
      });
    });

    function compile(){
      var out=[];
      function add(k,v){ if(v) out.push(k+': '+v); }
      var t=enq.querySelector('input[name=type]:checked'); add('Enquiry type', t?t.value:'');
      add('Industry', el('industry').value);
      add('Quantity', el('scale').value);
      add('Timescale', el('timescale').value);
      add('Budget', el('budget').value.trim());
      var std=[].slice.call(enq.querySelectorAll('input[name=standards]:checked')).map(function(c){return c.value;});
      if(std.length) add('Standards', std.join(', '));
      add('Other standard', el('standards_other').value.trim());
      var sol=enq.querySelector('input[name=solder]:checked');
      if(sol){
        var sv=sol.value;
        if(sv==='Yes'){ var ic=enq.querySelector('input[name=ipc]:checked'); sv='Yes — '+(ic?ic.value:'class not specified'); }
        add('Soldering to IPC', sv);
      }
      add('Company / organisation', el('org').value.trim());
      return out.join('\n')+'\n\n--- Message ---\n'+el('message').value.trim();
    }

    enq.addEventListener('submit',function(e){
      e.preventDefault();
      if(!validate(active.length-1)) return;
      var t=enq.querySelector('input[name=type]:checked');
      var orig=sub?sub.textContent:'';
      if(sub){sub.disabled=true;sub.textContent='Sending…';}
      function done(success){
        if(success){
          if(ok)ok.style.display='block';
          steps.forEach(function(s){s.hidden=true;});
          var nv=enq.querySelector('.wiz-nav'); if(nv)nv.style.display='none';
          var pg=enq.querySelector('.wiz-progress'); if(pg)pg.style.display='none';
          if(lbl)lbl.style.display='none';
          if(ok)setTimeout(function(){ok.scrollIntoView({behavior:'smooth',block:'center'});},60);
        } else { if(sub){sub.disabled=false;sub.textContent=orig;} alert('Sorry — that didn’t send. Please try again in a moment.'); }
      }
      if(isSpam(enq)){done(true);return;}               /* honeypot → silently accept */
      /* Build a clean Web3Forms payload — the compiled message already carries every answer. */
      var key=enq.querySelector('[name=access_key]');
      var fd=new FormData();
      if(key) fd.set('access_key', key.value);
      fd.set('from_name','Red Queen Solutions website');
      fd.set('subject','Website enquiry — '+(t?t.value:'general'));
      fd.set('name', el('name').value.trim());
      fd.set('email', el('email').value.trim());
      fd.set('message', compile());
      if(placeholderKey(enq)){done(true);return;}       /* no key yet / preview → friendly confirm */
      fetch(enq.getAttribute('action')||WEB3,{method:'POST',body:fd})
        .then(function(r){return r.json().catch(function(){return {success:r.ok};});})
        .then(function(d){done(!!(d&&d.success));})
        .catch(function(){done(false);});
    });

    refreshActive();
    show(0,true);
  }

  /* Other Apps catalogue: live search filter */
  var as=document.getElementById('appsearch'), acount=document.getElementById('appcount');
  if(as){
    var cards=[].slice.call(document.querySelectorAll('.grid .card'));
    var total=cards.length;
    function apply(){
      var q=as.value.trim().toLowerCase(), shown=0;
      cards.forEach(function(c){
        var hit=!q||c.textContent.toLowerCase().indexOf(q)>-1;
        c.style.display=hit?'':'none'; if(hit)shown++;
      });
      document.querySelectorAll('.grid').forEach(function(g){
        var any=[].slice.call(g.querySelectorAll('.card')).some(function(c){return c.style.display!=='none';});
        var sec=g.closest('.band'); if(sec) sec.style.display=any?'':'none';
      });
      if(acount) acount.textContent = q ? (shown+' of '+total+' apps') : (total+' apps included');
    }
    as.addEventListener('input',apply); apply();
  }

  /* About journey timeline: reveal each entry as it scrolls into view */
  var tl=[].slice.call(document.querySelectorAll('.tl-item'));
  if(tl.length){
    if('IntersectionObserver' in window){
      var tio=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');tio.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'});
      tl.forEach(function(i){tio.observe(i);});
    } else { tl.forEach(function(i){i.classList.add('in');}); }
  }
})();

/* Lightbox: click any app screenshot to open it full-size */
(function(){
  var imgs=[].slice.call(document.querySelectorAll('.shot img'));
  var tiles=[].slice.call(document.querySelectorAll('.work-tile'));
  if(!imgs.length && !tiles.length)return;
  var box=document.createElement('div');
  box.id='lightbox';
  box.innerHTML='<button class="lb-x" aria-label="Close">\u00d7</button><img alt=""><div class="lb-cap"></div>';
  document.body.appendChild(box);
  var big=box.querySelector('img'), cap=box.querySelector('.lb-cap');
  function open(src,alt){big.src=src;big.alt=alt||'';cap.textContent=alt||'';box.classList.add('open');document.documentElement.style.overflow='hidden';}
  function close(){box.classList.remove('open');big.removeAttribute('src');document.documentElement.style.overflow='';}
  box.addEventListener('click',function(e){if(e.target!==big)close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('open'))close();});
  imgs.forEach(function(im){im.style.cursor='zoom-in';im.addEventListener('click',function(){open(im.currentSrc||im.src, im.getAttribute('alt'));});});
  tiles.forEach(function(t){var im=t.querySelector('img'); if(im) t.addEventListener('click',function(){open(im.currentSrc||im.src, im.getAttribute('alt'));});});
})();

/* Tap a demo video to toggle its sound (they autoplay muted + looping) */
(function(){
  [].forEach.call(document.querySelectorAll('.shot video'), function(v){
    v.style.cursor='pointer'; v.setAttribute('title','Tap for sound');
    v.addEventListener('click', function(){ v.muted=!v.muted; if(!v.muted){ try{ v.play(); }catch(e){} } });
  });
})();
