(function(){
  'use strict';

  function build(){
    const engine=window.MSKSmartReview;
    if(!engine)throw new Error('MSKSmartReview must be loaded before demo data.');
    const now=Date.now();
    const questions=[
      {id:'d1',quiz_id:'msk-demo-13',week:'Week 13',lecture:'Skin, Spine & Neural Foundations',topic:'Humerus',difficulty:'In-House',stem:'A fracture through the surgical neck of the humerus places which nerve at greatest risk?',answer:'Axillary nerve',choices:['Axillary nerve','Radial nerve','Median nerve','Ulnar nerve'],explanation:'The axillary nerve passes near the surgical neck of the humerus, so this fracture location creates a classic nerve-injury association.'},
      {id:'d2',quiz_id:'msk-demo-14',week:'Week 14',lecture:'Dermatology & Upper Extremity I',topic:'Radial Nerve',difficulty:'Intermediate',stem:'A patient develops wrist drop after a midshaft humeral fracture. Which nerve is most likely injured?',answer:'Radial nerve',choices:['Axillary nerve','Radial nerve','Median nerve','Ulnar nerve'],explanation:'The radial nerve travels along the posterior humeral shaft in the radial groove and is vulnerable in midshaft fractures.'},
      {id:'d3',quiz_id:'msk-demo-14',week:'Week 14',lecture:'Dermatology & Upper Extremity I',topic:'Rotator Cuff',difficulty:'Step 1',stem:'Which muscle classically initiates the first approximately 15 degrees of shoulder abduction?',answer:'Supraspinatus',choices:['Supraspinatus','Deltoid','Teres major','Subscapularis'],explanation:'Supraspinatus initiates abduction; the deltoid becomes the major abductor after the first portion of the movement.'},
      {id:'d4',quiz_id:'msk-demo-13',week:'Week 13',lecture:'Skin, Spine & Neural Foundations',topic:'Dermatologic Morphology',difficulty:'Intermediate',stem:'A patient has a raised, solid skin lesion measuring 6 mm in diameter. Which primary lesion term is most appropriate?',answer:'Papule',choices:['Papule','Macule','Plaque','Vesicle'],explanation:'A papule is a small, raised, solid primary skin lesion. The key distinction is that it is elevated and does not contain fluid.'},
      {id:'d5',quiz_id:'msk-demo-15',week:'Week 15',lecture:'Bone Biology & Upper Extremity II',topic:'Brachial Plexus',difficulty:'Step 1',stem:'Traction separating the head from the shoulder most classically injures which portion of the brachial plexus?',answer:'Upper trunk',choices:['Upper trunk','Lower trunk','Medial cord','Posterior cord'],explanation:'Excessive separation of the head and shoulder classically stretches the upper trunk, producing an Erb-type pattern.'},
      {id:'d6',quiz_id:'msk-demo-13',week:'Week 13',lecture:'Gross Anatomy',topic:'Humerus Landmarks',difficulty:'In-House',stem:'Which distal humeral articular surface articulates with the radius?',answer:'Capitulum',choices:['Capitulum','Trochlea','Olecranon fossa','Medial epicondyle'],explanation:'The capitulum articulates with the head of the radius, while the trochlea articulates with the ulna.'}
    ];
    const out=[];
    let s;
    s=engine.fileItem(null,questions[0],now);out.push(s);
    s=engine.evaluatePrimaryAttempt(null,questions[1],{correct:false,confidence:'unsure'},now+1000);
    s=engine.evaluatePrimaryAttempt(s,questions[1],{correct:false,confidence:'unsure'},now+2000);out.push(s);
    s=engine.evaluatePrimaryAttempt(null,questions[2],{correct:false,confidence:'confident'},now+3000);out.push(s);
    s=engine.evaluatePrimaryAttempt(null,questions[3],{correct:true,confidence:'guessing'},now+4000);out.push(s);
    s=engine.fileItem(null,questions[4],now+5000);
    s=engine.unfileItem(s,now+6000);
    s.status='improving';
    s=engine.makeDueNow(s,now+7000);out.push(s);
    s=engine.evaluatePrimaryAttempt(null,questions[5],{correct:true,confidence:'unsure'},now+8000);
    s=engine.applyReviewAttempt(s,{correct:true,confidence:'confident'},now+9000);
    s=engine.applyReviewAttempt(s,{correct:true,confidence:'confident'},now+10000);
    s=engine.applyReviewAttempt(s,{correct:true,confidence:'confident'},now+11000);out.push(s);
    return out;
  }

  window.MSKReviewDemoData={build};
})();
