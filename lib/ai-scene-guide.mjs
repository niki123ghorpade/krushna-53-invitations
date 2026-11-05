const option=(id,label,title,action)=>({id,label,title,action});
export const SCENE_GUIDES=[
 {question:"How did your story begin?",feeling:"How did you feel when you first met?",options:[option('school','We met at school','Our first meeting','They first meet at school, notice each other and share friendly smiles.'),option('college','We met at college','Our first meeting','They meet at college, notice each other and exchange their first shy smiles.'),option('work','We met through work','Our first meeting','They first meet through work and begin a friendly conversation.'),option('friends','A friend introduced us','A happy introduction','A mutual friend introduces them; they turn towards each other with curious smiles.'),option('family','Our families introduced us','An unexpected beginning','Their families introduce them, and they share a warm first glance.'),option('online','We connected online','Our first hello','After connecting online, they smile during their first video call; no readable text appears.'),option('chance','We met by chance','A chance encounter','An unexpected encounter brings them together, and they pause to exchange a smile.')]},
 {question:"What brought you closer after that?",feeling:"What was the mood of this moment?",options:[option('coffee','Our first coffee or date','Coffee together','They share coffee, exchange shy glances and gradually break into laughter.'),option('walk','A long walk together','Getting closer','They walk side by side, talking silently and sharing happy glances.'),option('calls','Long calls and conversations','Growing closer','They enjoy warm video calls from their own homes, smiling and laughing silently.'),option('hobby','A shared hobby','Something in common','They enjoy a favourite activity together and discover how much they have in common.'),option('trip','Our first outing','A day to remember','They explore a new place together, noticing little details and enjoying each other’s company.')]},
 {question:"Which special memory should come next?",feeling:"How should this memory feel?",options:[option('travel','A memorable trip','Our favourite journey','They explore a beautiful destination together and pause for a joyful shared memory.'),option('festival','Celebrating a festival','A shared celebration','They celebrate a favourite festival together, surrounded by warm lights and loved ones.'),option('support','Supporting each other','Always by your side','One partner reassures the other during an important moment, then they share a relieved smile.'),option('distance','Reuniting after time apart','Together again','They recognise each other after time apart and move into a joyful reunion.'),option('surprise','A thoughtful surprise','A little surprise','One partner offers a thoughtful surprise and watches the other react with delight.')]},
 {question:"How did you decide on your future together?",feeling:"How did you react to that decision?",options:[option('proposal','A romantic proposal','The proposal','One partner offers a ring; the other reacts emotionally and accepts with a joyful smile.'),option('conversation','A quiet promise to each other','Our promise','They sit together, hold hands and make a heartfelt promise about their future.'),option('family','Our families agreed','A new beginning','Both families warmly support their decision, and the couple share an emotional smile.'),option('surprise','A surprise celebration','Our happy yes','A carefully planned surprise ends with a joyful commitment and a shared embrace.')]},
 {question:"How did your loved ones celebrate your relationship?",feeling:"How should the family celebration feel?",options:[option('home','Our families met at home','Family meet','Their families meet at a welcoming home, greet each other and celebrate the couple’s relationship.'),option('dinner','A special family dinner','A warm welcome','Both families share a celebratory dinner, exchanging warm greetings and smiles.'),option('friends','A celebration with friends','Our people, our joy','Close friends gather around the couple, cheering and sharing their happiness.'),option('blessings','Blessings from our elders','With their blessings','The couple respectfully receive their elders’ blessings as loved ones smile around them.')]},
 {question:"How should this part of your journey end?",feeling:"What feeling should the ending leave?",options:[option('sunset','Walking into the sunset','Our next chapter','They walk hand in hand into warm sunset light as the camera gently pulls back.'),option('garden','A quiet moment together','Forever begins here','They share a peaceful embrace in a flower-filled garden, looking forward to their life together.'),option('celebrate','Celebrating our new beginning','Our new beginning','The couple celebrate with loved ones and finish with a happy shared glance.'),option('journey','Setting off on a new journey','More memories ahead','They set off together on a new journey, smiling as the scene fades gently.')]}
];
const settings=(items)=>items.map(([id,label])=>({id,label}));
const SETTING_GROUPS={
 school:settings([['classroom','Our school classroom'],['playground','The school playground'],['library','The school library'],['school-event','A school annual day or event'],['bus-stop','The school bus stop']]),
 college:settings([['classroom','A college classroom'],['campus','Our college campus'],['canteen','The college canteen'],['library','The college library'],['college-fest','A college festival']]),
 work:settings([['office','Our office'],['meeting-room','A meeting or conference room'],['work-event','A work event'],['coworking','A shared workspace']]),
 family:settings([['home','A warmly lit home'],['restaurant','A family restaurant'],['family-function','A family function'],['community-hall','A community hall']]),
 online:settings([['own-homes','Our separate homes during a video call'],['home-balconies','Our balconies during a call'],['home-study','Our study spaces during an online chat']]),
 coffee:settings([['cafe','A cosy café'],['rooftop-cafe','A rooftop café'],['bakery','A small bakery'],['canteen','Our college canteen'],['restaurant','Our favourite restaurant']]),
 walk:settings([['park','A quiet park'],['lakeside','A peaceful lakeside'],['beach','A beach promenade'],['campus','Our college campus'],['neighbourhood','Our neighbourhood']]),
 hobby:settings([['sports-ground','A sports ground'],['art-studio','An art workshop'],['music-room','A music practice room'],['library','A library or book club']]),
 travel:settings([['hills','Scenic hills or countryside'],['beach','A beach destination'],['city','A city we explored'],['heritage','A historic place'],['road-trip','A scenic road-trip stop']]),
 festival:settings([['home','Our decorated home'],['festival-ground','A festival celebration'],['community-hall','A community celebration'],['courtyard','A festive courtyard']]),
 support:settings([['home','Our home'],['office','Our workplace'],['college','Our college'],['achievement-event','An important milestone celebration']]),
 reunion:settings([['airport','An airport arrival area'],['railway-station','A railway station'],['bus-station','A bus station'],['home','Our home'],['campus','Our college campus']]),
 proposal:settings([['garden','A flower-filled garden'],['rooftop','A rooftop at sunset'],['lakeside','A peaceful lakeside'],['beach','A quiet beach'],['restaurant','A special restaurant']]),
 home:settings([['living-room','Our family living room'],['home-courtyard','Our home courtyard'],['home-garden','Our home garden'],['dining-room','Our dining room']]),
 dinner:settings([['restaurant','A family restaurant'],['dining-room','Our home dining room'],['banquet','A private dining hall'],['home-garden','A dinner in our home garden']]),
 celebration:settings([['home','Our home'],['party-venue','A celebration venue'],['garden','A flower-filled garden'],['restaurant','Our favourite restaurant']]),
 sunset:settings([['beach','A beach at sunset'],['lakeside','A lakeside at sunset'],['hills','A hilltop at sunset'],['garden','A garden in golden evening light']]),
 general:settings([['home','Our home'],['cafe','A cosy café'],['garden','A flower-filled garden'],['city','A city setting'],['lakeside','A peaceful lakeside'],['hills','Scenic hills or countryside']])
};
const SETTING_CONTEXT={
 '0:school':'school','0:college':'college','0:work':'work','0:friends':'celebration','0:family':'family','0:online':'online',
 '1:coffee':'coffee','1:walk':'walk','1:calls':'online','1:hobby':'hobby','1:trip':'travel',
 '2:travel':'travel','2:festival':'festival','2:support':'support','2:distance':'reunion','2:surprise':'celebration',
 '3:proposal':'proposal','3:conversation':'proposal','3:family':'family','3:surprise':'celebration',
 '4:home':'home','4:dinner':'dinner','4:friends':'celebration','4:blessings':'family',
 '5:sunset':'sunset','5:garden':'proposal','5:celebrate':'celebration','5:journey':'travel'
};
export function settingsForScene(index,answers={}) {
 const group=SETTING_CONTEXT[(answers.kind ?? index)+':'+answers.moment] || 'general';
 return [...SETTING_GROUPS[group],{id:'custom',label:'Other · write my own location'}];
}
export const GUIDE_MOODS=[{id:'shy',label:'Shy and sweet'},{id:'playful',label:'Playful and joyful'},{id:'emotional',label:'Emotional and heartfelt'},{id:'peaceful',label:'Calm and romantic'},{id:'festive',label:'Warm and celebratory'}];
export function guideForScene(index){return SCENE_GUIDES[Math.min(index,SCENE_GUIDES.length-1)];}
export function guidedSceneDraft(index,answers={}){
 const choice=guideForScene(index).options.find(item=>item.id===answers.moment);
 if(!choice)return {title:'',description:''};
 const setting=answers.setting === "custom" ? (answers.customSetting?.trim()?{label:answers.customSetting.trim().slice(0,120)}:null) : settingsForScene(index,answers).find(item=>item.id===answers.setting),mood=GUIDE_MOODS.find(item=>item.id===answers.mood);
 return {title:choice.title,description:choice.action+(setting?' Setting: '+setting.label+'.':'')+(mood?' Mood: '+mood.label+'.':'')+' Gentle cinematic movement, natural expressions and silent smiles.'};
}
export function updateGuidedScene(scene,index,field,value){
 const kind=scene.guide?.kind ?? index;
 const answers={...scene.guide,kind,[field]:value};
 if(field === "moment" && !settingsForScene(kind,answers).some(item=>item.id===answers.setting)){answers.setting="";answers.customSetting="";}
 const oldDraft=scene.guide?.draft || '',next=guidedSceneDraft(kind,answers);
 return {...scene,title:!scene.title || scene.title===scene.guide?.draftTitle?next.title || scene.title:scene.title,description:!scene.description || scene.description===oldDraft?next.description || scene.description:scene.description,guide:{...answers,draft:next.description,draftTitle:next.title}};
}
